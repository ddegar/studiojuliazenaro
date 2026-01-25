
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CheckInSuccess: React.FC = () => {
   const navigate = useNavigate();
   const [actions, setActions] = useState({
      story: false,
      instagram: false
   });

   const handleAction = async (type: 'story' | 'instagram') => {
      if (type === 'instagram') {
         // Tenta abrir o Instagram e dá feedback
         window.open('https://instagram.com', '_blank');
         alert("Abra o Instagram, poste seu momento e marque @studiojuliazenaro para validar seus pontos! ✨");
      } else {
         alert("Foto enviada para a timeline do Studio! Você ganhou +20 JZ Balance ✨");
      }
      setActions(prev => ({ ...prev, [type]: true }));
   };

   return (
      <div className="flex flex-col h-full bg-background-dark text-white p-10 overflow-y-auto no-scrollbar selection:bg-accent-gold/20 pb-20 relative">
         {/* Decorative Elite Silhouettes */}
         <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-[-10%] left-[-20%] w-[70%] aspect-square organic-shape-1 bg-emerald-500/10 blur-[120px] animate-float"></div>
            <div className="absolute bottom-[-5%] right-[-10%] w-[60%] aspect-square organic-shape-2 bg-accent-gold/5 blur-[100px] animate-float" style={{ animationDelay: '2s' }}></div>
         </div>

         <div className="relative z-10 mb-12 text-center animate-reveal">
            <div className="relative size-24 mx-auto mb-8">
               <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse"></div>
               <div className="relative size-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] ring-4 ring-emerald-500/10 scale-110">
                  <span className="material-symbols-outlined !text-5xl text-white animate-reveal">verified</span>
               </div>
            </div>

            <div className="space-y-3">
               <h1 className="text-3xl font-display font-medium tracking-tight text-white italic leading-tight">Chegada Confirmada.</h1>
               <p className="text-emerald-400 font-outfit text-sm font-black uppercase tracking-[0.3em] block">Status: VIP Privé ✅</p>
            </div>

            <div className="mt-8 flex flex-col items-center gap-2 select-none">
               <div className="h-px w-8 bg-accent-gold/30"></div>
               <p className="text-white/40 text-[10px] uppercase font-black tracking-[0.5em]">Julia Zenaro Studio</p>
            </div>
         </div>

         <div className="relative z-10 space-y-8">
            <section className="bg-surface-dark/40 backdrop-blur-xl border border-white/5 rounded-[48px] p-8 space-y-8 animate-reveal" style={{ animationDelay: '0.2s' }}>
               <div className="flex flex-col items-center gap-2">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-gold/60">Potencialize seu brilho</h2>
                  <p className="text-xs text-white/40 font-light italic text-center">Ações exclusivas para membros da elite</p>
               </div>

               <div className="grid gap-4">
                  <button
                     onClick={() => handleAction('story')}
                     disabled={actions.story}
                     className={`group relative p-6 rounded-3xl border transition-all duration-500 active:scale-95 ${actions.story ? 'bg-emerald-500/10 border-emerald-500/20 opacity-60' : 'bg-white/5 border-white/10 hover:border-accent-gold/30'}`}
                  >
                     <div className="flex items-center gap-5">
                        <div className={`size-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform ${actions.story ? 'bg-emerald-500 text-white scale-90' : 'bg-primary text-accent-gold group-hover:scale-105'}`}>
                           <span className="material-symbols-outlined !text-2xl">{actions.story ? 'check' : 'auto_awesome'}</span>
                        </div>
                        <div className="text-left flex-1">
                           <p className={`text-sm font-outfit font-bold ${actions.story ? 'text-white/40 line-through' : 'text-white'}`}>Timeline JZ Privé</p>
                           <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] text-accent-gold font-black uppercase tracking-widest">+20 JZ Balance</span>
                           </div>
                        </div>
                        <span className="material-symbols-outlined text-white/10 group-hover:text-accent-gold transition-colors">east</span>
                     </div>
                  </button>

                  <button
                     onClick={() => handleAction('instagram')}
                     disabled={actions.instagram}
                     className={`group relative p-6 rounded-3xl border transition-all duration-500 active:scale-95 ${actions.instagram ? 'bg-emerald-500/10 border-emerald-500/20 opacity-60' : 'bg-white/5 border-white/10 hover:border-accent-gold/30'}`}
                  >
                     <div className="flex items-center gap-5">
                        <div className={`size-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform ${actions.instagram ? 'bg-emerald-500 text-white scale-90' : 'bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] text-white group-hover:scale-105'}`}>
                           <span className="material-symbols-outlined !text-2xl">{actions.instagram ? 'check' : 'share'}</span>
                        </div>
                        <div className="text-left flex-1">
                           <p className={`text-sm font-outfit font-bold ${actions.instagram ? 'text-white/40 line-through' : 'text-white'}`}>Social Presence</p>
                           <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] text-accent-gold font-black uppercase tracking-widest">+30 JZ Balance</span>
                           </div>
                        </div>
                        <span className="material-symbols-outlined text-white/10 group-hover:text-accent-gold transition-colors">east</span>
                     </div>
                  </button>
               </div>
            </section>

            <section className="bg-surface-dark border border-white/5 rounded-[48px] p-10 flex flex-col items-center gap-8 animate-reveal shadow-huge" style={{ animationDelay: '0.4s' }}>
               <div className="flex flex-col items-center gap-2 w-full">
                  <div className="size-10 rounded-full bg-accent-gold/10 flex items-center justify-center text-accent-gold border border-accent-gold/20 mb-2">
                     <span className="material-symbols-outlined !text-xl">wifi_tethering</span>
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">Conexão Digital Ilimitada</h3>
                  <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">Escaneie para conectar</p>
               </div>

               <div className="relative p-6 bg-white rounded-[32px] shadow-hugest max-w-[180px] group overflow-hidden">
                  <div className="absolute inset-0 bg-accent-gold opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none"></div>
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=WIFI:S:JuliaZenaro_Studio;T:WPA;P:beleza2024;;" alt="QR WiFi" className="w-full grayscale brightness-90 hover:grayscale-0 transition-all duration-700" />
               </div>

               <div className="text-center space-y-1 select-all">
                  <p className="text-sm font-display font-bold text-accent-gold tracking-widest italic">JuliaZenaro_Studio</p>
                  <div className="flex items-center justify-center gap-2 text-white/30 text-[9px] font-black uppercase tracking-widest">
                     <span className="material-symbols-outlined !text-[10px]">key</span>
                     <span>Passe: beleza2024</span>
                  </div>
               </div>
            </section>
         </div>

         <div className="mt-16 animate-reveal relative z-10" style={{ animationDelay: '0.6s' }}>
            <button
               onClick={() => navigate('/home')}
               className="group relative w-full h-20 bg-white/5 border border-white/10 text-white rounded-[32px] font-outfit font-black uppercase tracking-[0.4em] text-[10px] active:scale-95 transition-all overflow-hidden hover:bg-white hover:text-primary hover:border-white"
            >
               <span className="relative z-10">Finalizar e Relaxar</span>
               <div className="absolute inset-x-0 bottom-0 h-1 bg-accent-gold translate-y-full group-hover:translate-y-0 transition-transform"></div>
            </button>
         </div>

         <div className="mt-12 text-center opacity-10 select-none animate-reveal" style={{ animationDelay: '0.8s' }}>
            <p className="font-display italic text-base tracking-widest">Seu bem-estar é o nosso maior privilégio.</p>
         </div>
      </div>
   );
};

export default CheckInSuccess;
