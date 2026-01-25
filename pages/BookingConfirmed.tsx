import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';

const BookingConfirmed: React.FC = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const { selection } = location.state || {}; // { professional, service, date, time }

   const [studioAddress, setStudioAddress] = useState('');

   useEffect(() => {
      const fetchAddress = async () => {
         const { data } = await supabase
            .from('studio_config')
            .select('value')
            .eq('key', 'studio_address')
            .maybeSingle();

         if (data) {
            setStudioAddress(data.value);
         }
      };
      fetchAddress();
   }, []);

   const formatDate = (dateStr: string) => {
      if (!dateStr) return 'Data não informada';
      const [year, month, day] = dateStr.split('-');
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
   };

   const addToCalendar = () => {
      if (!selection) return;

      const [year, month, day] = selection.date.split('-');
      const [hour, minute] = selection.time.split(':');

      const startTime = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
      const duration = selection.service?.duration || 60;
      const endTime = new Date(startTime.getTime() + duration * 60000);

      const formatGoogleDate = (date: Date) => {
         return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
      };

      const start = formatGoogleDate(startTime);
      const end = formatGoogleDate(endTime);

      const title = `Procedimento: ${selection.service?.name} - Studio Julia Zenaro`;
      const details = `Profissional: ${selection.professional?.name}. Endereço: ${studioAddress}`;
      const locationText = studioAddress || 'Studio Julia Zenaro';

      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(locationText)}&sf=true&output=xml`;

      window.open(url, '_blank');
   };

   return (
      <div className="flex flex-col min-h-screen bg-background-light font-outfit relative overflow-hidden selection:bg-accent-gold/20 selection:text-primary">
         {/* Background Narrative */}
         <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/10 blur-[100px] animate-float"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/20 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
         </div>

         <header className="relative z-50 px-6 py-8 flex items-center justify-between sticky top-0 premium-blur">
            <button
               onClick={() => navigate('/home')}
               className="size-12 rounded-2xl bg-white shadow-sm border border-primary/5 flex items-center justify-center text-primary group active:scale-95 transition-all"
            >
               <span className="material-symbols-outlined !text-xl group-hover:scale-110 transition-transform">close</span>
            </button>
            <div className="text-center">
               <p className="text-[8px] font-black uppercase tracking-[0.5em] text-primary/30 leading-none mb-1">Confirmação</p>
               <h2 className="font-display italic text-xl text-primary">Concluído</h2>
            </div>
            <div className="size-12"></div>
         </header>

         <main className="relative z-10 flex-1 flex flex-col items-center px-8 pt-10 pb-20 overflow-y-auto no-scrollbar">
            {/* Immersive Success Indicator */}
            <div className="mb-14 relative group">
               <div className="absolute inset-0 organic-shape-1 bg-accent-gold/10 animate-ping opacity-30"></div>
               <div className="size-28 rounded-full bg-background-light border-2 border-accent-gold/20 flex items-center justify-center shadow-huge relative z-10">
                  <div className="size-20 rounded-full bg-primary text-accent-gold flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform duration-700">
                     <span className="material-symbols-outlined !text-5xl animate-reveal" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
               </div>
            </div>

            <div className="text-center space-y-4 mb-14 animate-reveal">
               <h1 className="font-display text-4xl text-primary leading-tight tracking-tight italic">
                  Tudo pronto <br /> <span className="text-accent-gold not-italic font-outfit font-light">para o seu brilho.</span>
               </h1>
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/30 max-w-[280px] mx-auto leading-relaxed">
                  Agendamento confirmado. Mal podemos esperar para recebê-la.
               </p>
            </div>

            {/* Appointment Detail Ticket */}
            <div className="w-full relative animate-reveal stagger-1 mb-14">
               <div className="absolute -top-4 -left-4 size-16 organic-shape-1 bg-accent-gold/5 blur-xl"></div>
               <div className="relative w-full bg-white rounded-[56px] p-10 border border-primary/5 shadow-huge overflow-hidden">
                  <div className="flex justify-between items-center mb-10 pb-8 border-b border-dashed border-primary/5">
                     <div className="text-left">
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/20 leading-none mb-2">Procedimento VIP</p>
                        <h2 className="font-display text-2xl font-medium text-primary leading-tight">
                           {selection?.service?.name || 'Sua Experiência'}
                        </h2>
                     </div>
                     <div className="size-14 rounded-3xl bg-primary/5 flex items-center justify-center text-accent-gold border border-primary/5">
                        <span className="material-symbols-outlined !text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
                     </div>
                  </div>

                  <div className="space-y-8">
                     <div className="flex items-center gap-6">
                        <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary/40">
                           <span className="material-symbols-outlined !text-xl">calendar_today</span>
                        </div>
                        <div className="flex-1">
                           <p className="text-[8px] font-black text-primary/30 uppercase tracking-[0.2em] mb-1">Data de Atendimento</p>
                           <p className="text-base font-outfit font-bold text-primary capitalize">
                              {selection?.date ? formatDate(selection.date) : '...'}
                           </p>
                        </div>
                     </div>

                     <div className="flex items-center gap-6">
                        <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary/40">
                           <span className="material-symbols-outlined !text-xl">schedule</span>
                        </div>
                        <div className="flex-1">
                           <p className="text-[8px] font-black text-primary/30 uppercase tracking-[0.2em] mb-1">Momento e Duração</p>
                           <p className="text-base font-outfit font-bold text-primary">
                              {selection?.time} <span className="text-accent-gold opacity-40 ml-1">•</span> {selection?.service?.duration || 60} minutos
                           </p>
                        </div>
                     </div>

                     <div className="flex items-center gap-6">
                        <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary/40">
                           <span className="material-symbols-outlined !text-xl">person</span>
                        </div>
                        <div className="flex-1">
                           <p className="text-[8px] font-black text-primary/30 uppercase tracking-[0.2em] mb-1">Sua Especialista</p>
                           <p className="text-base font-outfit font-bold text-primary">
                              {selection?.professional?.name || 'Equipe Studio Julia Zenaro'}
                           </p>
                        </div>
                     </div>
                  </div>

                  <div className="mt-10 pt-8 border-t border-dashed border-primary/10 flex justify-between items-end">
                     <div>
                        <p className="text-[8px] font-black text-primary/20 uppercase tracking-[0.3em] mb-1">Total Investido</p>
                        <div className="flex items-baseline gap-2">
                           <span className="text-[10px] font-outfit font-black text-primary/20 uppercase">R$</span>
                           <span className="text-4xl font-outfit font-light text-primary tracking-tighter leading-none">
                              {selection?.service?.price || '0,00'}
                           </span>
                        </div>
                     </div>
                     <div className="size-10 rounded-full border border-primary/5 flex items-center justify-center opacity-40">
                        <span className="material-symbols-outlined !text-lg">info</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Premium Address Card */}
            <div className="w-full bg-primary border border-accent-gold/20 rounded-[48px] p-10 mb-14 text-center space-y-6 shadow-huge relative overflow-hidden animate-reveal stagger-2">
               <div className="absolute top-0 right-0 w-32 h-1 bg-gradient-to-l from-accent-gold/40 to-transparent"></div>
               <div className="size-14 rounded-3xl bg-accent-gold/10 text-accent-gold flex items-center justify-center mx-auto mb-2 border border-accent-gold/20">
                  <span className="material-symbols-outlined !text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
               </div>
               <div className="space-y-4">
                  <p className="text-[9px] font-black text-accent-gold/60 uppercase tracking-[0.4em]">Local de encontro</p>
                  <p className="text-2xl font-display font-medium text-white leading-tight italic">
                     {studioAddress || 'Carregando endereço...'}
                  </p>
               </div>

               {studioAddress && (
                  <button
                     onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(studioAddress)}`, '_blank')}
                     className="group relative h-16 w-full bg-accent-gold rounded-3xl overflow-hidden shadow-xl active:scale-95 transition-all mt-4"
                  >
                     <div className="relative z-10 flex items-center justify-center gap-3 text-[11px] font-black text-primary uppercase tracking-[0.2em]">
                        <span className="material-symbols-outlined !text-xl">directions</span>
                        Abrir no GPS
                     </div>
                     <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                  </button>
               )}
            </div>

            {/* Action Buttons Area */}
            <div className="w-full space-y-6 animate-reveal" style={{ animationDelay: '0.8s' }}>
               <button
                  onClick={addToCalendar}
                  className="group relative w-full h-18 bg-white text-primary rounded-[28px] border border-primary/5 shadow-huge flex items-center justify-center gap-4 hover:bg-primary hover:text-white transition-all active:scale-95"
               >
                  <span className="material-symbols-outlined !text-xl text-accent-gold">calendar_add_on</span>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">Agendar no Google</span>
               </button>

               <button
                  onClick={() => navigate('/history')}
                  className="w-full py-4 text-[9px] font-black text-primary/30 uppercase tracking-[0.4em] hover:text-primary transition-colors text-center"
               >
                  Ver Meus Compromissos 💖
               </button>
            </div>
         </main>
      </div>
   );
};

export default BookingConfirmed;
