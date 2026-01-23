
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
            .single();

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

         alert(`Avaliação enviada! Você ganhou ${totalReward} pontos JZ Privé! ✨💎`);
         navigate('/home');
      } catch (err: any) {
         alert('Erro ao enviar avaliação: ' + err.message);
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="flex flex-col min-h-screen bg-[#f8f7f4] text-[#1a1c1a] font-sans">
         <header className="p-6 flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="material-symbols-outlined text-2xl">close</button>
            <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1a1c1a]/60 pt-1">FEEDBACK</h1>
            <button className="material-symbols-outlined text-2xl">more_horiz</button>
         </header>

         <main className="flex-1 px-8 py-6 space-y-10 overflow-y-auto no-scrollbar pb-10">
            <section className="text-center space-y-4">
               <h2 className="text-[32px] font-display font-medium leading-tight">
                  Como foi sua<br />experiência? ✨
               </h2>
               <p className="text-sm text-[#1a1c1a]/40 leading-relaxed max-w-[280px] mx-auto">
                  Sua opinião é fundamental para o Studio Julia Zenaro.
               </p>
            </section>

            <div className="flex justify-center gap-2">
               {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setRating(star)} className="transition-transform active:scale-90">
                     <span className={`material-symbols-outlined !text-4xl ${rating >= star ? 'text-[#C5A059]' : 'text-[#1a1c1a]/10'}`} style={{ fontVariationSettings: rating >= star ? "'FILL' 1" : "'FILL' 0" }}>
                        star
                     </span>
                  </button>
               ))}
            </div>

            {/* Photo Card */}
            <div className="bg-white rounded-[32px] overflow-hidden border border-[#1a1c1a]/5 shadow-sm">
               <div className="relative aspect-[4/3] bg-[#f0eee9]">
                  {photoPreview ? (
                     <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                     <img src="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80&w=1000" alt="Eyelashes" className="w-full h-full object-cover opacity-60 grayscale-[0.5]" />
                  )}
                  <div className="absolute bottom-4 left-4">
                     <span className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest text-[#1a1c1a]">Resultado do Procedimento</span>
                  </div>
               </div>
               <div className="p-6 flex items-center justify-between">
                  <div>
                     <h3 className="text-lg font-display font-medium text-[#1a1c1a]">Antes e Depois</h3>
                     <p className="text-[11px] text-[#1a1c1a]/40 mt-1">Registre o olhar que criamos hoje para você.</p>
                  </div>
                  <label className="bg-[#2D5043] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-[#1f382f] transition-all">
                     Adicionar
                     <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a1c1a]/50 px-2">SEU DEPOIMENTO</h4>
               <textarea
                  value={testimonial}
                  onChange={e => setTestimonial(e.target.value)}
                  placeholder="Conte-nos o que você mais gostou..."
                  className="w-full bg-white border border-[#1a1c1a]/5 rounded-[24px] p-6 text-sm min-h-[140px] focus:ring-1 focus:ring-[#2D5043] outline-none placeholder:text-[#1a1c1a]/20"
               />
            </div>

            <div className="flex items-start gap-4 px-2">
               <button
                  onClick={() => setAllowFeed(!allowFeed)}
                  className={`mt-1 size-5 rounded-md flex items-center justify-center transition-all ${allowFeed ? 'bg-[#C5A059] text-white' : 'border border-[#1a1c1a]/20'}`}
               >
                  {allowFeed && <span className="material-symbols-outlined !text-sm">check</span>}
               </button>
               <p className="text-[11px] text-[#1a1c1a]/60 font-medium leading-relaxed">
                  Permitir uso da minha foto no Feed do Studio
               </p>
            </div>

            <button
               onClick={handleSubmit}
               disabled={loading}
               className="w-full h-16 bg-[#2D5043] text-white rounded-[20px] flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-[#2D5043]/10 hover:translate-y-[-2px] active:translate-y-[0px] transition-all disabled:opacity-50"
            >
               {loading ? 'Enviando...' : (
                  <>
                     Enviar Avaliação
                     <span className="material-symbols-outlined !text-lg">send</span>
                  </>
               )}
            </button>
         </main>
      </div>
   );
};

export default Evaluation;
