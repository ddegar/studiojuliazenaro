
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
   const [currentTime, setCurrentTime] = useState(new Date());

   useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 60000);
      return () => {
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
         const mapped = data.map(p => ({
            id: p.id,
            name: p.name,
            role: p.role,
            avatar: p.image_url || `https://ui-avatars.com/api/?name=${p.name}&background=0f3e29&color=C9A961`,
            active: p.active,
            specialties: p.specialties || [],
            rating: p.rating || 5
         }));

         mapped.sort((a, b) => {
            const isJuliaA = a.name.toLowerCase().includes('julia') || a.name.toLowerCase().includes('júlia');
            const isJuliaB = b.name.toLowerCase().includes('julia') || b.name.toLowerCase().includes('júlia');
            if (isJuliaA && !isJuliaB) return -1;
            if (!isJuliaA && isJuliaB) return 1;
            return a.name.localeCompare(b.name);
         });

         setProfessionals(mapped);
         if (!selectedProId) setSelectedProId(mapped[0].id);
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
            .not('status', 'in', '(cancelled,cancelled_by_user)')
            .order('start_time');

         if (error) throw error;

         if (data) {
            setAppointments(data.map(d => ({
               ...d,
               start: new Date(d.start_time),
               end: new Date(d.end_time),
               clientName: d.profiles?.name || d.professional_name || 'Membro do Clube',
               clientAvatar: d.profiles?.profile_pic || `https://ui-avatars.com/api/?name=${d.profiles?.name || 'C'}&background=0f3e29&color=C9A961`,
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
         alert('Membro sem telefone cadastrado.');
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
      const statusLabels: Record<string, string> = {
         'completed': 'Finalizado',
         'no_show': 'Faltou',
         'cancelled': 'Cancelado'
      };
      if (!window.confirm(`Mudar status para ${statusLabels[newStatus] || newStatus}?`)) return;
      try {
         const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', apt.id);
         if (error) throw error;

         if (newStatus === 'completed') {
            let targetProfileId: string | null = null;
            const { data: pro } = await supabase.from('professionals').select('profile_id').eq('id', apt.professional_id).single();
            targetProfileId = pro?.profile_id || null;

            if (!targetProfileId) {
               const { data: { user: currentUser } } = await supabase.auth.getUser();
               targetProfileId = currentUser?.id || null;
            }

            const { data: existing } = await supabase.from('transactions').select('id').eq('appointment_id', apt.id).maybeSingle();

            if (!existing) {
               const servicePrice = apt.services?.price || apt.price || 0;
               const txPayload: any = {
                  type: 'INCOME',
                  category: 'Serviço',
                  description: `Atendimento VIP: ${apt.services?.name || apt.service_name || 'Serviço'}`,
                  amount: servicePrice,
                  date: apt.date,
                  appointment_id: apt.id
               };
               if (targetProfileId) txPayload.user_id = targetProfileId;
               await supabase.from('transactions').insert(txPayload);
            }

            if (apt.user_id && apt.services?.points_reward) {
               const { data: clientProfile } = await supabase.from('profiles').select('name, lash_points, referred_by').eq('id', apt.user_id).maybeSingle();
               if (clientProfile) {
                  // 1. Regular Service Points
                  let pointsToAdd = apt.services.points_reward;

                  // 2. REFERRAL LOGIC
                  // Only reward if it's the FIRST completed appointment
                  const { count: completedCount } = await supabase
                     .from('appointments')
                     .select('*', { count: 'exact', head: true })
                     .eq('user_id', apt.user_id)
                     .eq('status', 'completed');

                  // If count is 0 (this one being updated is not yet in the count if using head: true on same query, 
                  // but we just updated it above, so count will be at least 1)
                  // However, to be safe, we check if a referral transaction already exists.
                  const { data: existingRefTx } = await supabase
                     .from('point_transactions')
                     .select('id')
                     .eq('user_id', apt.user_id)
                     .eq('source', 'REFERRAL_REWARD_BONUS')
                     .maybeSingle();

                  if (clientProfile.referred_by && !existingRefTx && (completedCount || 0) <= 1) {
                     // Fetch Config
                     const { data: refConfig } = await supabase
                        .from('loyalty_actions')
                        .select('points_reward')
                        .eq('code', 'REFERRAL')
                        .eq('is_active', true)
                        .maybeSingle();

                     const bonusPoints = refConfig?.points_reward || 200;

                     // Find Referrer
                     const { data: referrerProfile } = await supabase
                        .from('profiles')
                        .select('id, name, lash_points')
                        .eq('referral_code', clientProfile.referred_by)
                        .maybeSingle();

                     if (referrerProfile) {
                        // Reward Referrer
                        await supabase.from('profiles').update({
                           lash_points: (referrerProfile.lash_points || 0) + bonusPoints
                        }).eq('id', referrerProfile.id);

                        await supabase.from('point_transactions').insert({
                           user_id: referrerProfile.id,
                           amount: bonusPoints,
                           source: 'REFERRAL_SUCCESS',
                           description: `Bônus: Sua indicação ${clientProfile.name || 'Amiga'} completou o primeiro ritual! ✨`
                        });

                        await supabase.from('notifications').insert({
                           user_id: referrerProfile.id,
                           title: 'Sua indicação completou um ritual! ✨',
                           message: `Você ganhou ${bonusPoints} JZ Balance porque ${clientProfile.name || 'sua amiga'} finalizou o primeiro atendimento.`,
                           icon: 'card_giftcard',
                           type: 'loyalty'
                        });

                        // Reward Referred (The current client)
                        pointsToAdd += bonusPoints;

                        // Add bônus transaction for current client too
                        await supabase.from('point_transactions').insert({
                           user_id: apt.user_id,
                           amount: bonusPoints,
                           source: 'REFERRAL_REWARD_BONUS',
                           description: `Boas-vindas: Bônus de Indicação aplicado! ✨`
                        });
                     }
                  }

                  await supabase.from('profiles').update({ lash_points: (clientProfile.lash_points || 0) + pointsToAdd }).eq('id', apt.user_id);
               }
            }

            // 5. AUTO NOTIFICATION: Create post-care notification
            if (apt.user_id) {
               await supabase.from('notifications').insert({
                  user_id: apt.user_id,
                  title: 'Como cuidar do seu novo olhar? ✨',
                  message: `Sua experiência de ${apt.services?.name || apt.service_name || 'procedimento'} foi concluída! Preparamos um guia de cuidados pós especial para você.`,
                  link: '/care/post',
                  icon: 'skincare',
                  type: 'post_care'
               });
            }
         }
         fetchAppointments();
      } catch (err: any) {
         alert('Erro: ' + err.message);
      }
   };

   const handleDeleteAppointment = async (apt: any) => {
      if (!window.confirm(`Tem certeza que deseja EXCLUIR permanentemente o agendamento de ${apt.clientName}?`)) return;
      try {
         const { error } = await supabase.from('appointments').delete().eq('id', apt.id);
         if (error) throw error;
         fetchAppointments();
      } catch (err: any) {
         alert('Erro ao excluir: ' + err.message);
      }
   };

   const hours = (() => {
      if (!date) return [];
      try {
         const currentSelectedPro = professionals.find(p => p.id === selectedProId);
         let startH = 8, endH = 22;
         if (currentSelectedPro) {
            const dayOfWeek = new Date(date + 'T12:00:00').getDay();
            const dayConfig = (currentSelectedPro as any).working_hours?.[dayOfWeek];
            const sStr = dayConfig?.start || (currentSelectedPro as any).start_hour;
            const eStr = dayConfig?.end || (currentSelectedPro as any).end_hour;
            if (sStr) startH = parseInt(sStr.split(':')[0]) || 8;
            if (eStr) endH = parseInt(eStr.split(':')[0]) || 22;
         }
         endH = Math.max(startH + 1, endH);
         return Array.from({ length: (endH - startH) * 2 + 1 }).map((_, i) => {
            const totalMinutes = (startH * 60) + (i * 30);
            return `${Math.floor(totalMinutes / 60).toString().padStart(2, '0')}:${(totalMinutes % 60).toString().padStart(2, '0')}`;
         });
      } catch (e) { return ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']; }
   })();

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
   const isToday = date === currentTime.toLocaleDateString('en-CA');
   const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
   const dayOfWeekIndicator = date ? new Date(date + 'T12:00:00').getDay() : 0;
   const dayConfigIndicator = (currentPro as any)?.working_hours?.[dayOfWeekIndicator];
   const startOfAgenda = parseInt((dayConfigIndicator?.start || (currentPro as any)?.start_hour || '08:00').split(':')[0]) * 60;
   const indicatorTop = ((currentMinutes - startOfAgenda) / 30) * 120; // 120px is new slot height

   if (loading && professionals.length === 0) {
      return (
         <div className="flex h-screen items-center justify-center bg-background-dark font-outfit">
            <div className="relative size-16 flex items-center justify-center">
               <div className="absolute inset-0 border-2 border-primary/5 rounded-full"></div>
               <div className="absolute inset-0 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
               <span className="material-symbols-outlined text-accent-gold scale-75">history_toggle_off</span>
            </div>
         </div>
      );
   }

   return (
      <div className="flex flex-col min-h-screen bg-background-dark text-white font-outfit antialiased selection:bg-accent-gold/20 selection:text-white overflow-hidden">
         {/* HEADER STRATEGY */}
         <header className="relative z-[60] premium-blur-dark sticky top-0 px-8 pt-12 pb-6 flex flex-col gap-8 border-b border-white/5 bg-background-dark/80 backdrop-blur-xl">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <button
                     onClick={() => navigate('/admin/agenda')}
                     className="size-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-accent-gold group active:scale-95 transition-all"
                  >
                     <span className="material-symbols-outlined !text-xl group-hover:-translate-x-1 transition-transform">west</span>
                  </button>
                  <div className="space-y-1">
                     <p className="text-[8px] font-black uppercase tracking-[0.5em] text-accent-gold/40 leading-none">Cronograma de Horários</p>
                     <h1 className="font-display italic text-2xl text-white">
                        {date ? new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }) : ''}
                        <span className="font-light not-italic text-white/20 ml-3">{date ? new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' }) : ''}</span>
                     </h1>
                  </div>
               </div>

               <div className="flex gap-4">
                  <button
                     onClick={() => fetchAppointments()}
                     className="size-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all active:rotate-180 duration-500"
                  >
                     <span className="material-symbols-outlined !text-xl">sync</span>
                  </button>
                  <button
                     onClick={() => navigate('/admin/agenda/new', { state: { date, proId: selectedProId } })}
                     className="size-12 rounded-2xl bg-accent-gold flex items-center justify-center text-primary shadow-huge active:scale-90 transition-all"
                  >
                     <span className="material-symbols-outlined">add</span>
                  </button>
               </div>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1 mask-fade-horizontal">
               {professionals.map(p => (
                  <button
                     key={p.id}
                     onClick={() => handleProChange(p.id)}
                     className={`flex items-center gap-3 px-6 h-12 rounded-2xl transition-all duration-500 border whitespace-nowrap ${selectedProId === p.id ? 'bg-white text-primary border-white shadow-huge' : 'bg-white/5 border-white/5 text-white/30'}`}
                  >
                     <img src={p.avatar} className="size-6 rounded-lg opacity-80" alt="" />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em]">{p.name.split(' ')[0]}</span>
                  </button>
               ))}
            </div>
         </header>

         {/* TIMELINE ARCHITECTURE */}
         <main className="relative z-10 flex-1 w-full max-w-screen-xl mx-auto overflow-y-auto no-scrollbar overflow-x-hidden px-8 lg:px-12 py-10 pb-40">
            <div className="flex items-center gap-4 mb-10">
               <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
               <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Fluxo Operacional</p>
               <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            </div>

            <div className="relative">
               {/* CURRENT TIME INDICATOR */}
               {isToday && currentMinutes >= startOfAgenda && (
                  <div className="absolute left-0 right-0 z-40 flex items-center pointer-events-none transition-all duration-1000" style={{ top: `${indicatorTop}px` }}>
                     <div className="w-20 text-right pr-4 text-[11px] font-bold text-accent-gold tabular-nums">{currentTime.getHours()}:{currentTime.getMinutes().toString().padStart(2, '0')}</div>
                     <div className="flex-1 h-px bg-accent-gold/40 relative">
                        <div className="absolute -left-1.5 -top-1.5 size-3 rounded-full bg-accent-gold shadow-[0_0_15px_rgba(201,169,97,0.8)] border border-primary"></div>
                     </div>
                  </div>
               )}

               <div className="space-y-0 relative border-l border-white/5 ml-20">
                  {hours.map((hour, index) => {
                     const apt = getAppointmentAt(hour);
                     const isStart = apt && apt.time?.slice(0, 5) === hour;
                     const apptDuration = apt ? (apt.end.getTime() - apt.start.getTime()) / (1000 * 60) : 0;
                     const cardHeight = (apptDuration / 30) * 120;

                     return (
                        <div key={hour} className="flex min-h-[120px] relative group">
                           {/* TIME MARK */}
                           <div className="absolute right-full mr-8 top-0 text-[11px] font-black text-white/20 tabular-nums group-hover:text-accent-gold transition-colors">
                              {hour}
                           </div>

                           <div className="flex-1 relative py-4 px-8 border-t border-white/5 group-hover:bg-white/[0.02] transition-all">
                              {isStart ? (
                                 <div
                                    className={`absolute left-4 right-4 z-20 flex flex-col justify-between rounded-[32px] p-8 shadow-hugest border transition-all duration-700 animate-reveal ${apt.status === 'blocked' || apt.status === 'BLOCKED'
                                       ? 'bg-rose-500/10 border-rose-500/20'
                                       : apt.status === 'completed'
                                          ? 'bg-emerald-500/10 border-emerald-500/20'
                                          : apt.status === 'no_show'
                                             ? 'bg-orange-500/10 border-orange-500/20 opacity-80'
                                             : apt.status === 'rescheduled'
                                                ? 'bg-sky-500/10 border-sky-500/20'
                                                : 'bg-surface-dark/60 border-white/10'
                                       }`}
                                    style={{ height: `${cardHeight - 16}px`, top: '8px' }}
                                 >
                                    <div className="flex justify-between items-start gap-4">
                                       <div className="space-y-2 min-w-0">
                                          <div className="flex items-center gap-3">
                                             <span className={`px-3 py-1 rounded-xl text-[8px] font-black tracking-widest uppercase border ${apt.status === 'blocked' ? 'bg-rose-900/40 text-rose-200 border-rose-500/20' : 'bg-primary/40 text-accent-gold border-accent-gold/20'
                                                }`}>
                                                {apt.status === 'blocked' ? 'Indisponível' : (apt.services?.name || apt.service_name)}
                                             </span>
                                             {apt.status === 'completed' && (
                                                <div className="flex items-center gap-1.5 text-emerald-400">
                                                   <span className="material-symbols-outlined !text-sm">verified</span>
                                                   <span className="text-[8px] font-black uppercase tracking-widest">Finalizado</span>
                                                </div>
                                             )}
                                             {apt.status === 'no_show' && (
                                                <div className="flex items-center gap-1.5 text-orange-400">
                                                   <span className="material-symbols-outlined !text-sm">person_off</span>
                                                   <span className="text-[8px] font-black uppercase tracking-widest">Não Compareceu</span>
                                                </div>
                                             )}
                                          </div>
                                          <h3 className="text-2xl font-display italic text-white truncate pr-4">
                                             {apt.status === 'blocked' ? (apt.notes || 'Curadoria Interna') : apt.clientName}
                                          </h3>
                                       </div>

                                       <div className="flex gap-2 shrink-0">
                                          {apt.status !== 'blocked' && (
                                             <>
                                                <button onClick={() => handleWhatsApp(apt)} className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-[#25D366] hover:text-white transition-all shadow-lg">
                                                   <span className="material-symbols-outlined !text-xl">chat</span>
                                                </button>
                                                <button onClick={() => handleStatusUpdate(apt, 'completed')} className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-emerald-500 hover:text-white transition-all shadow-lg">
                                                   <span className="material-symbols-outlined !text-xl">check_box</span>
                                                </button>
                                                <button onClick={() => handleStatusUpdate(apt, 'no_show')} className={`size-10 rounded-xl flex items-center justify-center transition-all shadow-lg ${apt.status === 'no_show' ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/40 hover:bg-orange-500 hover:text-white'}`}>
                                                   <span className="material-symbols-outlined !text-xl">person_off</span>
                                                </button>
                                                <button onClick={() => handleDeleteAppointment(apt)} className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-white/10 hover:bg-rose-500 hover:text-white transition-all shadow-lg">
                                                   <span className="material-symbols-outlined !text-lg">delete</span>
                                                </button>
                                             </>
                                          )}
                                       </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                                       <div className="flex items-center gap-6">
                                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20">
                                             <span className="material-symbols-outlined !text-sm">schedule</span>
                                             {hour} — {apt.end.getHours().toString().padStart(2, '0')}:{apt.end.getMinutes().toString().padStart(2, '0')}
                                          </div>
                                          {apt.services?.price && (
                                             <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 tracking-widest">
                                                <span className="material-symbols-outlined !text-sm">payments</span>
                                                R$ {apt.services.price}
                                             </div>
                                          )}
                                       </div>

                                       {apt.status !== 'blocked' && (
                                          <div className="relative size-10 rounded-2xl overflow-hidden border border-white/5 group-hover:scale-110 transition-transform">
                                             <img src={apt.clientAvatar} className="w-full h-full object-cover" alt="" />
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              ) : !apt ? (
                                 <div
                                    onClick={() => navigate('/admin/agenda/new', { state: { hour, date, proId: selectedProId } })}
                                    className="h-full flex items-center gap-4 text-white/5 hover:text-accent-gold/40 cursor-pointer transition-all group/slot"
                                 >
                                    <span className="material-symbols-outlined !text-xl group-hover/slot:scale-110 transition-transform">add_circle</span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.4em] opacity-0 group-hover/slot:opacity-100 transition-opacity">Reservar Horário</span>
                                 </div>
                              ) : null}
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>
         </main >

         {(isToday) && (
            <div className="fixed bottom-32 right-8 z-[100] animate-reveal">
               <button onClick={() => fetchAppointments()} className="size-16 rounded-[24px] bg-accent-gold text-primary shadow-huge flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                  <span className="material-symbols-outlined !text-2xl">sync</span>
               </button>
            </div>
         )}

         {/* Elite Layout Gradients */}
         <div className="fixed top-0 right-0 w-[40vw] h-[40vh] bg-accent-gold/5 blur-[120px] pointer-events-none z-0"></div>
         <div className="fixed bottom-0 left-0 w-[40vw] h-[40vh] bg-primary/20 blur-[120px] pointer-events-none z-0 opacity-40"></div>
      </div >
   );
};

export default AdminTimeline;
