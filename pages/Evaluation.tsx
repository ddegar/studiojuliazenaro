
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Evaluation: React.FC = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);

  return (
    <div className="flex flex-col h-full bg-background-light">
      <header className="p-8 flex items-center justify-between glass-nav border-b">
         <button onClick={() => navigate('/home')} className="material-symbols-outlined text-primary">close</button>
         <h2 className="font-display font-bold text-primary text-sm uppercase tracking-[0.3em]">Sua Experiência</h2>
         <span className="size-6"></span>
      </header>

      <main className="flex-1 p-10 flex flex-col items-center justify-center text-center space-y-12">
         <div className="space-y-6">
            <h1 className="text-4xl font-display font-bold text-primary leading-tight">Como foi sua <br/>experiência? 💖</h1>
            <p className="text-sm text-gray-500 leading-relaxed italic">Sua opinião é muito importante para nós ✨</p>
         </div>

         <div className="flex gap-4">
            {[1,2,3,4,5].map(star => (
               <button 
                key={star} 
                onClick={() => setRating(star)}
                className="transition-all active:scale-90"
               >
                  <span className={`material-symbols-outlined !text-5xl ${rating >= star ? 'text-accent-gold fill-1' : 'text-gray-200'}`} style={{fontVariationSettings: rating >= star ? "'FILL' 1" : "'FILL' 0"}}>
                    star
                  </span>
               </button>
            ))}
         </div>

         <textarea 
          placeholder="Deseja deixar uma nota carinhosa para a Julia? ✨"
          className="w-full bg-white border border-gray-100 rounded-[32px] p-8 text-sm focus:ring-primary h-48 premium-shadow italic placeholder:text-gray-300"
         />

         <div className="flex items-center gap-5 w-full bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <input type="checkbox" className="size-6 rounded-full text-primary focus:ring-primary border-gray-200" id="share" />
            <label htmlFor="share" className="text-[11px] text-gray-500 font-bold text-left leading-relaxed">Autorizo o Studio Julia Zenaro a compartilhar minha avaliação carinhosa 💖</label>
         </div>

         <button 
          onClick={() => navigate('/home')}
          className="w-full h-20 bg-primary text-white rounded-[28px] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl active:scale-95 transition-transform"
         >
            ENVIAR FEEDBACK ✨
         </button>
      </main>
    </div>
  );
};

export default Evaluation;
