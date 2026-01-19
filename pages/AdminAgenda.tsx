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
   const [pendingRequests, setPendingRequests] = useState<any[]>([]);

   const now = new Date();
   const [viewMonth, setViewMonth] = useState(now.getMonth());
   const [viewYear, setViewYear] = useState(now.getFullYear());
   const [activeTab, setActiveTab] = useState<'requests' | 'agenda'>('requests');

   const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
   const monthName = new Date(viewYear, viewMonth).toLocaleDateString('pt-BR', { month: 'long' });

   const fetchPendingRequests = async (role: UserRole, userId: string) => {
      let query = supabase
         .from('appointments')
         .select(`
   *,
   profiles(name, avatar_url),
   services(name)
      `)
         .eq('status', 'pending_approval')
         .order('date', { ascending: true })
         .order('time', { ascending: true });

      const isPrivilegedRole = ['MASTER_ADMIN', 'ADMIN', 'PROFESSIONAL_ADMIN'].includes(role);
      if (!isPrivilegedRole) {
         query = query.eq('professional_id', userId);
      }

      const { data } = await query;
      setPendingRequests(data || []);
   };

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
               rating: p.rating || 5
            }));

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

            // Use the professional's ID for filtering, not the profile ID
            const professionalIdForFilter = matchingPro?.id || profile.id;
            fetchPendingRequests(profile.role as UserRole, professionalIdForFilter);
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
               if (currentUser) {
                  fetchPendingRequests(currentUser.role, currentUser.id);
                  fetchMonthAppts();
               } else {
                  // Fallback if currentUser is not yet set
                  initAgenda();
               }
            }
         )
         .subscribe();

      return () => {
         supabase.removeChannel(channel);
      };
   }, [navigate]);

   const fetchMonthAppts = async () => {
      if (!selectedProId) return;
      const firstDay = `${viewYear}-${(viewMonth + 1).toString().padStart(2, '0')}-01`;
      const lastDay = `${viewYear}-${(viewMonth + 1).toString().padStart(2, '0')}-${daysInMonth}`;

      const { data } = await supabase
         .from('appointments')
         .select('date, status')
         .eq('professional_id', selectedProId)
         .in('status', ['approved', 'rescheduled', 'confirmed'])
         .gte('date', firstDay)
         .lte('date', lastDay);

      setAppointments(data || []);
   };

   useEffect(() => {
      fetchMonthAppts();
   }, [selectedProId, viewMonth, viewYear, daysInMonth]);

   const handleStatusUpdate = async (id: string, newStatus: string) => {
      try {
         const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
         if (error) throw error;

         // Refresh both views
         if (currentUser) fetchPendingRequests(currentUser.role, currentUser.id);
         fetchMonthAppts();

         // Notificar Cliente
         const { data: apt } = await supabase.from('appointments').select('user_id, service_name, date, time').eq('id', id).single();
         if (apt?.user_id) {
            const statusLabel = newStatus === 'approved' ? 'Aprovado' : 'Recusado';
            await supabase.from('notifications').insert({
               user_id: apt.user_id,
               title: `Agendamento ${statusLabel}`,
               message: `Seu agendamento de ${apt.service_name} para ${new Date(apt.date).toLocaleDateString('pt-BR')} às ${apt.time.slice(0, 5)} foi ${statusLabel.toLowerCase()}.`,
               type: newStatus
            });
         }

         alert(`Agendamento ${newStatus === 'approved' ? 'aprovado' : newStatus === 'rejected' ? 'recusado' : 'atualizado'} com sucesso.`);
      } catch (err: any) {
         alert('Erro ao atualizar: ' + err.message);
      }
   };

   const isPrivileged = ['MASTER_ADMIN', 'ADMIN', 'PROFESSIONAL_ADMIN'].includes(currentUser?.role || '');
   const isMaster = isPrivileged; // Standardize for the UI logic that uses isMaster

   const visibleProfessionals = useMemo(() => {
      if (isMaster) return professionals;
      return professionals.filter(p => p.id === currentUser?.id);
   }, [isMaster, professionals, currentUser]);

   const handleDayClick = (day: number) => {
      const dateStr = `${viewYear}-${(viewMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      navigate(`/admin/agenda/day/${dateStr}?proId=${selectedProId}`);
   };

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
      <div className="flex flex-col h-full bg-background-dark text-white pb-32">
         <header className="sticky top-0 z-50 glass-nav !bg-background-dark/80 p-6 border-b border-white/5 flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <button onClick={() => navigate('/admin')} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
                  <div>
                     <h1 className="text-xl font-display font-bold">Agenda Mestra</h1>
                     <p className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em]">Sincronizada em Tempo Real</p>
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

            {isMaster && visibleProfessionals.length > 1 && (
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
               <button
                  onClick={() => setActiveTab('requests')}
                  className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'requests' ? 'bg-accent-gold text-primary font-black shadow-lg shadow-accent-gold/20' : 'text-gray-500 hover:text-white'}`}
               >
                  <span className="material-symbols-outlined !text-lg">notification_important</span>
                  Pedidos
                  {pendingRequests.length > 0 && (
                     <span className={`size-5 rounded-full flex items-center justify-center text-[9px] ${activeTab === 'requests' ? 'bg-primary text-white' : 'bg-accent-gold text-primary'}`}>
                        {pendingRequests.length}
                     </span>
                  )}
               </button>
               <button
                  onClick={() => setActiveTab('agenda')}
                  className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'agenda' ? 'bg-white text-primary shadow-lg' : 'text-gray-500 hover:text-white'}`}
               >
                  <span className="material-symbols-outlined !text-lg">calendar_month</span>
                  Agenda Geral
               </button>
            </div>
         </header>

         <main className="flex-1 p-6 space-y-10 overflow-y-auto no-scrollbar">
            {activeTab === 'requests' ? (
               <section className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between px-2">
                     <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 flex items-center gap-2">
                        Solicitações Pendentes
                     </h2>
                  </div>

                  {pendingRequests.length === 0 ? (
                     <div className="bg-white/5 rounded-[40px] p-12 text-center border border-dashed border-white/10">
                        <span className="material-symbols-outlined !text-5xl text-gray-700 mb-4">notifications_off</span>
                        <p className="text-gray-500 text-sm font-medium">Tudo em dia! ✨<br />Nenhuma solicitação pendente.</p>
                     </div>
                  ) : (
                     <div className="space-y-4">
                        {pendingRequests.map(req => (
                           <div key={req.id} className="bg-card-dark p-6 rounded-[32px] border border-white/5 shadow-2xl space-y-4">
                              <div className="flex items-center gap-4">
                                 <img src={req.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${req.profiles?.name || 'C'}`} className="size-12 rounded-full border border-white/10" alt="" />
                                 <div className="flex-1">
                                    <h4 className="font-bold text-base leading-tight text-white">{req.profiles?.name || 'Cliente'}</h4>
                                    <p className="text-[10px] text-accent-gold font-bold uppercase tracking-widest">{req.services?.name}</p>
                                 </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 pb-2 border-b border-white/5">
                                 <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined !text-xs text-gray-500">calendar_today</span>
                                    <span className="text-[10px] font-bold">{new Date(req.date).toLocaleDateString('pt-BR')}</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined !text-xs text-gray-500">schedule</span>
                                    <span className="text-[10px] font-bold">{req.time.slice(0, 5)}</span>
                                 </div>
                              </div>

                              <div className="flex gap-2 pt-1">
                                 <button
                                    onClick={() => handleStatusUpdate(req.id, 'approved')}
                                    className="flex-1 h-12 bg-emerald-500 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                                 >
                                    <span className="material-symbols-outlined !text-lg">done</span>
                                    Aprovar
                                 </button>
                                 <button
                                    onClick={() => navigate(`/admin/agenda/day/${req.date}?proId=${req.professional_id}`)}
                                    className="flex-1 h-12 bg-white/5 border border-white/10 text-gray-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                                 >
                                    <span className="material-symbols-outlined !text-lg">schedule</span>
                                    Alterar
                                 </button>
                                 <button
                                    onClick={() => {
                                       if (window.confirm('Recusar este agendamento?')) {
                                          handleStatusUpdate(req.id, 'rejected');
                                       }
                                    }}
                                    className="size-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center active:scale-95 transition-all"
                                 >
                                    <span className="material-symbols-outlined">close</span>
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </section>
            ) : (
               <>
                  <div className="flex justify-between items-center px-4">
                     <h2 className="text-2xl font-display font-bold capitalize">{monthName} <span className="text-gray-600">{viewYear}</span></h2>
                     <div className="flex gap-4">
                        <button onClick={() => changeMonth(-1)} className="material-symbols-outlined text-gray-500 hover:text-white transition-colors">chevron_left</button>
                        <button onClick={() => changeMonth(1)} className="material-symbols-outlined text-gray-500 hover:text-white transition-colors">chevron_right</button>
                     </div>
                  </div>

                  <div className="grid grid-cols-7 gap-3 transition-opacity duration-300">
                     {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                        <div key={d} className="text-center text-[9px] font-black uppercase text-gray-700 pb-2">{d}</div>
                     ))}
                     {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dayDate = `${viewYear}-${(viewMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                        const isToday = dayDate === now.toISOString().split('T')[0];

                        const dayAppts = appointments.filter(a => a.date === dayDate);
                        const confirmedAppts = dayAppts.filter(a => ['approved', 'rescheduled', 'confirmed'].includes(a.status));
                        const hasAppointments = confirmedAppts.length > 0;
                        const isFull = confirmedAppts.length >= 8;

                        return (
                           <button
                              key={i}
                              onClick={() => handleDayClick(day)}
                              className={`aspect-square rounded-3xl border flex flex-col items-center justify-center gap-1.5 transition-all relative ${isToday ? 'bg-primary border-primary shadow-xl shadow-primary/30 scale-105 z-10' : 'bg-white/5 border-white/5 hover:border-accent-gold/30 hover:bg-white/10'}`}
                           >
                              <span className={`text-xs font-black ${isToday ? 'text-white' : 'text-gray-400'}`}>{day}</span>
                              {hasAppointments && <div className={`size-1.5 rounded-full ${isFull ? 'bg-rose-500' : 'bg-primary'}`}></div>}
                           </button>
                        );
                     })}
                  </div>

                  <div className="bg-card-dark p-8 rounded-[40px] border border-white/5 space-y-6">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status dos Dias</h3>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="flex items-center gap-3">
                           <div className="size-3 rounded-full bg-primary shadow-lg shadow-primary/20"></div>
                           <span className="text-[11px] font-medium text-gray-400">Atendimentos</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="size-3 rounded-full bg-rose-500"></div>
                           <span className="text-[11px] font-medium text-gray-400">Dia Cheio</span>
                        </div>
                     </div>
                  </div>
               </>
            )}
         </main>
         <AdminBottomNav />
      </div>
   );
};

export default AdminAgenda;
