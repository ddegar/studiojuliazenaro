
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import Logo from '../components/Logo';

const Testimonials: React.FC = () => {
   const navigate = useNavigate();
   const [testimonials, setTestimonials] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedImage, setSelectedImage] = useState<string | null>(null);

   useEffect(() => {
      fetchTestimonials();
   }, []);

   const fetchTestimonials = async () => {
      try {
         setLoading(true);
         const { data, error } = await supabase
            .from('testimonials')
            .select('*, profiles(name, profile_pic), professionals(name)')
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

         if (error) throw error;
         setTestimonials(data || []);
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   // Calculate real stats from data
   const getStats = () => {
      if (testimonials.length === 0) return { rating: 5.0, total: 0, excellence: 100 };

      const total = testimonials.length;
      const sum = testimonials.reduce((acc, t) => acc + (t.stars || 5), 0); // Default to 5 if null
      const rating = sum / total;

      // Calculate 'Excellence' percentage (4 or 5 stars)
      const excellentCount = testimonials.filter(t => (t.stars || 5) >= 4).length;
      const excellence = Math.round((excellentCount / total) * 100);

      return { rating, total, excellence };
   };

   const stats = getStats();

   return (
      <div className="flex flex-col h-full bg-background-dark text-white overflow-y-auto no-scrollbar selection:bg-accent-gold/20 pb-32 relative">
         {/* Dynamic Background Elements */}
         <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/30 blur-[100px] animate-float"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
         </div>

         {/* Premium Header */}
         <header className="sticky top-0 z-[100] premium-nav-dark px-6 py-5 flex items-center justify-between border-b border-white/5">
            <button onClick={() => navigate('/home')} className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-accent-gold hover:bg-white/10 active:scale-90 transition-all">
               <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
            </button>
            <div className="text-center">
               <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mb-1">Elite Testimonials</p>
               <h2 className="text-xl font-display italic text-white tracking-tight">Vozes JZ Privé</h2>
            </div>
            <div className="size-10"></div>
         </header>

         <main className="relative z-10 flex-1 p-8 space-y-12">
            {/* Excellence Dashboard */}
            <div className="text-center space-y-8 animate-reveal">
               <div className="relative inline-flex items-center justify-center">
                  <div className="absolute inset-0 bg-accent-gold/20 blur-3xl rounded-full"></div>
                  <div className="relative flex items-baseline gap-2">
                     <h1 className="text-7xl font-display italic text-accent-gold">{stats.rating.toFixed(1)}</h1>
                     <span className="material-symbols-outlined text-accent-gold !text-2xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                  </div>
               </div>

               <div className="flex justify-center gap-2 text-accent-gold mb-3">
                  {[1, 2, 3, 4, 5].map(i => (
                     <span key={i} className="material-symbols-outlined !text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
               </div>

               <div className="space-y-4">
                  <p className="text-[10px] font-black font-outfit uppercase tracking-[0.3em] text-white/40">
                     Sinfonia de satisfação baseada em <span className="text-white">{stats.total}</span> relatos de elite
                  </p>

                  <div className="bg-surface-dark border border-white/5 rounded-full px-6 py-3 flex items-center gap-4 max-w-[240px] mx-auto shadow-huge">
                     <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                           className="h-full bg-accent-gold rounded-full transition-all duration-1000"
                           style={{ width: `${stats.excellence}%` }}
                        ></div>
                     </div>
                     <span className="text-[9px] font-black font-outfit uppercase tracking-widest text-accent-gold">{stats.excellence}% de Excelência</span>
                  </div>
               </div>
            </div>

            {/* Stories Section */}
            <div className="space-y-10">
               <div className="flex items-center gap-3 px-2 border-b border-white/5 pb-4">
                  <div className="h-px w-8 bg-accent-gold/40"></div>
                  <h3 className="text-[10px] font-black font-outfit uppercase tracking-[0.4em] text-white/60">Fragmentos de Prestigio</h3>
               </div>

               {loading ? (
                  <div className="flex flex-col items-center gap-4 py-20 opacity-20">
                     <div className="size-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
                     <p className="text-[10px] uppercase font-black tracking-widest">Sincronizando Histórias</p>
                  </div>
               ) : testimonials.length === 0 ? (
                  <div className="text-center py-20 bg-surface-dark/40 rounded-[40px] border border-white/5">
                     <p className="text-sm font-outfit font-light italic text-white/20">O Mural de Praises aguarda seu relato.</p>
                  </div>
               ) : (
                  <div className="space-y-8">
                     {testimonials.map((item, idx) => (
                        <div
                           key={item.id}
                           className="group relative bg-surface-dark/40 backdrop-blur-xl p-8 rounded-[48px] border border-white/5 shadow-huge animate-reveal"
                           style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                           {/* Narrative Header */}
                           <div className="flex items-center gap-5 mb-8">
                              <div className="size-14 rounded-2xl overflow-hidden border-2 border-accent-gold/20 shadow-xl group-hover:scale-110 transition-transform duration-500">
                                 <img
                                    src={item.profiles?.profile_pic || `https://ui-avatars.com/api/?name=${item.profiles?.name}&background=122b22&color=c9a961`}
                                    alt={item.profiles?.name}
                                    className="w-full h-full object-cover"
                                 />
                              </div>
                              <div>
                                 <h4 className="font-display text-xl text-white italic leading-tight mb-1">
                                    {item.profiles?.name || 'Membro Privé'}
                                 </h4>
                                 <div className="flex items-center gap-2">
                                    <span className="size-1 rounded-full bg-accent-gold"></span>
                                    <p className="text-[9px] font-black font-outfit uppercase tracking-[0.2em] text-accent-gold/60">
                                       {item.professionals?.name ? `Signature by ${item.professionals.name}` : 'Membro VIP Verificado'}
                                    </p>
                                 </div>
                              </div>
                           </div>

                           {/* Stars */}
                           <div className="flex gap-1 text-accent-gold/40 mb-6">
                              {[...Array(5)].map((_, i) => (
                                 <span key={i} className={`material-symbols-outlined !text-sm ${i < (item.stars || 5) ? 'text-accent-gold' : ''}`} style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              ))}
                           </div>

                           {/* Testimony */}
                           <blockquote className="font-display italic text-white/70 leading-relaxed text-lg mb-8 relative">
                              <span className="absolute -top-4 -left-2 text-white/5 !text-6xl material-symbols-outlined select-none">format_quote</span>
                              "{item.text}"
                           </blockquote>

                           {/* Visual Evidence */}
                           {item.photo_url && (
                              <div className="mb-10 animate-reveal">
                                 <div
                                    onClick={() => setSelectedImage(item.photo_url)}
                                    className="relative aspect-[16/10] rounded-[32px] overflow-hidden cursor-zoom-in group border border-white/5 shadow-huge"
                                 >
                                    <img src={item.photo_url} alt="Resultado" className="w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-105" />
                                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-background-dark/80 to-transparent">
                                       <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/80 flex items-center gap-2">
                                          <span className="size-1 bg-accent-gold rounded-full"></span> Portrait da Beleza
                                       </span>
                                    </div>
                                    <div className="absolute inset-0 bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                 </div>
                              </div>
                           )}

                           {/* Verification Badge */}
                           <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                              <div className="size-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                 <span className="material-symbols-outlined !text-[12px] text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                              </div>
                              <span className="text-[9px] font-black font-outfit uppercase tracking-[0.3em] text-white/20">Elite Experience Certified</span>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </main>

         {/* Persistent Invitation */}
         <div className="fixed bottom-10 left-0 right-0 px-8 z-[110] flex justify-center pointer-events-none">
            <button
               onClick={() => navigate('/services')}
               className="pointer-events-auto group relative h-18 w-full max-w-[340px] bg-primary text-white rounded-[32px] font-outfit font-black text-[10px] uppercase tracking-[0.4em] shadow-hugest overflow-hidden active:scale-95 transition-all"
            >
               <div className="absolute inset-x-0 bottom-0 h-1 bg-accent-gold translate-y-full group-hover:translate-y-0 transition-transform"></div>
               <span className="relative z-10 flex items-center justify-center gap-4">
                  Viver meu Momento
                  <span className="material-symbols-outlined !text-xl text-accent-gold transition-transform group-hover:translate-x-2">calendar_month</span>
               </span>
            </button>
         </div>

         {/* Immersive Lightbox */}
         {selectedImage && (
            <div
               className="fixed inset-0 z-[200] bg-background-dark/98 backdrop-blur-3xl flex items-center justify-center p-8 animate-fade-in"
               onClick={() => setSelectedImage(null)}
            >
               <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-10 right-10 text-white/30 hover:text-white p-2 transition-colors"
               >
                  <span className="material-symbols-outlined !text-4xl">close</span>
               </button>
               <div className="relative max-w-full max-h-[80vh] group animate-reveal">
                  <div className="absolute -inset-4 bg-accent-gold/10 blur-3xl opacity-50"></div>
                  <img
                     src={selectedImage}
                     alt="Zoom"
                     className="relative max-w-full max-h-full rounded-[40px] shadow-hugest object-contain border border-white/10"
                     onClick={(e) => e.stopPropagation()}
                  />
               </div>
            </div>
         )}

         {/* Visual Safe Area Inset */}
         <div className="fixed bottom-0 left-0 w-full h-8 bg-background-dark pointer-events-none z-[90]"></div>
      </div>
   );
};

export default Testimonials;
