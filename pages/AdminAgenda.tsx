
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import AdminBottomNav from '../components/AdminBottomNav';
import { Professional, UserRole } from '../types';

const AdminAgenda: React.FC = () => {
   const navigate = useNavigate();
   const [loading, setLoading] = useState(true);
   const [professionals, setProfessionals] = useState<Professional[]>([]);
   const [currentUser, setCurrentUser] = useState<{ id: string, role: UserRole } | null>(null);
   const [selectedProId, setSelectedProId] = useState<string>('');
   const [appointments, setAppointments] = useState<any[]>([]);

   const now = new Date();
   const [viewMonth, setViewMonth] = useState(now.getMonth());
   const [viewYear, setViewYear] = useState(now.getFullYear());

   const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
   const monthName = new Date(viewYear, viewMonth).toLocaleDateString('pt-BR', { month: 'long' });

   const initAgenda = async () => {
      setLoading(true);
      try {
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) {
            navigate('/login');
            return;
         }

         const { data: profile } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('id', user.id)
            .maybeSingle();

         if (profile) {
            setCurrentUser(profile as { id: string, role: UserRole });

            const { data: pros } = await supabase
               .from('professionals')
               .select('*')
               .eq('active', true);

            const formattedPros: Professional[] = (pros || []).map(p => ({
               id: p.id,
               name: p.name || 'Sem nome',
               role: p.role || 'Designer',
               avatar: p.image_url || `https://ui-avatars.com/api/?name=${p.name}`,
               active: p.active,
               specialties: [],
               rating: p.rating || 5,
               start_hour: p.start_hour || '08:00',
               end_hour: p.end_hour || '19:00'
            } as any));

            setProfessionals(formattedPros);

            const { data: profileData } = await supabase
               .from('profiles')
               .select('name')
               .eq('id', profile.id)
               .maybeSingle();

            const matchingPro = formattedPros.find(p =>
               p.name.toLowerCase().includes(profileData?.name?.split(' ')[0]?.toLowerCase() || '')
            );

            const isPrivileged = ['MASTER_ADMIN', 'ADMIN', 'PROFESSIONAL_ADMIN'].includes(profile.role);
            if (!isPrivileged) {
               if (!matchingPro) {
                  alert("Perfil profissional não vinculado. Entre em contato com o suporte.");
                  navigate('/admin');
                  return;
               }
               setSelectedProId(matchingPro.id);
            } else {
               setSelectedProId(matchingPro?.id || formattedPros[0]?.id || '');
            }
         }
      } catch (err) {
         console.error('Error initializing agenda:', err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      initAgenda();

      const channel = supabase
         .channel('schema-db-changes')
         .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'appointments' },
            () => fetchMonthAppts()
         )
         .subscribe();

      return () => {
         supabase.removeChannel(channel);
      };
   }, [navigate]);

   const fetchMonthAppts = async () => {
      if (!selectedProId) return;

      try {
         const firstDay = `${viewYear}-${(viewMonth + 1).toString().padStart(2, '0')}-01`;
         const lastDay = `${viewYear}-${(viewMonth + 1).toString().padStart(2, '0')}-${daysInMonth}`;

         const { data } = await supabase
            .from('appointments')
            .select('date, status')
            .eq('professional_id', selectedProId)
            .not('status', 'in', '(cancelled,cancelled_by_user)')
            .gte('date', firstDay)
            .lte('date', lastDay);

         setAppointments(data || []);
      } catch (e) {
         console.error("Error fetching month appts", e);
      }
   };

   useEffect(() => {
      fetchMonthAppts();
   }, [selectedProId, viewMonth, viewYear, daysInMonth, currentUser]);

   const isPrivileged = ['MASTER_ADMIN', 'ADMIN', 'PROFESSIONAL_ADMIN'].includes(currentUser?.role || '');
   const isMaster = isPrivileged;

   const visibleProfessionals = useMemo(() => {
      if (isMaster) return professionals;
      return professionals.filter(p => p.id === currentUser?.id);
   }, [isMaster, professionals, currentUser]);

   const handleDayClick = (day: number) => {
      const dateStr = `${viewYear}-${(viewMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      navigate(`/admin/agenda/day/${dateStr}?proId=${selectedProId}`);
   };

   const [filter, setFilter] = useState<'ALL' | 'FREE' | 'BUSY'>('ALL');

   const changeMonth = (delta: number) => {
      let newMonth = viewMonth + delta;
      let newYear = viewYear;
      if (newMonth < 0) {
         newMonth = 11;
         newYear--;
      } else if (newMonth > 11) {
         newMonth = 0;
         newYear++;
      }
      setViewMonth(newMonth);
      setViewYear(newYear);
   };

   if (loading) {
      return (
         <div className="flex h-screen items-center justify-center bg-background-dark font-outfit">
            <div className="relative size-16 flex items-center justify-center">
               <div className="absolute inset-0 border-2 border-primary/5 rounded-full"></div>
               <div className="absolute inset-0 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
               <span className="material-symbols-outlined text-accent-gold scale-75">calendar_month</span>
            </div>
         </div>
      );
   }

   return (
      <div className="flex flex-col min-h-screen bg-background-dark text-white font-outfit antialiased selection:bg-accent-gold/20 selection:text-white">
         <header className="relative z-[60] premium-blur-dark sticky top-0 px-8 py-6 flex flex-col gap-6 border-b border-white/5 bg-background-dark/80 backdrop-blur-xl">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <button
                     onClick={() => navigate('/admin')}
                     className="size-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-accent-gold group active:scale-95 transition-all"
                  >
                     <span className="material-symbols-outlined !text-xl group-hover:-translate-x-1 transition-transform">west</span>
                  </button>
                  <div className="space-y-0.5">
                     <p className="text-[7px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none">Gestão Studio</p>
                     <h1 className="font-display italic text-xl text-white">Agenda Mestra</h1>
                  </div>
               </div>

               <div className="flex gap-3">
                  <button
                     onClick={() => initAgenda()}
                     className="size-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/30 hover:text-white transition-all active:rotate-180 duration-500"
                  >
                     <span className="material-symbols-outlined !text-lg">sync</span>
                  </button>
                  <button
                     onClick={() => navigate('/admin/agenda/new')}
                     className="size-11 rounded-2xl bg-accent-gold flex items-center justify-center text-primary shadow-huge active:scale-90 transition-all"
                  >
                     <span className="material-symbols-outlined !text-lg">add</span>
                  </button>
               </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
               {/* Professional Selector - More Compact */}
               {isMaster && visibleProfessionals.length > 1 && (
                  <div className="flex-1 flex items-center gap-3 overflow-x-auto no-scrollbar mask-fade-horizontal">
                     {visibleProfessionals.map(p => (
                        <button
                           key={p.id}
                           onClick={() => setSelectedProId(p.id)}
                           className={`group flex items-center gap-2 px-4 h-11 rounded-2xl transition-all duration-500 shrink-0 border whitespace-nowrap ${selectedProId === p.id ? 'bg-white text-primary border-white shadow-huge' : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10'}`}
                        >
                           <div className={`size-6 rounded-lg overflow-hidden border transition-all duration-500 ${selectedProId === p.id ? 'border-primary/20' : 'border-white/10 opacity-40'}`}>
                              <img src={p.avatar} className="w-full h-full object-cover" alt="" />
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-[0.1em]">{p.name.split(' ')[0]}</span>
                        </button>
                     ))}
                  </div>
               )}

               {/* View Filters - More Compact */}
               <div className="bg-white/5 p-1 rounded-2xl border border-white/5 flex gap-1 shrink-0">
                  {[
                     { id: 'ALL', label: 'Tudo', icon: 'border_all' },
                     { id: 'FREE', label: 'Disponível', icon: 'auto_awesome' },
                     { id: 'BUSY', label: 'Demanda', icon: 'show_chart' }
                  ].map(f => (
                     <button
                        key={f.id}
                        onClick={() => setFilter(f.id as any)}
                        className={`px-4 h-9 rounded-xl flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-[0.1em] transition-all duration-500 ${filter === f.id ? 'bg-white/10 text-accent-gold border border-accent-gold/20' : 'text-white/20 hover:text-white/40'}`}
                     >
                        <span className="material-symbols-outlined !text-xs">{f.icon}</span>
                        {f.label}
                     </button>
                  ))}
               </div>
            </div>
         </header>

         <main className="relative z-10 p-8 lg:p-12 space-y-12 pb-48 w-full max-w-screen-xl mx-auto overflow-x-hidden">
            {/* Calendar Navigation and Month View */}
            <div className="space-y-10 animate-reveal">
               <div className="flex items-center justify-between px-4">
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-accent-gold tracking-[0.4em] uppercase opacity-40">Período Selecionado</p>
                     <h2 className="text-4xl font-display font-medium text-white italic capitalize">{monthName} <span className="font-light text-white/30 not-italic ml-2">{viewYear}</span></h2>
                  </div>
                  <div className="flex bg-white/5 p-2 rounded-2xl border border-white/10 gap-2">
                     <button onClick={() => changeMonth(-1)} className="size-12 rounded-xl flex items-center justify-center text-white/40 hover:text-white active:scale-95 transition-all">
                        <span className="material-symbols-outlined !text-xl">west</span>
                     </button>
                     <button onClick={() => changeMonth(1)} className="size-12 rounded-xl flex items-center justify-center text-white/40 hover:text-white active:scale-95 transition-all">
                        <span className="material-symbols-outlined !text-xl">east</span>
                     </button>
                  </div>
               </div>

               {/* Design Calendar Grid */}
               <div className="grid grid-cols-7 gap-3 lg:gap-6">
                  {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'].map(d => (
                     <div key={d} className="text-center text-[9px] font-black uppercase text-white/10 py-4 tracking-[0.3em] font-outfit">{d}</div>
                  ))}

                  {Array.from({ length: new Date(viewYear, viewMonth, 1).getDay() }).map((_, i) => (
                     <div key={`empty-${i}`} className="aspect-square opacity-0"></div>
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                     const day = i + 1;
                     const dayDate = `${viewYear}-${(viewMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                     const isToday = dayDate === now.toISOString().split('T')[0];

                     const dayAppts = appointments.filter(a => a.date === dayDate);
                     const busyAppts = dayAppts.filter(a => ['scheduled', 'confirmed', 'completed', 'rescheduled'].includes(a.status));
                     const blockedAppts = dayAppts.filter(a => ['blocked', 'BLOCKED'].includes(a.status));

                     const selectedPro = professionals.find(p => p.id === selectedProId);
                     const dayOfWeek = new Date(viewYear, viewMonth, day).getDay();
                     const wHours = (selectedPro as any)?.working_hours;
                     const dayConfig = wHours?.[dayOfWeek];

                     const startRange = dayConfig?.start || (selectedPro as any)?.start_hour || '08:00';
                     const endRange = dayConfig?.end || (selectedPro as any)?.end_hour || '19:00';
                     const isDayClosed = dayConfig ? dayConfig.closed : JSON.parse((selectedPro as any)?.closed_days || '[]').includes(dayOfWeek);

                     const startH = parseInt(startRange.split(':')[0]);
                     const endH = parseInt(endRange.split(':')[0]);
                     const totalSlots = isDayClosed ? 0 : (endH - startH) * 2;

                     const hasAppointments = busyAppts.length > 0;
                     const isBlocked = blockedAppts.length > 0;
                     const isFull = busyAppts.length >= totalSlots && totalSlots > 0;
                     const isFree = busyAppts.length === 0 && !isBlocked;

                     const isVisible = filter === 'ALL' || (filter === 'FREE' && isFree && !isDayClosed) || (filter === 'BUSY' && !isFree);

                     return (
                        <button
                           key={i}
                           onClick={() => handleDayClick(day)}
                           className={`group aspect-square rounded-[24px] lg:rounded-[36px] border flex flex-col items-center justify-center p-2 transition-all duration-700 relative overflow-hidden
                               ${isToday ? 'bg-accent-gold border-accent-gold shadow-huge scale-[1.1] z-20' : 'bg-surface-dark/40 border-white/5 hover:border-accent-gold/40 hover:bg-surface-dark'}
                               ${!isVisible ? 'opacity-10 scale-90 blur-[1px]' : 'opacity-100'}
                               ${isDayClosed && !isToday ? 'bg-rose-900/5 border-rose-900/10' : ''}
                               ${filter === 'FREE' && isFree && !isToday && !isDayClosed ? 'border-accent-gold/40 ring-1 ring-accent-gold/20' : ''}
                               animate-reveal
                            `}
                           style={{ animationDelay: `${i * 0.02}s` }}
                        >
                           <span className={`text-base lg:text-xl font-display ${isToday ? 'text-primary' : (isDayClosed ? 'text-white/10' : (hasAppointments ? 'text-white' : 'text-white/30'))}`}>
                              {day}
                           </span>

                           <div className="flex gap-1 items-center mt-1">
                              {isDayClosed && !isToday ? (
                                 <span className="text-[6px] font-black text-rose-400 uppercase tracking-widest opacity-40">Folga</span>
                              ) : (
                                 <div className={`h-1 transition-all duration-700 rounded-full ${isFull ? 'w-4 bg-rose-500' : (hasAppointments ? 'w-2 bg-accent-gold' : 'w-0')}`}></div>
                              )}
                              {isBlocked && <span className="material-symbols-outlined !text-[10px] text-rose-500">lock</span>}
                           </div>

                           {!isToday && !isDayClosed && hasAppointments && (
                              <div className="absolute top-2 right-2 text-[8px] font-black text-white/20 group-hover:text-accent-gold transition-colors">{busyAppts.length}</div>
                           )}
                        </button>
                     );
                  })}
               </div>

               {/* Status Intelligence Legend */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-white/5">
                  <div className="flex flex-col gap-6 p-8 bg-surface-dark/20 rounded-[40px] border border-white/5">
                     <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Monitor de Disponibilidade</p>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="flex items-center gap-4 group">
                           <div className="size-3 rounded-full bg-accent-gold shadow-lg shadow-accent-gold/20"></div>
                           <span className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover:text-white transition-colors">Reserva Ativa</span>
                        </div>
                        <div className="flex items-center gap-4 group">
                           <div className="size-3 rounded-full bg-rose-500 shadow-lg shadow-rose-500/20"></div>
                           <span className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover:text-white transition-colors">Capacidade Máxima</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col gap-6 p-8 bg-surface-dark/20 rounded-[40px] border border-white/5">
                     <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Informação Estratégica</p>
                     <div className="flex flex-wrap gap-10">
                        <div className="flex items-center gap-4 group">
                           <div className="size-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-accent-gold">
                              <span className="material-symbols-outlined !text-sm">auto_awesome</span>
                           </div>
                           <span className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover:text-white transition-colors">Dia de Alta Demanda</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </main>

         <div className="lg:hidden">
            <AdminBottomNav />
         </div>

         {/* Elite Background Gradients */}
         <div className="fixed top-0 left-0 w-[50vw] h-[50vh] bg-accent-gold/5 blur-[120px] pointer-events-none z-0"></div>
         <div className="fixed bottom-0 right-0 w-[40vw] h-[40vh] bg-primary/20 blur-[100px] pointer-events-none z-0 opacity-30"></div>
      </div>
   );
};

export default AdminAgenda;
