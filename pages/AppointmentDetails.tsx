
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';

const statusMap: { [key: string]: { label: string, color: string, isLive: boolean } } = {
   'scheduled': { label: 'Agendado', color: 'text-primary bg-primary/5', isLive: true },
   'completed': { label: 'Finalizado', color: 'text-emerald-500 bg-emerald-500/5', isLive: false },
   'no_show': { label: 'Não Compareceu', color: 'text-rose-500 bg-rose-500/5', isLive: false },
   'cancelled_by_user': { label: 'Cancelado', color: 'text-rose-500 bg-rose-500/5', isLive: false },
   'cancelled': { label: 'Cancelado', color: 'text-rose-500 bg-rose-500/5', isLive: false },
   'rescheduled': { label: 'Reagendado', color: 'text-blue-500 bg-blue-500/5', isLive: true },
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
            const { data } = await supabase
               .from('appointments')
               .select(`
            *,
            services (name, points_reward, description),
            professionals (name, role, phone)
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

      if (diffHours < 24) {
         setShowCancelPopup(true);
      } else {
         if (window.confirm('Deseja realmente cancelar seu agendamento VIP?')) {
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

         if (newStatus === 'cancelled_by_user') {
            try {
               await supabase.from('notifications').insert([
                  {
                     user_id: 'JULIA_ZENARO_ID',
                     title: 'Reserva VIP Cancelada',
                     message: `${appointment?.service_name || 'Serviço'} em ${new Date(appointment?.date).toLocaleDateString('pt-BR')} às ${appointment?.time}`,
                     type: 'cancelled_by_user'
                  },
                  {
                     user_id: appointment?.professional_id,
                     title: 'Alteração na Agenda',
                     message: `Um cliente cancelou a reserva de ${appointment?.service_name || 'Serviço'}.`,
                     type: 'cancelled_by_user'
                  }
               ]);
            } catch (notifyErr) {
               console.error('Error sending notifications:', notifyErr);
            }
         }

         alert(`Sua reserva foi ${newStatus === 'cancelled_by_user' ? 'cancelada' : 'atualizada'} com sucesso.`);
         navigate('/history');
      } catch (e: any) {
         alert('Erro ao processar: ' + e.message);
      }
   };

   if (loading) {
      return (
         <div className="flex h-screen items-center justify-center bg-background-light font-outfit">
            <div className="relative size-16 flex items-center justify-center">
               <div className="absolute inset-0 border-2 border-primary/5 rounded-full"></div>
               <div className="absolute inset-0 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
               <span className="material-symbols-outlined text-primary scale-75">verified</span>
            </div>
         </div>
      );
   }

   if (!appointment) {
      return (
         <div className="flex flex-col h-screen items-center justify-center bg-background-light p-10 text-center space-y-6">
            <div className="size-20 rounded-[32px] bg-primary/5 flex items-center justify-center text-primary/20">
               <span className="material-symbols-outlined !text-4xl">event_busy</span>
            </div>
            <div className="space-y-2">
               <h2 className="text-2xl font-display text-primary italic">Reserva não encontrada.</h2>
               <p className="text-xs text-primary/40 uppercase tracking-widest font-black">Link expirado ou inexistente</p>
            </div>
            <button onClick={() => navigate('/history')} className="px-8 py-4 bg-primary text-accent-gold rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-huge">Voltar à Agenda</button>
         </div>
      );
   }

   const status = statusMap[appointment.status] || { label: appointment.status, color: 'text-gray-400 bg-gray-50', isLive: false };

   return (
      <div className="flex flex-col min-h-screen bg-background-light font-outfit antialiased selection:bg-accent-gold/20 selection:text-primary">
         {/* Immersive Background */}
         <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[70%] aspect-square organic-shape-1 bg-accent-gold/10 blur-[100px] animate-float"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[60%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
         </div>

         <header className="relative z-50 premium-blur sticky top-0 px-6 py-8 flex items-center justify-between border-b border-primary/5">
            <button
               onClick={() => navigate(-1)}
               className="size-12 rounded-2xl bg-white shadow-sm border border-primary/5 flex items-center justify-center text-primary group active:scale-95 transition-all"
            >
               <span className="material-symbols-outlined !text-xl group-hover:-translate-x-1 transition-transform">west</span>
            </button>
            <div className="text-center">
               <p className="text-[8px] font-black uppercase tracking-[0.5em] text-primary/30 leading-none mb-1">Certificado de Reserva</p>
               <h2 className="font-display italic text-xl text-primary">Detalhes VIP</h2>
            </div>
            <div className="size-12"></div>
         </header>

         <main className="relative z-10 flex-1 px-8 pt-10 pb-40 overflow-y-auto no-scrollbar">
            {/* Header Status Narrative */}
            <div className="bg-white p-10 rounded-[56px] border border-primary/5 shadow-huge flex flex-col items-center text-center space-y-8 animate-reveal relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-1 bg-gradient-to-l from-accent-gold/40 to-transparent"></div>

               <div className={`size-24 rounded-[36px] flex items-center justify-center relative transition-all duration-700 ${appointment.status === 'completed' || appointment.status === 'COMPLETED' ? 'bg-primary text-accent-gold shadow-2xl scale-110' : 'bg-primary/5 text-primary'}`}>
                  <span className="material-symbols-outlined !text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                     {appointment.status === 'completed' || appointment.status === 'COMPLETED' ? 'verified' : 'auto_awesome'}
                  </span>
                  {status.isLive && (
                     <span className="absolute -top-1 -right-1 size-4 bg-accent-gold rounded-full border-2 border-white animate-pulse"></span>
                  )}
               </div>

               <div className="space-y-3">
                  <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${status.color.split(' ')[0]}`}>
                     {status.label}
                  </p>
                  <h1 className="text-4xl font-display text-primary leading-tight italic tracking-tight">{appointment.service_name || appointment.services?.name}</h1>
                  <p className="text-xs text-primary/30 font-light max-w-[200px] mx-auto leading-relaxed">Sua beleza é nossa maior obra de arte. ✨</p>
               </div>
            </div>

            {/* Loyalty Experience Card */}
            {(appointment.status === 'completed' || appointment.status === 'COMPLETED') ? (
               <section className="mt-8 animate-reveal" style={{ animationDelay: '0.2s' }}>
                  <div className="bg-primary p-10 rounded-[48px] text-white flex flex-col items-center text-center shadow-huge relative overflow-hidden ring-1 ring-white/10">
                     <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                     <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 mb-4">Experiência de Fidelidade</p>
                     <div className="flex items-center gap-3 mb-2">
                        <span className="h-px w-6 bg-accent-gold/40"></span>
                        <h3 className="text-3xl font-display italic text-accent-gold">+{appointment.services?.points_reward || 50} JZ Balance</h3>
                        <span className="h-px w-6 bg-accent-gold/40"></span>
                     </div>
                     <p className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-none">Sincronizados com JZ Privé</p>
                     <span className="material-symbols-outlined !text-[120px] text-accent-gold/5 absolute -right-8 -bottom-8 rotate-12">diamond</span>
                  </div>
               </section>
            ) : (
               <div className="mt-8 bg-accent-gold/5 border border-accent-gold/10 p-8 rounded-[40px] flex items-center gap-6 animate-reveal" style={{ animationDelay: '0.2s' }}>
                  <div className="size-14 rounded-[24px] bg-primary flex items-center justify-center text-accent-gold shadow-xl">
                     <span className="material-symbols-outlined !text-2xl">stars</span>
                  </div>
                  <div className="flex-1">
                     <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Recompensa Exclusiva</p>
                     <p className="text-xs text-primary/60 leading-snug">Ao concluir esta experiência, você receberá <span className="text-primary font-bold">{appointment.services?.points_reward || 50} JZ Balance</span>.</p>
                  </div>
               </div>
            )}

            {/* Narrative Data Grid */}
            <div className="mt-12 space-y-8 animate-reveal" style={{ animationDelay: '0.4s' }}>
               <div className="flex items-center gap-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30">Agenda Detalhada</p>
                  <div className="flex-1 h-px bg-gradient-to-r from-primary/5 to-transparent"></div>
               </div>

               <div className="bg-white p-10 rounded-[56px] border border-primary/5 shadow-huge space-y-10 relative overflow-hidden">
                  <div className="flex items-center gap-6 group">
                     <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary/40 group-hover:bg-primary group-hover:text-accent-gold transition-all duration-500">
                        <span className="material-symbols-outlined">calendar_month</span>
                     </div>
                     <div className="flex-1 border-b border-primary/5 pb-4 group-hover:border-accent-gold/20 transition-all">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/20 mb-1">Data do Momento</p>
                        <p className="text-lg font-display text-primary">{new Date(appointment.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-6 group">
                     <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary/40 group-hover:bg-primary group-hover:text-accent-gold transition-all duration-500">
                        <span className="material-symbols-outlined">schedule_send</span>
                     </div>
                     <div className="flex-1 border-b border-primary/5 pb-4 group-hover:border-accent-gold/20 transition-all">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/20 mb-1">Horário Previsto</p>
                        <p className="text-lg font-display text-primary">{appointment.time} Horas</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-6 group">
                     <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary/40 group-hover:bg-primary group-hover:text-accent-gold transition-all duration-500">
                        <span className="material-symbols-outlined">person_pin</span>
                     </div>
                     <div className="flex-1 pb-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/20 mb-1">Lash Designer Senior</p>
                        <p className="text-lg font-display text-primary">{appointment.professional_name || appointment.professionals?.name}</p>
                     </div>
                  </div>
               </div>
            </div>

            {appointment.services?.description && (
               <div className="mt-12 p-8 glass-nav rounded-[40px] italic text-primary/40 text-xs text-center px-12 leading-relaxed animate-reveal" style={{ animationDelay: '0.6s' }}>
                  "{appointment.services.description}"
               </div>
            )}
         </main>

         {/* Immersive Action Bar */}
         <div className="fixed bottom-0 inset-x-0 p-8 z-[100]">
            <div className="premium-blur rounded-[36px] border border-primary/5 p-2 shadow-hugest flex gap-3 overflow-hidden">
               {(appointment.status === 'scheduled' || appointment.status === 'rescheduled') ? (
                  <>
                     <button
                        onClick={handleCancelClick}
                        className="flex-[1] h-18 bg-white/40 text-rose-400 rounded-[24px] font-black text-[10px] uppercase tracking-[0.25em] active:scale-95 transition-all hover:bg-rose-50"
                     >
                        Desistir
                     </button>
                     <button
                        onClick={() => navigate('/booking', { state: { professional: appointment.professionals, service: appointment.services, isRescheduling: true, oldApptId: appointment.id } })}
                        className="flex-[2] h-18 bg-primary text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.4em] shadow-huge flex items-center justify-center gap-3 active:scale-95 transition-all"
                     >
                        Reagendar ✧
                     </button>
                  </>
               ) : (
                  <button
                     onClick={() => navigate('/home')}
                     className="w-full h-18 bg-primary text-white rounded-[28px] font-black text-[11px] uppercase tracking-[0.4em] shadow-huge flex items-center justify-center gap-3 active:scale-95 transition-all"
                  >
                     Retornar ao Início
                     <span className="text-accent-gold">✧</span>
                  </button>
               )}
            </div>
         </div>

         {showCancelPopup && (
            <div className="fixed inset-0 z-[1000] p-6 flex items-center justify-center animate-reveal">
               <div className="absolute inset-0 bg-primary/95 backdrop-blur-xl" onClick={() => setShowCancelPopup(false)}></div>
               <div className="relative bg-background-light rounded-[56px] p-12 max-w-sm w-full space-y-10 text-center shadow-hugest border border-primary/5 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-1 bg-gradient-to-l from-rose-400/40 to-transparent"></div>

                  <div className="size-20 rounded-[32px] bg-rose-50 mx-auto flex items-center justify-center text-rose-500 scale-110 shadow-lg">
                     <span className="material-symbols-outlined !text-4xl">notification_important</span>
                  </div>

                  <div className="space-y-4">
                     <h3 className="text-3xl font-display text-primary italic leading-tight">Um breve aviso, <br /> <span className="not-italic text-rose-400 font-light font-outfit">maravilhosa.</span></h3>
                     <p className="text-xs text-primary/60 leading-relaxed font-light px-2">
                        Reservas canceladas com menos de <span className="font-bold text-primary">24 horas</span> exigem contato direto com a nossa concierge para melhor gestão da agenda.
                     </p>
                  </div>

                  <div className="space-y-4">
                     <a
                        href={`https://wa.me/55${(appointment.professionals?.phone || '14999999999').replace(/\D/g, '')}?text=Olá! Gostaria de falar sobre meu agendamento VIP de ${appointment.service_name || appointment.services?.name} no dia ${new Date(appointment.date).toLocaleDateString('pt-BR')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-18 bg-[#25D366] text-white rounded-[24px] flex items-center justify-center gap-4 font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-green-500/20 active:scale-95 transition-all"
                     >
                        <span className="material-symbols-outlined">spa</span>
                        Falar no Concierge
                     </a>
                     <button
                        onClick={() => setShowCancelPopup(false)}
                        className="w-full py-4 text-[9px] font-black text-primary/30 uppercase tracking-[0.4em] active:scale-95 transition-all"
                     >
                        Entendi, fechar aviso
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default AppointmentDetails;
