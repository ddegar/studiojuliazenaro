
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
            .single();

         if (profile) {
            setCurrentUser(profile as { id: string, role: UserRole });

            // Fetch real professionals from professionals table
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

            // Find the professional record that matches the logged-in user by name
            const { data: profileData } = await supabase
               .from('profiles')
               .select('name')
               .eq('id', profile.id)
               .single();

            const matchingPro = formattedPros.find(p =>
               p.name.toLowerCase().includes(profileData?.name?.split(' ')[0]?.toLowerCase() || '')
            );

            // Initial selection
            const isPrivileged = ['MASTER_ADMIN', 'ADMIN', 'PROFESSIONAL_ADMIN'].includes(profile.role);
            if (isPrivileged) {
               setSelectedProId(matchingPro?.id || formattedPros[0]?.id || '');
            } else {
               setSelectedProId(matchingPro?.id || '');
            }

            // Use the professional's ID for filtering
            const initialProId = isPrivileged ? (matchingPro?.id || formattedPros[0]?.id || '') : (matchingPro?.id || '');

            // SECURITY: If not Master, force selectedProId to be the matching professional ID
            if (!isPrivileged) {
               if (!matchingPro) {
                  alert("Perfil profissional não vinculado. Entre em contato com o suporte.");
                  navigate('/admin');
                  return;
               }
               setSelectedProId(matchingPro.id);
            } else {
               setSelectedProId(initialProId);
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

      // Real-time synchronization
      const channel = supabase
         .channel('schema-db-changes')
         .on(
            'postgres_changes',
            {
               event: '*',
               schema: 'public',
               table: 'appointments'
            },
            () => {
               // Reload data on any change
               fetchMonthAppts();
            }
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

         const { data, error } = await supabase
            .from('appointments')
            .select('date, status')
            .eq('professional_id', selectedProId)
            // Just filter out cancelled, everything else is relevant for blocking the calendar
            .neq('status', 'cancelled')
            .gte('date', firstDay)
            .lte('date', lastDay);

         if (error) throw error;
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
         <div className="flex h-screen items-center justify-center bg-background-dark">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
         </div>
      );
   }

   return (
      <div className="flex flex-col h-full bg-background-dark text-white pb-32 lg:pb-8">
         <header className="sticky top-0 z-50 glass-nav !bg-background-dark/80 p-6 lg:p-8 border-b border-white/5 flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <button onClick={() => navigate('/admin')} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
                  <div>
                     <h1 className="text-xl md:text-2xl font-display font-bold">Agenda Mestra</h1>
                     <p className="text-[10px] md:text-xs text-gray-500 uppercase font-bold tracking-[0.2em]">Sincronizada em Tempo Real</p>
                  </div>
               </div>
               <div className="flex gap-3">
                  <button onClick={() => initAgenda()} className="size-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                     <span className="material-symbols-outlined !text-xl">refresh</span>
                  </button>
                  <button onClick={() => navigate('/admin/agenda/new')} className="size-10 rounded-full bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20">
                     <span className="material-symbols-outlined">add</span>
                  </button>
               </div>
            </div>

            {(isMaster && visibleProfessionals.length > 1) && (
               <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                  {visibleProfessionals.map(p => (
                     <button
                        key={p.id}
                        onClick={() => setSelectedProId(p.id)}
                        className={`px-6 h-10 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 border ${selectedProId === p.id ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-400'}`}
                     >{p.name}</button>
                  ))}
               </div>
            )}

            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
               {[
                  { id: 'ALL', label: 'Tudo', icon: 'border_all' },
                  { id: 'FREE', label: 'Livres', icon: 'event_available' },
                  { id: 'BUSY', label: 'Ocupados', icon: 'event_busy' }
               ].map(f => (
                  <button
                     key={f.id}
                     onClick={() => setFilter(f.id as any)}
                     className={`flex-1 h-9 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all ${filter === f.id ? 'bg-white/10 text-accent-gold shadow-sm' : 'text-gray-500'}`}
                  >
                     <span className="material-symbols-outlined !text-sm">{f.icon}</span>
                     {f.label}
                  </button>
               ))}
            </div>
         </header>

         <main className="flex-1 p-6 lg:p-6 space-y-6 overflow-y-auto no-scrollbar">
            <div className="max-w-6xl mx-auto w-full">
               <div className="flex justify-between items-center px-4">
                  <h2 className="text-2xl md:text-3xl font-display font-bold capitalize">{monthName} <span className="text-gray-600">{viewYear}</span></h2>
                  <div className="flex gap-4">
                     <button onClick={() => changeMonth(-1)} className="material-symbols-outlined text-gray-500 hover:text-white transition-colors">chevron_left</button>
                     <button onClick={() => changeMonth(1)} className="material-symbols-outlined text-gray-500 hover:text-white transition-colors">chevron_right</button>
                  </div>
               </div>

               <div className="grid grid-cols-7 gap-2 lg:gap-3 transition-opacity duration-300">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                     <div key={d} className="text-center text-[9px] md:text-xs font-black uppercase text-gray-700 pb-2">{d}</div>
                  ))}
                  {/* Empty cells for offset */}
                  {Array.from({ length: new Date(viewYear, viewMonth, 1).getDay() }).map((_, i) => (
                     <div key={`empty-${i}`}></div>
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                     const day = i + 1;
                     const dayDate = `${viewYear}-${(viewMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                     const isToday = dayDate === now.toISOString().split('T')[0];

                     const dayAppts = appointments.filter(a => a.date === dayDate);
                     const busyAppts = dayAppts.filter(a => ['scheduled', 'confirmed', 'completed'].includes(a.status));
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
                     const totalSlots = isDayClosed ? 0 : (endH - startH) * 2; // Slots de 30 min

                     const hasAppointments = busyAppts.length > 0;
                     const isBlocked = blockedAppts.length > 0;
                     const isFull = busyAppts.length >= totalSlots && totalSlots > 0;
                     const isFree = busyAppts.length === 0 && !isBlocked;

                     // Filter Logic
                     const isVisible = filter === 'ALL' || (filter === 'FREE' && isFree && !isDayClosed) || (filter === 'BUSY' && !isFree);

                     return (
                        <button
                           key={i}
                           onClick={() => handleDayClick(day)}
                           className={`aspect-square md:aspect-auto md:h-12 rounded-2xl md:rounded-xl border flex flex-col items-center justify-center gap-1 transition-all relative 
                               ${isToday ? 'bg-primary border-primary shadow-xl shadow-primary/30 scale-105 z-10' : 'bg-white/5 border-white/5 hover:border-accent-gold/30 hover:bg-white/10'}
                               ${!isVisible ? 'opacity-20 grayscale' : 'opacity-100'}
                               ${isDayClosed && !isToday ? 'bg-rose-500/5 border-rose-500/10 grayscale-[0.8]' : ''}
                               ${filter === 'FREE' && isFree && !isToday && !isDayClosed ? 'ring-1 ring-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : ''}
                            `}
                        >
                           <span className={`text-xs md:text-sm font-black ${isToday ? 'text-white' : (filter === 'FREE' && isFree && !isDayClosed ? 'text-emerald-400' : (isDayClosed ? 'text-rose-900/40' : 'text-gray-400'))}`}>{day}</span>
                           <div className="flex gap-1 items-center">
                              {isDayClosed && <span className="text-[8px] font-black text-rose-900/40 uppercase">Folga</span>}
                              {hasAppointments && <div className={`size-1.5 rounded-full ${isFull ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>}
                              {isBlocked && <span className="material-symbols-outlined !text-[10px] text-rose-500">lock</span>}
                           </div>
                        </button>
                     );
                  })}
               </div>

               <div className="bg-card-dark p-6 rounded-3xl border border-white/5 space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status dos Dias</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="flex items-center gap-3">
                        <div className="size-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Atendimentos</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="size-3 rounded-full bg-rose-500 shadow-lg shadow-rose-500/20"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cheio / Bloqueado</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="size-3 rounded-full border border-gray-600"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sem Atividade</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="size-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                           <span className="material-symbols-outlined !text-[10px] text-emerald-500">check</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-100 uppercase tracking-widest">Dia Disponível</span>
                     </div>
                  </div>
               </div>
            </div>
         </main>
         <div className="lg:hidden">
            <AdminBottomNav />
         </div>
      </div>
   );
};

export default AdminAgenda;
