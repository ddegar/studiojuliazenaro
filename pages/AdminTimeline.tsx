
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Professional } from '../types';
import { supabase } from '../services/supabase';

const AdminTimeline: React.FC = () => {
   const navigate = useNavigate();
   const { date } = useParams();
   const [searchParams, setSearchParams] = useSearchParams();

   const [professionals, setProfessionals] = useState<Professional[]>([]);
   const [selectedProId, setSelectedProId] = useState<string>(searchParams.get('proId') || '');
   const [appointments, setAppointments] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [currentUser, setCurrentUser] = useState<any>(null);
   const [currentTime, setCurrentTime] = useState(new Date());

   // Inject Playfair Display
   useEffect(() => {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      const timer = setInterval(() => setCurrentTime(new Date()), 60000);
      return () => {
         document.head.removeChild(link);
         clearInterval(timer);
      }
   }, []);

   const fetchPros = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      const isPrivileged = ['MASTER_ADMIN', 'ADMIN', 'PROFESSIONAL_ADMIN'].includes(profile?.role || '');

      let query = supabase.from('professionals').select('*').eq('active', true);
      if (!isPrivileged) {
         query = query.eq('id', user.id);
      }

      const { data } = await query;
      if (data && data.length > 0) {
         setProfessionals(data.map(p => ({
            id: p.id,
            name: p.name,
            role: p.role,
            avatar: p.image_url || `https://ui-avatars.com/api/?name=${p.name}`,
            active: p.active,
            specialties: p.specialties || [],
            rating: p.rating || 5
         })));
         if (!selectedProId) setSelectedProId(data[0].id);
      }
   };

   const fetchAppointments = async () => {
      if (!selectedProId || !date) return;
      setLoading(true);
      try {
         const { data, error } = await supabase
            .from('appointments')
            .select(`
               *,
               profiles:profiles!user_id (name, profile_pic, phone),
               services (name, points_reward, price)
            `)
            .eq('professional_id', selectedProId)
            .eq('date', date)
            .neq('status', 'cancelled')
            .order('start_time');

         if (error) throw error;

         if (data) {
            setAppointments(data.map(d => ({
               ...d,
               start: new Date(d.start_time),
               end: new Date(d.end_time),
               clientName: d.profiles?.name || d.professional_name || 'Cliente',
               clientAvatar: d.profiles?.profile_pic || `https://ui-avatars.com/api/?name=${d.profiles?.name || 'C'}`,
               clientPhone: d.profiles?.phone || ''
            })));
         }
      } catch (err: any) {
         console.error('Fetch appointments error:', err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchPros();
   }, []);

   useEffect(() => {
      fetchAppointments();
      const channel = supabase
         .channel('timeline-changes')
         .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchAppointments())
         .subscribe();
      return () => { supabase.removeChannel(channel); };
   }, [selectedProId, date]);

   const handleProChange = (id: string) => {
      setSelectedProId(id);
      setSearchParams({ proId: id });
   };

   const handleWhatsApp = async (apt: any) => {
      if (!apt.clientPhone) {
         alert('Cliente sem telefone cadastrado.');
         return;
      }
      try {
         const { data } = await supabase.from('studio_config').select('value').eq('key', 'whatsapp_msg_template').single();
         let template = data?.value || "Olá {cliente}! ✨ Passando para confirmar seu horário de {servico} amanhã às {hora} no Studio Julia Zenaro. Podemos confirmar?";
         const message = template
            .replace('{cliente}', apt.clientName.split(' ')[0])
            .replace('{servico}', apt.service_name || apt.services?.name || 'procedimento')
            .replace('{hora}', apt.time.slice(0, 5));
         const phone = apt.clientPhone.replace(/\D/g, '');
         window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
      } catch (err) {
         console.error('Error fetching template:', err);
      }
   };

   const handleStatusUpdate = async (apt: any, newStatus: string) => {
      if (!window.confirm(`Tem certeza que deseja marcar como ${newStatus === 'completed' ? 'Finalizado' : 'Não Compareceu'}?`)) return;
      try {
         // 1. Update Appointment Status
         const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', apt.id);
         if (error) throw error;

         // 2. If COMPLETED, generate automatic transaction and loyalty points
         if (newStatus === 'completed') {
            // A. TRANSACTION: Try to get professional's profile_id first
            let targetProfileId: string | null = null;

            const { data: pro } = await supabase.from('professionals').select('profile_id').eq('id', apt.professional_id).single();
            targetProfileId = pro?.profile_id || null;

            // Fallback: if no profile_id, try to get the logged-in user's ID
            if (!targetProfileId) {
               const { data: { user: currentUser } } = await supabase.auth.getUser();
               targetProfileId = currentUser?.id || null;
            }

            // Check if transaction already exists for this appointment
            const { data: existing } = await supabase.from('transactions').select('id').eq('appointment_id', apt.id).single();

            if (!existing) {
               const servicePrice = apt.services?.price || apt.price || 0;

               // Build transaction payload - user_id is optional
               const txPayload: any = {
                  type: 'INCOME',
                  category: 'Serviço',
                  description: `Atendimento: ${apt.services?.name || apt.service_name || 'Serviço'}`,
                  amount: servicePrice,
                  date: apt.date,
                  appointment_id: apt.id
               };

               // Only add user_id if we have a valid profile_id
               if (targetProfileId) {
                  txPayload.user_id = targetProfileId;
               }

               const { error: txError } = await supabase.from('transactions').insert(txPayload);
               if (txError) {
                  console.error('Transaction error:', txError);
                  // Don't throw - let the status update succeed even if transaction fails
               }
            }

            // B. LOYALTY POINTS (Zenaro Credits)
            if (apt.user_id && apt.services?.points_reward) {
               console.log('Updating loyalty points for user:', apt.user_id);

               // Always use 'lash_points' column in DB (renamed to Zenaro Credits in UI only)
               const { data: clientProfile, error: fetchError } = await supabase
                  .from('profiles')
                  .select('lash_points')
                  .eq('id', apt.user_id)
                  .single();

               if (fetchError) {
                  console.error('Error fetching client profile for points:', fetchError);
               } else {
                  const currentPoints = clientProfile?.lash_points || 0;
                  const newPoints = currentPoints + apt.services.points_reward;
                  console.log(`Updating points: ${currentPoints} -> ${newPoints}`);

                  const { error: updateError } = await supabase
                     .from('profiles')
                     .update({ lash_points: newPoints })
                     .eq('id', apt.user_id);

                  if (updateError) console.error('Error updating points:', updateError);
               }
            }
         }

         fetchAppointments();
      } catch (err: any) {
         alert('Erro ao atualizar: ' + err.message);
      }
   };

   const hours = (() => {
      const selectedPro = professionals.find(p => p.id === selectedProId);
      if (!selectedPro || !date) return [];

      try {
         const dayOfWeek = new Date(date + 'T12:00:00').getDay();
         const dayConfig = (selectedPro as any).working_hours?.[dayOfWeek];

         // Robust fallback logic
         const startStr = dayConfig?.start || (selectedPro as any).start_hour || '08:00';
         const endStr = dayConfig?.end || (selectedPro as any).end_hour || '22:00';

         const startH = parseInt(startStr.split(':')[0]) || 8;
         const endH = (parseInt(endStr.split(':')[0]) || 22) + 1; // +1 to show the last hour slot

         if (isNaN(startH) || isNaN(endH)) return [];

         const range = Math.max(0, (endH - startH) * 2 + 1); // slots of 30min
         return Array.from({ length: range }).map((_, i) => {
            const totalMinutes = (startH * 60) + (i * 30);
            const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
            const m = (totalMinutes % 60).toString().padStart(2, '0');
            return `${h}:${m}`;
         });
      } catch (e) {
         console.error('Error calculating timeline hours:', e);
         return []; // Fallback empty timeline instead of crash
      }
   })();
   return `${h}:${m}`;
});
   }) ();

