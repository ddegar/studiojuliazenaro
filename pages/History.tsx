
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const statusMap: { [key: string]: { label: string, color: string } } = {
   'scheduled': { label: 'Agendado', color: 'text-primary bg-primary/5 border-primary/10' },
   'completed': { label: 'Finalizado', color: 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10' },
   'no_show': { label: 'Não Compareceu', color: 'text-rose-500 bg-rose-500/5 border-rose-500/10' },
   'cancelled_by_user': { label: 'Cancelado', color: 'text-rose-500 bg-rose-500/5 border-rose-500/10' },
   'cancelled': { label: 'Cancelado', color: 'text-rose-500 bg-rose-500/5 border-rose-500/10' },
   'rescheduled': { label: 'Reagendado', color: 'text-blue-500 bg-blue-500/5 border-blue-500/10' },
};

const History: React.FC = () => {
   const navigate = useNavigate();
   const [loading, setLoading] = useState(true);
   const [upcoming, setUpcoming] = useState<any[]>([]);
   const [past, setPast] = useState<any[]>([]);
   const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

   const fetchHistory = async () => {
      try {
         setLoading(true);
         const { data: { user } } = await supabase.auth.getUser();
         if (user) {
            const today = new Date().toISOString().split('T')[0];

            const { data: allAppts } = await supabase.from('appointments')
               .select(`
                  *,
                  services (name, category),
                  professionals (name)
               `)
               .eq('user_id', user.id)
               .order('date', { ascending: true })
               .order('time', { ascending: true });

            if (allAppts) {
               const upcomingStatuses = ['scheduled', 'rescheduled'];
               const up = allAppts.filter(a => a.date >= today && upcomingStatuses.includes(a.status));
               const ps = allAppts.filter(a => a.date < today || !upcomingStatuses.includes(a.status));

               setUpcoming(up);
               setPast(ps.sort((a, b) => b.date.localeCompare(a.date)));
            }
         }
      } catch (err) {
         console.error('History fetch error:', err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchHistory();

      const channel = supabase
         .channel('history-changes')
         .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'appointments' },
            () => fetchHistory()
         )
         .subscribe();

      return () => {
         supabase.removeChannel(channel);
      };
   }, []);

   const renderAppointmentCard = (item: any, isPast: boolean) => {
      const status = statusMap[item.status] || { label: item.status, color: 'text-gray-400 bg-gray-100' };

      return (
         <div
            key={item.id}
            onClick={() => navigate(`/history/details/${item.id}`)}
            className={`group relative w-full bg-white p-8 rounded-[40px] border border-primary/5 shadow-xl shadow-primary/5 hover:shadow-huge active:scale-[0.99] transition-all duration-500 overflow-hidden ${isPast ? 'opacity-80' : ''}`}
         >
            <div className="flex justify-between items-start mb-6">
               <div className="space-y-1">
                  <p className="text-[8px] font-black text-accent-gold uppercase tracking-[0.4em] leading-none mb-1">
                     {item.services?.category || 'Procedimento VIP'}
                  </p>
                  <h4 className="font-display italic text-2xl text-primary leading-tight">{item.service_name || item.services?.name}</h4>
               </div>
               <span className={`text-[9px] font-black px-4 py-2 rounded-2xl uppercase tracking-widest border ${status.color}`}>
                  {status.label}
               </span>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-primary/5 to-transparent mb-6"></div>

            <div className="flex flex-wrap gap-6 items-center">
               <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary/40 group-hover:text-accent-gold transition-colors">
                     <span className="material-symbols-outlined !text-lg">calendar_month</span>
                  </div>
                  <div>
                     <p className="text-[8px] font-black text-primary/20 uppercase tracking-widest">Data</p>
                     <p className="text-sm font-outfit font-bold text-primary">
                        {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                     </p>
                  </div>
               </div>

               <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary/40 group-hover:text-accent-gold transition-colors">
                     <span className="material-symbols-outlined !text-lg">schedule</span>
                  </div>
                  <div>
                     <p className="text-[8px] font-black text-primary/20 uppercase tracking-widest">Hora</p>
                     <p className="text-sm font-outfit font-bold text-primary">{item.time}</p>
                  </div>
               </div>

               <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary/40 group-hover:text-accent-gold transition-colors">
                     <span className="material-symbols-outlined !text-lg">person</span>
                  </div>
                  <div>
                     <p className="text-[8px] font-black text-primary/20 uppercase tracking-widest">Especialista</p>
                     <p className="text-sm font-outfit font-bold text-primary">{item.professional_name || item.professionals?.name?.split(' ')[0]}</p>
                  </div>
               </div>
            </div>

            <div className="absolute top-0 right-0 w-24 h-1 bg-gradient-to-l from-accent-gold/20 to-transparent"></div>
         </div>
      );
   };

   if (loading) {
      return (
         <div className="flex h-screen items-center justify-center bg-background-light">
            <div className="relative size-16 flex items-center justify-center">
               <div className="absolute inset-0 border-2 border-primary/5 rounded-full"></div>
               <div className="absolute inset-0 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
               <span className="material-symbols-outlined text-primary scale-75">calendar_month</span>
            </div>
         </div>
      );
   }

   return (
      <div className="flex flex-col min-h-screen bg-background-light font-outfit antialiased selection:bg-accent-gold/20 selection:text-primary">
         {/* Immersive Background */}
         <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[70%] aspect-square organic-shape-1 bg-accent-gold/10 blur-[100px] animate-float"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
         </div>

         <header className="relative z-50 premium-blur sticky top-0 px-6 py-8 flex items-center justify-between border-b border-primary/5">
            <button
               onClick={() => navigate('/home')}
               className="size-12 rounded-2xl bg-white shadow-sm border border-primary/5 flex items-center justify-center text-primary group active:scale-95 transition-all"
            >
               <span className="material-symbols-outlined !text-xl group-hover:-translate-x-1 transition-transform">west</span>
            </button>
            <div className="text-center">
               <p className="text-[8px] font-black uppercase tracking-[0.5em] text-primary/30 leading-none mb-1">Seu Histórico</p>
               <h2 className="font-display italic text-xl text-primary">Agenda VIP</h2>
            </div>
            <div className="size-12"></div>
         </header>

         <main className="relative z-10 flex-1 px-8 pt-8 pb-32 overflow-y-auto no-scrollbar">
            {/* Elegant Tab Switcher */}
            <div className="bg-white/50 p-2 rounded-3xl border border-primary/5 flex gap-2 mb-12 animate-reveal">
               <button
                  onClick={() => setActiveTab('upcoming')}
                  className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === 'upcoming' ? 'bg-primary text-accent-gold shadow-lg shadow-primary/20 scale-[1.02]' : 'text-primary/30 hover:text-primary hover:bg-white'}`}
               >
                  Próximos Momentos
               </button>
               <button
                  onClick={() => setActiveTab('past')}
                  className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === 'past' ? 'bg-primary text-accent-gold shadow-lg shadow-primary/20 scale-[1.02]' : 'text-primary/30 hover:text-primary hover:bg-white'}`}
               >
                  Minha Jornada
               </button>
            </div>

            {activeTab === 'upcoming' ? (
               <section className="space-y-10 animate-reveal">
                  <div className="flex justify-between items-center px-2">
                     <h3 className="text-[10px] font-black text-primary/30 uppercase tracking-[0.3em]">Encontros Confirmados</h3>
                     <span className="text-[10px] text-accent-gold font-black uppercase tracking-widest">{upcoming.length} Reserva(s)</span>
                  </div>

                  <div className="space-y-6">
                     {upcoming.length === 0 ? (
                        <div className="py-24 text-center space-y-6 glass-nav rounded-[48px] border border-dashed border-primary/10">
                           <div className="size-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto text-primary/20">
                              <span className="material-symbols-outlined !text-4xl">event_upcoming</span>
                           </div>
                           <div className="space-y-2">
                              <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest">Nenhum agendamento futuro</p>
                              <button
                                 onClick={() => navigate('/services')}
                                 className="text-accent-gold font-display italic text-lg hover:underline transition-all"
                              >
                                 Deseja reservar um novo horário?✧
                              </button>
                           </div>
                        </div>
                     ) : (
                        <div className="grid grid-cols-1 gap-6">
                           {upcoming.map((item, i) => (
                              <div key={item.id} className="animate-reveal" style={{ animationDelay: `${i * 0.15}s` }}>
                                 {renderAppointmentCard(item, false)}
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </section>
            ) : (
               <section className="space-y-10 animate-reveal">
                  <h3 className="text-[10px] font-black text-primary/30 uppercase tracking-[0.3em] px-2">Histórico de Experiências</h3>
                  <div className="space-y-6">
                     {past.length === 0 ? (
                        <div className="py-24 text-center glass-nav rounded-[48px] border border-dashed border-primary/10">
                           <p className="text-[10px] font-black text-primary/20 uppercase tracking-widest">Inicie sua história conosco ✨</p>
                        </div>
                     ) : (
                        <div className="grid grid-cols-1 gap-6">
                           {past.map((item, i) => (
                              <div key={item.id} className="animate-reveal" style={{ animationDelay: `${i * 0.15}s` }}>
                                 {renderAppointmentCard(item, true)}
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </section>
            )}
         </main>

         {/* Persistent Premium Navigation */}
         <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-[120]">
            <nav className="animate-reveal" style={{ animationDelay: '0.4s' }}>
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
                  <button className="relative p-2 text-primary group transition-all">
                     <span className="material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
                     <span className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 w-1 h-1 bg-accent-gold rounded-full"></span>
                  </button>
                  <button onClick={() => navigate('/profile')} className="p-2 text-primary/30 hover:text-primary transition-colors group">
                     <span className="material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform">person_outline</span>
                  </button>
               </div>
            </nav>
         </div>

         <div className="fixed bottom-0 left-0 w-full h-8 bg-background-light pointer-events-none z-[110]"></div>
      </div>
   );
};

export default History;
