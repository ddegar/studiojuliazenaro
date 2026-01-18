
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CheckIn: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'LOCATING' | 'READY' | 'ERROR'>('LOCATING');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStep('READY');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleCheckIn = () => {
    setLoading(true);
    setTimeout(() => navigate('/checkin/success'), 1800);
  };

  return (
    <div className="flex flex-col h-full bg-background-light">
      <header className="p-8 flex items-center justify-between glass-nav border-b">
         <button onClick={() => navigate('/home')} className="material-symbols-outlined text-primary">close</button>
         <h2 className="font-display font-bold text-primary text-sm uppercase tracking-[0.3em]">Seja bem-vinda ✨</h2>
         <span className="size-6"></span>
      </header>

      <main className="flex-1 p-10 flex flex-col items-center justify-center text-center space-y-12">
         {step === 'LOCATING' && (
            <div className="space-y-10 animate-pulse">
               <div className="size-40 rounded-full bg-primary/5 flex items-center justify-center relative">
                  <span className="material-symbols-outlined text-primary !text-6xl">spa</span>
                  <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-ping"></div>
               </div>
               <div className="space-y-4">
                  <h3 className="text-3xl font-display font-bold text-primary">Aguardamos você...</h3>
                  <p className="text-sm text-gray-400 italic">Sinta a paz do nosso estúdio.</p>
               </div>
            </div>
         )}

         {step === 'READY' && (
            <div className="space-y-12 animate-fade-in w-full">
               <div className="size-40 rounded-full bg-primary/10 flex items-center justify-center mx-auto ring-[24px] ring-primary/5">
                  <span className="material-symbols-outlined text-primary !text-7xl">favorite</span>
               </div>
               
               <div className="space-y-4">
                  <h1 className="text-4xl font-display font-bold text-primary leading-tight">Olá, Maria! ✨</h1>
                  <p className="text-sm text-gray-500 italic">Fique à vontade, seu momento começou agora</p>
               </div>

               <div className="bg-white p-8 rounded-[48px] premium-shadow border border-gray-100 text-left space-y-6">
                  <div className="flex justify-between items-center">
                     <span className="text-[10px] uppercase font-black text-accent-gold tracking-[0.25em]">Estamos prontas</span>
                     <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-4 py-1.5 rounded-full uppercase">Confirmada</span>
                  </div>
                  <div className="space-y-2">
                     <p className="font-bold text-2xl text-primary leading-tight">Lash Lifting Premium</p>
                     <p className="text-sm text-gray-400 font-medium">Julia Zenaro • Experiência personalizada</p>
                  </div>
               </div>

               <button 
                onClick={handleCheckIn}
                disabled={loading}
                className="w-full h-20 bg-primary text-white rounded-[28px] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-transform"
               >
                  {loading ? <div className="size-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'NOTIFICAR CHEGADA ✨'}
               </button>
            </div>
         )}
      </main>
    </div>
  );
};

export default CheckIn;
