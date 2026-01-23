
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
      <div className="flex flex-col h-full min-h-screen bg-[#f8f7f4] relative">
         {/* Top Bar with Back Button */}
         <div className="p-6 pb-2 flex items-center justify-between sticky top-0 z-40 bg-[#f8f7f4]/95 backdrop-blur-sm">
            <button onClick={() => navigate('/home')} className="size-10 flex items-center justify-center rounded-full bg-white border border-[#2D5043]/10 shadow-sm text-[#2D5043]">
               <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
            </button>
            <div className="flex items-center justify-center flex-1">
               <Logo size="md" className="w-[180px]" />
            </div>
            <div className="size-10"></div>
         </div>

         <main className="flex-1 px-6 pb-32">
            {/* Rating Header */}
            <div className="text-center py-8">
               <div className="flex justify-center items-start gap-2 mb-2">
                  <h1 className="text-6xl font-display font-medium text-[#C5A059]">{stats.rating.toFixed(1)}</h1>
                  <span className="material-symbols-outlined text-[#C5A059] !text-xl mt-2">auto_awesome</span>
               </div>
               <div className="flex justify-center gap-1.5 text-[#C5A059] mb-3">
                  {[1, 2, 3, 4, 5].map(i => (
                     <span key={i} className="material-symbols-outlined !text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
               </div>
               <p className="text-[10px] uppercase tracking-[0.1em] text-[#2D5043]/60 font-medium mb-6">
                  Baseado em {stats.total} avaliações impecáveis
               </p>

               {/* Excellence Bar */}
               <div className="flex items-center gap-3 max-w-[200px] mx-auto">
                  <div className="h-1 flex-1 bg-[#2D5043]/10 rounded-full overflow-hidden">
                     <div className="h-full w-[96%] bg-[#2D5043] rounded-full"></div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#2D5043]/40">96% Excelente</span>
               </div>
            </div>

            {/* Section Title */}
            <div className="flex items-baseline justify-between mb-6 border-b border-[#2D5043]/5 pb-2">
               <h3 className="font-display font-medium text-2xl text-[#1a1c1a] italic">Histórias Reais</h3>
               <span className="text-[9px] font-black uppercase tracking-widest text-[#2D5043]/40">Membro VIP</span>
            </div>

            {/* Testimonials List */}
            {loading ? (
               <div className="flex justify-center py-10">
                  <div className="size-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div>
               </div>
            ) : testimonials.length === 0 ? (
               <div className="text-center py-20 opacity-30">
                  <p className="italic text-[#2D5043]">Ainda não há novas histórias.</p>
               </div>
            ) : (
               <div className="space-y-6">
                  {testimonials.map(item => (
                     <div key={item.id} className="bg-white p-6 rounded-[24px] shadow-[0_2px_20px_-10px_rgba(0,0,0,0.05)] border border-[#2D5043]/5">
                        {/* Card Header */}
                        <div className="flex items-center gap-4 mb-4">
                           <div className="size-12 rounded-full overflow-hidden border border-[#f8f7f4]">
                              <img
                                 src={item.profiles?.profile_pic || `https://ui-avatars.com/api/?name=${item.profiles?.name}&background=ebdccb&color=2d5043`}
                                 alt={item.profiles?.name}
                                 className="w-full h-full object-cover"
                              />
                           </div>
                           <div>
                              <h4 className="font-display font-bold text-lg text-[#2D5043] leading-none mb-1">
                                 {item.profiles?.name || 'Cliente Secreta'}
                              </h4>
                              <p className="text-[9px] font-black uppercase tracking-widest text-[#C5A059]">
                                 {item.professionals?.name ? `Atendida por ${item.professionals.name}` : 'Cliente Verificada'}
                              </p>
                           </div>
                        </div>

                        {/* Stars */}
                        <div className="flex gap-0.5 text-[#C5A059] mb-4">
                           {[...Array(item.stars || 5)].map((_, i) => (
                              <span key={i} className="material-symbols-outlined !text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                           ))}
                        </div>

                        {/* Text */}
                        <p className="font-display italic text-[#1a1c1a]/80 leading-relaxed text-[15px] mb-6">
                           "{item.text}"
                        </p>

                        {/* Photos (Thumbnails) */}
                        {item.photo_url && (
                           <div className="flex gap-3 mb-6">
                              <div
                                 onClick={() => setSelectedImage(item.photo_url)}
                                 className="relative h-16 w-24 rounded-xl overflow-hidden cursor-zoom-in group border border-[#2D5043]/5"
                              >
                                 <img src={item.photo_url} alt="Resultado" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                 <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/50 backdrop-blur rounded text-[7px] font-bold text-white uppercase tracking-wider">
                                    Resultado
                                 </div>
                              </div>
                           </div>
                        )}

                        {/* Footer Badge */}
                        <div className="flex items-center gap-2 pt-4 border-t border-[#f8f7f4]">
                           <span className="material-symbols-outlined text-[#2D5043] !text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                           <span className="text-[9px] font-bold uppercase tracking-widest text-[#2D5043]/40">Avaliação Verificada</span>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </main>

         {/* Floating CTA */}
         <div className="fixed bottom-8 left-0 right-0 px-6 z-40 flex justify-center pointer-events-none">
            <button
               onClick={() => navigate('/services')}
               className="pointer-events-auto bg-[#2D5043] text-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl flex items-center gap-3 active:scale-95 transition-all w-full max-w-[320px] justify-center hover:bg-[#1f3a30]"
            >
               Agendar Experiência
               <span className="material-symbols-outlined !text-sm">calendar_month</span>
            </button>
         </div>

         {/* Lightbox Modal */}
         {selectedImage && (
            <div
               className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-fade-in"
               onClick={() => setSelectedImage(null)}
            >
               <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-6 right-6 text-white/50 hover:text-white p-2"
               >
                  <span className="material-symbols-outlined !text-3xl">close</span>
               </button>
               <img
                  src={selectedImage}
                  alt="Zoom"
                  className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
                  onClick={(e) => e.stopPropagation()}
               />
            </div>
         )}
      </div>
   );
};

export default Testimonials;
