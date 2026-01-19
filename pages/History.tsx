
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const statusMap: { [key: string]: { label: string, color: string } } = {
   'pending_approval': { label: 'Pendente de aprovação', color: 'text-accent-gold bg-accent-gold/5 border-accent-gold/10' },
   'approved': { label: 'Aprovado', color: 'text-primary bg-primary/5 border-primary/10' },
   'completed': { label: 'Finalizado', color: 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10' },
   'rejected': { label: 'Recusado', color: 'text-rose-500 bg-rose-500/5 border-rose-500/10' },
   'cancelled_by_user': { label: 'Cancelado', color: 'text-rose-500 bg-rose-500/5 border-rose-500/10' },
   'rescheduled': { label: 'Reagendado', color: 'text-blue-500 bg-blue-500/5 border-blue-500/10' },
   // Compatibility fallbacks
   'pending': { label: 'Pendente', color: 'text-accent-gold bg-accent-gold/5 border-accent-gold/10' },
   'confirmed': { label: 'Aprovado', color: 'text-primary bg-primary/5 border-primary/10' },
   'cancelled': { label: 'Cancelado', color: 'text-rose-500 bg-rose-500/5 border-rose-500/10' },
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

            // Fetch with specific columns to avoid join errors if relations aren't perfect
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
               const upcomingStatuses = ['pending_approval', 'approved', 'rescheduled', 'pending', 'confirmed'];
               const up = allAppts.filter(a => a.date >= today && upcomingStatuses.includes(a.status));
               const ps = allAppts.filter(a => a.date < today || !upcomingStatuses.includes(a.status));

               setUpcoming(up);
               // Sort past reverse
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
   }, []);

   const renderAppointmentCard = (item: any, isPast: boolean) => {
      const status = statusMap[item.status] || { label: item.status, color: 'text-gray-400 bg-gray-50' };

      return (
         <div key={item.id} className="relative">
            {!isPast && <div className="absolute left-[-45px] top-4 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/10"></div>}
            <div
               onClick={() => navigate(`/history/details/${item.id}`)}
               className={`bg-white p-6 rounded-[32px] premium-shadow border border-gray-50 active:scale-[0.98] transition-all cursor-pointer ${isPast ? 'opacity-70' : ''}`}
            >
               <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-accent-gold uppercase tracking-widest leading-none">
                        {item.services?.category || 'Procedimento'}
                     </p>
                     <h4 className="font-bold text-primary text-lg leading-tight">{item.service_name || item.services?.name}</h4>
                  </div>
                  <span className={`text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border ${status.color}`}>
                     {status.label}
                  </span>
               </div>
               <div className="space-y-3 text-xs text-gray-500 font-medium">
                  <div className="flex items-center gap-2">
                     <span className="material-symbols-outlined !text-sm text-accent-gold">calendar_today</span>
                     {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="material-symbols-outlined !text-sm text-accent-gold">schedule</span>
                     {item.time}
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="material-symbols-outlined !text-sm text-accent-gold">person</span>
                     com {item.professional_name || item.professionals?.name}
                  </div>
               </div>
            </div>
         </div>
      );
   };

   if (loading) {
      return (
         <div className="flex h-screen items-center justify-center bg-background-light">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
         </div>
      );
   }

   return (
      <div className="flex flex-col h-full bg-background-light pb-24">
         <header className="sticky top-0 z-50 glass-nav p-6 flex items-center justify-between border-b">
            <button onClick={() => navigate('/home')} className="material-symbols-outlined text-primary">arrow_back_ios_new</button>
            <h2 className="font-display font-bold text-lg">Seus Agendamentos</h2>
            <span className="size-6"></span>
         </header>

         <main className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar">
            <div className="flex gap-4 border-b">
               <button
                  onClick={() => setActiveTab('upcoming')}
                  className={`pb-3 font-bold text-sm flex-1 transition-all ${activeTab === 'upcoming' ? 'border-b-2 border-primary text-primary' : 'border-b-2 border-transparent text-gray-400'}`}
               >
                  Próximos
               </button>
               <button
                  onClick={() => setActiveTab('past')}
                  className={`pb-3 font-bold text-sm flex-1 transition-all ${activeTab === 'past' ? 'border-b-2 border-primary text-primary' : 'border-b-2 border-transparent text-gray-400'}`}
               >
                  Anteriores
               </button>
            </div>

            {activeTab === 'upcoming' ? (
               <section className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center">
                     <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Agendados</h3>
                     <span className="text-[10px] text-gray-400 font-bold uppercase">{upcoming.length} Encontro(s)</span>
                  </div>

                  <div className="relative pl-10 border-l border-gray-100 py-2 space-y-4">
                     {upcoming.length === 0 ? (
                        <div className="py-10 text-center space-y-2 opacity-40">
                           <span className="material-symbols-outlined !text-4xl text-primary">calendar_today</span>
                           <p className="text-xs font-bold uppercase tracking-widest">Nenhum agendamento futuro</p>
                           <button onClick={() => navigate('/services')} className="text-[10px] text-accent-gold underline font-bold uppercase tracking-widest mt-2 block w-full text-center">Agendar Agora ✨</button>
                        </div>
                     ) : upcoming.map(item => renderAppointmentCard(item, false))}
                  </div>
               </section>
            ) : (
               <section className="space-y-6 animate-fade-in">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sua História Conosco</h3>
                  <div className="space-y-6">
                     {past.length === 0 ? (
                        <p className="text-xs text-gray-400 pl-10 opacity-60">Histórico vazio.</p>
                     ) : past.map(item => renderAppointmentCard(item, true))}
                  </div>
               </section>
            )}
         </main>

         <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] glass-nav border-t border-gray-100 flex justify-around items-center py-6 px-4 z-50 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <button onClick={() => navigate('/home')} className="flex flex-col items-center gap-1.5 text-gray-400">
               <span className="material-symbols-outlined !text-3xl">home</span>
               <span className="text-[9px] font-black uppercase tracking-widest">Início</span>
            </button>
            <button onClick={() => navigate('/feed')} className="flex flex-col items-center gap-1.5 text-gray-400">
               <span className="material-symbols-outlined !text-3xl">grid_view</span>
               <span className="text-[9px] font-black uppercase tracking-widest">Feed</span>
            </button>
            <button onClick={() => navigate('/services')} className="flex flex-col items-center gap-1.5 text-gray-400">
               <span className="material-symbols-outlined !text-3xl">content_cut</span>
               <span className="text-[9px] font-black uppercase tracking-widest">Serviços</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 text-primary">
               <span className="material-symbols-outlined !text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
               <span className="text-[9px] font-black uppercase tracking-widest">Agenda</span>
            </button>
            <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1.5 text-gray-400">
               <span className="material-symbols-outlined !text-3xl">person</span>
               <span className="text-[9px] font-black uppercase tracking-widest">Perfil</span>
            </button>
         </nav>
      </div>
   );
};

export default History;
