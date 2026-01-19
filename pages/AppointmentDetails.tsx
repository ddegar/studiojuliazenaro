
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';

const statusMap: { [key: string]: { label: string, color: string, isLive: boolean } } = {
   'pending_approval': { label: 'Pendente de aprovação', color: 'text-accent-gold bg-accent-gold/5', isLive: false },
   'approved': { label: 'Aprovado', color: 'text-primary bg-primary/5', isLive: true },
   'completed': { label: 'Finalizado', color: 'text-emerald-500 bg-emerald-500/5', isLive: false },
   'rejected': { label: 'Recusado', color: 'text-rose-500 bg-rose-500/5', isLive: false },
   'cancelled_by_user': { label: 'Cancelado', color: 'text-rose-500 bg-rose-500/5', isLive: false },
   'rescheduled': { label: 'Reagendado', color: 'text-blue-500 bg-blue-500/5', isLive: false },
   // Compatibility fallbacks
   'pending': { label: 'Pendente', color: 'text-accent-gold bg-accent-gold/5', isLive: false },
   'confirmed': { label: 'Aprovado', color: 'text-primary bg-primary/5', isLive: true },
   'cancelled': { label: 'Cancelado', color: 'text-rose-500 bg-rose-500/5', isLive: false },
};

const AppointmentDetails: React.FC = () => {
   const navigate = useNavigate();
   const { id } = useParams();
   const [loading, setLoading] = useState(true);
   const [appointment, setAppointment] = useState<any>(null);
   const [showCancelPopup, setShowCancelPopup] = useState(false);

   useEffect(() => {
      const fetchAppt = async () => {
         try {
            setLoading(true);
            const { data, error } = await supabase
               .from('appointments')
               .select(`
            *,
            services (name, points_reward, description),
            professionals (name, role)
          `)
               .eq('id', id)
               .single();

            if (data) setAppointment(data);
         } catch (err) {
            console.error('Fetch appointment details error:', err);
         } finally {
            setLoading(false);
         }
      };
      fetchAppt();
   }, [id]);

   const handleCancelClick = () => {
      if (!appointment) return;

      const apptDate = new Date(`${appointment.date}T${appointment.time}`);
      const now = new Date();
      const diffHours = (apptDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (diffHours < 12) {
         setShowCancelPopup(true);
      } else {
         if (window.confirm('Deseja realmente cancelar seu agendamento?')) {
            updateStatus('cancelled_by_user');
         }
      }
   };

   const updateStatus = async (newStatus: string) => {
      try {
         const { error } = await supabase
            .from('appointments')
            .update({ status: newStatus })
            .eq('id', id);

         if (error) throw error;

         // Notificar Admin e Profissional sobre cancelamento
         if (newStatus === 'cancelled_by_user') {
            try {
               await supabase.from('notifications').insert([
                  {
                     user_id: 'JULIA_ZENARO_ID',
                     title: 'Agendamento Cancelado pelo Cliente',
                     message: `${appointment?.service_name || 'Serviço'} que seria em ${new Date(appointment?.date).toLocaleDateString('pt-BR')} às ${appointment?.time}`,
                     type: 'cancelled_by_user'
                  },
                  {
                     user_id: appointment?.professional_id,
                     title: 'Cancelamento na sua Agenda',
                     message: `O cliente cancelou o agendamento de ${appointment?.service_name || 'Serviço'}.`,
                     type: 'cancelled_by_user'
                  }
               ]);
            } catch (notifyErr) {
               console.error('Error sending cancellation notifications:', notifyErr);
            }
         }

         alert(`Agendamento ${newStatus === 'cancelled_by_user' ? 'cancelado' : 'atualizado'} com sucesso.`);
         navigate('/history');
      } catch (e: any) {
         alert('Erro ao atualizar: ' + e.message);
      }
   };

   if (loading) {
      return (
         <div className="flex h-screen items-center justify-center bg-background-light">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
         </div>
      );
   }

   if (!appointment) {
      return (
         <div className="flex flex-col h-screen items-center justify-center bg-background-light p-10 text-center space-y-4">
            <span className="material-symbols-outlined !text-6xl text-gray-200">event_busy</span>
            <h2 className="text-xl font-display font-bold text-primary">Agendamento não encontrado</h2>
            <button onClick={() => navigate('/history')} className="text-primary underline font-bold uppercase tracking-widest text-xs">Voltar para Agenda</button>
         </div>
      );
   }

   const status = statusMap[appointment.status] || { label: appointment.status, color: 'text-gray-400 bg-gray-50', isLive: false };

   return (
      <div className="flex flex-col h-full bg-background-light overflow-hidden">
         <header className="glass-nav p-6 flex items-center justify-between border-b sticky top-0 z-50">
            <button onClick={() => navigate(-1)} className="material-symbols-outlined text-primary">arrow_back_ios_new</button>
            <h2 className="font-display font-bold text-lg">Resumo do Cuidado</h2>
            <span className="size-6"></span>
         </header>

         <main className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar pb-32">
            <div className={`bg-white p-8 rounded-[48px] border transition-all duration-700 flex flex-col items-center text-center space-y-6 premium-shadow`}>
               <div className={`size-24 rounded-[32px] flex items-center justify-center relative transition-all duration-700 ${appointment.status === 'completed' || appointment.status === 'COMPLETED' ? 'bg-emerald-500 text-white shadow-xl' : 'bg-primary/5 text-primary'}`}>
                  <span className="material-symbols-outlined !text-5xl">{appointment.status === 'completed' || appointment.status === 'COMPLETED' ? 'verified' : 'event_available'}</span>
               </div>

               <div className="space-y-2">
                  <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${status.color.split(' ')[0]}`}>
                     {status.label}
                  </p>
                  <h1 className="text-3xl font-display font-bold text-primary leading-tight">{appointment.service_name || appointment.services?.name}</h1>
                  <p className="text-sm text-gray-400 font-medium italic">Sua beleza, nossa dedicação ✨</p>
               </div>
            </div>

            {/* Lash Points Information */}
            {(appointment.status === 'completed' || appointment.status === 'COMPLETED') ? (
               <section className="animate-slide-up space-y-4">
                  <div className="bg-primary p-8 rounded-[40px] text-white flex items-center justify-between shadow-2xl shadow-primary/20 relative overflow-hidden">
                     <div className="relative z-10 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Fidelidade Automática</p>
                        <h3 className="text-2xl font-display font-bold">+{appointment.services?.points_reward || 50} Lash Points</h3>
                        <p className="text-[10px] text-accent-gold font-bold uppercase tracking-widest mt-1">Saldo Atualizado ✨</p>
                     </div>
                     <span className="material-symbols-outlined !text-6xl text-accent-gold/20 absolute -right-4 -bottom-4">stars</span>
                  </div>
               </section>
            ) : (
               <div className="bg-accent-gold/5 border border-accent-gold/10 p-6 rounded-[32px] flex items-center gap-4">
                  <div className="size-11 rounded-full bg-accent-gold/10 flex items-center justify-center text-accent-gold">
                     <span className="material-symbols-outlined !text-xl">redeem</span>
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-primary uppercase tracking-widest">Recompensa VIP</p>
                     <p className="text-xs text-gray-500">Este atendimento vale <span className="text-accent-gold font-bold">{appointment.services?.points_reward || 50} pontos</span>!</p>
                  </div>
               </div>
            )}

            <div className="bg-white p-8 rounded-[40px] border border-gray-100 premium-shadow space-y-6">
               <h4 className="text-[10px] font-black uppercase text-gray-300 tracking-[0.3em] px-1">Dados da Reserva</h4>
               <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                     <span className="text-[11px] font-bold text-gray-400">Data</span>
                     <span className="text-sm font-black text-primary">{new Date(appointment.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                     <span className="text-[11px] font-bold text-gray-400">Horário</span>
                     <span className="text-sm font-black text-primary">{appointment.time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-[11px] font-bold text-gray-400">Especialista</span>
                     <span className="text-sm font-black text-primary">{appointment.professional_name || appointment.professionals?.name}</span>
                  </div>
               </div>
            </div>

            {appointment.services?.description && (
               <div className="p-2 italic text-gray-400 text-xs text-center px-10">
                  "{appointment.services.description}"
               </div>
            )}
         </main>

         <div className="fixed bottom-0 inset-x-0 p-8 glass-nav border-t border-gray-100 rounded-t-[40px] flex gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            {(appointment.status === 'pending_approval' || appointment.status === 'approved' || appointment.status === 'pending' || appointment.status === 'confirmed' || appointment.status === 'rescheduled') ? (
               <>
                  <button
                     onClick={handleCancelClick}
                     className="flex-1 h-16 border border-rose-500/10 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                  >
                     CANCELAR
                  </button>
                  <button
                     onClick={() => navigate('/booking', { state: { professional: appointment.professionals, service: appointment.services, isRescheduling: true, oldApptId: appointment.id } })}
                     className="flex-1 h-16 bg-primary text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.25em] shadow-xl active:scale-95 transition-all"
                  >
                     REAGENDAR
                  </button>
               </>
            ) : (
               <button onClick={() => navigate('/home')} className="w-full h-16 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all">VOLTAR AO INÍCIO 💖</button>
            )}
         </div>

         {showCancelPopup && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
               <div className="bg-white rounded-[40px] p-8 max-w-sm w-full space-y-6 text-center shadow-2xl animate-scale-up">
                  <div className="size-20 rounded-full bg-rose-50 mx-auto flex items-center justify-center text-rose-500">
                     <span className="material-symbols-outlined !text-4xl">warning</span>
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-xl font-display font-bold text-primary">Atenção, maravilhosa! 💕</h3>
                     <p className="text-sm text-gray-500 leading-relaxed font-medium">
                        Para cancelar com menos de 12 horas de antecedência, entre em contato diretamente com a profissional pelo WhatsApp.
                     </p>
                  </div>
                  <div className="space-y-3">
                     <a
                        href={`https://wa.me/55${(appointment.professionals?.phone || '14999999999').replace(/\D/g, '')}?text=Olá! Gostaria de falar sobre meu agendamento de ${appointment.service_name || appointment.services?.name} no dia ${new Date(appointment.date).toLocaleDateString('pt-BR')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-14 bg-[#25D366] text-white rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-500/20"
                     >
                        <span className="material-symbols-outlined">chat</span>
                        Falar no WhatsApp
                     </a>
                     <button
                        onClick={() => setShowCancelPopup(false)}
                        className="w-full h-14 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                     >
                        Agora não
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default AppointmentDetails;
