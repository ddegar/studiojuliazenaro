
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Tip } from '../types';

const PreCare: React.FC = () => {
   const navigate = useNavigate();
   const [tips, setTips] = useState<Tip[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetchFilteredTips = async () => {
         try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: appointments } = await supabase
               .from('appointments')
               .select('service_name, professional_id')
               .eq('user_id', user.id)
               .order('date', { ascending: false })
               .limit(1);

            const lastAppt = appointments?.[0];
            const { data: allTips } = await supabase.from('tips').select('*').eq('type', 'PRE_CARE').eq('active', true);

            if (allTips && lastAppt) {
               const filtered = allTips.filter(tip => {
                  const isGeneral = !tip.professional_id && !tip.linked_category;
                  const matchesProfessional = tip.professional_id === lastAppt.professional_id;
                  const matchesService = lastAppt.service_name?.toLowerCase().includes(tip.linked_category?.toLowerCase() || '___none___');
                  return isGeneral || matchesProfessional || matchesService;
               });
               setTips(filtered);
            } else if (allTips) {
               setTips(allTips.filter(tip => !tip.professional_id && !tip.linked_category));
            }
         } catch (error) {
            console.error(error);
         } finally {
            setLoading(false);
         }
      };
      fetchFilteredTips();
   }, []);

   return (
      <div className="flex flex-col h-full bg-background-light">
         <header className="glass-nav p-4 flex items-center justify-between border-b">
            <button onClick={() => navigate(-1)} className="material-symbols-outlined text-primary">arrow_back_ios_new</button>
            <h2 className="font-display font-bold text-lg">Preparação</h2>
            <span className="size-6"></span>
         </header>

         <main className="flex-1 p-6 space-y-10 overflow-y-auto no-scrollbar pb-32">
            <div className="text-center space-y-4">
               <div className="size-20 rounded-full border border-primary/10 flex items-center justify-center mx-auto bg-white premium-shadow">
                  <span className="material-symbols-outlined text-primary !text-3xl">lightbulb</span>
               </div>
               <h1 className="text-3xl font-display font-bold text-primary">Dicas Pré-Atendimento</h1>
               <p className="text-sm text-gray-500">Para o melhor resultado possível, siga as recomendações abaixo antes de vir ao estúdio.</p>
            </div>

            <div className="space-y-6">
               {loading ? <p className="text-center text-gray-500">Carregando dicas...</p> : tips.map((tip, i) => (
                  <div key={tip.id} className="flex gap-6 relative group">
                     <div className="absolute left-6 top-8 bottom-0 w-[1px] bg-primary/10 group-last:hidden"></div>
                     <div className="size-12 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0 relative z-10">{i + 1}</div>
                     <div className="space-y-2 pt-2">
                        <h4 className="font-bold text-primary">{tip.title}</h4>
                        <p className="text-xs text-gray-500 leading-relaxed">{tip.content}</p>
                     </div>
                  </div>
               ))}
               {!loading && tips.length === 0 && <p className="text-center text-gray-400">Nenhuma dica encontrada.</p>}
            </div>
         </main>

         <div className="p-6 glass-nav border-t">
            <button onClick={() => navigate('/home')} className="w-full h-14 bg-primary text-white rounded-xl font-bold uppercase tracking-widest text-xs">Entendi, estarei pronta!</button>
         </div>
      </div>
   );
};

export default PreCare;
