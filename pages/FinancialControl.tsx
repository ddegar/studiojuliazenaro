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

   const [user, setUser] = useState<any>(null);

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

      const { data } = await query.order('date', { ascending: false }).limit(50);
      if (data) setTransactions(data);
      setLoading(false);
   };

   useEffect(() => {
      fetchTransactions();
   }, []);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!amount || !category) return;

      const { error } = await supabase.from('transactions').insert({
         type,
         category,
         description,
         amount: parseFloat(amount),
         date,
         user_id: user?.id
      });

      if (error) {
         alert('Erro ao salvar: ' + error.message);
      } else {
         alert('Salvo com sucesso!');
         setShowForm(false);
         setCategory('');
         setDescription('');
         setAmount('');
         fetchTransactions();
      }
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

         {/* Actions */}
         <div className="px-6 mb-6 flex gap-4">
            <button onClick={() => { setType('INCOME'); setShowForm(true); }} className="flex-1 bg-green-500/10 border border-green-500/20 text-green-400 py-3 rounded-xl font-bold text-sm tracking-wide active:scale-95 transition-transform">
               + RECEITA
            </button>
            <button onClick={() => { setType('EXPENSE'); setShowForm(true); }} className="flex-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 py-3 rounded-xl font-bold text-sm tracking-wide active:scale-95 transition-transform">
               - DESPESA
            </button>
         </div>

         {/* List */}
         <div className="flex-1 px-6 space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Últimos Lançamentos</h3>
            {loading ? <p className="text-gray-500 text-xs">Carregando...</p> : transactions.map(t => (
               <div key={t.id} className="bg-card-dark p-4 rounded-xl border border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     <div className={`size-8 rounded-full flex items-center justify-center ${t.type === 'INCOME' ? 'bg-green-500/10 text-green-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        <span className="material-symbols-outlined !text-sm">{t.type === 'INCOME' ? 'arrow_upward' : 'arrow_downward'}</span>
                     </div>
                     <div>
                        <p className="font-bold text-sm">{t.category}</p>
                        <p className="text-[10px] text-gray-500">{t.description || new Date(t.date).toLocaleDateString()}</p>
                     </div>
                  </div>
                  <span className={`font-bold text-sm ${t.type === 'INCOME' ? 'text-green-400' : 'text-rose-400'}`}>
                     {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount}
                  </span>
               </div>
            ))}
         </div>

         {/* Form Modal */}
         {showForm && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
               <div className="bg-background-dark border border-white/10 w-full max-w-md rounded-3xl p-6 space-y-6">
                  <div className="flex justify-between items-center">
                     <h3 className="text-lg font-bold">Nova {type === 'INCOME' ? 'Receita' : 'Despesa'}</h3>
                     <button onClick={() => setShowForm(false)} className="text-gray-400">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="text-gray-500 text-xs font-bold uppercase block mb-2">Valor (R$)</label>
                        <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-gold" placeholder="0.00" autoFocus />
                     </div>
                     <div>
                        <label className="text-gray-500 text-xs font-bold uppercase block mb-2">Categoria</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-accent-gold">
                           <option value="">Selecione...</option>
                           {type === 'INCOME' ? (
                              <>
                                 <option value="Serviço">Serviço</option>
                                 <option value="Produto">Venda de Produto</option>
                                 <option value="Outros">Outros</option>
                              </>
                           ) : (
                              <>
                                 <option value="Material">Material</option>
                                 <option value="Aluguel">Aluguel/Contas</option>
                                 <option value="Marketing">Marketing</option>
                                 <option value="Salário">Salário/Pró-labore</option>
                                 <option value="Outros">Outros</option>
                              </>
                           )}
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

                     <button type="submit" className="w-full bg-accent-gold text-primary font-bold py-4 rounded-xl uppercase tracking-widest mt-4">
                        Salvar
                     </button>
                  </form>
               </div>
            </div>
         )}

         <AdminBottomNav />
      </div>
   );
};

export default FinancialControl;
