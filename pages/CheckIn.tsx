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
      <div className="min-h-screen bg-[#FDF8F2] font-sans text-[#122B22] relative overflow-hidden flex flex-col">
         {/* Background Texture/Gradient */}
         <div className="absolute top-0 right-0 w-[80%] h-[50%] bg-[#C9A961]/5 rounded-bl-[100px] pointer-events-none"></div>

         {/* Header */}
         <header className="px-8 pt-12 pb-6 flex items-center justify-between relative z-10">
            <button onClick={() => navigate('/home')} className="size-10 bg-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all">
               <span className="material-symbols-outlined text-[#122B22]">close</span>
            </button>
            <div className="w-10"></div> {/* Spacer for balance */}
         </header>

         {/* Main Content */}
         <main className="flex-1 px-8 flex flex-col">
            <div className="mb-10 mt-4">
               <p className="text-[10px] mobile-s:text-[9px] uppercase tracking-[0.3em] text-[#C9A961] font-black mb-3">Ritual de Chegada</p>
               <h1 className="font-display font-medium text-4xl leading-tight">
                  Que bom ter você aqui,<br />
                  <span className="italic font-serif">{userName}.</span>
               </h1>
               <p className="text-[#122B22]/60 mt-4 font-medium text-sm">Seu momento exclusivo começa agora.</p>
            </div>

            <div className="space-y-4 w-full max-w-sm mx-auto">
               {/* Card 1: Check-in */}
               <button
                  onClick={handleCheckIn}
                  disabled={checkedIn}
                  className={`w-full bg-white p-6 rounded-[32px] shadow-sm flex items-center gap-5 transition-all ${!checkedIn ? 'active:scale-95 hover:shadow-md' : 'opacity-90'}`}
               >
                  <div className={`size-14 rounded-full flex items-center justify-center shrink-0 transition-colors ${checkedIn ? 'bg-[#122B22] text-white' : 'bg-[#F5F5F5] text-[#122B22]/30'}`}>
                     <span className="material-symbols-outlined !text-2xl">check</span>
                  </div>
                  <div className="text-left">
                     <h3 className={`font-bold text-base ${checkedIn ? 'text-[#122B22]/40 line-through' : 'text-[#122B22]'}`}>
                        Confirmar presença
                     </h3>
                     <p className="text-[11px] text-[#122B22]/50 font-medium">
                        {checkedIn ? `Presença confirmada às ${checkInTime}` : 'Check-in no Studio'}
                     </p>
                  </div>
               </button>

               {/* Card 2: Wi-Fi */}
               <button
                  onClick={handleWifi}
                  className="w-full bg-[#FFFBF5] border border-[#C9A961]/20 p-6 rounded-[32px] shadow-sm flex items-center gap-5 active:scale-95 hover:bg-[#FFF8EB] transition-all"
               >
                  <div className="size-14 rounded-full bg-[#E8DCC0] flex items-center justify-center shrink-0 text-[#122B22]">
                     <span className="material-symbols-outlined !text-2xl">wifi</span>
                  </div>
                  <div className="text-left flex-1">
                     <div className="flex justify-between items-center">
                        <h3 className="font-bold text-base text-[#122B22]">Wi-Fi Privé</h3>
                        <span className="material-symbols-outlined text-[#122B22]/30 text-sm">arrow_forward_ios</span>
                     </div>
                     <p className="text-[10px] text-[#122B22]/50 font-black uppercase tracking-widest mt-0.5">Conexão exclusiva</p>
                  </div>
               </button>

               {/* Card 3: Share to Earn */}
               <button
                  onClick={() => navigate('/checkin/filter')}
                  className="w-full bg-[#122B22] p-6 rounded-[32px] shadow-xl shadow-[#122B22]/20 flex items-center gap-5 active:scale-95 group transition-all relative overflow-hidden"
               >
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer"></div>

                  <div className="size-14 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[#C9A961] border border-white/5">
                     <span className="material-symbols-outlined !text-2xl">auto_awesome</span>
                  </div>
                  <div className="text-left flex-1">
                     <div className="flex justify-between items-center">
                        <h3 className="font-bold text-base text-white">Ativar benefícios JZ Privé</h3>
                        <span className="bg-[#C9A961] text-[#122B22] text-[9px] font-black px-2 py-1 rounded-md uppercase">+50</span>
                     </div>
                     <p className="text-[10px] text-white/50 font-black uppercase tracking-widest mt-0.5">Compartilhe sua experiência</p>
                  </div>
               </button>
            </div>
         </main>

         {/* Footer Navigation (Optional, or just simple footer text like the reference) */}
         <div className="p-8 pb-10 text-center">
            <div className="w-12 h-0.5 bg-[#122B22]/10 mx-auto mb-6"></div>
            <p className="font-serif italic text-lg text-[#122B22]/40">Seu espaço de cuidado sempre te espera</p>

            {/* Bottom Apps Bar Placeholder (Mock visual) */}
            <div className="mt-8 bg-white rounded-full h-16 shadow-xl shadow-[#122B22]/5 flex items-center justify-around px-2">
               <button onClick={() => navigate('/home')} className="p-4 rounded-full text-[#122B22] active:bg-gray-50"><span className="material-symbols-outlined">home</span></button>
               <button onClick={() => navigate('/feed')} className="p-4 rounded-full text-[#122B22]/30 active:bg-gray-50"><span className="material-symbols-outlined">grid_view</span></button>
               <button onClick={() => navigate('/booking')} className="p-4 rounded-full text-[#122B22]/30 active:bg-gray-50"><span className="material-symbols-outlined">calendar_today</span></button>
               <button onClick={() => navigate('/profile')} className="p-4 rounded-full text-[#122B22]/30 active:bg-gray-50"><span className="material-symbols-outlined">person</span></button>
            </div>
         </div>
      </div>
   );
};

export default CheckIn;
