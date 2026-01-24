
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Service, Professional } from '../types';

const ServiceDetails: React.FC = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const { service, professional } = location.state as { service: Service; professional: Professional | null } || {};

   if (!service) {
      return (
         <div className="min-h-screen bg-background-light flex items-center justify-center p-6 text-center">
            <div className="space-y-4">
               <p className="text-primary font-bold">Serviço não encontrado.</p>
               <button onClick={() => navigate('/services')} className="text-accent-gold underline uppercase text-xs font-black tracking-widest">
                  Voltar ao Catálogo
               </button>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-background-light font-outfit text-primary animate-reveal relative pb-40 overflow-x-hidden">
         {/* Dynamic Background Engine */}
         <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/40 blur-[100px] animate-float"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/20 blur-[80px] animate-float" style={{ animationDelay: '1.5s' }}></div>
         </div>

         {/* Hero Section */}
         <div className="relative h-[55vh] w-full overflow-hidden">
            <img
               src={service.imageUrl}
               alt={service.name}
               className="w-full h-full object-cover animate-reveal scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background-light via-transparent to-black/20"></div>

            {/* Navigation Header */}
            <header className="absolute top-0 left-0 right-0 p-8 pt-12 flex justify-between items-center z-[50]">
               <button
                  onClick={() => navigate(-1)}
                  className="size-11 rounded-full premium-blur border border-white/40 flex items-center justify-center text-white shadow-xl active:scale-90 transition-all"
               >
                  <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
               </button>
               <div className="premium-blur px-5 py-2 rounded-2xl border border-white/40 shadow-xl">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">{service.category || 'Procedimento Elite'}</span>
               </div>
            </header>

            {/* Aesthetic Detail Badge */}
            <div className="absolute bottom-20 left-8 z-20">
               <div className="flex items-center gap-3">
                  <div className="size-1 h-12 bg-accent-gold rounded-full"></div>
                  <div className="space-y-1">
                     <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.4em] leading-none">Protocolo Studio</p>
                     <p className="text-xl font-display italic text-white leading-none">Estética de Resultados</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Content Body - Elevated Card */}
         <main className="-mt-16 relative z-10 bg-background-light/80 backdrop-blur-xl rounded-t-[56px] px-8 pt-14 space-y-12 min-h-[50vh] border-t border-white shadow-hugest selection:bg-accent-gold/20">
            <div className="space-y-2 text-center max-w-lg mx-auto">
               <h1 className="text-4xl font-display font-bold text-primary italic leading-tight animate-reveal">
                  {service.name}
               </h1>
               {professional && (
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-gold flex items-center justify-center gap-3 mt-4">
                     <span className="h-px w-6 bg-accent-gold/30"></span>
                     <span className="material-symbols-outlined !text-sm">verified</span>
                     Com {professional.name}
                     <span className="h-px w-6 bg-accent-gold/30"></span>
                  </p>
               )}
            </div>

            {/* Primary Stats Panel */}
            <div className="grid grid-cols-2 gap-8 py-8 px-6 bg-white/40 rounded-[40px] border border-white shadow-sm max-w-md mx-auto">
               <div className="text-center space-y-2">
                  <div className="size-14 mx-auto bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-2 shadow-inner">
                     <span className="material-symbols-outlined !text-2xl">payments</span>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-primary/30 font-black">Investimento</p>
                  <p className="text-2xl font-display font-bold text-primary">R$ {service.price}</p>
               </div>
               <div className="text-center space-y-2 relative">
                  <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-px h-16 bg-primary/10"></div>
                  <div className="size-14 mx-auto bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-2 shadow-inner">
                     <span className="material-symbols-outlined !text-2xl">schedule</span>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-primary/30 font-black">Duração</p>
                  <p className="text-2xl font-display font-bold text-primary">{service.duration} min</p>
               </div>
            </div>

            {/* Narrative Description */}
            <div className="space-y-6 max-w-2xl mx-auto">
               <div className="flex items-center gap-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/30 whitespace-nowrap">Sobre o Ritual</h3>
                  <div className="h-px w-full bg-gradient-to-r from-primary/10 to-transparent"></div>
               </div>
               <p className="text-base text-primary/60 leading-relaxed font-outfit font-light text-justify px-2 italic">
                  {service.description}
               </p>

               {/* Feature Highlight Grid */}
               <div className="grid grid-cols-1 gap-4 pt-4">
                  {(service.features && service.features.length > 0) ? (
                     service.features.map((feat, idx) => (
                        <div key={idx} className="flex gap-6 items-center p-6 bg-white/40 border border-white rounded-[32px] shadow-sm hover:border-accent-gold/20 transition-all group">
                           <div className="size-14 rounded-2xl bg-accent-gold/5 flex items-center justify-center text-accent-gold shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                              <span className="material-symbols-outlined !text-2xl">{feat.icon || 'stars'}</span>
                           </div>
                           <div className="space-y-1">
                              <h4 className="font-outfit font-black text-primary text-[10px] uppercase tracking-[0.2em]">{feat.title}</h4>
                              <p className="text-[12px] text-primary/40 font-light leading-relaxed">
                                 {feat.description}
                              </p>
                           </div>
                        </div>
                     ))
                  ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-4 p-8 bg-white/40 border border-white rounded-[40px] shadow-sm relative overflow-hidden group">
                           <div className="size-14 rounded-2xl bg-accent-gold/5 flex items-center justify-center text-accent-gold group-hover:scale-110 transition-all">
                              <span className="material-symbols-outlined !text-2xl">spa</span>
                           </div>
                           <div className="space-y-2">
                              <h4 className="font-outfit font-black text-primary text-[10px] uppercase tracking-[0.2em]">Cuidado Premium</h4>
                              <p className="text-[12px] text-primary/40 font-light leading-relaxed italic">
                                 {service.carePremium || "Produtos de alta performance sincronizados com sua biologia."}
                              </p>
                           </div>
                        </div>
                        <div className="flex flex-col gap-4 p-8 bg-white/40 border border-white rounded-[40px] shadow-sm relative overflow-hidden group">
                           <div className="size-14 rounded-2xl bg-accent-gold/5 flex items-center justify-center text-accent-gold group-hover:scale-110 transition-all">
                              <span className="material-symbols-outlined !text-2xl">verified_user</span>
                           </div>
                           <div className="space-y-2">
                              <h4 className="font-outfit font-black text-primary text-[10px] uppercase tracking-[0.2em]">Exclusividade</h4>
                              <p className="text-[12px] text-primary/40 font-light leading-relaxed italic">
                                 {service.biosafety || "Protocolos sanitários de elite e atendimento privativo."}
                              </p>
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </main>

         {/* Elite Navigation Bar - Matches Home */}
         <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[450px] z-[100]">
            <div className="premium-blur-light rounded-[32px] border border-white shadow-hugest px-8 py-5 flex items-center justify-between gap-10">
               <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/30 leading-none mb-1">Total</p>
                  <p className="text-2xl font-display font-bold text-primary leading-none">R$ {service.price}</p>
               </div>
               <button
                  onClick={() => navigate('/booking', { state: { service, professional } })}
                  className="group relative h-16 px-10 bg-primary text-white rounded-[24px] overflow-hidden shadow-2xl active:scale-95 transition-all"
               >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s]"></div>
                  <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.4em] text-accent-gold group-hover:text-white transition-colors flex items-center gap-3">
                     Agendar
                     <span className="material-symbols-outlined !text-lg">event_note</span>
                  </span>
               </button>
            </div>
         </div>

         {/* Visual Safe Area Inset */}
         <div className="fixed bottom-0 left-0 w-full h-8 bg-background-light pointer-events-none z-[90]"></div>
      </div>
   );
};

export default ServiceDetails;
