
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Appointment, Professional } from '../types';
import { supabase } from '../services/supabase';

const AdminTimeline: React.FC = () => {
   const navigate = useNavigate();
   const { date } = useParams();
   const [searchParams, setSearchParams] = useSearchParams();
   const [professionals, setProfessionals] = useState<Professional[]>([]);
   const [selectedProId, setSelectedProId] = useState<string>(searchParams.get('proId') || '');
   const [appointments, setAppointments] = useState<Appointment[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetchPros = async () => {
         const { data } = await supabase.from('professionals').select('*').eq('active', true);
         if (data && data.length > 0) {
            setProfessionals(data);
            if (!selectedProId) setSelectedProId(data[0].id);
         }
      };
      fetchPros();
   }, []);

   const fetchAppointments = async () => {
      if (!selectedProId || !date) return;
      setLoading(true);
      const { data } = await supabase
         .from('appointments')
         .select('*')
         .eq('professional_id', selectedProId)
         .eq('date', date)
         .order('time');

      if (data) setAppointments(data.map(d => ({
         ...d,
         serviceId: d.service_id,
         serviceName: d.service_name,
         professionalId: d.professional_id,
         professionalName: d.professional_name,
         clientName: d.client_name,
         userId: d.user_id,
         date: d.date,
         time: d.time.slice(0, 5),
         price: d.price
      })));
      setLoading(false);
   };

   useEffect(() => {
      fetchAppointments();
   }, [selectedProId, date]);

   const handleProChange = (id: string) => {
      setSelectedProId(id);
      setSearchParams({ proId: id });
   };

   const updateStatus = async (id: string, status: string) => {
      const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
      if (error) alert('Erro ao atualizar: ' + error.message);
      else fetchAppointments();
   };

   const hours = Array.from({ length: 15 }).map((_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

   const getAppointmentAt = (time: string) => appointments.find(a => a.time === time);
   const currentPro = professionals.find(p => p.id === selectedProId);

   return (
      <div className="flex flex-col h-full bg-background-dark text-white">
         {/* Header Analítico de Timeline */}
         <header className="sticky top-0 z-50 glass-nav !bg-background-dark/95 p-6 border-b border-white/5 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <button onClick={() => navigate('/admin/agenda')} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
                  <div>
                     <h1 className="text-xl font-display font-bold">Timeline Diária</h1>
                     <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">{date}</p>
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

            {/* Seletor de Profissional */}
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

         {/* Timeline Vertical Premium */}
         <main className="flex-1 p-6 overflow-y-auto no-scrollbar space-y-4 pb-40 bg-gradient-to-b from-background-dark to-[#121415]">
            <div className="flex items-center justify-between px-2 mb-6 opacity-40">
               <span className="text-[10px] font-black uppercase tracking-[0.3em]">Agenda: {currentPro?.name}</span>
               <div className="h-px flex-1 mx-4 bg-white/10"></div>
               <span className="text-[9px] font-bold">{appointments.length} Slots</span>
            </div>

            {loading ? <p className="text-center text-gray-500 animate-pulse">Carregando...</p> : hours.map(hour => {
               const apt = getAppointmentAt(hour);
               const isBlocked = apt?.status === 'BLOCKED';
               const isPending = apt?.status === 'PENDING';
               const isCompleted = apt?.status === 'COMPLETED';

               return (
                  <div key={hour} className="flex gap-6 min-h-[90px] group">
                     <div className="w-12 text-[11px] font-black text-gray-700 pt-4 transition-colors group-hover:text-accent-gold">
                        {hour}
                     </div>

                     {apt ? (
                        <div className={`flex-1 p-5 rounded-[32px] border transition-all duration-500 flex flex-col justify-between ${isBlocked ? 'bg-white/5 border-white/10 opacity-40 grayscale' :
                              isPending ? 'bg-accent-gold/5 border-accent-gold border-dashed' :
                                 isCompleted ? 'bg-green-500/10 border-green-500/20' :
                                    'bg-accent-gold/10 border-accent-gold/20 shadow-2xl shadow-accent-gold/5'
                           }`}>
                           <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                 <div className="flex items-center gap-2">
                                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${isBlocked ? 'text-gray-500' : 'text-accent-gold'}`}>
                                       {isBlocked ? 'Intervalo' : apt.serviceName}
                                    </p>
                                    {isPending && <span className="text-[9px] bg-accent-gold text-black px-2 py-0.5 rounded-full font-bold">NOVO</span>}
                                    {isCompleted && <span className="text-[9px] bg-green-500 text-black px-2 py-0.5 rounded-full font-bold">CONCLUÍDO</span>}
                                 </div>
                                 <h4 className={`font-bold text-sm ${isBlocked ? 'text-gray-600 italic' : 'text-white'}`}>
                                    {isBlocked ? 'Horário Bloqueado' : apt.clientName}
                                 </h4>
                                 {!isBlocked && <p className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter">Valor: R$ {apt.price}</p>}
                              </div>

                              {!isBlocked && !isCompleted && (
                                 <div className="flex gap-2">
                                    {isPending ? (
                                       <>
                                          <button onClick={() => updateStatus(apt.id!, 'CONFIRMED')} className="size-8 rounded-full bg-green-500 text-black flex items-center justify-center hover:scale-110 transition-transform" title="Aceitar">
                                             <span className="material-symbols-outlined !text-lg">check</span>
                                          </button>
                                          <button onClick={() => updateStatus(apt.id!, 'CANCELLED')} className="size-8 rounded-full bg-rose-500 text-white flex items-center justify-center hover:scale-110 transition-transform" title="Rejeitar">
                                             <span className="material-symbols-outlined !text-lg">close</span>
                                          </button>
                                       </>
                                    ) : (
                                       <button onClick={() => updateStatus(apt.id!, 'COMPLETED')} className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[9px] font-bold tracking-widest hover:bg-green-500 hover:text-black hover:border-green-500 transition-colors" title="Concluir">
                                          CONCLUIR
                                       </button>
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
                           <span className="text-[10px] font-black uppercase tracking-[0.3em]">Disponível</span>
                        </button>
                     )}
                  </div>
               );
            })}
         </main>

         {/* Footer Operacional Fixo */}
         <div className="fixed bottom-0 inset-x-0 p-6 glass-nav !bg-background-dark/95 border-t border-white/5 flex gap-4 backdrop-blur-2xl">
            <button onClick={() => navigate('/admin/agenda/new', { state: { type: 'BLOCK', date, proId: selectedProId } })} className="flex-1 h-16 bg-white/5 border border-white/10 text-gray-500 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:text-rose-400 transition-colors">Bloquear Horário</button>
            <button onClick={() => navigate('/admin/agenda/new', { state: { date, proId: selectedProId } })} className="flex-[1.8] h-16 bg-primary text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-primary/40 flex items-center justify-center gap-3 active:scale-95 transition-all">
               <span className="material-symbols-outlined !text-xl">add_circle</span>
               Agendar Cliente
            </button>
         </div>
      </div>
   );
};

export default AdminTimeline;
