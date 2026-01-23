import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import AdminBottomNav from '../components/AdminBottomNav';

const FinancialControl: React.FC = () => {
   const [transactions, setTransactions] = useState<any[]>([]);
   const [professionals, setProfessionals] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [showForm, setShowForm] = useState(false);

   // Form State
   const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
   const [category, setCategory] = useState('');
   const [description, setDescription] = useState('');
   const [amount, setAmount] = useState('');
   const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
   const [period, setPeriod] = useState<'TODAY' | '7D' | '30D' | 'ALL'>('30D');

   const [user, setUser] = useState<any>(null);
   const [editingTransaction, setEditingTransaction] = useState<any>(null);
   const [isRecurring, setIsRecurring] = useState(false);

   // Category Management
   const [incomeCategories, setIncomeCategories] = useState<string[]>(['Serviço', 'Produto', 'Outros']);
   const [expenseCategories, setExpenseCategories] = useState<string[]>(['Material', 'Aluguel', 'Marketing', 'Salário', 'Outros']);
   const [showCategoryManager, setShowCategoryManager] = useState(false);
   const [newCategory, setNewCategory] = useState('');

   // Master View Controls
   const [viewFilter, setViewFilter] = useState<'ALL' | 'ME' | 'TEAM' | string>('ALL'); // 'ALL', 'ME', 'TEAM', or specific Pro ID
   const [showTeamDetails, setShowTeamDetails] = useState(true);


   useEffect(() => {
      fetchCategories();
   }, []);

   const fetchCategories = async () => {
      try {
         const { data: incomeConfig } = await supabase.from('studio_config').select('value').eq('key', 'finance_income_categories').single();
         if (incomeConfig?.value) setIncomeCategories(JSON.parse(incomeConfig.value));

         const { data: expenseConfig } = await supabase.from('studio_config').select('value').eq('key', 'finance_expense_categories').single();
         if (expenseConfig?.value) setExpenseCategories(JSON.parse(expenseConfig.value));
      } catch (error) {
         console.error('Error fetching categories:', error);
      }
   };

   const saveCategories = async (newIncome: string[], newExpense: string[]) => {
      try {
         await supabase.from('studio_config').upsert({ key: 'finance_income_categories', value: JSON.stringify(newIncome), updated_at: new Date().toISOString() });
         await supabase.from('studio_config').upsert({ key: 'finance_expense_categories', value: JSON.stringify(newExpense), updated_at: new Date().toISOString() });
      } catch (error) {
         console.error('Error saving categories:', error);
      }
   };

   const handleAddCategory = () => {
      if (!newCategory.trim()) return;
      if (type === 'INCOME') {
         const updated = [...incomeCategories, newCategory.trim()];
         setIncomeCategories(updated);
         saveCategories(updated, expenseCategories);
      } else {
         const updated = [...expenseCategories, newCategory.trim()];
         setExpenseCategories(updated);
         saveCategories(incomeCategories, updated);
      }
      setNewCategory('');
   };

   const handleDeleteCategory = (cat: string) => {
      if (type === 'INCOME') {
         const updated = incomeCategories.filter(c => c !== cat);
         setIncomeCategories(updated);
         saveCategories(updated, expenseCategories);
      } else {
         const updated = expenseCategories.filter(c => c !== cat);
         setExpenseCategories(updated);
         saveCategories(incomeCategories, updated);
      }
   };

   const fetchTransactions = async () => {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profile } = await supabase.from('profiles').select('role, id, permissions, name, email').eq('id', authUser.id).single();
      setUser(profile);

      const isMaster = profile?.role === 'MASTER_ADMIN' || profile?.email === 'admin@juliazenaro.com';

      // 1. Fetch Professionals if Master (to map names/photos)
      if (isMaster) {
         // Fix: Use profile_id (fk to auth) and avatar (if exists) or just name
         // Fallback to name-based query if direct columns fail? No, simpler.
         // Let's try select * to be safe in dev, OR restrict to known good columns.
         // Based on AdminDashboard, profile_id IS correct.
         const { data: pros, error } = await supabase.from('professionals').select('*');
         if (error) console.error('Error fetching professionals:', error);
         if (pros) {
            console.log('Professionals loaded:', pros.length);
            setProfessionals(pros);
         }
      }

      if (!isMaster && !profile?.permissions?.canViewOwnFinance) {
         setLoading(false);
         return;
      }

      let query = supabase.from('transactions').select('*');

      // 2. Permission Check on Transactions
      // If NOT master, force filter by user_id
      if (!isMaster) {
         query = query.eq('user_id', authUser.id);
      }

      // Apply Period Filter
      const now = new Date();
      if (period === 'TODAY') {
         query = query.eq('date', now.toISOString().split('T')[0]);
      } else if (period === '7D') {
         const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
         query = query.gte('date', sevenDaysAgo);
      } else if (period === '30D') {
         const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
         query = query.gte('date', thirtyDaysAgo);
      }

      const { data } = await query.order('date', { ascending: false });
      if (data) setTransactions(data);
      setLoading(false);
   };

   useEffect(() => {
      fetchTransactions();
   }, [period]);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!amount || !category) return;

      const payload = {
         type,
         category,
         description,
         amount: parseFloat(amount),
         date,
         user_id: user?.id,
         is_recurring: isRecurring
      };

      let error;
      if (editingTransaction) {
         const { error: err } = await supabase.from('transactions').update(payload).eq('id', editingTransaction.id);
         error = err;
      } else {
         const { error: err } = await supabase.from('transactions').insert(payload);
         error = err;
      }

      if (error) {
         alert('Erro ao salvar: ' + error.message);
      } else {
         alert('Salvo com sucesso!');
         closeModal();
         fetchTransactions();
      }
   };

   const handleDelete = async (id: string) => {
      if (!window.confirm('Tem certeza que deseja excluir este lançamento?')) return;
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) alert('Erro ao excluir: ' + error.message);
      else fetchTransactions();
   };

   const openEdit = (t: any) => {
      setEditingTransaction(t);
      setType(t.type);
      setCategory(t.category);
      setDescription(t.description || '');
      setAmount(t.amount.toString());
      setDate(t.date);
      setIsRecurring(t.is_recurring || false);
      setShowForm(true);
   };

   const closeModal = () => {
      setShowForm(false);
      setEditingTransaction(null);
      setCategory('');
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsRecurring(false);
   };

   const isMaster = user?.role === 'MASTER_ADMIN' || user?.email === 'admin@juliazenaro.com';

   // --- CALCULATE AGGREGATED STATS (CLIENT-SIDE) ---
   const calculateStats = (txs: any[]) => {
      if (!Array.isArray(txs)) return { income: 0, expense: 0, net: 0 };
      const income = txs.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      const expense = txs.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      return { income, expense, net: income - expense };
   };

   // 1. Studio Totals (Everything fetched)
   const studioStats = calculateStats(transactions);

   // 2. Julia Personal (User ID matches logged in master)
   const juliaStats = calculateStats(transactions.filter(t => t.user_id === user?.id));

   // 3. Team Map
   const teamStats = Array.isArray(professionals) ? professionals.map(pro => {
      // Find transactions where user_id matches pro's profile_id
      const proTxs = Array.isArray(transactions) ? transactions.filter(t => t.user_id === pro.profile_id) : [];
      const stats = calculateStats(proTxs);
      return { ...pro, ...stats };
   }) : [];

   // Resolve Current Balance Display based on View
   // If Master and View=ALL -> Studio Net
   // If Master and View=ME -> Julia Net
   // If Master and View=TEAM -> Studio Net (or nothing?)
   // If Pro -> Own Net
   const currentBalance = isMaster
      ? (viewFilter === 'ME' ? juliaStats.net : studioStats.net)
      : calculateStats(transactions).net; // Pro only has their own txs anyway

   const navigate = useNavigate();

   return (
      <div className="flex flex-col h-full bg-background-dark text-white pb-24 lg:pb-8 overflow-y-auto custom-scrollbar">
         <header className="px-6 lg:px-10 pt-12 lg:pt-8 pb-6 flex items-center gap-4">
            <button onClick={() => navigate('/admin')} className="material-symbols-outlined text-accent-gold">arrow_back</button>
            <div>
               <h1 className="text-2xl lg:text-3xl font-bold font-display">Controle Financeiro</h1>
               <p className="text-xs text-gray-400">
                  {isMaster ? 'Visão Geral do Studio' : 'Seu Fluxo de Caixa'}
               </p>
            </div>
         </header>

         {/* MASTER DASHBOARD SECTIONS */}
         {isMaster && (
            <div className="px-6 lg:px-10 mb-8 space-y-8">

               {/* 1. STUDIO OVERVIEW */}
               <div>
                  <div className="flex items-center gap-2 mb-3">
                     <span className="material-symbols-outlined text-accent-gold text-lg">domain</span>
                     <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300">Studio Geral</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                     <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/70 mb-1">Receita Total</p>
                        <p className="text-lg font-bold text-emerald-400">R$ {studioStats.income.toLocaleString('pt-BR', { notation: 'compact' })}</p>
                     </div>
                     <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4">
                        <p className="text-[9px] font-black uppercase tracking-widest text-rose-500/70 mb-1">Despesa Total</p>
                        <p className="text-lg font-bold text-rose-400">R$ {studioStats.expense.toLocaleString('pt-BR', { notation: 'compact' })}</p>
                     </div>
                     <div className="bg-white/5 border border-white/10 rounded-2xl p-4 relative overflow-hidden">
                        <div className={`absolute inset-0 opacity-10 ${studioStats.net >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Resultado Líquido</p>
                        <p className={`text-lg font-bold relative z-10 ${studioStats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                           R$ {studioStats.net.toLocaleString('pt-BR', { notation: 'compact' })}
                        </p>
                     </div>
                  </div>
               </div>

               {/* 2. JULIA (PERSONAL) */}
               <div className="bg-[#1c1f24] rounded-3xl p-5 border border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                     <span className="material-symbols-outlined text-6xl">person</span>
                  </div>
                  <div className="relative z-10">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                           <div className="size-10 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold border border-accent-gold/30">
                              <span className="material-symbols-outlined">diamond</span>
                           </div>
                           <div>
                              <p className="text-sm font-bold text-white">Julia Zenaro</p>
                              <p className="text-[10px] text-gray-500">Performance Individual</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[9px] font-bold uppercase text-gray-500">Líquido</p>
                           <p className={`text-xl font-bold ${juliaStats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              R$ {juliaStats.net.toLocaleString('pt-BR')}
                           </p>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/20 rounded-xl p-3 flex justify-between items-center">
                           <span className="text-[10px] text-gray-400">Entradas</span>
                           <span className="text-xs font-bold text-emerald-400">+ {juliaStats.income.toLocaleString('pt-BR', { notation: 'compact' })}</span>
                        </div>
                        <div className="bg-black/20 rounded-xl p-3 flex justify-between items-center">
                           <span className="text-[10px] text-gray-400">Saídas</span>
                           <span className="text-xs font-bold text-rose-400">- {juliaStats.expense.toLocaleString('pt-BR', { notation: 'compact' })}</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* 3. TEAM BREAKDOWN */}
               <div>
                  <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={() => setShowTeamDetails(!showTeamDetails)}>
                     <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-400 text-lg">groups</span>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300">Equipe</h3>
                     </div>
                     <span className={`material-symbols-outlined text-gray-500 transition-transform ${showTeamDetails ? 'rotate-180' : ''}`}>expand_more</span>
                  </div>

                  {showTeamDetails && (
                     <div className="space-y-3">
                        {teamStats
                           // Exclude Julia from Team View to avoid redundancy if she is also a pro? 
                           // Usually user wants to see everyone in team view too, or just others. 
                           // Let's Keep everyone for completeness, user can ignore Julia card here.
                           .sort((a, b) => b.income - a.income) // Sort by Revenue
                           .map(pro => {
                              if (!pro || !pro.name) return null;
                              return (
                                 <button
                                    key={pro.id || Math.random()}
                                    onClick={() => setViewFilter(viewFilter === pro.profile_id ? 'ALL' : pro.profile_id)}
                                    className={`w-full text-left bg-card-dark p-4 rounded-2xl border transition-all flex items-center justify-between ${viewFilter === pro.profile_id ? 'border-accent-gold bg-accent-gold/5' : 'border-white/5 hover:border-white/10'}`}
                                 >
                                    <div className="flex items-center gap-3">
                                       <div className="size-10 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                                          {(pro as any).avatar || (pro as any).image_url || (pro as any).profile_pic ? (
                                             <img src={(pro as any).avatar || (pro as any).image_url || (pro as any).profile_pic} alt={pro.name} className="w-full h-full object-cover" />
                                          ) : (
                                             <span>{(pro.name || '??').substring(0, 2).toUpperCase()}</span>
                                          )}
                                       </div>
                                       <div>
                                          <p className={`text-sm font-bold ${viewFilter === pro.profile_id ? 'text-accent-gold' : 'text-gray-200'}`}>
                                             {(pro.name || 'Desconhecido').split(' ')[0]}
                                          </p>
                                          <p className="text-[10px] text-gray-500">{0} Lançamentos</p>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-xs font-bold text-white">R$ {Number(pro.income || 0).toLocaleString('pt-BR', { notation: 'compact' })}</p>
                                       <p className={`text-[9px] font-bold ${pro.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                          {pro.net >= 0 ? 'Lucro' : 'Preju'} R$ {Math.abs(pro.net || 0).toLocaleString('pt-BR', { notation: 'compact' })}
                                       </p>
                                    </div>
                                 </button>
                              )
                           })
                        }
                     </div>
                  )}
               </div>
            </div>
         )}

         {/* REGULAR PRO BALANCE CARD (Only if NOT master) */}
         {!isMaster && (
            <div className="px-6 mb-8">
               <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Seu Saldo</p>
                  <h2 className={`text-3xl font-bold ${currentBalance >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                     R$ {currentBalance.toFixed(2)}
                  </h2>
               </div>
            </div>
         )}

         {/* Common Filters for List */}
         <div className="px-6 lg:px-10 mb-6">
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
               {(['TODAY', '7D', '30D', 'ALL'] as const).map(p => (
                  <button
                     key={p}
                     onClick={() => setPeriod(p)}
                     className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${period === p ? 'bg-accent-gold text-primary shadow-lg' : 'text-gray-500'}`}
                  >
                     {p === 'TODAY' ? 'Hoje' : p === '7D' ? '7 Dias' : p === '30D' ? '30 Dias' : 'Tudo'}
                  </button>
               ))}
            </div>
         </div>

         {/* Actions */}
         <div className="px-6 lg:px-10 mb-6 flex gap-4">
            <button onClick={() => { setType('INCOME'); setShowForm(true); }} className="flex-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all">
               + RECEITA
            </button>
            <button onClick={() => { setType('EXPENSE'); setShowForm(true); }} className="flex-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all">
               - DESPESA
            </button>
         </div>

         {/* Transactions List */}
         <div className="flex items-center justify-between px-6 lg:px-10 mb-4">
            <div>
               <h2 className="text-xl font-display font-bold">Lançamentos</h2>
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  {isMaster && viewFilter !== 'ALL'
                     ? (viewFilter === 'ME' ? 'Apenas Você' : (transactionUser => transactionUser ? `Filtrando: ${transactionUser.name}` : 'Filtrando Profissional')(professionals.find(p => p.profile_id === viewFilter)))
                     : 'Todos'
                  }
               </p>
            </div>
            {isMaster && (
               <button
                  onClick={() => setViewFilter('ALL')}
                  className={`text-[10px] font-bold px-3 py-1 rounded-lg border ${viewFilter === 'ALL' ? 'bg-white text-black border-white' : 'border-white/20 text-gray-400'}`}
               >
                  VER TUDO
               </button>
            )}
         </div>

         {/* Transactions List Content */}
         <div className="space-y-3 px-6 lg:px-10">
            {transactions
               .filter(t => {
                  if (!isMaster) return true; // Already filtered by server
                  if (viewFilter === 'ALL') return true;
                  if (viewFilter === 'ME') return t.user_id === user?.id; // Julia
                  return t.user_id === viewFilter; // Specific ID
               })
               .map((t) => (
                  <div key={t.id} className="bg-card-dark p-5 rounded-3xl border border-white/5 flex justify-between items-center group hover:border-white/10 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className={`size-10 rounded-2xl flex items-center justify-center ${t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                           <span className="material-symbols-outlined !text-xl">{t.type === 'INCOME' ? 'payments' : 'shopping_bag'}</span>
                        </div>
                        <div>
                           <div className="flex items-center gap-2">
                              <p className="font-bold text-sm text-gray-200">{t.category}</p>
                              {t.appointment_id && <span className="text-[8px] bg-white/5 text-gray-500 px-1.5 py-0.5 rounded-md uppercase font-black tracking-tighter">Auto</span>}
                           </div>
                           <p className="text-[10px] text-gray-500 mt-0.5">{t.description || new Date(t.date).toLocaleDateString()}</p>
                           {/* Show who made this transaction if Master Viewing ALL */}
                           {isMaster && viewFilter === 'ALL' && (
                              <p className="text-[9px] text-accent-gold mt-1">
                                 {professionals.find(p => p.profile_id === t.user_id)?.name.split(' ')[0] || 'Desconhecido'}
                              </p>
                           )}
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="text-right">
                           <p className={`font-black text-sm ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                           </p>
                           <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                        </div>
                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => openEdit(t)} className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all"><span className="material-symbols-outlined !text-base">edit</span></button>
                           <button onClick={() => handleDelete(t.id)} className="size-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><span className="material-symbols-outlined !text-base">delete</span></button>
                        </div>
                     </div>
                  </div>
               ))}
            {transactions.length === 0 && !loading && (
               <div className="py-20 text-center opacity-30 italic text-sm">Nenhum lançamento no período</div>
            )}
         </div>

         {/* Form Modal */}
         {showForm && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
               <div className="bg-background-dark border border-white/10 w-full max-w-md rounded-3xl p-6 space-y-6">
                  <div className="flex justify-between items-center">
                     <h3 className="text-lg font-bold">{editingTransaction ? 'Editar' : 'Nova'} {type === 'INCOME' ? 'Receita' : 'Despesa'}</h3>
                     <button onClick={closeModal} className="text-gray-400 hover:text-white transition-all">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="text-gray-500 text-xs font-bold uppercase block mb-2">Valor (R$)</label>
                        <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-gold" placeholder="0.00" autoFocus />
                     </div>
                     <div>
                        <div className="flex justify-between items-center mb-2">
                           <label className="text-gray-500 text-xs font-bold uppercase">Categoria</label>
                           <button type="button" onClick={() => setShowCategoryManager(true)} className="text-[10px] text-accent-gold font-bold hover:underline">
                              GERENCIAR
                           </button>
                        </div>
                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[#1c1f24] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-gold">
                           <option value="" className="bg-[#1c1f24] text-white">Selecione...</option>
                           {(type === 'INCOME' ? incomeCategories : expenseCategories).map(cat => (
                              <option key={cat} value={cat} className="bg-[#1c1f24] text-white">{cat}</option>
                           ))}
                        </select>
                     </div>
                     <div>
                        <label className="text-gray-500 text-xs font-bold uppercase block mb-2">Descrição (Opcional)</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-gold" placeholder="Ex: Cílios 0.07D" />
                     </div>
                     <div>
                        <label className="text-gray-500 text-xs font-bold uppercase block mb-2">Data</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-gold" />
                     </div>

                     {type === 'EXPENSE' && (
                        <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer" onClick={() => setIsRecurring(!isRecurring)}>
                           <div className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${isRecurring ? 'bg-accent-gold border-accent-gold' : 'border-white/20'}`}>
                              {isRecurring && <span className="material-symbols-outlined !text-sm text-primary">check</span>}
                           </div>
                           <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-gray-200">Despesa Mensal (Fixa)</p>
                              <p className="text-[9px] text-gray-500 font-medium">Repetir automaticamente todos os meses</p>
                           </div>
                        </div>
                     )}

                     <button type="submit" className="w-full bg-accent-gold text-primary font-bold py-4 rounded-xl uppercase tracking-widest mt-4">
                        Salvar
                     </button>
                  </form>
               </div>
            </div>
         )}

         <div className="lg:hidden">
            <AdminBottomNav />
         </div>
         {/* Category Manager Modal */}
         {showCategoryManager && (
            <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-background-dark border border-white/10 w-full max-w-sm rounded-[32px] p-6 space-y-6">
                  <div className="flex justify-between items-center">
                     <h3 className="text-lg font-bold">Gerenciar Categorias</h3>
                     <button onClick={() => setShowCategoryManager(false)} className="text-gray-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                  </div>

                  <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                     <button onClick={() => setType('INCOME')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === 'INCOME' ? 'bg-primary text-white shadow-lg' : 'text-gray-500'}`}>RECEITAS</button>
                     <button onClick={() => setType('EXPENSE')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === 'EXPENSE' ? 'bg-rose-500 text-white shadow-lg' : 'text-gray-500'}`}>DESPESAS</button>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                     {(type === 'INCOME' ? incomeCategories : expenseCategories).map(cat => (
                        <div key={cat} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                           <span className="text-sm font-medium">{cat}</span>
                           <button onClick={() => handleDeleteCategory(cat)} className="text-rose-500 hover:bg-rose-500/10 p-1 rounded-full"><span className="material-symbols-outlined !text-sm">delete</span></button>
                        </div>
                     ))}
                  </div>

                  <div className="flex gap-2">
                     <input
                        type="text"
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        placeholder="Nova categoria..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-gold"
                     />
                     <button onClick={handleAddCategory} className="bg-accent-gold text-primary p-3 rounded-xl"><span className="material-symbols-outlined">add</span></button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default FinancialControl;
