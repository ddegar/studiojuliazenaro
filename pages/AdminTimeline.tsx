
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

   useEffect(() => {
      const getSession = async () => {
         const { data: { user } } = await supabase.auth.getUser();
         setCurrentUser(user);
      };
      getSession();
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

   const [fetchError, setFetchError] = useState<string | null>(null);
   const [debugRawCount, setDebugRawCount] = useState<number>(0);

   const fetchAppointments = async () => {
      if (!selectedProId || !date) return;
      setLoading(true);
      setFetchError(null);
      try {
         const { data, error } = await supabase
            .from('appointments')
            .select(`
               *,
               profiles:profiles!user_id (name, profile_pic),
               services (name, points_reward, price)
            `)
            .eq('professional_id', selectedProId)
            .eq('date', date)
            .neq('status', 'cancelled')
            .order('start_time');

         if (error) {
            setFetchError(error.message);
            throw error;
         }

         if (data) {
            setAppointments(data.map(d => ({
               ...d,
               start: new Date(d.start_time),
               end: new Date(d.end_time),
               clientName: d.profiles?.name || d.professional_name || 'Cliente',
               clientAvatar: d.profiles?.profile_pic || `https://ui-avatars.com/api/?name=${d.profiles?.name || 'C'}`
            })));
         }
      } catch (err: any) {
         console.error('Fetch appointments error:', err);
         setFetchError(err.message);
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
         .on(
            'postgres_changes',
            {
               event: '*',
               schema: 'public',
               table: 'appointments'
            },
            () => {
               fetchAppointments();
            }
         )
         .subscribe();

      return () => {
         supabase.removeChannel(channel);
      };
   }, [selectedProId, date]);

   const handleProChange = (id: string) => {
      setSelectedProId(id);
      setSearchParams({ proId: id });
   };

   const handleStatusUpdate = async (apt: any, newStatus: string) => {
      if (!window.confirm(`Tem certeza que deseja marcar como ${newStatus === 'completed' ? 'Finalizado' : 'Não Compareceu'}?`)) return;

      try {
         const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', apt.id);
         if (error) throw error;
         fetchAppointments();
      } catch (err: any) {
         alert('Erro ao atualizar: ' + err.message);
      }
   };

   const hours = Array.from({ length: 29 }).map((_, i) => {
      const totalMinutes = (8 * 60) + (i * 30);
      const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
      const m = (totalMinutes % 60).toString().padStart(2, '0');
      return `${h}:${m}`;
   });

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

   return (
      <div className="flex flex-col h-full bg-background-dark text-white">
         <header className="sticky top-0 z-50 glass-nav !bg-background-dark/95 p-6 border-b border-white/5 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <button onClick={() => navigate('/admin/agenda')} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
                  <div>
                     <h1 className="text-xl font-display font-bold">Timeline Diária</h1>
                     <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">{date?.split('-').reverse().join('/')}</p>
                  </div>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => fetchAppointments()} className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 active:scale-95">
                     <span className="material-symbols-outlined !text-xl">refresh</span>
                  </button>
                  <button onClick={() => navigate('/admin/agenda/new', { state: { date, proId: selectedProId } })} className="size-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                     <span className="material-symbols-outlined">add</span>
                  </button>
               </div>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
               {professionals.map(p => (
                  <button
                     key={p.id}
                     onClick={() => handleProChange(p.id)}
                     className={`px-6 h-11 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border-2 ${selectedProId === p.id ? 'bg-primary border-primary text-white shadow-xl scale-105' : 'bg-white/5 border-white/5 text-gray-500'}`}
                  >
                     <img src={p.avatar} className="size-6 rounded-lg object-cover grayscale-[0.5]" alt="" />
                     {p.name.split(' ')[0]}
                  </button>
               ))}
            </div>
         </header>

         <main className="flex-1 p-6 overflow-y-auto no-scrollbar space-y-4 pb-40 bg-gradient-to-b from-background-dark to-[#121415]">
            <div className="flex items-center justify-between px-2 mb-6 opacity-40">
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Agenda: {currentPro?.name}</span>
               <div className="h-px flex-1 mx-4 bg-white/10"></div>
               <span className="text-[9px] font-bold">{appointments.length} Sessões</span>
            </div>





            {loading ? (
               <div className="py-20 flex flex-col items-center gap-4 opacity-30">
                  <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando timeline...</p>
               </div>
            ) : hours.map(hour => {
               const apt = getAppointmentAt(hour);
               const isStart = apt && apt.time?.slice(0, 5) === hour;

               if (!apt) {
                  return (
                     <div key={hour} className="flex gap-6 min-h-[100px] group">
                        <div className="w-12 text-[11px] font-black text-gray-700 pt-4 transition-colors group-hover:text-accent-gold">
                           {hour}
                        </div>
                        <button
                           onClick={() => navigate('/admin/agenda/new', { state: { hour, date, proId: selectedProId } })}
                           className="flex-1 rounded-[32px] border-2 border-dashed border-white/5 flex items-center px-8 gap-4 text-gray-700 hover:border-accent-gold/30 hover:text-accent-gold hover:bg-accent-gold/5 transition-all duration-300 group/btn"
                        >
                           <span className="material-symbols-outlined !text-xl opacity-20 group-hover/btn:opacity-100 transition-opacity">add_circle</span>
                           <span className="text-[10px] font-black uppercase tracking-[0.3em]">Livre</span>
                        </button>
                     </div>
                  );
               }

               const isBlocked = apt.status === 'blocked' || apt.status === 'BLOCKED';
               const isCompleted = apt.status === 'completed';
               const isNoShow = apt.status === 'no_show';

               return (
                  <div key={hour} className="flex gap-6 min-h-[100px] group">
                     <div className="w-12 text-[11px] font-black text-gray-700 pt-4 transition-colors group-hover:text-accent-gold">
                        {hour}
                     </div>

                     <div className={`flex-1 p-6 rounded-[32px] border transition-all duration-500 flex flex-col justify-between ${isBlocked ? 'bg-white/5 border-white/10 opacity-40 grayscale' :
                        isCompleted ? 'bg-green-500/10 border-green-500/20' :
                           isNoShow ? 'bg-red-500/10 border-red-500/20 opacity-60' :
                              'bg-white/5 border-white/10 shadow-2xl shadow-black/20'
                        }`}>
                        <div className="flex justify-between items-start">
                           <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                 <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isBlocked ? 'text-gray-500' : 'text-accent-gold'}`}>
                                    {isBlocked ? 'Bloqueio / Intervalo' : apt.service_name || apt.services?.name}
                                 </p>
                                 {isCompleted && <span className="text-[8px] bg-green-500/20 text-green-500 px-2.5 py-1 rounded-full font-black border border-green-500/20 uppercase tracking-widest">Concluído</span>}
                                 {isNoShow && <span className="text-[8px] bg-red-500/20 text-red-500 px-2.5 py-1 rounded-full font-black border border-red-500/20 uppercase tracking-widest">Não Compareceu</span>}
                              </div>
                              <div className="flex items-center gap-3">
                                 {!isBlocked && <img src={apt.clientAvatar} className="size-8 rounded-full border border-white/10" alt="" />}
                                 <h4 className={`font-bold text-base ${isBlocked ? 'text-gray-600 italic' : 'text-white'}`}>
                                    {isBlocked ? apt.notes || 'Horário Bloqueado' : apt.clientName}
                                 </h4>
                              </div>
                           </div>

                           {!isBlocked && !isCompleted && !isNoShow && isStart && (
                              <div className="flex gap-2">
                                 <button onClick={() => handleStatusUpdate(apt, 'completed')} className="h-10 px-5 bg-emerald-500 text-black rounded-2xl font-black text-[9px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                                    <span className="material-symbols-outlined !text-base">verified</span>
                                    Compareceu?
                                 </button>
                                 <button onClick={() => handleStatusUpdate(apt, 'no_show')} className="size-10 rounded-2xl bg-white/5 border border-white/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                                    <span className="material-symbols-outlined">person_off</span>
                                 </button>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               );
            })}
         </main>
      </div>
   );
};

export default AdminTimeline;
