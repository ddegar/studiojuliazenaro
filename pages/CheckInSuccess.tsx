
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
       alert("Foto enviada para a timeline do Studio! Você ganhou +20 Lash Points ✨");
    }
    setActions(prev => ({ ...prev, [type]: true }));
  };

  return (
    <div className="flex flex-col h-full bg-background-dark text-white p-8 overflow-y-auto no-scrollbar pb-10">
      <div className="mb-8 text-center animate-fade-in">
         <div className="size-20 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/20 ring-4 ring-emerald-500/10">
            <span className="material-symbols-outlined !text-4xl text-white">verified</span>
         </div>
         <h1 className="text-3xl font-display font-bold tracking-tight text-emerald-500">Check-in Realizado!</h1>
         <p className="text-accent-gold text-lg font-display italic mt-2">Seja bem-vinda ao seu momento ✨</p>
         <p className="text-gray-500 text-[10px] mt-4 uppercase tracking-[0.25em] font-black">Aproveite esse tempo para relaxar e se cuidar</p>
      </div>

      <div className="space-y-6">
        <section className="bg-white/5 border border-white/10 rounded-[32px] p-6 space-y-6">
           <div className="text-center space-y-1">
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Ganhe mais Lash Points ✨</h2>
              <p className="text-[10px] text-gray-400 font-medium italic">Compartilhe sua experiência e ganhe benefícios</p>
           </div>

           <div className="space-y-4">
              <button 
                onClick={() => handleAction('story')}
                disabled={actions.story}
                className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all active:scale-95 ${actions.story ? 'bg-emerald-500/10 border-emerald-500/20 opacity-60' : 'bg-white/5 border-white/10'}`}
              >
                 <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-white">
                       <span className="material-symbols-outlined">add_a_photo</span>
                    </div>
                    <div className="text-left">
                       <p className="text-sm font-bold">Postar Story no App</p>
                       <p className="text-[9px] text-accent-gold font-black uppercase">+20 Pontos</p>
                    </div>
                 </div>
                 <span className="material-symbols-outlined text-gray-600">{actions.story ? 'check_circle' : 'chevron_right'}</span>
              </button>

              <button 
                onClick={() => handleAction('instagram')}
                disabled={actions.instagram}
                className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all active:scale-95 ${actions.instagram ? 'bg-emerald-500/10 border-emerald-500/20 opacity-60' : 'bg-white/5 border-white/10'}`}
              >
                 <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center text-white">
                       <span className="material-symbols-outlined">share</span>
                    </div>
                    <div className="text-left">
                       <p className="text-sm font-bold">Compartilhar no Instagram</p>
                       <p className="text-[9px] text-accent-gold font-black uppercase">+30 Pontos</p>
                    </div>
                 </div>
                 <span className="material-symbols-outlined text-gray-600">{actions.instagram ? 'check_circle' : 'chevron_right'}</span>
              </button>
           </div>
        </section>

        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 flex flex-col items-center gap-5">
           <div className="flex items-center gap-3 w-full">
              <span className="material-symbols-outlined text-accent-gold">wifi</span>
              <p className="text-xs font-bold uppercase tracking-widest">Conecte-se e relaxe 💖</p>
           </div>
           <div className="aspect-square bg-white p-3 rounded-2xl max-w-[140px] shadow-xl">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=WIFI:S:JuliaZenaro_Studio;T:WPA;P:beleza2024;;" alt="QR WiFi" />
           </div>
           <div className="text-center space-y-0.5">
              <p className="text-xs font-bold text-white">Studio Julia Zenaro</p>
              <p className="text-[9px] text-gray-500 font-medium">Senha: beleza2024</p>
           </div>
        </div>
      </div>

      <div className="mt-10">
        <button onClick={() => navigate('/home')} className="w-full h-16 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] active:bg-white/10 transition-colors">
          IR PARA INÍCIO 💖
        </button>
      </div>
    </div>
  );
};

export default CheckInSuccess;
