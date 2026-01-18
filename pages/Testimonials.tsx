
import React from 'react';
import { useNavigate } from 'react-router-dom';

const TESTIMONIALS = [
  { id: 1, name: 'Alice Rocha', text: 'O Lash Lifting da Julia mudou minha rotina. Acordo pronta todos os dias! O atendimento é impecável e o ambiente super relaxante.', date: 'Há 2 dias', stars: 5 },
  { id: 2, name: 'Camila Bento', text: 'Melhor estúdio de Campinas. A técnica clássica ficou super natural, exatamente como eu queria. Recomendo de olhos fechados!', date: 'Há 1 semana', stars: 5 },
  { id: 3, name: 'Beatriz Santos', text: 'Profissionalismo define. A Julia explica cada passo e nos deixa super confortáveis. Meus cílios nunca estiveram tão lindos.', date: 'Há 2 semanas', stars: 5 },
];

const Testimonials: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-background-light">
      <header className="glass-nav p-4 flex items-center justify-between border-b sticky top-0 z-50">
         <button onClick={() => navigate(-1)} className="material-symbols-outlined text-primary">arrow_back_ios_new</button>
         <h2 className="font-display font-bold text-lg">Depoimentos</h2>
         <button onClick={() => navigate('/evaluation')} className="text-primary text-xs font-bold uppercase underline">Avaliar</button>
      </header>

      <main className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar">
         <div className="text-center space-y-4 pt-4">
            <h1 className="text-3xl font-display font-bold text-primary">O que dizem sobre nós</h1>
            <p className="text-sm text-gray-500">A satisfação das nossas clientes é a nossa maior recompensa.</p>
         </div>

         <div className="space-y-4">
            {TESTIMONIALS.map(item => (
               <div key={item.id} className="bg-white p-6 rounded-3xl border border-gray-100 premium-shadow space-y-4">
                  <div className="flex justify-between items-center">
                     <div className="flex gap-1 text-accent-gold">
                        {[...Array(item.stars)].map((_, i) => (
                           <span key={i} className="material-symbols-outlined !text-sm" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                        ))}
                     </div>
                     <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">{item.date}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed italic">"{item.text}"</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                     <div className="size-8 rounded-full bg-primary/5 flex items-center justify-center text-primary text-[10px] font-bold">{item.name[0]}</div>
                     <span className="text-xs font-bold text-primary">{item.name}</span>
                  </div>
               </div>
            ))}
         </div>
         
         <div className="bg-primary/5 p-8 rounded-[40px] text-center space-y-4">
            <p className="text-sm font-bold text-primary">Quer aparecer aqui?</p>
            <button 
              onClick={() => navigate('/evaluation')}
              className="px-8 py-3 bg-primary text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20"
            >
              DEIXAR MEU FEEDBACK
            </button>
         </div>
      </main>
    </div>
  );
};

export default Testimonials;
