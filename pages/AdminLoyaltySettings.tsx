
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoyaltyTier, LoyaltyConfig } from '../types';

const INITIAL_TIERS: LoyaltyTier[] = [
   { id: '1', name: 'Select', minPoints: 0, color: 'bg-slate-400', icon: 'person', perks: ['Acesso ao Clube', '5% Cashback em produtos'] },
   { id: '2', name: 'Prime', minPoints: 500, color: 'bg-accent-gold', icon: 'star', perks: ['10% Cashback', 'Mimo Aniversário', 'Prioridade na Agenda'] },
   { id: '3', name: 'Signature', minPoints: 1000, color: 'bg-primary', icon: 'stars', perks: ['15% Cashback', 'VIP Status', 'Coffee Break Exclusivo'] },
   { id: '4', name: 'Privé', minPoints: 2000, color: 'bg-indigo-500', icon: 'diamond', perks: ['20% Cashback', 'Concierge Pessoal', 'Eventos Exclusivos'] },
];

const AdminLoyaltySettings: React.FC = () => {
   const navigate = useNavigate();
   const [config, setConfig] = useState({
      pointsEnabled: true,
      referralPoints: 50,
      checkInPoints: 10,
      storyAppPoints: 20,
      socialSharePoints: 30
   });
   const [tiers, setTiers] = useState<LoyaltyTier[]>(INITIAL_TIERS);
   const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);

   const handleSaveTier = () => {
      if (editingTier) {
         setTiers(tiers.map(t => t.id === editingTier.id ? editingTier : t));
         setEditingTier(null);
      }
   };

   return (
      <div className="flex flex-col h-full bg-background-dark text-white">
         <header className="p-4 border-b border-white/5 flex items-center justify-between glass-nav !bg-background-dark/80">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate(-1)} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
               <h1 className="text-lg font-bold">Regras de Fidelidade</h1>
            </div>
         </header>

         <main className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar pb-32">
            {/* Configuração Geral Gamificada */}
            <section className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-8">
               <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-accent-gold">Automatização de Pontos</h3>
                  <button
                     onClick={() => setConfig({ ...config, pointsEnabled: !config.pointsEnabled })}
                     className={`w-12 h-6 rounded-full relative transition-colors ${config.pointsEnabled ? 'bg-primary' : 'bg-zinc-800'}`}
                  >
                     <div className={`absolute top-1 size-4 bg-white rounded-full transition-all ${config.pointsEnabled ? 'right-1' : 'left-1'}`}></div>
                  </button>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest pl-1">Indicação Convertida</label>
                     <div className="flex items-center gap-3">
                        <input type="number" value={config.referralPoints} onChange={e => setConfig({ ...config, referralPoints: parseInt(e.target.value) })} className="flex-1 h-12 bg-white/5 border-white/10 rounded-xl px-4 text-sm font-bold" />
                        <span className="text-[9px] font-bold text-gray-400">PTS</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest pl-1">Check-in</label>
                        <div className="flex items-center gap-2">
                           <input type="number" value={config.checkInPoints} onChange={e => setConfig({ ...config, checkInPoints: parseInt(e.target.value) })} className="flex-1 h-12 bg-white/5 border-white/10 rounded-xl px-4 text-sm font-bold" />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest pl-1">Story no App</label>
                        <div className="flex items-center gap-2">
                           <input type="number" value={config.storyAppPoints} onChange={e => setConfig({ ...config, storyAppPoints: parseInt(e.target.value) })} className="flex-1 h-12 bg-white/5 border-white/10 rounded-xl px-4 text-sm font-bold" />
                        </div>
                     </div>
                     <div className="space-y-2 col-span-2">
                        <label className="text-[9px] uppercase font-black text-gray-500 tracking-widest pl-1">Compartilhar Redes Sociais</label>
                        <div className="flex items-center gap-2">
                           <input type="number" value={config.socialSharePoints} onChange={e => setConfig({ ...config, socialSharePoints: parseInt(e.target.value) })} className="flex-1 h-12 bg-white/5 border-white/10 rounded-xl px-4 text-sm font-bold" />
                        </div>
                     </div>
                  </div>
               </div>
            </section>

            {/* Níveis de Fidelidade */}
            <section className="space-y-4">
               <h3 className="text-sm font-bold uppercase tracking-widest text-accent-gold px-2">Níveis e Tiers</h3>
               <div className="space-y-3">
                  {tiers.map(tier => (
                     <div key={tier.id} className="bg-card-dark p-5 rounded-[32px] border border-white/5 flex items-center justify-between group active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-4">
                           <div className={`size-12 rounded-2xl ${tier.color} flex items-center justify-center text-white shadow-lg`}>
                              <span className="material-symbols-outlined">{tier.icon}</span>
                           </div>
                           <div>
                              <h4 className="font-bold text-sm">{tier.name}</h4>
                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{tier.minPoints} pts necessários</p>
                           </div>
                        </div>
                        <button onClick={() => setEditingTier(tier)} className="size-10 rounded-full bg-white/5 flex items-center justify-center text-accent-gold">
                           <span className="material-symbols-outlined !text-sm">edit</span>
                        </button>
                     </div>
                  ))}
               </div>
            </section>
         </main>

         {editingTier && (
            <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm">
               <div className="bg-card-dark w-full max-w-sm rounded-[40px] p-8 border border-white/10 space-y-6">
                  <h2 className="text-xl font-display font-bold">Editar {editingTier.name}</h2>
                  <div className="space-y-4">
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-500">Pontos Mínimos</label>
                        <input
                           type="number"
                           value={editingTier.minPoints}
                           onChange={e => setEditingTier({ ...editingTier, minPoints: parseInt(e.target.value) })}
                           className="w-full h-12 bg-white/5 border-white/10 rounded-xl px-4 text-sm font-bold"
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-500">Benefícios (Um por linha)</label>
                        <textarea
                           className="w-full h-24 bg-white/5 border-white/10 rounded-2xl p-4 text-sm"
                           value={editingTier.perks.join('\n')}
                           onChange={e => setEditingTier({ ...editingTier, perks: e.target.value.split('\n') })}
                        />
                     </div>
                  </div>
                  <div className="flex gap-3">
                     <button onClick={() => setEditingTier(null)} className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest">Cancelar</button>
                     <button onClick={handleSaveTier} className="flex-1 h-12 rounded-xl bg-primary text-white text-[10px] font-bold uppercase tracking-widest">Salvar</button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default AdminLoyaltySettings;
