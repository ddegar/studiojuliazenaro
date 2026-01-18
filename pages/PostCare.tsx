
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Tip } from '../types';

const PostCare: React.FC = () => {
   const navigate = useNavigate();
   const [tips, setTips] = useState<Tip[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetchTips = async () => {
         const { data } = await supabase.from('tips').select('*').eq('type', 'POST_CARE').eq('active', true);
         if (data) setTips(data);
         setLoading(false);
      };
      fetchTips();
   }, []);

   return (
      <div className="flex flex-col h-full bg-background-light">
         <header className="glass-nav p-4 flex items-center justify-between border-b">
            <button onClick={() => navigate(-1)} className="material-symbols-outlined text-primary">arrow_back_ios_new</button>
            <h2 className="font-display font-bold text-lg">Cuidados Pós</h2>
            <button onClick={() => navigate('/faq')} className="material-symbols-outlined text-accent-gold">help_center</button>
         </header>

         <main className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar">
            <div className="bg-primary/5 p-6 rounded-[40px] text-center space-y-3">
               <span className="text-accent-gold text-[10px] font-bold uppercase tracking-[0.3em]">Manutenção da Beleza</span>
               <h1 className="text-2xl font-display font-bold text-primary leading-tight">Como cuidar do seu <br />novo olhar</h1>
               <p className="text-xs text-gray-500 leading-relaxed">Siga estas instruções para garantir a durabilidade máxima do seu procedimento.</p>
            </div>

            <div className="space-y-4">
               {loading ? <p className="text-center text-gray-500">Carregando...</p> : tips.map((tip, i) => (
                  <div key={i} className="bg-white p-5 rounded-3xl border border-gray-100 flex gap-4 premium-shadow">
                     <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined">{tip.icon || 'star'}</span>
                     </div>
                     <div className="space-y-1">
                        <h4 className="font-bold text-primary text-sm">{tip.title}</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">{tip.content}</p>
                     </div>
                  </div>
               ))}
               {!loading && tips.length === 0 && <p className="text-center text-gray-400">Nenhuma instrução encontrada.</p>}
            </div>

            <div className="bg-accent-gold/5 p-6 rounded-3xl border border-accent-gold/20 flex flex-col items-center gap-4 text-center">
               <span className="material-symbols-outlined text-accent-gold !text-4xl">calendar_month</span>
               <div className="space-y-1">
                  <p className="text-xs font-bold text-primary uppercase">Próxima Manutenção</p>
                  <p className="text-xs font-bold font-display text-gray-500">Recomendado em 15-20 dias</p>
               </div>
               <button onClick={() => navigate('/booking')} className="px-6 py-2 bg-primary text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20">Agendar agora</button>
            </div>
         </main>
      </div>
   );
};

export default PostCare;
