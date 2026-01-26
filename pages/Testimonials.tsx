
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import Logo from '../components/Logo';

const Testimonials: React.FC = () => {
   const navigate = useNavigate();
   const [testimonials, setTestimonials] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedImage, setSelectedImage] = useState<string | null>(null);
   const [allowSubmission, setAllowSubmission] = useState(false);
   const [showSubmissionModal, setShowSubmissionModal] = useState(false);
   const [newTestimonial, setNewTestimonial] = useState('');
   const [newRating, setNewRating] = useState(5);
   const [submitting, setSubmitting] = useState(false);

   useEffect(() => {
      fetchTestimonials();
      fetchConfig();
   }, []);

   const fetchConfig = async () => {
      const { data } = await supabase.from('studio_config').select('value').eq('key', 'allow_public_testimonials').maybeSingle();
      if (data) setAllowSubmission(data.value === 'true');
   };

   const [uploadingImage, setUploadingImage] = useState(false);
   const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

   const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
         alert('Por favor, selecione uma imagem válida.');
         return;
      }

      if (file.size > 5 * 1024 * 1024) {
         alert('A imagem deve ter no máximo 5MB.');
         return;
      }

      try {
         setUploadingImage(true);
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) throw new Error('Usuário não autenticado');

         const fileExt = file.name.split('.').pop();
         const fileName = `${user.id}-${Date.now()}.${fileExt}`;
         const filePath = `${fileName}`;

         const { error: uploadError } = await supabase.storage
            .from('testimonials')
            .upload(filePath, file);

         if (uploadError) throw uploadError;

         const { data: { publicUrl } } = supabase.storage
            .from('testimonials')
            .getPublicUrl(filePath);

         setTempImageUrl(publicUrl);
      } catch (err: any) {
         console.error('Upload error:', err);
         alert('Erro ao fazer upload: ' + err.message);
      } finally {
         setUploadingImage(false);
      }
   };

   const handleSubmitTestimonial = async () => {
      if (!newTestimonial.trim()) return;
      setSubmitting(true);
      try {
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) {
            alert('Você precisa estar logada para enviar um depoimento.');
            navigate('/login');
            return;
         }

         // Fetch user name for the required column
         const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single();
         const userName = profile?.name || user.user_metadata?.name || 'Cliente';

         const { error } = await supabase.from('testimonials').insert({
            user_id: user.id,
            name: userName, // Satisfy NOT NULL constraint
            text: newTestimonial,
            message: newTestimonial,
            stars: newRating,
            rating: newRating,
            status: 'pending',
            photo_url: tempImageUrl
         });

         if (error) throw error;

         alert('Depoimento enviado com sucesso! Ele será analisado pela nossa equipe. ✨');
         setShowSubmissionModal(false);
         setNewTestimonial('');
         setNewRating(5);
         setTempImageUrl(null);
      } catch (error: any) {
         console.error('Error submitting testimonial:', error);
         alert('Erro ao enviar depoimento: ' + error.message);
      } finally {
         setSubmitting(false);
      }
   };

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
      <div className="flex flex-col h-full bg-background-light text-primary overflow-y-auto no-scrollbar selection:bg-accent-gold/20 pb-32 relative">
         {/* Dynamic Background Elements */}
         <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/30 blur-[100px] animate-float"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
         </div>

         {/* Premium Header */}
         <header className="sticky top-0 z-[100] premium-blur px-6 py-5 flex items-center justify-between border-b border-primary/5">
            <button onClick={() => navigate('/home')} className="size-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-primary/5 text-primary hover:scale-105 active:scale-95 transition-all">
               <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
            </button>
            <div className="text-center">
               <p className="text-[8px] font-black uppercase tracking-[0.4em] text-primary/40 leading-none mb-1">Elite Testimonials</p>
               <h2 className="text-xl font-display italic text-primary tracking-tight">Vozes JZ Privé</h2>
            </div>
            <div className="size-10"></div>
         </header>

         <main className="relative z-10 flex-1 p-8 space-y-12">
            {/* Excellence Dashboard */}
            <div className="text-center space-y-8 animate-reveal">
               <div className="relative inline-flex items-center justify-center">
                  <div className="absolute inset-0 bg-accent-gold/20 blur-3xl rounded-full"></div>
                  <div className="relative flex items-baseline gap-2">
                     <h1 className="text-7xl font-display italic text-primary">{stats.rating.toFixed(1)}</h1>
                     <span className="material-symbols-outlined text-accent-gold !text-2xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                  </div>
               </div>

               <div className="flex justify-center gap-2 text-accent-gold mb-3">
                  {[1, 2, 3, 4, 5].map(i => (
                     <span key={i} className="material-symbols-outlined !text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
               </div>

               <div className="space-y-4">
                  <p className="text-[10px] font-black font-outfit uppercase tracking-[0.3em] text-primary/40">
                     Sinfonia de satisfação baseada em <span className="text-primary">{stats.total}</span> relatos de elite
                  </p>

                  <div className="bg-white border border-primary/5 rounded-full px-6 py-3 flex items-center gap-4 max-w-[240px] mx-auto shadow-huge">
                     <div className="h-1 flex-1 bg-primary/5 rounded-full overflow-hidden">
                        <div
                           className="h-full bg-accent-gold rounded-full transition-all duration-1000"
                           style={{ width: `${stats.excellence}%` }}
                        ></div>
                     </div>
                     <span className="text-[9px] font-black font-outfit uppercase tracking-widest text-primary">{stats.excellence}% de Excelência</span>
                  </div>
               </div>
            </div>

            {/* Stories Section */}
            <div className="space-y-10">
               <div className="flex items-center gap-3 px-2 border-b border-primary/5 pb-4">
                  <div className="h-px w-8 bg-accent-gold/40"></div>
                  <h3 className="text-[10px] font-black font-outfit uppercase tracking-[0.4em] text-primary/60">Fragmentos de Prestigio</h3>
               </div>

               {loading ? (
                  <div className="flex flex-col items-center gap-4 py-20 opacity-20">
                     <div className="size-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
                     <p className="text-[10px] uppercase font-black tracking-widest text-primary">Sincronizando Histórias</p>
                  </div>
               ) : testimonials.length === 0 ? (
                  <div className="text-center py-20 bg-white/40 rounded-[40px] border border-primary/5 shadow-huge">
                     <p className="text-sm font-outfit font-light italic text-primary/40">O Mural de Praises aguarda seu relato.</p>
                  </div>
               ) : (
                  <div className="space-y-8">
                     {testimonials.map((item, idx) => (
                        <div
                           key={item.id}
                           className="group relative bg-white p-8 rounded-[48px] border border-primary/5 shadow-huge animate-reveal hover:shadow-hugest transition-all duration-500"
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
                                 <h4 className="font-display text-xl text-primary italic leading-tight mb-1">
                                    {item.profiles?.name || 'Membro Privé'}
                                 </h4>
                                 <div className="flex items-center gap-2">
                                    <span className="size-1 rounded-full bg-accent-gold"></span>
                                    <p className="text-[9px] font-black font-outfit uppercase tracking-[0.2em] text-primary/40">
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
                           <blockquote className="font-display italic text-primary/80 leading-relaxed text-lg mb-8 relative">
                              <span className="absolute -top-4 -left-2 text-primary/5 !text-6xl material-symbols-outlined select-none">format_quote</span>
                              "{item.text}"
                           </blockquote>

                           {/* Visual Evidence */}
                           {item.photo_url && (
                              <div className="mb-10 animate-reveal">
                                 <div
                                    onClick={() => setSelectedImage(item.photo_url)}
                                    className="relative aspect-[16/10] rounded-[32px] overflow-hidden cursor-zoom-in group border border-primary/5 shadow-huge"
                                 >
                                    <img src={item.photo_url} alt="Resultado" className="w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-105" />
                                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-white/90 to-transparent">
                                       <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/80 flex items-center gap-2">
                                          <span className="size-1 bg-accent-gold rounded-full"></span> Portrait da Beleza
                                       </span>
                                    </div>
                                    <div className="absolute inset-0 bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                 </div>
                              </div>
                           )}

                           {/* Verification Badge */}
                           <div className="flex items-center gap-3 pt-6 border-t border-primary/5">
                              <div className="size-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                 <span className="material-symbols-outlined !text-[12px] text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                              </div>
                              <span className="text-[9px] font-black font-outfit uppercase tracking-[0.3em] text-primary/30">Elite Experience Certified</span>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </main>

         {/* Submission Button (Conditional) */}
         {allowSubmission && (
            <div className="fixed top-24 right-6 z-[90] animate-reveal">
               <button
                  onClick={() => setShowSubmissionModal(true)}
                  className="size-12 rounded-full bg-accent-gold text-primary shadow-huge flex items-center justify-center hover:scale-110 active:scale-90 transition-all"
               >
                  <span className="material-symbols-outlined !text-2xl">rate_review</span>
               </button>
            </div>
         )}

         {/* Submission Modal */}
         {showSubmissionModal && (
            <div className="fixed inset-0 z-[150] bg-white/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
               <div className="w-full max-w-md bg-white rounded-[40px] shadow-hugest border border-primary/10 p-8 relative animate-reveal">
                  <button
                     onClick={() => setShowSubmissionModal(false)}
                     className="absolute top-6 right-6 text-primary/30 hover:text-primary transition-colors"
                  >
                     <span className="material-symbols-outlined">close</span>
                  </button>

                  <h3 className="text-2xl font-display italic text-primary mb-2">Seu Relato</h3>
                  <p className="text-xs font-outfit text-primary/60 mb-8">Compartilhe como foi sua experiência conosco.</p>

                  <div className="space-y-6">
                     {/* Image Upload Area */}
                     <div className="flex gap-4 items-center">
                        <div className="relative size-16 bg-background-light rounded-xl border border-primary/10 flex items-center justify-center overflow-hidden">
                           {tempImageUrl ? (
                              <img src={tempImageUrl} alt="Preview" className="size-full object-cover" />
                           ) : (
                              <span className="material-symbols-outlined text-primary/20">add_a_photo</span>
                           )}
                           <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                           />
                           {uploadingImage && (
                              <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                                 <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                              </div>
                           )}
                        </div>
                        <div className="flex-1">
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1">Foto do Resultado (Opcional)</p>
                           <p className="text-[9px] font-outfit text-primary/40">Mostre o brilho do seu olhar.</p>
                        </div>
                     </div>

                     <textarea
                        value={newTestimonial}
                        onChange={(e) => setNewTestimonial(e.target.value)}
                        placeholder="Escreva aqui..."
                        className="w-full h-32 bg-background-light rounded-2xl p-4 text-primary text-sm font-outfit border border-primary/5 focus:border-accent-gold outline-none resize-none"
                     />
                     <div className="flex gap-2 justify-center mb-4">
                        {[1, 2, 3, 4, 5].map(star => (
                           <button key={star} onClick={() => setNewRating(star)} className="focus:outline-none transition-transform active:scale-95">
                              <span className={`material-symbols-outlined !text-3xl ${star <= newRating ? 'text-accent-gold' : 'text-primary/10'}`} style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                           </button>
                        ))}
                     </div>
                     <button
                        onClick={handleSubmitTestimonial}
                        disabled={submitting || !newTestimonial.trim()}
                        className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-huge disabled:opacity-50 hover:bg-primary-dark transition-all"
                     >
                        {submitting ? 'Enviando...' : 'Enviar Depoimento'}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Immersive Lightbox */}
         {selectedImage && (
            <div
               className="fixed inset-0 z-[200] bg-white/90 backdrop-blur-xl flex items-center justify-center p-8 animate-fade-in"
               onClick={() => setSelectedImage(null)}
            >
               <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-10 right-10 text-primary/30 hover:text-primary p-2 transition-colors"
               >
                  <span className="material-symbols-outlined !text-4xl">close</span>
               </button>
               <div className="relative max-w-full max-h-[80vh] group animate-reveal">
                  <div className="absolute -inset-4 bg-accent-gold/10 blur-3xl opacity-50"></div>
                  <img
                     src={selectedImage}
                     alt="Zoom"
                     className="relative max-w-full max-h-full rounded-[40px] shadow-hugest object-contain border border-white"
                     onClick={(e) => e.stopPropagation()}
                  />
               </div>
            </div>
         )}

         {/* Visual Safe Area Inset */}
         <div className="fixed bottom-0 left-0 w-full h-8 bg-white/50 backdrop-blur-md pointer-events-none z-[90]"></div>
      </div>
   );
};

export default Testimonials;
