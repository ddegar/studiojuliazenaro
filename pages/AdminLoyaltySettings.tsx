
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

// Intefaces baseadas no DB
interface Tier {
   id: string;
   name: string;
   min_points: number;
   color: string;
   icon: string;
   benefits: string[];
}

interface Action {
   id: string;
   code: string;
   description: string;
   points_reward: number;
   is_active: boolean;
}

const AdminLoyaltySettings: React.FC = () => {
   const navigate = useNavigate();
   const [loading, setLoading] = useState(true);
   const [tiers, setTiers] = useState<Tier[]>([]);
   const [actions, setActions] = useState<Action[]>([]);

   // State para edição
   const [editingTier, setEditingTier] = useState<Tier | null>(null);
   const [tierForm, setTierForm] = useState<Partial<Tier>>({});

   const [editingAction, setEditingAction] = useState<Action | null>(null);

   useEffect(() => {
      fetchData();
   }, []);

   const fetchData = async () => {
      try {
         const [tiersRes, actionsRes] = await Promise.all([
            supabase.from('loyalty_tiers').select('*').order('min_points'),
            supabase.from('loyalty_actions').select('*').order('description')
         ]);

         if (tiersRes.error) throw tiersRes.error;
         if (actionsRes.error) throw actionsRes.error;

         setTiers(tiersRes.data || []);
         setActions(actionsRes.data || []);
      } catch (error) {
         console.error('Error fetching loyalty settings:', error);
      } finally {
         setLoading(false);
      }
   };

   const handleSaveTier = async () => {
      try {
         if (editingTier && editingTier.id) {
            const { error } = await supabase.from('loyalty_tiers').update({
               name: tierForm.name,
               min_points: tierForm.min_points,
               benefits: tierForm.benefits
            }).eq('id', editingTier.id);
            if (error) throw error;
         }
         setEditingTier(null);
         fetchData();
         alert('Nível atualizado!');
      } catch (error: any) {
         alert('Erro ao salvar nível: ' + error.message);
      }
   };

   const handleSaveAction = async () => {
      try {
         if (editingAction) {
            const { error } = await supabase.from('loyalty_actions').update({
               points_reward: editingAction.points_reward,
               is_active: editingAction.is_active
            }).eq('id', editingAction.id);
            if (error) throw error;
         }
         setEditingAction(null);
         fetchData();
         alert('Regra atualizada!');
      } catch (error: any) {
         alert('Erro ao salvar regra: ' + error.message);
      }
   };

   return (
      <div className="min-h-screen bg-[#121417] text-white p-6 font-sans pb-24">
         <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate('/admin')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <span className="material-symbols-outlined text-gray-400">arrow_back</span>
               </button>
               <div>
                  <h1 className="text-2xl font-display font-bold">Club JZ Privé</h1>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Painel de Controle</p>
               </div>
            </div>
         </header>

         {loading ? (
            <div className="flex justify-center py-20"><div className="size-8 border-4 border-accent-gold border-t-transparent rounded-full animate-spin"></div></div>
         ) : (
            <div className="space-y-8 max-w-5xl mx-auto">
               {/* Quick Links */}
               <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => navigate('/admin/loyalty/clients')} className="bg-[#1c1f24] p-6 rounded-[32px] border border-white/5 text-left hover:border-accent-gold/50 transition-all group shadow-xl">
                     <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">groups</span>
                     </div>
                     <h3 className="font-bold text-lg mb-1">Gestão de Clientes</h3>
                     <p className="text-xs text-gray-500">Visualizar saldos, ajustar pontos e níveis.</p>
                  </button>
                  <button onClick={() => navigate('/admin/loyalty/rewards')} className="bg-[#1c1f24] p-6 rounded-[32px] border border-white/5 text-left hover:border-accent-gold/50 transition-all group shadow-xl">
                     <div className="size-12 rounded-2xl bg-accent-gold/10 text-accent-gold flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">redeem</span>
                     </div>
                     <h3 className="font-bold text-lg mb-1">Gestão de Recompensas</h3>
                     <p className="text-xs text-gray-500">Cadastrar mimos, serviços e experiências.</p>
                  </button>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Actions Config */}
                  <section className="bg-[#1c1f24] p-6 rounded-[32px] border border-white/5 space-y-6">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-accent-gold flex items-center gap-2">
                        <span className="material-symbols-outlined">bolt</span>
                        Regras de Pontuação
                     </h3>
                     <div className="space-y-3">
                        {actions.map(action => (
                           <div key={action.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                              <div>
                                 <p className="font-bold text-sm">{action.description}</p>
                                 <p className="text-[10px] text-gray-500 uppercase tracking-wider">{action.code}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                 <div className="text-right">
                                    <span className="font-black text-accent-gold">{action.points_reward} pts</span>
                                    <p className="text-[9px] text-gray-600 uppercase">{action.is_active ? 'Ativo' : 'Inativo'}</p>
                                 </div>
                                 <button onClick={() => setEditingAction(action)} className="size-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white">
                                    <span className="material-symbols-outlined !text-sm">edit</span>
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </section>

                  {/* Tiers Config */}
                  <section className="bg-[#1c1f24] p-6 rounded-[32px] border border-white/5 space-y-6">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-accent-gold flex items-center gap-2">
                        <span className="material-symbols-outlined">military_tech</span>
                        Níveis de Fidelidade
                     </h3>
                     <div className="space-y-3">
                        {tiers.map(tier => (
                           <div key={tier.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border-l-4 border-l-white/20 hover:bg-white/10 transition-colors">
                              <div className="flex items-center gap-3">
                                 <div className={`size-10 rounded-xl flex items-center justify-center text-white text-xs font-bold ${tier.color.replace('bg-', 'bg-opacity-20 bg-')}`}>
                                    <span className="material-symbols-outlined !text-lg">{tier.icon}</span>
                                 </div>
                                 <div>
                                    <h4 className="font-bold text-sm">{tier.name}</h4>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Min: {tier.min_points} pts</p>
                                 </div>
                              </div>
                              <button onClick={() => { setEditingTier(tier); setTierForm(tier); }} className="size-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white">
                                 <span className="material-symbols-outlined !text-sm">edit</span>
                              </button>
                           </div>
                        ))}
                     </div>
                  </section>
               </div>
            </div>
         )}

         {/* Edit Action Modal */}
         {editingAction && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-[#1c1f24] w-full max-w-sm p-6 rounded-3xl border border-white/10 space-y-6">
                  <h3 className="text-lg font-bold">Editar Regra: {editingAction.description}</h3>
                  <div className="space-y-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Pontos Ofertados</label>
                        <input type="number"
                           className="w-full bg-[#121417] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-gold/50 outline-none"
                           value={editingAction.points_reward}
                           onChange={e => setEditingAction({ ...editingAction, points_reward: parseInt(e.target.value) })}
                        />
                     </div>
                     <div className="flex items-center gap-3 px-2">
                        <input type="checkbox" checked={editingAction.is_active} onChange={e => setEditingAction({ ...editingAction, is_active: e.target.checked })} className="size-4 accent-accent-gold" />
                        <label className="text-sm">Regra Ativa</label>
                     </div>
                  </div>
                  <div className="flex gap-3">
                     <button onClick={() => setEditingAction(null)} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 font-bold text-xs uppercase tracking-widest">Cancelar</button>
                     <button onClick={handleSaveAction} className="flex-1 py-3 rounded-xl bg-accent-gold text-black font-bold text-xs uppercase tracking-widest">Salvar</button>
                  </div>
               </div>
            </div>
         )}

         {/* Edit Tier Modal */}
         {editingTier && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="bg-[#1c1f24] w-full max-w-md p-6 rounded-3xl border border-white/10 space-y-6">
                  <h3 className="text-lg font-bold">Editar Nível: {editingTier.name}</h3>
                  <div className="space-y-4">
                     <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Pontos Mínimos</label>
                        <input type="number"
                           className="w-full bg-[#121417] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-gold/50 outline-none"
                           value={tierForm.min_points}
                           onChange={e => setTierForm({ ...tierForm, min_points: parseInt(e.target.value) })}
                        />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Benefícios (JSON Array)</label>
                        <textarea
                           className="w-full bg-[#121417] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-gold/50 outline-none h-32 font-mono"
                           value={JSON.stringify(tierForm.benefits, null, 2)}
                           onChange={e => {
                              try {
                                 setTierForm({ ...tierForm, benefits: JSON.parse(e.target.value) })
                              } catch (err) {
                                 // Keep editing
                              }
                           }}
                        />
                        <p className="text-[9px] text-gray-500 px-2 pt-1">Edite como lista ["Item 1", "Item 2"]</p>
                     </div>
                  </div>
                  <div className="flex gap-3">
                     <button onClick={() => setEditingTier(null)} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 font-bold text-xs uppercase tracking-widest">Cancelar</button>
                     <button onClick={handleSaveTier} className="flex-1 py-3 rounded-xl bg-accent-gold text-black font-bold text-xs uppercase tracking-widest">Salvar</button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default AdminLoyaltySettings;
