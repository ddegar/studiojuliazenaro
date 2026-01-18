
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const CheckIn: React.FC = () => {
   const navigate = useNavigate();
   const [step, setStep] = useState<'LOCATING' | 'READY' | 'ERROR'>('LOCATING');
   const [loading, setLoading] = useState(false);
   const [appointment, setAppointment] = useState<any>(null);
   const [userName, setUserName] = useState('');
   const [userId, setUserId] = useState('');
   const [pointsReward, setPointsReward] = useState(0);

   useEffect(() => {
      const fetchCheckInData = async () => {
         try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
               navigate('/login');
               return;
            }
            setUserId(user.id);

            const { data: profile } = await supabase
               .from('profiles')
               .select('name')
               .eq('id', user.id)
               .single();

            setUserName(profile?.name || 'Cliente');

            const today = new Date().toISOString().split('T')[0];
            const { data: appt } = await supabase
               .from('appointments')
               .select('*, services(points_reward)')
               .eq('user_id', user.id)
               .eq('date', today)
               .eq('status', 'PENDING')
               .maybeSingle();

            if (appt) {
               setAppointment(appt);
               setPointsReward(appt.services?.points_reward || 0);
               setStep('READY');
            } else {
               setStep('ERROR');
            }
         } catch (err) {
            console.error('Check-in fetch error:', err);
            setStep('ERROR');
         }
      };

      fetchCheckInData();
   }, [navigate]);

   const handleCheckIn = async () => {
      setLoading(true);
      try {
         // 1. Update appointment status
         const { error: apptError } = await supabase
            .from('appointments')
            .update({ status: 'ARRIVED' })
            .eq('id', appointment.id);

         if (apptError) throw apptError;

         // 2. Reward points if any
         if (pointsReward > 0) {
            // Add transaction
            await supabase.from('point_transactions').insert({
               user_id: userId,
               amount: pointsReward,
               source: 'CHECK_IN',
               description: `Pontos ganhos no check-in: ${appointment.service_name}`
            });

            // Update profile balance
            const { data: profile } = await supabase.from('profiles').select('lash_points').eq('id', userId).single();
            const currentPoints = profile?.lash_points || 0;

            await supabase.from('profiles')
               .update({ lash_points: currentPoints + pointsReward })
               .eq('id', userId);
         }

         navigate('/checkin/success');
      } catch (err: any) {
         console.error('Check-in error:', err);
         alert('Erro ao notificar chegada: ' + err.message);
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="flex flex-col h-full bg-background-light">
         <header className="p-8 flex items-center justify-between glass-nav border-b border-gray-100 sticky top-0 z-50">
            <button onClick={() => navigate('/home')} className="size-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors">
               <span className="material-symbols-outlined text-primary">close</span>
            </button>
            <h2 className="font-display font-bold text-primary text-sm uppercase tracking-[0.3em]">Momento Julia Zenaro ✨</h2>
            <span className="size-10"></span>
         </header>

         <main className="flex-1 p-10 flex flex-col items-center justify-center text-center space-y-12">
            {step === 'LOCATING' && (
               <div className="space-y-10 animate-pulse">
                  <div className="size-44 rounded-full bg-primary/5 flex items-center justify-center relative">
                     <span className="material-symbols-outlined text-primary !text-7xl">spa</span>
                     <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-ping"></div>
                  </div>
                  <div className="space-y-4">
                     <h3 className="text-3xl font-display font-bold text-primary">Localizando você...</h3>
                     <p className="text-sm text-gray-400 italic font-medium px-10">Estamos preparando tudo para sua chegada.</p>
                  </div>
               </div>
            )}

            {step === 'READY' && (
               <div className="space-y-12 animate-fade-in w-full max-w-sm">
                  <div className="size-44 rounded-full bg-primary/10 flex items-center justify-center mx-auto ring-[32px] ring-primary/5 relative">
                     <span className="material-symbols-outlined text-primary !text-8xl">favorite</span>
                     {pointsReward > 0 && (
                        <div className="absolute -bottom-2 -right-2 bg-accent-gold text-primary p-3 rounded-2xl shadow-xl border-4 border-white rotate-12">
                           <p className="text-[10px] font-black uppercase leading-none">+{pointsReward}</p>
                           <p className="text-[8px] font-bold uppercase tracking-tighter">Points</p>
                        </div>
                     )}
                  </div>

                  <div className="space-y-4">
                     <h1 className="text-4xl font-display font-bold text-primary leading-tight">Olá, {userName.split(' ')[0]}! ✨</h1>
                     <p className="text-sm text-gray-500 italic font-medium">Você chegou ao seu refúgio de autocuidado.</p>
                  </div>

                  <div className="bg-white p-8 rounded-[48px] premium-shadow border border-gray-100 text-left space-y-6">
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase font-black text-accent-gold tracking-[0.25em]">Confirmar Presença</span>
                        <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-4 py-1.5 rounded-full uppercase">Hoje</span>
                     </div>
                     <div className="space-y-2">
                        <p className="font-bold text-2xl text-primary leading-tight">{appointment.service_name || 'Serviço Premium'}</p>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">{appointment.professional_name || 'Studio Julia Zenaro'}</p>
                     </div>
                  </div>

                  <button
                     onClick={handleCheckIn}
                     disabled={loading}
                     className="w-full h-20 bg-primary text-white rounded-[28px] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all disabled:opacity-50"
                  >
                     {loading ? <div className="size-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'NOTIFICAR CHEGADA ✨'}
                  </button>
               </div>
            )}

            {step === 'ERROR' && (
               <div className="space-y-10 animate-fade-in">
                  <div className="size-36 rounded-full bg-rose-50 flex items-center justify-center mx-auto border-4 border-white shadow-xl">
                     <span className="material-symbols-outlined text-rose-500 !text-6xl">event_busy</span>
                  </div>
                  <div className="space-y-3">
                     <h3 className="text-2xl font-display font-bold text-primary">Ops! Nada por aqui.</h3>
                     <p className="text-sm text-gray-500 px-10 leading-relaxed">Não encontramos agendamentos pendentes para hoje. Que tal garantir seu horário agora?</p>
                  </div>
                  <button onClick={() => navigate('/services')} className="w-full max-w-[200px] h-14 bg-primary text-white rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 mx-auto block active:scale-95 transition-all">Ver Serviços</button>
               </div>
            )}
         </main>
      </div>
   );
};

export default CheckIn;
