
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
      <div className="flex flex-col h-full bg-background-dark text-white overflow-y-auto no-scrollbar selection:bg-accent-gold/20 pb-24 relative">
         {/* Dynamic Background Elements */}
         <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/30 blur-[100px] animate-float"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
         </div>

         <header className="sticky top-0 z-[100] premium-nav-dark px-6 py-5 flex items-center justify-between border-b border-white/5">
            <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-accent-gold hover:bg-white/10 active:scale-90 transition-all">
               <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
            </button>
            <div className="text-center">
               <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mb-1">Ritual de Preparo</p>
               <h2 className="text-xl font-display italic text-white tracking-tight">Antes do Encontro</h2>
            </div>
            <div className="size-10"></div>
         </header>

         <main className="relative z-10 flex-1 p-8 space-y-12">
            <div className="text-center space-y-6 animate-reveal">
               <div className="relative size-24 mx-auto">
                  <div className="absolute inset-0 bg-accent-gold/20 rounded-full blur-2xl animate-pulse"></div>
                  <div className="relative size-24 rounded-full bg-surface-dark border border-white/5 flex items-center justify-center shadow-huge">
                     <span className="material-symbols-outlined text-accent-gold !text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                  </div>
               </div>

               <div className="space-y-3">
                  <h1 className="text-3xl font-display font-medium text-white italic">Curadoria de Cuidados</h1>
                  <p className="text-sm font-outfit text-white/40 font-light leading-relaxed max-w-[280px] mx-auto">
                     Siga nossas recomendações de elite para garantir resultados impecáveis e duradouros.
                  </p>
               </div>
            </div>

            <div className="space-y-10 relative">
               {/* Timeline Connector */}
               <div className="absolute left-7 top-10 bottom-10 w-px bg-gradient-to-b from-accent-gold/40 via-accent-gold/5 to-transparent"></div>

               {loading ? (
                  <div className="flex flex-col items-center gap-4 py-10 opacity-20">
                     <div className="size-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
                     <p className="text-[10px] uppercase font-black tracking-widest">Sincronizando Ritual</p>
                  </div>
               ) : tips.map((tip, i) => (
                  <div key={tip.id} className="flex gap-8 relative group animate-reveal" style={{ animationDelay: `${i * 0.1}s` }}>
                     <div className="size-14 rounded-2xl bg-surface-dark border border-white/5 text-accent-gold flex items-center justify-center font-display text-xl font-bold shrink-0 relative z-10 shadow-huge group-hover:border-accent-gold/40 transition-colors">
                        {i + 1}
                        <div className="absolute inset-0 bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                     </div>
                     <div className="space-y-2 pt-2">
                        <div className="flex items-center gap-3">
                           <h4 className="text-base font-outfit font-black text-white uppercase tracking-wider">{tip.title}</h4>
                           <span className="size-1 rounded-full bg-accent-gold animate-pulse"></span>
                        </div>
                        <p className="text-[13px] text-white/40 font-light leading-relaxed italic">{tip.content}</p>
                     </div>
                  </div>
               ))}

               {!loading && tips.length === 0 && (
                  <div className="text-center py-10 opacity-20">
                     <p className="text-[10px] uppercase font-black font-outfit tracking-[0.4em]">Nenhuma diretriz necessária</p>
                  </div>
               )}
            </div>
         </main>

         <div className="p-8 fixed bottom-0 inset-x-0 glass-nav !bg-background-dark/90 border-t border-white/5 z-[60]">
            <button
               onClick={() => navigate('/home')}
               className="group relative w-full h-16 bg-accent-gold text-primary rounded-2xl font-outfit font-black text-[10px] uppercase tracking-[0.3em] overflow-hidden shadow-2xl shadow-accent-gold/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
               <div className="absolute inset-x-0 bottom-0 h-1 bg-primary translate-y-full group-hover:translate-y-0 transition-transform"></div>
               <span className="material-symbols-outlined !text-xl group-hover:scale-110 transition-transform">done_all</span>
               <span>Entendi o Ritual</span>
            </button>
         </div>

         {/* Visual Safe Area Inset */}
         <div className="fixed bottom-0 left-0 w-full h-8 bg-background-dark pointer-events-none z-[90]"></div>
      </div>
   );
};

export default PreCare;
