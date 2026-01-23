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
         const { data, error } = await supabase
            .from('studio_config')
            .select('value')
            .eq('key', 'studio_address')
            .single();

         if (data) {
            setStudioAddress(data.value);
         }
      };
      fetchAddress();
   }, []);

   // Format Helper
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

      // Create Start and End Dates properly
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
      <div className="flex flex-col h-full bg-white relative overflow-hidden">
         {/* Header */}
         <header className="px-6 py-6 flex items-center justify-between">
            <button onClick={() => navigate('/home')} className="p-2 -ml-2 text-primary hover:bg-gray-50 rounded-full transition-colors">
               <span className="material-symbols-outlined !text-2xl">close</span>
            </button>
            <span className="text-sm font-bold text-primary">Confirmação</span>
            <div className="w-10"></div>
         </header>

         <main className="flex-1 flex flex-col items-center px-8 pt-4 pb-12 overflow-y-auto no-scrollbar">
            {/* Animated Check */}
            <div className="mb-8 relative">
               <div className="size-24 rounded-full bg-accent-gold/10 flex items-center justify-center animate-pulse-slow">
                  <div className="size-16 rounded-full bg-accent-gold text-white flex items-center justify-center shadow-lg shadow-accent-gold/30">
                     <span className="material-symbols-outlined !text-4xl animate-bounce-slow">check</span>
                  </div>
               </div>
            </div>

            <div className="text-center space-y-3 mb-10">
               <h1 className="font-display text-3xl font-bold text-primary leading-tight">Agendamento <br />Confirmado</h1>
               <p className="text-sm text-gray-400 font-medium italic">Estamos ansiosas para ver você.</p>
            </div>

            {/* Details Card */}
            <div className="w-full bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-100/50 p-0 overflow-hidden mb-8">
               <div className="p-8 space-y-4">
                  <span className="inline-block px-3 py-1 bg-accent-gold/10 text-accent-gold text-[9px] font-black uppercase tracking-widest rounded-lg mb-2">
                     Serviço Premium
                  </span>

                  <h2 className="font-display text-2xl font-bold text-primary leading-tight">
                     {selection?.service?.name || 'Serviço Selecionado'}
                  </h2>

                  <div className="pt-6 space-y-5">
                     {/* Data */}
                     <div className="flex items-start gap-4">
                        <div className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-primary shrink-0">
                           <span className="material-symbols-outlined !text-lg">calendar_today</span>
                        </div>
                        <div>
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Data</p>
                           <p className="text-sm font-bold text-primary capitalize">
                              {selection?.date ? formatDate(selection.date) : '...'}
                           </p>
                        </div>
                     </div>

                     {/* Horário */}
                     <div className="flex items-start gap-4">
                        <div className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-primary shrink-0">
                           <span className="material-symbols-outlined !text-lg">schedule</span>
                        </div>
                        <div>
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Horário</p>
                           <p className="text-sm font-bold text-primary">
                              {selection?.time} ({selection?.service?.duration || 60} min)
                           </p>
                        </div>
                     </div>

                     {/* Profissional */}
                     <div className="flex items-start gap-4">
                        <div className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-primary shrink-0">
                           <span className="material-symbols-outlined !text-lg">person</span>
                        </div>
                        <div>
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Profissional</p>
                           <p className="text-sm font-bold text-primary">
                              {selection?.professional?.name || 'Especialista JZ'}
                           </p>
                        </div>
                     </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-dashed border-gray-100 flex justify-between items-end">
                     <span className="text-xs text-gray-400">Valor estimado</span>
                     <span className="text-xl font-bold text-primary">
                        R$ {selection?.service?.price || '0,00'}
                     </span>
                  </div>
               </div>
            </div>

            {/* Address Highlight Card - ULTRA PROMINENT */}
            <div className="w-full bg-[#0f3e29] border border-accent-gold/20 rounded-[40px] p-8 mb-10 text-center space-y-5 shadow-2xl shadow-[#0f3e29]/20 relative overflow-hidden">
               {/* Decorative Background */}
               <div className="absolute -top-10 -right-10 size-32 bg-accent-gold/5 rounded-full blur-2xl"></div>

               <div className="flex flex-col items-center relative z-10">
                  <div className="size-12 rounded-2xl bg-accent-gold/10 text-accent-gold flex items-center justify-center mb-4 border border-accent-gold/30">
                     <span className="material-symbols-outlined !text-2xl">location_on</span>
                  </div>
                  <h3 className="text-[10px] font-black text-accent-gold uppercase tracking-[0.3em] mb-2">Local do seu Atendimento</h3>
                  <p className="text-xl font-display font-medium text-white leading-tight">
                     {studioAddress || 'Carregando endereço...'}
                  </p>
               </div>

               {studioAddress && (
                  <button
                     onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(studioAddress)}`, '_blank')}
                     className="inline-flex items-center gap-3 text-[11px] font-black text-[#0f3e29] uppercase tracking-widest bg-accent-gold py-4 px-8 rounded-2xl shadow-lg active:scale-95 transition-all w-full justify-center"
                  >
                     <span className="material-symbols-outlined !text-lg">directions</span>
                     Ver no Google Maps (GPS)
                  </button>
               )}
            </div>

            {/* Actions */}
            <div className="w-full space-y-4">
               <button
                  onClick={addToCalendar}
                  className="w-full h-14 bg-primary text-white rounded-[20px] font-bold text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
               >
                  <span className="material-symbols-outlined !text-lg">calendar_add_on</span>
                  Adicionar ao calendário
               </button>

               <button
                  onClick={() => navigate('/history')}
                  className="w-full h-14 bg-transparent text-gray-400 hover:text-primary rounded-[20px] font-bold text-[10px] uppercase tracking-widest transition-colors"
               >
                  Ver meus agendamentos
               </button>
            </div>
         </main>
      </div>
   );
};

export default BookingConfirmed;
