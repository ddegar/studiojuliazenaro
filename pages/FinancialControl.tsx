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
      <div className="flex flex-col min-h-screen bg-background-dark text-white font-outfit antialiased selection:bg-accent-gold/20 selection:text-white">
         <header className="relative z-[60] premium-blur-dark sticky top-0 px-8 py-10 flex flex-col gap-6 border-b border-white/5 bg-background-dark/80 backdrop-blur-xl">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <button
                     onClick={() => navigate('/admin')}
                     className="size-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-accent-gold group active:scale-95 transition-all"
                  >
                     <span className="material-symbols-outlined !text-xl group-hover:-translate-x-1 transition-transform">west</span>
                  </button>
                  <div className="space-y-1">
                     <p className="text-[8px] font-black uppercase tracking-[0.5em] text-accent-gold/40 leading-none">Painel Financeiro</p>
                     <h1 className="font-display italic text-2xl text-white">Controle Financeiro</h1>
                  </div>
               </div>

               <div className="flex gap-3">
                  <button onClick={() => setShowCategoryManager(true)} className="size-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-accent-gold transition-all">
                     <span className="material-symbols-outlined !text-xl">settings_account_balance</span>
                  </button>
                  <button onClick={() => { setType('INCOME'); setShowForm(true); }} className="size-12 rounded-2xl bg-accent-gold flex items-center justify-center text-primary shadow-huge active:scale-90 transition-all font-black">
                     <span className="material-symbols-outlined">add</span>
                  </button>
               </div>
            </div>
         </header>

         <main className="relative z-10 p-8 lg:p-12 space-y-10 pb-48 w-full max-w-screen-xl mx-auto overflow-x-hidden">
            {/* 1. MASTER STRATEGIC INTELLIGENCE */}
            {isMaster && (
               <div className="space-y-10">
                  {/* Studio Global KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {[
                        { label: 'Receita Elite', value: studioStats.income, color: 'text-emerald-400', bg: 'bg-emerald-500/5', icon: 'payments' },
                        { label: 'Custo Operacional', value: studioStats.expense, color: 'text-rose-400', bg: 'bg-rose-500/5', icon: 'shopping_cart' },
                        { label: 'Eficiência Líquida', value: studioStats.net, color: studioStats.net >= 0 ? 'text-accent-gold' : 'text-rose-400', bg: 'bg-white/5', icon: 'account_balance_wallet' }
                     ].map((kpi, idx) => (
                        <div key={idx} className={`${kpi.bg} border border-white/5 rounded-[40px] p-8 space-y-4 hover:border-white/10 transition-all shadow-huge group`}>
                           <div className="flex items-center justify-between">
                              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20">{kpi.label}</p>
                              <span className={`material-symbols-outlined !text-lg ${kpi.color} opacity-20 group-hover:opacity-100 transition-opacity`}>{kpi.icon}</span>
                           </div>
                           <p className={`text-2xl font-black ${kpi.color} tabular-nums tracking-tight`}>
                              R$ {kpi.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                           </p>
                        </div>
                     ))}
                  </div>

                  {/* Individual Performance - Julia Zenaro */}
                  <div className="relative group bg-surface-dark/40 border border-white/5 rounded-[48px] p-10 overflow-hidden shadow-hugest hover:border-accent-gold/20 transition-all duration-700">
                     <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                           <div className="size-20 rounded-[28px] overflow-hidden border border-white/10 shadow-hugest group-hover:scale-105 transition-all duration-700">
                              <img src={user?.avatar_url || 'https://ui-avatars.com/api/?name=Julia+Zenaro&background=0f3e29&color=C9A961'} className="w-full h-full object-cover" alt="" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-gold/60">Signature Performance</p>
                              <h3 className="text-xl font-display italic text-white">Julia Zenaro</h3>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 border-t lg:border-t-0 lg:border-l border-white/5 pt-8 lg:pt-0 lg:pl-12">
                           <div>
                              <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1">Receita Direta</p>
                              <p className="text-sm font-black text-emerald-400">R$ {juliaStats.income.toLocaleString('pt-BR')}</p>
                           </div>
                           <div>
                              <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1">Custo Oper.</p>
                              <p className="text-sm font-black text-rose-400">R$ {juliaStats.expense.toLocaleString('pt-BR')}</p>
                           </div>
                           <div className="hidden lg:block">
                              <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1">Líquido Premium</p>
                              <p className={`text-sm font-black ${juliaStats.net >= 0 ? 'text-accent-gold' : 'text-rose-400'}`}>R$ {juliaStats.net.toLocaleString('pt-BR')}</p>
                           </div>
                        </div>
                     </div>
                     <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/5 blur-[100px] -z-0 rounded-full group-hover:bg-accent-gold/10 transition-all duration-700"></div>
                  </div>

                  {/* Team Ledger Selection */}
                  <div className="space-y-6">
                     <div className="flex items-center justify-between group" onClick={() => setShowTeamDetails(!showTeamDetails)}>
                        <div className="flex items-center gap-3">
                           <span className="w-6 h-px bg-accent-gold/40"></span>
                           <h3 className="text-[10px] uppercase font-black text-white/30 tracking-[0.3em]">Performance do Squad</h3>
                        </div>
                        <span className={`material-symbols-outlined text-white/10 transition-transform duration-500 ${showTeamDetails ? 'rotate-180' : ''}`}>expand_more</span>
                     </div>

                     {showTeamDetails && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-reveal">
                           {teamStats.filter(pro => pro?.profile_id !== user?.id).sort((a, b) => b.income - a.income).map(pro => (
                              <button
                                 key={pro.id}
                                 onClick={() => setViewFilter(viewFilter === pro.profile_id ? 'ALL' : pro.profile_id)}
                                 className={`p-6 rounded-[32px] border transition-all duration-500 flex flex-col gap-4 text-left ${viewFilter === pro.profile_id ? 'bg-accent-gold text-primary border-accent-gold shadow-huge scale-[1.02]' : 'bg-surface-dark/40 border-white/5 text-white/20 hover:border-white/20'}`}
                              >
                                 <div className="flex items-center gap-4">
                                    <div className={`size-10 rounded-xl overflow-hidden border p-0.5 ${viewFilter === pro.profile_id ? 'border-primary/20' : 'border-white/5'}`}>
                                       <img src={pro.image_url || `https://ui-avatars.com/api/?name=${pro.name}`} className="w-full h-full object-cover rounded-lg" alt="" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest truncate">{pro.name.split(' ')[0]}</p>
                                 </div>
                                 <div className="space-y-1">
                                    <p className={`text-sm font-black tabular-nums ${viewFilter === pro.profile_id ? 'text-primary' : 'text-emerald-400'}`}>R$ {pro.income.toLocaleString('pt-BR', { notation: 'compact' })}</p>
                                    <p className={`text-[7px] font-bold uppercase tracking-widest ${viewFilter === pro.profile_id ? 'text-primary/60' : 'text-white/20'}`}>Fluxo de Receita</p>
                                 </div>
                              </button>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
            )}

            {/* 2. OPERATIONAL FLOW & FILTERS */}
            <div className="space-y-8">
               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-1">
                     <h2 className="text-xl font-display font-bold italic text-white italic">Atividades Recentes</h2>
                     <p className="text-[10px] text-accent-gold/40 font-black uppercase tracking-[0.2em]">
                        {isMaster && viewFilter !== 'ALL'
                           ? `Exibindo Ledger: ${professionals.find(p => p.profile_id === viewFilter)?.name || 'Especialista'}`
                           : 'Fluxo Global Consolidado'}
                     </p>
                  </div>

                  <div className="flex bg-white/5 p-1.5 rounded-[24px] border border-white/10 shadow-huge shrink-0">
                     {(['TODAY', '7D', '30D', 'ALL'] as const).map(p => (
                        <button
                           key={p}
                           onClick={() => setPeriod(p)}
                           className={`px-6 py-2.5 text-[8px] font-black uppercase tracking-[0.2em] rounded-[18px] transition-all duration-500 ${period === p ? 'bg-white text-primary shadow-huge scale-[1.05]' : 'text-white/20 hover:text-white/40'}`}
                        >
                           {p === 'TODAY' ? 'Hoje' : p === '7D' ? 'Semana' : p === '30D' ? 'Mês' : 'Total'}
                        </button>
                     ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 animate-reveal">
                  {transactions
                     .filter(t => {
                        if (!isMaster) return true;
                        if (viewFilter === 'ALL') return true;
                        if (viewFilter === 'ME') return t.user_id === user?.id;
                        return t.user_id === viewFilter;
                     })
                     .map((t) => (
                        <div key={t.id} className="relative group bg-surface-dark/40 border border-white/5 rounded-[32px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-accent-gold/20 hover:bg-surface-dark transition-all duration-700 overflow-hidden shadow-huge">
                           <div className="flex items-center gap-5 relative z-10">
                              <div className={`size-12 rounded-2xl flex items-center justify-center border transition-colors ${t.type === 'INCOME' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                                 <span className="material-symbols-outlined !text-xl">{t.type === 'INCOME' ? 'north_east' : 'south_west'}</span>
                              </div>
                              <div>
                                 <div className="flex items-center gap-3">
                                    <p className="font-bold text-sm text-white group-hover:text-accent-gold transition-colors">{t.category}</p>
                                    {t.appointment_id && <span className="text-[7px] bg-accent-gold/10 text-accent-gold px-2 py-0.5 rounded-full uppercase font-black tracking-widest border border-accent-gold/20">Sincronizado</span>}
                                 </div>
                                 <p className="text-[10px] text-white/20 mt-1 font-medium italic">{t.description || 'Lançamento sem descrição adicional'}</p>
                              </div>
                           </div>

                           <div className="flex items-center justify-between md:justify-end gap-10 relative z-10 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                              {isMaster && viewFilter === 'ALL' && (
                                 <div className="hidden lg:block text-right">
                                    <p className="text-[7px] font-black text-white/10 uppercase tracking-widest">Emissor</p>
                                    <p className="text-[10px] text-accent-gold/60 font-black uppercase tracking-widest">{professionals.find(p => p.profile_id === t.user_id)?.name.split(' ')[0] || 'Studio'}</p>
                                 </div>
                              )}

                              <div className="text-right">
                                 <p className={`text-base font-black tabular-nums ${t.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                 </p>
                                 <p className="text-[8px] text-white/10 font-bold uppercase tracking-[0.2em] mt-1">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                              </div>

                              <div className="flex gap-2">
                                 <button onClick={() => openEdit(t)} className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:bg-white hover:text-primary transition-all active:scale-90"><span className="material-symbols-outlined !text-lg">edit</span></button>
                                 <button onClick={() => handleDelete(t.id)} className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-white/10 hover:bg-rose-500 hover:text-white transition-all active:scale-90"><span className="material-symbols-outlined !text-lg">delete</span></button>
                              </div>
                           </div>
                           <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-[50px] -z-0 rounded-full group-hover:bg-accent-gold/5 transition-all"></div>
                        </div>
                     ))}

                  {transactions.length === 0 && !loading && (
                     <div className="py-32 text-center space-y-4 opacity-20 group">
                        <span className="material-symbols-outlined !text-6xl group-hover:scale-110 transition-transform duration-700">account_balance_wallet</span>
                        <div className="space-y-1">
                           <p className="font-display italic text-2xl">Balanço Limpo</p>
                           <p className="text-[9px] font-black uppercase tracking-widest">Nenhuma transação identificada neste período</p>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </main>

         {/* 3. TRANSACTION CONSOLE MODAL */}
         {showForm && (
            <div className="fixed inset-0 z-[100] bg-background-dark/95 flex items-end justify-center backdrop-blur-2xl animate-fade-in overflow-hidden">
               <div className="fixed inset-0" onClick={closeModal}></div>
               <form onSubmit={handleSubmit} className="bg-surface-dark w-full max-w-screen-md rounded-t-[64px] p-12 space-y-10 animate-slide-up border-t border-white/10 max-h-[92vh] overflow-y-auto no-scrollbar relative z-10 shadow-hugest">
                  <div className="flex justify-between items-center px-4">
                     <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none">Módulo de Lançamento</p>
                        <h2 className="text-3xl font-display italic text-white italic">
                           {editingTransaction ? 'Consolidar Lançamento' : (type === 'INCOME' ? 'Registrar Receita Elite' : 'Vincular Despesa')}
                        </h2>
                     </div>
                     <button type="button" onClick={closeModal} className="size-14 flex items-center justify-center rounded-3xl bg-white/5 border border-white/10 text-white/20 hover:text-white transition-all">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <div className="space-y-12">
                     <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <span className="w-6 h-px bg-accent-gold/40"></span>
                           <label className="text-[10px] uppercase font-black text-white/30 tracking-[0.3em]">Montante e Classificação</label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="relative">
                              <span className="absolute left-8 top-1/2 -translate-y-1/2 text-emerald-400 font-black text-lg">R$</span>
                              <input
                                 type="number"
                                 step="0.01"
                                 required
                                 value={amount}
                                 onChange={e => setAmount(e.target.value)}
                                 className="w-full h-20 bg-white/5 border border-white/5 rounded-[32px] pl-20 pr-8 text-2xl font-black text-white focus:border-accent-gold/60 outline-none transition-all shadow-huge tabular-nums"
                                 placeholder="0,00"
                                 autoFocus
                              />
                           </div>
                           <div className="relative">
                              <select
                                 required
                                 value={category}
                                 onChange={e => setCategory(e.target.value)}
                                 className="w-full h-20 bg-white/5 border border-white/5 rounded-[32px] px-8 text-xs font-black uppercase tracking-widest text-white/60 focus:border-accent-gold/60 outline-none appearance-none shadow-huge italic"
                              >
                                 <option value="" className="bg-surface-dark">Categorizar...</option>
                                 {(type === 'INCOME' ? incomeCategories : expenseCategories).map(cat => (
                                    <option key={cat} value={cat} className="bg-surface-dark">{cat}</option>
                                 ))}
                              </select>
                              <span className="absolute right-8 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/10 pointer-events-none">expand_more</span>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <span className="w-6 h-px bg-accent-gold/40"></span>
                           <label className="text-[10px] uppercase font-black text-white/30 tracking-[0.3em]">Cronologia e Narrativa</label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <input
                              type="date"
                              value={date}
                              onChange={e => setDate(e.target.value)}
                              className="w-full h-18 bg-white/5 border border-white/5 rounded-[28px] px-8 text-sm focus:border-accent-gold/60 outline-none transition-all text-white/40 shadow-huge"
                           />
                           <input
                              type="text"
                              placeholder="Identificador ou Descrição..."
                              value={description}
                              onChange={e => setDescription(e.target.value)}
                              className="w-full h-18 bg-white/5 border border-white/5 rounded-[28px] px-8 text-sm focus:border-accent-gold/60 outline-none transition-all shadow-huge italic text-white/60"
                           />
                        </div>
                     </div>

                     {type === 'EXPENSE' && (
                        <button
                           type="button"
                           onClick={() => setIsRecurring(!isRecurring)}
                           className={`flex items-center gap-6 p-8 rounded-[40px] border transition-all duration-700 ${isRecurring ? 'bg-accent-gold text-primary border-accent-gold shadow-huge' : 'bg-white/5 border-white/5 text-white/20 hover:bg-white/10'}`}
                        >
                           <div className={`size-10 rounded-2xl flex items-center justify-center transition-all ${isRecurring ? 'bg-primary/10 text-primary' : 'bg-white/5 text-white/20'}`}>
                              <span className="material-symbols-outlined !text-xl">{isRecurring ? 'verified' : 'sync'}</span>
                           </div>
                           <div className="text-left">
                              <p className="text-[11px] font-black uppercase tracking-[0.2em]">Fluxo Recorrente</p>
                              <p className={`text-[8px] font-medium mt-1 leading-relaxed ${isRecurring ? 'text-primary/60' : 'text-white/10'}`}>Esta despesa será provisionada mensalmente no sistema.</p>
                           </div>
                        </button>
                     )}
                  </div>

                  <div className="flex gap-4 pt-12">
                     <button type="button" onClick={closeModal} className="flex-1 h-20 bg-white/5 border border-white/10 text-white/20 rounded-[32px] font-black uppercase tracking-[0.4em] text-[10px] active:scale-95 transition-all">Descartar</button>
                     <button type="submit" className="flex-[2] h-20 bg-accent-gold text-primary rounded-[32px] font-black uppercase tracking-[0.5em] text-[11px] shadow-hugest active:scale-95 transition-all">Consolidar Fluxo</button>
                  </div>
               </form>
               <div className="fixed top-0 left-0 w-[50vw] h-[50vh] bg-accent-gold/10 blur-[120px] pointer-events-none -z-0"></div>
            </div>
         )}

         {/* 4. CATEGORY MASTER ARCHIVE */}
         {showCategoryManager && (
            <div className="fixed inset-0 z-[120] bg-background-dark/95 flex items-center justify-center p-8 backdrop-blur-2xl animate-fade-in overflow-hidden">
               <div className="absolute inset-0" onClick={() => setShowCategoryManager(false)}></div>
               <div className="bg-surface-dark border border-white/10 w-full max-w-lg rounded-[64px] p-12 space-y-10 animate-slide-up relative z-10 shadow-hugest">
                  <div className="flex justify-between items-center">
                     <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none">Taxonomia</p>
                        <h3 className="text-2xl font-display italic text-white italic">Gestão de Categorias</h3>
                     </div>
                     <button onClick={() => setShowCategoryManager(false)} className="size-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/20 hover:text-white transition-all">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <div className="flex bg-white/5 p-2 rounded-3xl border border-white/10">
                     <button onClick={() => setType('INCOME')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-500 ${type === 'INCOME' ? 'bg-white text-primary shadow-huge' : 'text-white/20'}`}>Receitas</button>
                     <button onClick={() => setType('EXPENSE')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-500 ${type === 'EXPENSE' ? 'bg-white text-primary shadow-huge' : 'text-white/20'}`}>Despesas</button>
                  </div>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-2 no-scrollbar">
                     {(type === 'INCOME' ? incomeCategories : expenseCategories).map(cat => (
                        <div key={cat} className="flex items-center justify-between bg-white/[0.02] p-5 rounded-[24px] border border-white/5 hover:bg-white/5 transition-all group">
                           <span className="text-xs font-black uppercase tracking-widest text-white/60">{cat}</span>
                           <button onClick={() => handleDeleteCategory(cat)} className="size-8 rounded-lg bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white flex items-center justify-center">
                              <span className="material-symbols-outlined !text-sm">delete</span>
                           </button>
                        </div>
                     ))}
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-white/5">
                     <input
                        type="text"
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        placeholder="Novo Rótulo..."
                        className="flex-1 bg-white/5 border border-white/5 rounded-[24px] px-8 py-4 text-xs focus:border-accent-gold/60 outline-none transition-all placeholder:text-white/10 shadow-huge italic text-white/40"
                     />
                     <button onClick={handleAddCategory} className="size-14 rounded-2xl bg-accent-gold text-primary shadow-huge active:scale-90 flex items-center justify-center">
                        <span className="material-symbols-outlined">add</span>
                     </button>
                  </div>
               </div>
            </div>
         )}

         <div className="lg:hidden">
            <AdminBottomNav />
         </div>

         {/* Layout Ornaments */}
         <div className="fixed top-0 right-0 w-[40vw] h-[40vh] bg-accent-gold/5 blur-[120px] pointer-events-none z-0"></div>
         <div className="fixed bottom-0 left-0 w-[40vw] h-[40vh] bg-primary/20 blur-[120px] pointer-events-none z-0 opacity-40"></div>
      </div>
   );
};

export default FinancialControl;
