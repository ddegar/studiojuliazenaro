import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import AdminBottomNav from '../components/AdminBottomNav';

const FinancialControl: React.FC = () => {
   const [transactions, setTransactions] = useState<any[]>([]);
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

   // View Filter for Master
   const [viewFilter, setViewFilter] = useState<'ALL' | 'ME' | 'TEAM'>('ALL');

   // View Filter for Master
   const [viewFilter, setViewFilter] = useState<'ALL' | 'ME' | 'TEAM'>('ALL');

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

      const { data: profile } = await supabase.from('profiles').select('role, id, permissions').eq('id', authUser.id).single();
      setUser(profile);

      if (profile?.role !== 'MASTER_ADMIN' && !profile?.permissions?.canViewOwnFinance) {
         setLoading(false);
         return;
      }

      let query = supabase.from('transactions').select('*');

      if (profile?.role !== 'MASTER_ADMIN' && profile?.role !== 'ADMIN' && profile?.role !== 'PROFESSIONAL_ADMIN') {
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

   const balance = transactions.reduce((acc, curr) => {
      return curr.type === 'INCOME' ? acc + curr.amount : acc - curr.amount;
   }, 0);

   const navigate = useNavigate();

   return (
      <div className="flex flex-col h-full bg-background-dark text-white pb-24 overflow-y-auto">
         {/* Header */}
         <header className="px-6 pt-12 pb-6 flex items-center gap-4">
            <button onClick={() => navigate('/admin')} className="material-symbols-outlined text-accent-gold">arrow_back</button>
            <div>
               <h1 className="text-2xl font-bold font-display">Controle Financeiro</h1>
               <p className="text-xs text-gray-400">Receitas e Despesas ({user?.role === 'MASTER_ADMIN' ? 'Geral' : 'Pessoal'})</p>
            </div>
         </header>

         {/* Balance Card */}
         <div className="px-6 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
               <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Saldo Atual</p>
               <h2 className={`text-3xl font-bold ${balance >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                  R$ {balance.toFixed(2)}
               </h2>
            </div>
         </div>

         {/* Filters */}
         <div className="px-6 mb-6">
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
         <div className="px-6 mb-6 flex gap-4">
            <button onClick={() => { setType('INCOME'); setShowForm(true); }} className="flex-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all">
               + RECEITA
            </button>
            <button onClick={() => { setType('EXPENSE'); setShowForm(true); }} className="flex-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all">
               - DESPESA
            </button>
         </div>

         {/* Transactions List Header & Filters */}
         <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-bold">Últimos Lançamentos</h2>
            <div className="flex gap-2">
               {/* View Filter for Master */}
               {user?.role === 'MASTER_ADMIN' && (
                  <select
                     value={viewFilter}
                     onChange={(e) => setViewFilter(e.target.value as 'ALL' | 'ME' | 'TEAM')}
                     className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                  >
                     <option value="ALL" className="bg-[#1c1f24] text-white">Tudo</option>
                     <option value="ME" className="bg-[#1c1f24] text-white">Apenas Eu</option>
                     <option value="TEAM" className="bg-[#1c1f24] text-white">Equipe</option>
                  </select>
               )}
               <button onClick={() => { setEditingTransaction(null); setShowForm(true); }} className="bg-white/5 hover:bg-white/10 text-white p-3 rounded-xl transition-all">
                  <span className="material-symbols-outlined">add</span>
               </button>
            </div>
         </div>

         {/* Transactions List */}
         <div className="space-y-3">
            {transactions
               .filter(t => {
                  if (user?.role !== 'MASTER_ADMIN') return true;
                  if (viewFilter === 'ME') return t.user_id === user?.id;
                  if (viewFilter === 'TEAM') return t.user_id !== user?.id;
                  return true;
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
                              {t.appointment_id && <span className="text-[8px] bg-white/5 text-gray-500 px-1.5 py-0.5 rounded-md uppercase font-black tracking-tighter">Automático</span>}
                           </div>
                           <p className="text-[10px] text-gray-500 mt-0.5">{t.description || new Date(t.date).toLocaleDateString()}</p>
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

         <AdminBottomNav />
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
