import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const CheckIn: React.FC = () => {
   const navigate = useNavigate();
   const [loading, setLoading] = useState(true);
   const [userName, setUserName] = useState('');
   const [userId, setUserId] = useState('');
   const [checkedIn, setCheckedIn] = useState(false);
   const [checkInTime, setCheckInTime] = useState<string | null>(null);
   const [appointment, setAppointment] = useState<any>(null);

   // Initial Data Fetch
   useEffect(() => {
      const fetchCheckInData = async () => {
         try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
               navigate('/login');
               return;
            }
            setUserId(user.id);

            // Fetch Profile
            const { data: profile } = await supabase
               .from('profiles')
               .select('name')
               .eq('id', user.id)
               .single();
            setUserName(profile?.name?.split(' ')[0] || 'Cliente');

            // Check for Today's Appointment
            const today = new Date().toISOString().split('T')[0];
            const { data: appt } = await supabase
               .from('appointments')
               .select('*')
               .eq('user_id', user.id)
               .eq('date', today)
               .in('status', ['PENDING', 'ARRIVED', 'CONFIRMED'])
               .order('time', { ascending: true })
               .limit(1)
               .single();

            if (appt) {
               setAppointment(appt);
               if (appt.status === 'ARRIVED') {
                  setCheckedIn(true);
                  // If we had a real check-in timestamp we would use it, 
                  // for now we simulate or use updated_at if available
                  setCheckInTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
               }
            }
         } catch (err) {
            console.error('Check-in fetch error:', err);
         } finally {
            setLoading(false);
         }
      };

      fetchCheckInData();
   }, [navigate]);

   const handleCheckIn = async () => {
      if (checkedIn || !appointment) return;

      // Optimistic UI update
      const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setCheckedIn(true);
      setCheckInTime(now);

      try {
         await supabase
            .from('appointments')
            .update({ status: 'ARRIVED' })
            .eq('id', appointment.id);

         // Haptic feedback if available (mobile)
         if (navigator.vibrate) navigator.vibrate(50);
      } catch (err) {
         console.error('Error checking in:', err);
         setCheckedIn(false); // Revert on error
         setCheckInTime(null);
         alert('Erro ao confirmar presença. Tente novamente.');
      }
   };

   const handleWifi = () => {
      // Copy to clipboard
      navigator.clipboard.writeText('JZPrive2024'); // Example password
      alert('Senha do Wi-Fi "JZPrive2024" copiada!');
   };

   if (loading) {
      return (
         <div className="min-h-screen bg-[#FDF8F2] flex items-center justify-center">
            <div className="size-10 border-4 border-[#122B22] border-t-transparent rounded-full animate-spin"></div>
         </div>
      );
   }

   return (
      <div className="flex flex-col h-full bg-background-light overflow-y-auto no-scrollbar selection:bg-accent-gold/30 selection:text-primary pb-32">
         {/* Dynamic Background Elements */}
         <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/30 blur-[100px] animate-float"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
         </div>

         <header className="sticky top-0 z-[100] premium-blur px-6 py-5 flex justify-between items-center border-b border-primary/5">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate('/home')} className="size-10 flex items-center justify-center rounded-full bg-white border border-primary/5 text-primary shadow-sm active:scale-90 transition-transform">
                  <span className="material-symbols-outlined !text-xl">close</span>
               </button>
               <div>
                  <p className="text-[9px] font-outfit font-black uppercase tracking-[0.2em] text-primary/40 leading-none mb-1">Elite Reception</p>
                  <h2 className="text-xl font-display italic text-primary tracking-tight">Ritual de Chegada</h2>
               </div>
            </div>
            <span className="size-10"></span>
         </header>

         <main className="relative z-10 flex-1 p-8 space-y-12">
            <div className="animate-reveal">
               <div className="flex items-center gap-3 mb-4">
                  <span className="h-px w-8 bg-accent-gold/40"></span>
                  <p className="text-[10px] font-black text-accent-gold tracking-[0.4em] uppercase">Momento Exclusivo</p>
               </div>
               <h1 className="text-4xl font-display text-primary leading-tight">
                  Que bom ter você <br />aqui, <span className="italic">{userName}.</span>
               </h1>
               <p className="text-sm font-outfit text-primary/60 mt-4 leading-relaxed font-light">Sua jornada de autocuidado premium começa agora.</p>
            </div>

            <div className="grid gap-4 w-full max-w-sm mx-auto">
               {/* Card 1: Check-in Action */}
               <button
                  onClick={handleCheckIn}
                  disabled={checkedIn}
                  className={`group relative p-8 rounded-[40px] shadow-xl border transition-all duration-500 animate-reveal stagger-1 ${checkedIn ? 'bg-white/40 border-primary/5 grayscale opacity-70' : 'bg-white border-accent-gold/20'}`}
               >
                  <div className="flex items-center gap-6">
                     <div className={`size-16 rounded-3xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-active:scale-90 ${checkedIn ? 'bg-primary text-white scale-90' : 'bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white'}`}>
                        <span className="material-symbols-outlined !text-2xl" style={{ fontVariationSettings: checkedIn ? "'FILL' 1" : "'FILL' 0" }}>{checkedIn ? 'check_circle' : 'fingerprint'}</span>
                     </div>
                     <div className="text-left space-y-1">
                        <h3 className={`font-outfit font-bold text-lg leading-tight ${checkedIn ? 'text-primary' : 'text-primary'}`}>
                           {checkedIn ? 'Presença Confirmada' : 'Confirmar Presença'}
                        </h3>
                        <p className="text-[10px] font-outfit font-black uppercase tracking-widest text-primary/30">
                           {checkedIn ? `Sincronizado às ${checkInTime}` : 'Clique para iniciar'}
                        </p>
                     </div>
                  </div>
                  {!checkedIn && (
                     <div className="absolute top-4 right-8">
                        <span className="animate-pulse flex h-2 w-2 rounded-full bg-accent-gold"></span>
                     </div>
                  )}
               </button>

               {/* Card 2: Strategic Tech */}
               <button
                  onClick={handleWifi}
                  className="group p-8 bg-white/40 rounded-[40px] border border-primary/5 shadow-sm flex items-center gap-6 active:scale-95 transition-all animate-reveal stagger-2 hover:bg-white hover:border-accent-gold/20"
               >
                  <div className="size-16 rounded-3xl bg-accent-gold/10 flex items-center justify-center shrink-0 text-accent-gold group-hover:bg-accent-gold group-hover:text-primary transition-all duration-500 shadow-sm">
                     <span className="material-symbols-outlined !text-2xl">wifi_password</span>
                  </div>
                  <div className="text-left flex-1">
                     <h3 className="font-outfit font-bold text-lg text-primary">Wi-Fi Privé</h3>
                     <p className="text-[10px] font-outfit font-black uppercase tracking-widest text-primary/30 mt-1">Conexão Digital Ilimitada</p>
                  </div>
                  <span className="material-symbols-outlined text-primary/20 !text-sm group-hover:translate-x-1 transition-transform">east</span>
               </button>

               {/* Card 3: Loyalty Upsell */}
               <button
                  onClick={() => navigate('/checkin/filter')}
                  className="w-full bg-primary p-8 rounded-[40px] shadow-2xl shadow-primary/20 flex items-center gap-6 active:scale-95 group transition-all relative overflow-hidden animate-reveal stagger-3"
               >
                  <div className="absolute inset-0 bg-accent-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
                  <div className="size-16 rounded-3xl bg-white/10 flex items-center justify-center shrink-0 text-accent-gold border border-white/5 shadow-inner">
                     <span className="material-symbols-outlined !text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  </div>
                  <div className="text-left flex-1 relative z-10">
                     <div className="flex justify-between items-center mb-1">
                        <h3 className="font-outfit font-bold text-lg text-white">JZ Privé</h3>
                        <span className="bg-accent-gold text-primary text-[9px] font-black px-2 py-0.5 rounded-lg uppercase shadow-xl tracking-tighter transition-transform group-hover:scale-110">+50 PTS</span>
                     </div>
                     <p className="text-[10px] text-white/40 font-black uppercase tracking-widest leading-tight">Momeento compartilhado <br />vale benefícios</p>
                  </div>
               </button>
            </div>

            <footer className="pt-12 text-center select-none opacity-20 transition-opacity hover:opacity-100 animate-reveal" style={{ animationDelay: '0.8s' }}>
               <p className="font-display italic text-lg text-primary tracking-widest">Excelência é a nossa única medida.</p>
               <div className="flex items-center justify-center gap-4 mt-4">
                  <div className="h-px w-6 bg-primary"></div>
                  <span className="font-outfit text-[8px] font-black uppercase tracking-[0.5em]">Julia Zenaro</span>
                  <div className="h-px w-6 bg-primary"></div>
               </div>
            </footer>
         </main>

         {/* Refined Persistent Navigation */}
         <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-[120]">
            <nav className="animate-reveal" style={{ animationDelay: '1s' }}>
               <div className="premium-blur rounded-[28px] border border-primary/10 shadow-2xl px-6 py-3 flex justify-between items-center bg-white/80">
                  <button onClick={() => navigate('/home')} className="p-2 text-primary/30 hover:text-primary transition-colors group">
                     <span className="material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform">home</span>
                  </button>
                  <button onClick={() => navigate('/feed')} className="p-2 text-primary/30 hover:text-primary transition-colors group">
                     <span className="material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform">grid_view</span>
                  </button>
                  <button onClick={() => navigate('/services')} className="relative size-14 -translate-y-6 rounded-3xl bg-primary text-accent-gold shadow-lg shadow-primary/40 flex items-center justify-center border-4 border-background-light group-active:scale-90 transition-transform ring-1 ring-primary/5">
                     <span className="material-symbols-outlined !text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
                  </button>
                  <button onClick={() => navigate('/history')} className="p-2 text-primary/30 hover:text-primary transition-colors group">
                     <span className="material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform">calendar_today</span>
                  </button>
                  <button onClick={() => navigate('/profile')} className="p-2 text-primary/30 hover:text-primary transition-colors group">
                     <span className="material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform">person_outline</span>
                  </button>
               </div>
            </nav>
         </div>

         {/* Visual Safe Area Inset */}
         <div className="fixed bottom-0 left-0 w-full h-8 bg-background-light pointer-events-none z-[90]"></div>
      </div>
   );
};

export default CheckIn;
