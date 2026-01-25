
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const Evaluation: React.FC = () => {
   const navigate = useNavigate();
   const [rating, setRating] = useState(0);
   const [testimonial, setTestimonial] = useState('');
   const [allowFeed, setAllowFeed] = useState(true);
   const [photo, setPhoto] = useState<File | null>(null);
   const [photoPreview, setPhotoPreview] = useState<string | null>(null);
   const [loading, setLoading] = useState(false);
   const [lastAppointment, setLastAppointment] = useState<any>(null);

   useEffect(() => {
      fetchLastAppointment();
   }, []);

   const fetchLastAppointment = async () => {
      try {
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) return;

         const { data, error } = await supabase
            .from('appointments')
            .select('*, professionals(id, name), services(id, name)')
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .order('date', { ascending: false })
            .limit(1)
            .single();

         if (error) console.error(error);
         else setLastAppointment(data);
      } catch (err) {
         console.error(err);
      }
   };

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
         const file = e.target.files[0];
         setPhoto(file);
         setPhotoPreview(URL.createObjectURL(file));
      }
   };

   const handleSubmit = async () => {
      if (rating === 0) {
         alert('Por favor, deixe uma nota com estrelas ✨');
         return;
      }

      try {
         setLoading(true);
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) return;

         // 1. Check if already reviewed for this appt (or just check first feedback status)
         // The user requested only for the FIRST appointment.
         // We'll check if any testimonials exist for this user.
         const { data: existing } = await supabase
            .from('testimonials')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

         if (existing) {
            alert('Você já enviou sua avaliação de boas-vindas! Obrigada pelo carinho ✨');
            navigate('/home');
            return;
         }

         let photoUrl = '';
         if (photo) {
            // In a real app, upload to storage
            // const { data, error } = await supabase.storage.from('testimonials').upload(`${user.id}/${Date.now()}`, photo);
            // photoUrl = data?.path || '';
            photoUrl = 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=400'; // Simulation
         }

         // 2. Get user name for the testimonial
         const { data: profileData } = await supabase.from('profiles').select('name').eq('id', user.id).single();

         // 3. Save Testimonial (includes both legacy and new fields)
         const { error: testError } = await supabase.from('testimonials').insert({
            // Legacy fields (required by table constraint)
            name: profileData?.name || 'Anônima',
            text: testimonial,
            stars: rating,
            date: new Date().toISOString().split('T')[0],
            approved: allowFeed,
            // New relational fields
            user_id: user.id,
            professional_id: lastAppointment?.professional_id,
            appointment_id: lastAppointment?.id,
            rating,
            message: testimonial,
            photo_url: photoUrl,
            show_on_feed: allowFeed,
            status: 'pending' // Requires master admin approval before showing on feed
         });

         if (testError) throw testError;

         // 3. Award Points (FIRST_FEEDBACK)
         const { data: rule } = await supabase.from('loyalty_actions').select('points_reward').eq('code', 'FIRST_FEEDBACK').single();
         const pointsReward = rule?.points_reward || 100;
         const extraPhotoPoints = photo ? 50 : 0;
         const totalReward = pointsReward + extraPhotoPoints;

         const { data: profile } = await supabase.from('profiles').select('lash_points').eq('id', user.id).single();
         const currentPoints = profile?.lash_points || 0;

         await supabase.from('profiles').update({ lash_points: currentPoints + totalReward }).eq('id', user.id);

         alert(`Avaliação enviada! Você ganhou ${totalReward} JZ Balance 💎✨`);
         navigate('/home');
      } catch (err: any) {
         alert('Erro ao enviar avaliação: ' + err.message);
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="flex flex-col h-full bg-background-dark text-white overflow-y-auto no-scrollbar selection:bg-accent-gold/20 pb-24 relative">
         {/* Dynamic Background Elements */}
         <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/30 blur-[100px] animate-float"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
         </div>

         <header className="sticky top-0 z-[100] premium-nav-dark px-6 py-5 flex items-center justify-between border-b border-white/5">
            <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-accent-gold hover:bg-white/10 active:scale-90 transition-all">
               <span className="material-symbols-outlined !text-xl">close</span>
            </button>
            <div className="text-center">
               <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mb-1">Ritual de Feedback</p>
               <h2 className="text-xl font-display italic text-white tracking-tight">Avaliar Experiência</h2>
            </div>
            <div className="size-10"></div>
         </header>

         <main className="relative z-10 flex-1 p-8 space-y-12">
            <section className="text-center space-y-6 animate-reveal">
               <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="h-px w-8 bg-accent-gold/40"></span>
                  <p className="text-[10px] font-black text-accent-gold tracking-[0.4em] uppercase font-outfit">Sua Opinião Vale Ouro</p>
                  <span className="h-px w-8 bg-accent-gold/40"></span>
               </div>
               <h2 className="text-4xl font-display text-white leading-tight">
                  Como foi sua <br /><span className="italic">experiência?</span> ✨
               </h2>
               <p className="text-sm font-outfit text-white/40 font-light leading-relaxed max-w-[80%] mx-auto">
                  Sua percepção molda o futuro da nossa excelência.
               </p>
            </section>

            <div className="flex justify-center gap-4 animate-reveal stagger-1">
               {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setRating(star)} className="group relative transition-all active:scale-90">
                     <span className={`material-symbols-outlined !text-5xl transition-all duration-500 ${rating >= star ? 'text-accent-gold scale-110' : 'text-white/10 group-hover:text-white/30'}`} style={{ fontVariationSettings: rating >= star ? "'FILL' 1" : "'FILL' 0" }}>
                        star
                     </span>
                     {rating === star && (
                        <div className="absolute inset-0 bg-accent-gold/20 blur-xl animate-pulse rounded-full"></div>
                     )}
                  </button>
               ))}
            </div>

            {/* Photo Card Redesigned */}
            <div className="group bg-surface-dark/40 backdrop-blur-xl rounded-[48px] overflow-hidden border border-white/5 shadow-2xl animate-reveal stagger-2">
               <div className="relative aspect-[16/10] bg-background-dark overflow-hidden">
                  {photoPreview ? (
                     <img src={photoPreview} alt="Preview" className="w-full h-full object-cover animate-reveal" />
                  ) : (
                     <div className="w-full h-full relative">
                        <img src="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=1000" alt="Eyelashes" className="w-full h-full object-cover opacity-10 grayscale" />
                        <div className="absolute inset-0 flex items-center justify-center">
                           <span className="material-symbols-outlined !text-4xl text-white/5">photo_camera</span>
                        </div>
                     </div>
                  )}
                  <div className="absolute top-4 right-4">
                     <div className="premium-blur border border-white/10 px-4 py-2 rounded-full flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-accent-gold animate-pulse"></span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/80">Resultados JZ</span>
                     </div>
                  </div>
               </div>
               <div className="p-8 flex items-center justify-between gap-6">
                  <div className="flex-1">
                     <h3 className="text-xl font-display italic text-white leading-tight">Portrait da Beleza</h3>
                     <p className="text-[10px] font-outfit text-white/30 uppercase tracking-widest mt-1">Registre seu novo olhar</p>
                  </div>
                  <label className="shrink-0 bg-white/5 border border-white/10 text-white px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-white hover:text-primary transition-all shadow-xl">
                     Capturar
                     <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
               </div>
            </div>

            <div className="space-y-4 animate-reveal stagger-3">
               <div className="flex items-center gap-3 px-2">
                  <div className="h-px w-6 bg-accent-gold/20"></div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 font-outfit">Sua Mensagem</h4>
               </div>
               <textarea
                  value={testimonial}
                  onChange={e => setTestimonial(e.target.value)}
                  placeholder="Descreva seu momento de cuidado..."
                  className="w-full bg-surface-dark/60 border border-white/5 rounded-[32px] p-8 text-sm min-h-[160px] focus:border-accent-gold/30 outline-none placeholder:text-white/10 transition-all font-outfit font-light"
               />
            </div>

            <div className="flex items-center gap-5 px-4 py-4 rounded-3xl bg-white/5 border border-white/5 animate-reveal stagger-4">
               <button
                  onClick={() => setAllowFeed(!allowFeed)}
                  className={`size-6 rounded-xl flex items-center justify-center transition-all duration-500 shadow-xl ${allowFeed ? 'bg-accent-gold text-primary' : 'border border-white/10 bg-white/5'}`}
               >
                  {allowFeed && <span className="material-symbols-outlined !text-sm font-black">done</span>}
               </button>
               <div>
                  <p className="text-[11px] text-white/60 font-outfit font-bold uppercase tracking-widest leading-none mb-1">Galeria JZ Privé</p>
                  <p className="text-[9px] text-white/20 font-medium">Permitir exibição pública do meu resultado</p>
               </div>
            </div>

            <button
               onClick={handleSubmit}
               disabled={loading}
               className="group relative w-full h-18 bg-primary text-white rounded-[24px] flex items-center justify-center gap-4 font-outfit font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 hover:translate-y-[-4px] active:scale-95 transition-all disabled:opacity-50 overflow-hidden"
            >
               <div className="absolute inset-0 bg-accent-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
               {loading ? (
                  <div className="size-5 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
               ) : (
                  <>
                     <span className="relative z-10">Enviar Certificado de Experiência</span>
                     <span className="material-symbols-outlined !text-xl text-accent-gold relative z-10 transition-transform group-hover:translate-x-2">send_money</span>
                  </>
               )}
            </button>
         </main>

         {/* Visual Safe Area Inset */}
         <div className="fixed bottom-0 left-0 w-full h-8 bg-background-dark pointer-events-none z-[90]"></div>
      </div>
   );
};

export default Evaluation;
