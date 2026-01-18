
import React from 'react';
import { useNavigate } from 'react-router-dom';

const BookingConfirmed: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-background-dark text-white p-10 items-center justify-center text-center">
      <div className="mb-12 relative">
        <div className="absolute inset-0 bg-accent-gold/20 blur-[60px] rounded-full animate-pulse"></div>
        <div className="relative z-10 size-32 rounded-full border-2 border-accent-gold/30 bg-primary/20 flex items-center justify-center shadow-[0_0_50px_rgba(228,199,143,0.3)]">
           <span className="material-symbols-outlined text-accent-gold !text-7xl animate-bounce-slow">verified</span>
        </div>
      </div>
      
      <div className="space-y-4 mb-16 relative z-10">
        <h1 className="font-display text-4xl font-bold tracking-tight text-white leading-tight">Estamos te <br/>esperando ✨</h1>
        <p className="text-accent-gold text-lg font-display italic">Vai ser um prazer cuidar de você</p>
        <p className="text-gray-500 text-xs leading-relaxed max-w-[280px] mx-auto uppercase tracking-widest font-black">
          Seu atendimento foi agendado com sucesso e carinho.
        </p>
      </div>
      
      <div className="w-full bg-white/5 border border-white/10 rounded-[40px] p-8 mb-16 text-left space-y-5 backdrop-blur-md">
         <div className="flex items-center gap-5">
            <div className="size-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
               <span className="material-symbols-outlined !text-3xl">favorite</span>
            </div>
            <div className="space-y-1">
               <p className="text-[10px] uppercase font-black text-accent-gold tracking-[0.2em]">Seu brilho garantido</p>
               <p className="text-sm text-gray-300 font-medium leading-tight">Prepare-se para um novo olhar.</p>
            </div>
         </div>
      </div>

      <div className="space-y-6 w-full relative z-10">
         <button 
          onClick={() => navigate('/home')}
          className="w-full h-20 bg-accent-gold text-primary rounded-[32px] font-black uppercase tracking-[0.3em] text-[11px] shadow-[0_20px_50px_-10px_rgba(228,199,143,0.4)] active:scale-[0.97] transition-all flex items-center justify-center gap-4 group"
         >
            Voltar para a Home 💖
         </button>
         
         <button 
          onClick={() => navigate('/history')}
          className="w-full h-14 bg-white/5 border border-white/10 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors flex items-center justify-center gap-3"
         >
            <span className="material-symbols-outlined !text-lg">calendar_month</span>
            Ver detalhes da reserva
         </button>
      </div>
    </div>
  );
};

export default BookingConfirmed;