const getAppointmentAt = (timeStr: string) => {
   if (!date) return null;
   const [h, m] = timeStr.split(':').map(Number);
   const slotMinutes = h * 60 + m;

   return appointments.find(a => {
      const startMinutes = a.start.getHours() * 60 + a.start.getMinutes();
      const endMinutes = a.end.getHours() * 60 + a.end.getMinutes();
      return slotMinutes >= startMinutes && slotMinutes < endMinutes;
   });
};

const currentPro = professionals.find(p => p.id === selectedProId);

// Current time indicator logic
const nowStr = currentTime.toLocaleDateString('en-CA');
const isToday = date === nowStr;
const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

const selectedPro = professionals.find(p => p.id === selectedProId);
const dayOfWeek = date ? new Date(date + 'T12:00:00').getDay() : 0;
const dayConfig = (selectedPro as any)?.working_hours?.[dayOfWeek];
const startOfAgenda = parseInt((dayConfig?.start || (selectedPro as any)?.start_hour || '08:00').split(':')[0]) * 60;

const agendaMinutes = currentMinutes - startOfAgenda;
const indicatorTop = (agendaMinutes / 30) * 105; // 105px is the slot height

return (
   <div className="flex flex-col h-full bg-[#0f1110] text-slate-100 font-sans antialiased overflow-hidden">
      {/* HEADER PREMIUM */}
      <header className="sticky top-0 z-50 bg-[#0f1110]/80 backdrop-blur-md border-b border-white/5 px-4 pt-12 pb-4">
         <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
               <button onClick={() => navigate('/admin/agenda')} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors">
                  <span className="material-symbols-outlined">chevron_left</span>
               </button>
               <div>
                  <h1 className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Timeline Diária</h1>
                  <p className="text-lg font-bold font-display italic text-accent-gold">
                     {date ? new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </p>
               </div>
            </div>
            <div className="flex gap-2">
               <button onClick={() => fetchAppointments()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 border border-white/5 hover:border-white/10 transition-all">
                  <span className="material-symbols-outlined">refresh</span>
               </button>
               <button
                  onClick={() => navigate('/admin/agenda/new', { state: { date, proId: selectedProId } })}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
               >
                  <span className="material-symbols-outlined">add</span>
               </button>
            </div>
         </div>

         <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {professionals.map(p => (
               <button
                  key={p.id}
                  onClick={() => handleProChange(p.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border whitespace-nowrap ${selectedProId === p.id ? 'bg-primary border-primary text-white shadow-lg shadow-primary/10' : 'bg-white/5 border-transparent text-slate-400'}`}
               >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${selectedProId === p.id ? 'bg-white/20' : 'bg-slate-700'}`}>
                     {p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{p.name}</span>
               </button>
            ))}
         </div>
      </header>

      {/* MAIN TIMELINE */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative px-4 py-6 pb-40">
         <div className="flex items-center justify-between mb-8">
            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-500 flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
               Agenda: {currentPro?.name}
            </h2>
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">{appointments.length} Sessões</span>
         </div>

         <div className="relative">
            {/* CURRENT TIME INDICATOR */}
            {isToday && agendaMinutes >= 0 && (
               <div className="absolute left-0 right-0 z-30 flex items-center pointer-events-none transition-all duration-1000" style={{ top: `${indicatorTop}px` }}>
                  <div className="w-14 text-right pr-2 text-[10px] font-bold text-primary">{currentTime.getHours()}:{currentTime.getMinutes().toString().padStart(2, '0')}</div>
                  <div className="flex-1 h-[1.5px] bg-primary relative overflow-visible">
                     <div className="absolute -left-1 -top-[4px] w-2.5 h-2.5 rounded-full bg-primary border-2 border-[#0f1110]"></div>
                     <div className="absolute left-0 top-0 w-full h-full bg-primary/20 blur-sm"></div>
                  </div>
               </div>
            )}

            <div className="space-y-0">
               {(() => {
                  return hours.map((hour, index) => {
                     const apt = getAppointmentAt(hour);
                     const isStart = apt && apt.time?.slice(0, 5) === hour;
                     const aptIndex = isStart ? appointments.findIndex(a => a.id === apt.id) : -1;

                     const calculateHeight = (a: any) => {
                        const startMinutes = a.start.getHours() * 60 + a.start.getMinutes();
                        const endMinutes = a.end.getHours() * 60 + a.end.getMinutes();
                        return ((endMinutes - startMinutes) / 30) * 105;
                     };

                     return (
                        <div key={hour} className="flex min-h-[105px]">
                           {/* TIME LABEL */}
                           <div className="w-14 pt-1 text-right pr-4 text-[11px] font-medium text-slate-600 border-r border-white/5 shrink-0">
                              {hour}
                           </div>

                           <div className="flex-1 relative border-t border-white/5 py-2 pl-4">
                              {isStart ? (
                                 <div
                                    className={`absolute left-4 right-0 z-20 flex flex-col justify-between rounded-2xl p-4 shadow-xl border overflow-hidden transition-all duration-500 ${apt.status === 'blocked' || apt.status === 'BLOCKED'
                                       ? 'bg-rose-950/20 border-rose-900/30'
                                       : apt.status === 'completed'
                                          ? 'bg-emerald-950/20 border-emerald-900/30'
                                          : apt.status === 'no_show'
                                             ? 'bg-red-950/20 border-red-900/30 opacity-60'
                                             : aptIndex % 2 === 0
                                                ? 'bg-white/[0.04] border-white/10'
                                                : 'bg-white/[0.02] border-white/5'
                                       }`}
                                    style={{ height: `${calculateHeight(apt) - 8}px`, top: '4px' }}
                                 >
                                    {/* BADGE TOP */}
                                    <div className="flex justify-between items-start">
                                       <div className="space-y-1">
                                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${apt.status === 'blocked' || apt.status === 'BLOCKED'
                                             ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                             : 'bg-primary/10 text-primary-light border-primary/20'
                                             }`}>
                                             {apt.status === 'blocked' || apt.status === 'BLOCKED' ? 'BLOQUEIO / INTERVALO' : apt.service_name || apt.services?.name}
                                          </span>
                                          <h3 className={`text-lg font-display italic mt-1 ${apt.status === 'blocked' || apt.status === 'BLOCKED' ? 'text-rose-200/50' : 'text-white'}`}>
                                             {apt.status === 'blocked' || apt.status === 'BLOCKED' ? (apt.notes || 'Horário Reservado') : apt.clientName}
                                          </h3>
                                       </div>

                                       <div className="flex gap-1">
                                          {!(apt.status === 'blocked' || apt.status === 'BLOCKED') && (
                                             <>
                                                <button onClick={() => handleWhatsApp(apt)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:text-[#25D366] transition-colors">
                                                   <span className="material-symbols-outlined !text-[18px]">chat_bubble</span>
                                                </button>
                                                <button onClick={() => handleStatusUpdate(apt, 'completed')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">
                                                   <span className="material-symbols-outlined !text-[18px]">verified</span>
                                                </button>
                                                <button onClick={() => handleStatusUpdate(apt, 'no_show')} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                                                   <span className="material-symbols-outlined !text-[18px]">person_off</span>
                                                </button>
                                             </>
                                          )}
                                       </div>
                                    </div>

                                    {/* FOOTER CARD */}
                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                                       <div className="flex items-center gap-4 text-slate-500 font-bold text-[10px] tracking-wide">
                                          <div className="flex items-center gap-1">
                                             <span className="material-symbols-outlined !text-[14px]">schedule</span>
                                             {hour} - {apt.end.getHours().toString().padStart(2, '0')}:{apt.end.getMinutes().toString().padStart(2, '0')}
                                          </div>
                                          {apt.services?.price && (
                                             <div className="flex items-center gap-1 text-emerald-500/80">
                                                <span className="material-symbols-outlined !text-[14px]">payments</span>
                                                R$ {apt.services.price}
                                             </div>
                                          )}
                                       </div>
                                       {apt.status === 'completed' && (
                                          <div className="px-3 py-1 rounded-full bg-emerald-500 text-[#0f1110] text-[9px] font-black tracking-widest flex items-center gap-1">
                                             <span className="material-symbols-outlined !text-[12px] filled">check</span>
                                             COMPARECEU
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              ) : !apt ? (
                                 <div
                                    onClick={() => navigate('/admin/agenda/new', { state: { hour, date, proId: selectedProId } })}
                                    className="flex items-center gap-2 text-slate-700 hover:text-accent-gold cursor-pointer transition-colors pt-2 group"
                                 >
                                    <span className="material-symbols-outlined !text-[18px] opacity-30 group-hover:opacity-100 transition-opacity">add_circle</span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Livre</span>
                                 </div>
                              ) : (
                                 <div className="min-h-full" />
                              )}
                           </div>
                        </div>
                     );
                  });
               })()}
            </div>
         </div>
      </main>

      {/* FLOAT REFRESH */}
      <div className="fixed bottom-24 right-6 z-30">
         <button onClick={() => fetchAppointments()} className="w-14 h-14 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-center text-accent-gold hover:scale-110 active:scale-95 transition-all">
            <span className="material-symbols-outlined !text-2xl">refresh</span>
         </button>
      </div>
   </div>
);
};

export default AdminTimeline;
