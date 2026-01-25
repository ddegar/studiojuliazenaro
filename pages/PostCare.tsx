
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Tip } from '../types';

const PostCare: React.FC = () => {
   const navigate = useNavigate();
   const [tips, setTips] = useState<Tip[]>([]);
   const [loading, setLoading] = useState(true);
   const [recentCompletedAppt, setRecentCompletedAppt] = useState<any>(null);

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
            setRecentCompletedAppt(lastAppt);

            const { data: allTips } = await supabase.from('tips').select('*').eq('type', 'POST_CARE').eq('active', true);

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
      <div className="flex flex-col h-full bg-background-light text-primary overflow-y-auto no-scrollbar selection:bg-accent-gold/20 pb-40 relative">
         {/* Dynamic Background Elements */}
         <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/30 blur-[100px] animate-float"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
         </div>

         <header className="sticky top-0 z-[100] premium-blur-light px-6 py-6 flex items-center justify-between border-b border-primary/5">
            <button onClick={() => navigate(-1)} className="size-11 flex items-center justify-center rounded-full bg-white border border-primary/5 text-primary shadow-sm active:scale-90 transition-all">
               <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
            </button>
            <div className="text-center">
               <p className="text-[9px] font-black uppercase tracking-[0.4em] text-accent-gold leading-none mb-1">Dossiê de Manutenção</p>
               <h2 className="text-xl font-display italic text-primary tracking-tight">Cuidado Pós-Encontro</h2>
            </div>
            <div className="size-11"></div>
         </header>

         <main className="relative z-10 flex-1 p-8 space-y-16">
            <div className="text-center space-y-6 animate-reveal">
               <div className="relative size-24 mx-auto">
                  <div className="absolute inset-0 bg-accent-gold/10 rounded-full blur-2xl animate-pulse"></div>
                  <div className="relative size-24 rounded-full bg-white border border-primary/5 flex items-center justify-center shadow-huge">
                     <span className="material-symbols-outlined text-accent-gold !text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>skincare</span>
                  </div>
               </div>

               <div className="space-y-3">
                  <h1 className="text-4xl font-display font-medium text-primary italic">Preservando o Brilho</h1>
                  <p className="text-sm font-outfit text-primary/60 font-light leading-relaxed max-w-[280px] mx-auto">
                     Siga estas diretrizes exclusivas para garantir a longevidade e saúde do seu procedimento.
                  </p>
               </div>
            </div>

            <div className="space-y-12 relative px-2">
               {/* Timeline Connector */}
               <div className="absolute left-8 top-10 bottom-10 w-px bg-gradient-to-b from-accent-gold/30 via-accent-gold/5 to-transparent"></div>

               {loading ? (
                  <div className="flex flex-col items-center gap-6 py-10">
                     <div className="size-12 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
                     <p className="text-[10px] uppercase font-black tracking-widest text-primary/20">Sincronizando Cuidados</p>
                  </div>
               ) : (
                  <div className="space-y-8">
                     {tips.length === 0 ? (
                        <div className="text-center py-12 opacity-30">
                           <p className="text-[10px] uppercase font-black font-outfit tracking-[0.4em]">Nenhuma recomendação no momento</p>
                        </div>
                     ) : tips.map((tip, i) => (
                        <div key={tip.id} className="flex gap-8 relative group animate-reveal" style={{ animationDelay: `${i * 0.1}s` }}>
                           <div className="size-16 rounded-[24px] bg-white border border-primary/5 text-accent-gold flex items-center justify-center shadow-huge group-hover:border-accent-gold/40 transition-all group-hover:scale-105 shrink-0 relative z-10">
                              <span className="material-symbols-outlined !text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{tip.icon || 'star'}</span>
                              <div className="absolute inset-0 bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[24px]"></div>
                           </div>
                           <div className="space-y-2 pt-3">
                              <div className="flex items-center gap-3">
                                 <h4 className="text-lg font-display italic text-primary leading-tight">{tip.title}</h4>
                                 <div className="size-1.5 rounded-full bg-accent-gold animate-pulse"></div>
                              </div>
                              <p className="text-sm text-primary/50 font-light leading-relaxed italic pr-4">{tip.content}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>

            {/* Maintenance Section */}
            <div className="pt-10 animate-reveal" style={{ animationDelay: '0.4s' }}>
               <div className="bg-primary/5 border border-primary/10 p-10 rounded-[48px] text-center space-y-8 relative overflow-hidden group">
                  <div className="absolute -top-20 -right-20 size-64 bg-accent-gold/5 blur-[80px] rounded-full group-hover:bg-accent-gold/10 transition-all duration-[2s]"></div>

                  <div className="space-y-2 relative z-10">
                     <div className="size-14 mx-auto rounded-2xl bg-white flex items-center justify-center text-accent-gold shadow-sm mb-4">
                        <span className="material-symbols-outlined !text-3xl">calendar_month</span>
                     </div>
                     <h3 className="text-2xl font-display italic text-primary">Sua Próxima Manutenção</h3>
                     <p className="text-[10px] font-black font-outfit text-primary/30 tracking-[0.3em] uppercase italic">Ciclo ideal entre 15 e 21 dias</p>
                  </div>

                  <button
                     onClick={() => navigate('/booking')}
                     className="w-full h-16 bg-white border border-primary/10 text-primary rounded-[24px] font-outfit font-black text-[10px] uppercase tracking-[0.4em] hover:bg-primary hover:text-white transition-all active:scale-95 relative z-10 shadow-sm"
                  >
                     Reservar Novo Horário
                  </button>
               </div>
            </div>
         </main>

         {/* Elite Action Bar */}
         <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[450px] z-[100]">
            <div className="premium-blur-light rounded-[32px] border border-white shadow-hugest px-8 py-5">
               <button
                  onClick={() => navigate('/home')}
                  className="group relative w-full h-16 bg-primary text-white rounded-[24px] overflow-hidden shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4"
               >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s]"></div>
                  <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.4em] text-accent-gold group-hover:text-white transition-colors">
                     Ciente dos Cuidados
                  </span>
                  <span className="material-symbols-outlined !text-xl text-accent-gold group-hover:text-white relative z-10 transition-colors">verified</span>
               </button>
            </div>
         </div>

         {/* Visual Safe Area Inset */}
         <div className="fixed bottom-0 left-0 w-full h-8 bg-background-light pointer-events-none z-[90]"></div>
      </div>
   );
};

export default PostCare;
