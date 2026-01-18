
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Appointment, Professional } from '../types';
import { supabase } from '../services/supabase';

const AdminTimeline: React.FC = () => {
   const navigate = useNavigate();
   const { date } = useParams();
   const [searchParams, setSearchParams] = useSearchParams();
   const [professionals, setProfessionals] = useState<Professional[]>([]);
   const [selectedProId, setSelectedProId] = useState<string>(searchParams.get('proId') || '');
   const [appointments, setAppointments] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   const fetchPros = async () => {
      const { data } = await supabase.from('professionals').select('*').eq('active', true);
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
               profiles (name, avatar_url),
               services (name, points_reward, price)
            `)
            .eq('professional_id', selectedProId)
            .eq('date', date)
            .order('time');

         if (error) throw error;

         if (data) {
            setAppointments(data.map(d => ({
               ...d,
               time: d.time.slice(0, 5),
               clientName: d.profiles?.name || 'Cliente Externo',
               clientAvatar: d.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${d.profiles?.name || 'C'}`
            })));
         }
      } catch (err) {
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
   }, [selectedProId, date]);

   const handleProChange = (id: string) => {
      setSelectedProId(id);
      setSearchParams({ proId: id });
   };

   const handleStatusUpdate = async (apt: any, newStatus: string) => {
      try {
         const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', apt.id);
         if (error) throw error;

         // Automation for COMPLETION
         if (newStatus === 'completed') {
            const userId = apt.user_id;
            const pointsReward = apt.services?.points_reward || 0;
            const price = apt.price || apt.services?.price || 0;

            // 1. Credit Points
            if (userId && pointsReward > 0) {
               const { data: profile } = await supabase.from('profiles').select('lash_points').eq('id', userId).single();
               const newTotal = (profile?.lash_points || 0) + pointsReward;

               await supabase.from('profiles').update({ lash_points: newTotal }).eq('id', userId);

               // 2. Transaction Log
               await supabase.from('point_transactions').insert({
                  user_id: userId,
                  amount: pointsReward,
                  source: 'SERVICE',
                  description: `Crédito automático: ${apt.service_name || apt.services?.name}`
               });
            }

            // 3. Financial Entry
            await supabase.from('transactions').insert({
               amount: price,
               type: 'INCOME',
               category: 'SERVICO',
               description: `Atendimento: ${apt.service_name || apt.services?.name} - ${apt.clientName}`,
               date: date,
               user_id: selectedProId // Professional's revenue
            });
         }

         alert(`Status atualizado para: ${newStatus === 'confirmed' ? 'Confirmado' : newStatus === 'completed' ? 'Finalizado' : 'Cancelado'}`);
         fetchAppointments();
      } catch (err: any) {
         alert('Erro ao atualizar: ' + err.message);
      }
   };

   const hours = Array.from({ length: 15 }).map((_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);
   const getAppointmentAt = (time: string) => appointments.find(a => a.time === time);
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
               const isBlocked = apt?.status === 'BLOCKED' || apt?.status === 'blocked';
               const isPending = apt?.status === 'pending' || apt?.status === 'PENDING';
               const isCompleted = apt?.status === 'completed' || apt?.status === 'COMPLETED';
               const isCancelled = apt?.status === 'cancelled' || apt?.status === 'CANCELLED';

               if (isCancelled) return null; // We hide cancelled in the timeline for focus

               return (
                  <div key={hour} className="flex gap-6 min-h-[100px] group">
                     <div className="w-12 text-[11px] font-black text-gray-700 pt-4 transition-colors group-hover:text-accent-gold">
                        {hour}
                     </div>

                     {apt ? (
                        <div className={`flex-1 p-6 rounded-[32px] border transition-all duration-500 flex flex-col justify-between ${isBlocked ? 'bg-white/5 border-white/10 opacity-40 grayscale' :
                           isPending ? 'bg-accent-gold/5 border-accent-gold border-dashed' :
                              isCompleted ? 'bg-green-500/10 border-green-500/20' :
                                 'bg-white/5 border-white/10 shadow-2xl shadow-black/20'
                           }`}>
                           <div className="flex justify-between items-start">
                              <div className="space-y-1.5">
                                 <div className="flex items-center gap-2">
                                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isBlocked ? 'text-gray-500' : 'text-accent-gold'}`}>
                                       {isBlocked ? 'Intervalo' : apt.service_name || apt.services?.name}
                                    </p>
                                    {isPending && <span className="text-[8px] bg-accent-gold text-black px-2 py-0.5 rounded-full font-black animate-pulse">NOVO AGENDAMENTO</span>}
                                    {isCompleted && <span className="text-[8px] bg-green-500/20 text-green-500 px-2.5 py-1 rounded-full font-black border border-green-500/20 uppercase tracking-widest">Concluído</span>}
                                 </div>
                                 <div className="flex items-center gap-3">
                                    {!isBlocked && <img src={apt.clientAvatar} className="size-8 rounded-full border border-white/10" alt="" />}
                                    <h4 className={`font-bold text-base ${isBlocked ? 'text-gray-600 italic' : 'text-white'}`}>
                                       {isBlocked ? 'Horário Bloqueado' : apt.clientName}
                                    </h4>
                                 </div>
                                 {!isBlocked && <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pt-1">R$ {apt.price || apt.services?.price} • {apt.time}</p>}
                              </div>

                              {!isBlocked && !isCompleted && (
                                 <div className="flex gap-2">
                                    {isPending ? (
                                       <>
                                          <button onClick={() => handleStatusUpdate(apt, 'confirmed')} className="size-10 rounded-full bg-emerald-500 text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/20" title="Aceitar">
                                             <span className="material-symbols-outlined !text-xl">done</span>
                                          </button>
                                          <button onClick={() => handleStatusUpdate(apt, 'cancelled')} className="size-10 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white active:scale-95 transition-all" title="Recusar">
                                             <span className="material-symbols-outlined !text-xl">close</span>
                                          </button>
                                       </>
                                    ) : (
                                       <div className="flex flex-col gap-2">
                                          <button onClick={() => handleStatusUpdate(apt, 'completed')} className="h-10 px-5 bg-emerald-500 text-black rounded-2xl font-black text-[9px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                                             <span className="material-symbols-outlined !text-base">verified</span>
                                             FINALIZAR
                                          </button>
                                          <button onClick={() => navigate('/admin/agenda/new', { state: { oldAppt: apt, date, proId: selectedProId } })} className="h-10 px-5 bg-white/5 border border-white/10 text-gray-400 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-white/10 transition-all">
                                             REAGENDAR
                                          </button>
                                       </div>
                                    )}
                                 </div>
                              )}
                           </div>
                        </div>
                     ) : (
                        <button
                           onClick={() => navigate('/admin/agenda/new', { state: { hour, date, proId: selectedProId } })}
                           className="flex-1 rounded-[32px] border-2 border-dashed border-white/5 flex items-center px-8 gap-4 text-gray-700 hover:border-accent-gold/30 hover:text-accent-gold hover:bg-accent-gold/5 transition-all duration-300 group/btn"
                        >
                           <span className="material-symbols-outlined !text-xl opacity-20 group-hover/btn:opacity-100 transition-opacity">add_circle</span>
                           <span className="text-[10px] font-black uppercase tracking-[0.3em]">Horário Disponível</span>
                        </button>
                     )}
                  </div>
               );
            })}
         </main>

         <div className="fixed bottom-0 inset-x-0 p-6 glass-nav !bg-background-dark/95 border-t border-white/5 flex gap-4 backdrop-blur-2xl">
            <button onClick={() => navigate('/admin/agenda/new', { state: { type: 'BLOCK', date, proId: selectedProId } })} className="flex-1 h-16 bg-white/5 border border-white/10 text-gray-500 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:text-rose-400 transition-colors">Bloquear Intervalo</button>
            <button onClick={() => navigate('/admin/agenda/new', { state: { date, proId: selectedProId } })} className="flex-[1.8] h-16 bg-primary text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-primary/40 flex items-center justify-center gap-3 active:scale-95 transition-all">
               <span className="material-symbols-outlined !text-xl">add_circle</span>
               Novo Agendamento
            </button>
         </div>
      </div>
   );
};

export default AdminTimeline;
