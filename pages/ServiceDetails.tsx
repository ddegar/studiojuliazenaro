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
      <div className="min-h-screen bg-background-light font-sans text-primary animate-fade-in relative pb-32">
         {/* Hero Section */}
         <div className="relative h-[50vh] w-full">
            <img
               src={service.imageUrl}
               alt={service.name}
               className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background-light"></div>

            {/* Navigation Header */}
            <div className="absolute top-0 left-0 right-0 p-6 pt-10 flex justify-between items-center z-10">
               <button
                  onClick={() => navigate(-1)}
                  className="size-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all active:scale-95"
               >
                  <span className="material-symbols-outlined">arrow_back</span>
               </button>
               <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">{service.category}</span>
               </div>
            </div>
         </div>

         {/* Content Body - Overlapping the image */}
         <div className="-mt-12 relative z-10 bg-background-light rounded-t-[40px] px-8 pt-10 space-y-8 min-h-[50vh] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t border-white/50">
            <div className="space-y-2 text-center">
               <h1 className="text-3xl font-display font-bold text-primary leading-tight text-shadow-sm">
                  {service.name}
               </h1>
               {professional && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-accent-gold flex items-center justify-center gap-2">
                     <span className="material-symbols-outlined !text-sm">verified</span>
                     Com {professional.name}
                  </p>
               )}
            </div>

            <div className="flex justify-center gap-8 py-6 border-y border-primary/5">
               <div className="text-center space-y-1">
                  <div className="size-12 mx-auto bg-primary/5 rounded-full flex items-center justify-center text-primary mb-2">
                     <span className="material-symbols-outlined">payments</span>
                  </div>
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Investimento</p>
                  <p className="text-xl font-display font-bold text-primary">R$ {service.price}</p>
               </div>
               <div className="w-px bg-primary/10"></div>
               <div className="text-center space-y-1">
                  <div className="size-12 mx-auto bg-primary/5 rounded-full flex items-center justify-center text-primary mb-2">
                     <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Duração</p>
                  <p className="text-xl font-display font-bold text-primary">{service.duration} min</p>
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-lg font-display font-bold text-primary flex items-center gap-2">
                  <span className="h-px w-8 bg-accent-gold/50"></span>
                  Sobre a Experiência
               </h3>
               <p className="text-sm text-gray-500 leading-relaxed font-light text-justify">
                  {service.description}
               </p>
               {/* Placeholder for future specific details (benefits, steps) */}
               <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  {(service.features && service.features.length > 0) ? (
                     service.features.map((feat, idx) => (
                        <div key={idx} className="flex gap-4 items-start">
                           <span className="material-symbols-outlined text-accent-gold shrink-0 bg-accent-gold/5 p-1.5 rounded-xl">{feat.icon || 'stars'}</span>
                           <div>
                              <h4 className="font-bold text-primary text-xs uppercase tracking-wide mb-1">{feat.title}</h4>
                              <p className="text-[10px] text-gray-400 leading-relaxed">
                                 {feat.description}
                              </p>
                           </div>
                        </div>
                     ))
                  ) : (
                     <>
                        <div className="flex gap-4 items-start">
                           <span className="material-symbols-outlined text-accent-gold shrink-0">spa</span>
                           <div>
                              <h4 className="font-bold text-primary text-xs uppercase tracking-wide mb-1">Cuidado Premium</h4>
                              <p className="text-[10px] text-gray-400 leading-relaxed">
                                 {service.carePremium || "Utilizamos apenas produtos de alta performance para garantir resultados duradouros e a saúde da sua beleza."}
                              </p>
                           </div>
                        </div>
                        <div className="flex gap-4 items-start">
                           <span className="material-symbols-outlined text-accent-gold shrink-0">verified_user</span>
                           <div>
                              <h4 className="font-bold text-primary text-xs uppercase tracking-wide mb-1">Biossegurança</h4>
                              <p className="text-[10px] text-gray-400 leading-relaxed">
                                 {service.biosafety || "Todo material é esterilizado e descartável, seguindo rigorosos protocolos sanitários."}
                              </p>
                           </div>
                        </div>
                     </>
                  )}
               </div>
            </div>
         </div>

         {/* Bottom Floating Action Button */}
         <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50">
            <div className="max-w-md mx-auto flex items-center justify-between gap-6">
               <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total</p>
                  <p className="text-2xl font-display font-bold text-primary">R$ {service.price}</p>
               </div>
               <button
                  onClick={() => navigate('/booking', { state: { service, professional } })}
                  className="bg-[#D4AF37] text-[#0A2118] py-4 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#D4AF37]/20 active:scale-95 transition-all hover:brightness-110"
               >
                  Agendar
               </button>
            </div>
         </div>
      </div>
   );
};

export default ServiceDetails;
