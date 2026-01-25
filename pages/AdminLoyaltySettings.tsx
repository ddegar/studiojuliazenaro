
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import AdminBottomNav from '../components/AdminBottomNav';

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
      <div className="flex flex-col h-full bg-background-dark text-white overflow-hidden selection:bg-accent-gold/20 relative">
         {/* Dynamic Background Engine */}
         <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/30 blur-[100px] animate-float"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-10 mix-blend-overlay"></div>
         </div>

         <header className="sticky top-0 z-[100] premium-nav-dark px-8 py-6 flex items-center justify-between border-b border-white/5 bg-background-dark/95 backdrop-blur-xl">
            <div className="flex items-center gap-6">
               <button onClick={() => navigate('/admin/settings')} className="size-11 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-accent-gold hover:bg-white/10 active:scale-90 transition-all shadow-huge">
                  <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
               </button>
               <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mb-1">Elite Control Hub</p>
                  <h1 className="text-xl font-display italic text-white tracking-tight">JZ Privé Architecture</h1>
               </div>
            </div>
            <div className="size-10"></div>
         </header>

         {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
               <div className="relative size-16 flex items-center justify-center">
                  <div className="absolute inset-0 border-2 border-white/5 rounded-full"></div>
                  <div className="absolute inset-0 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
                  <span className="material-symbols-outlined text-accent-gold scale-75">loyalty</span>
               </div>
               <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20">Sincronizando Engine de Fidelidade</p>
            </div>
         ) : (
            <main className="relative z-10 flex-1 p-8 space-y-12 overflow-y-auto no-scrollbar pb-32 animate-reveal">
               {/* Quick Links */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <button onClick={() => navigate('/admin/loyalty/clients')} className="group relative bg-surface-dark/40 p-10 rounded-[48px] border border-white/5 text-left hover:border-accent-gold/20 hover:bg-surface-dark transition-all duration-700 shadow-huge overflow-hidden">
                     <div className="absolute inset-0 bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                     <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-700 shadow-inner">
                        <span className="material-symbols-outlined !text-2xl">groups</span>
                     </div>
                     <h3 className="font-display italic text-2xl mb-2 text-white">Base de Membros</h3>
                     <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">Ajuste de saldos e auditoria de níveis.</p>
                  </button>
                  <button onClick={() => navigate('/admin/loyalty/rewards')} className="group relative bg-surface-dark/40 p-10 rounded-[48px] border border-white/5 text-left hover:border-accent-gold/20 hover:bg-surface-dark transition-all duration-700 shadow-huge overflow-hidden">
                     <div className="absolute inset-0 bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                     <div className="size-14 rounded-2xl bg-accent-gold/10 text-accent-gold flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-700 shadow-inner">
                        <span className="material-symbols-outlined !text-2xl">redeem</span>
                     </div>
                     <h3 className="font-display italic text-2xl mb-2 text-white">Catálogo de Mimos</h3>
                     <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">Regras de experiências e resgates.</p>
                  </button>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Actions Config */}
                  <section className="space-y-8">
                     <div className="flex items-center gap-4 px-2">
                        <div className="h-px w-6 bg-accent-gold/40"></div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-gold/60 font-outfit">Regras Generativas</h3>
                     </div>
                     <div className="space-y-4">
                        {actions.map((action, idx) => (
                           <div key={action.id} className="group relative flex items-center justify-between p-6 bg-surface-dark/40 border border-white/5 rounded-[32px] hover:bg-surface-dark hover:border-accent-gold/20 transition-all duration-500 animate-reveal" style={{ animationDelay: `${idx * 0.05}s` }}>
                              <div className="flex items-center gap-6 relative z-10">
                                 <div className={`size-12 rounded-2xl flex items-center justify-center border border-white/5 transition-all duration-700 ${action.is_active ? 'bg-primary/10 text-primary' : 'bg-white/5 text-white/20'}`}>
                                    <span className="material-symbols-outlined !text-xl">bolt</span>
                                 </div>
                                 <div>
                                    <p className="font-outfit font-bold text-sm text-white group-hover:text-accent-gold transition-colors">{action.description}</p>
                                    <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-black mt-0.5">{action.code}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-6 relative z-10">
                                 <div className="text-right">
                                    <span className="font-display italic text-xl text-accent-gold tabular-nums">+{action.points_reward}</span>
                                    <p className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${action.is_active ? 'text-emerald-500/40' : 'text-rose-500/40'}`}>
                                       {action.is_active ? 'Ativado' : 'Inativo'}
                                    </p>
                                 </div>
                                 <button onClick={() => setEditingAction(action)} className="size-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 active:scale-95 transition-all">
                                    <span className="material-symbols-outlined !text-xl">edit_note</span>
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </section>

                  {/* Tiers Config */}
                  <section className="space-y-8">
                     <div className="flex items-center gap-4 px-2">
                        <div className="h-px w-6 bg-accent-gold/40"></div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-gold/60 font-outfit">Hierarquia de Membros</h3>
                     </div>
                     <div className="space-y-4">
                        {tiers.map((tier, idx) => (
                           <div key={tier.id} className="group relative flex items-center justify-between p-6 bg-surface-dark/40 border border-white/5 rounded-[32px] hover:bg-surface-dark hover:border-accent-gold/20 transition-all duration-500 animate-reveal" style={{ animationDelay: `${idx * 0.05}s` }}>
                              <div className="flex items-center gap-6 relative z-10">
                                 <div className={`size-14 rounded-2xl flex items-center justify-center shadow-huge relative overflow-hidden transition-all duration-700 group-hover:scale-110`}>
                                    <div className={`absolute inset-0 opacity-20 ${tier.color === 'bg-slate-500' ? 'bg-slate-500' : tier.color === 'bg-accent-gold' ? 'bg-accent-gold' : 'bg-emerald-500'}`}></div>
                                    <span className="material-symbols-outlined !text-[28px] text-white relative z-10">{tier.icon}</span>
                                 </div>
                                 <div>
                                    <h4 className="font-display italic text-xl text-white group-hover:text-accent-gold transition-colors">{tier.name}</h4>
                                    <p className="text-[9px] text-white/20 uppercase font-black tracking-[0.3em] mt-0.5">Threshold: {tier.min_points} JZ Balance</p>
                                 </div>
                              </div>
                              <button onClick={() => { setEditingTier(tier); setTierForm(tier); }} className="size-11 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 active:scale-95 transition-all relative z-10 shadow-lg">
                                 <span className="material-symbols-outlined !text-xl">tune</span>
                              </button>
                           </div>
                        ))}
                     </div>
                  </section>
               </div>
            </main>
         )}

         {/* Modals with Elite Backdrop */}
         {(editingAction || editingTier) && <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md animate-reveal"></div>}

         {/* Edit Action Modal */}
         {editingAction && (
            <div className="fixed inset-0 z-[210] flex items-center justify-center p-8 animate-reveal">
               <div className="bg-surface-dark border border-white/10 w-full max-w-sm p-10 rounded-[48px] space-y-8 shadow-hugest relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-accent-gold/20"></div>
                  <div className="space-y-1">
                     <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40">Regra Operacional</p>
                     <h3 className="text-2xl font-display italic text-white leading-tight">{editingAction.description}</h3>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-3">
                        <label className="text-[9px] font-black text-white/20 uppercase tracking-widest px-2">JZ Balance por Ritual</label>
                        <input type="number"
                           className="w-full bg-white/5 border border-white/5 rounded-2xl px-8 py-4 text-sm focus:border-accent-gold/40 outline-none font-display italic text-xl transition-all"
                           value={editingAction.points_reward}
                           onChange={e => setEditingAction({ ...editingAction, points_reward: parseInt(e.target.value) })}
                        />
                     </div>
                     <button
                        onClick={() => setEditingAction({ ...editingAction, is_active: !editingAction.is_active })}
                        className="flex items-center gap-4 px-4 py-2 group/toggle"
                     >
                        <div className={`size-5 rounded-md border flex items-center justify-center transition-all ${editingAction.is_active ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-white/10 bg-white/5'}`}>
                           {editingAction.is_active && <span className="material-symbols-outlined !text-sm font-black">done</span>}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${editingAction.is_active ? 'text-white' : 'text-white/20'}`}>Regra Ativa no Core</span>
                     </button>
                  </div>
                  <div className="flex gap-4 pt-4">
                     <button onClick={() => setEditingAction(null)} className="flex-1 py-4 rounded-2xl bg-white/5 text-white/40 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Cancelar</button>
                     <button onClick={handleSaveAction} className="flex-2 px-10 py-4 rounded-2xl bg-accent-gold text-primary font-black text-[10px] uppercase tracking-widest shadow-huge active:scale-95 transition-all">Salvar Dossiê</button>
                  </div>
               </div>
            </div>
         )}

         {/* Edit Tier Modal */}
         {editingTier && (
            <div className="fixed inset-0 z-[210] flex items-center justify-center p-8 animate-reveal">
               <div className="bg-surface-dark border border-white/10 w-full max-w-lg p-12 rounded-[56px] space-y-10 shadow-hugest relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-accent-gold/20"></div>
                  <div className="space-y-1">
                     <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40">Hierarquia de Elite</p>
                     <h3 className="text-3xl font-display italic text-white leading-tight">Configurar Nível {editingTier.name}</h3>
                  </div>

                  <div className="space-y-8">
                     <div className="space-y-3">
                        <label className="text-[9px] font-black text-white/20 uppercase tracking-widest px-2">Pontos para Ascensão</label>
                        <input type="number"
                           className="w-full bg-white/5 border border-white/5 rounded-2xl px-8 py-4 text-sm focus:border-accent-gold/40 outline-none font-display italic text-2xl transition-all"
                           value={tierForm.min_points}
                           onChange={e => setTierForm({ ...tierForm, min_points: parseInt(e.target.value) })}
                        />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[9px] font-black text-white/20 uppercase tracking-widest px-2">Manifesto de Benefícios (JSON)</label>
                        <textarea
                           className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-6 text-sm focus:border-accent-gold/40 outline-none h-44 font-mono text-[11px] leading-relaxed transition-all"
                           value={JSON.stringify(tierForm.benefits, null, 2)}
                           onChange={e => {
                              try {
                                 setTierForm({ ...tierForm, benefits: JSON.parse(e.target.value) })
                              } catch (err) { }
                           }}
                        />
                        <p className="text-[8px] text-white/10 px-4 uppercase tracking-widest">Estrutura: ["Benefício 1", "Benefício 2"]</p>
                     </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                     <button onClick={() => setEditingTier(null)} className="flex-1 py-5 rounded-3xl bg-white/5 text-white/40 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Cancelar</button>
                     <button onClick={handleSaveTier} className="flex-2 px-12 py-5 rounded-3xl bg-accent-gold text-primary font-black text-[10px] uppercase tracking-widest shadow-huge active:scale-95 transition-all">Sincronizar Protocolo</button>
                  </div>
               </div>
            </div>
         )}

         <AdminBottomNav />

         {/* Visual Safe Area Inset */}
         <div className="fixed bottom-0 left-0 w-full h-8 bg-black pointer-events-none z-[90]"></div>
      </div>
   );
};

export default AdminLoyaltySettings;
