
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const ServiceDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="flex flex-col h-full bg-background-light">
      <div className="relative h-96 shrink-0">
         <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCiUm0OZLOAP3cwAd_kNhaySJIszM9lcCyidOrD36A0RJ6cgwHJtfgn-lnpXqaAtE8iKs_YU3tXlcSsuZ0boGn5bLhQ__y8m82EMKH2DKzjgEEHyZ1pmUPWmW5KqZdNlIbHCMNfZlZgTLPjH7QSoYmAh-qkuUgWkfB1bLAL9lAqTIGQXxHt2HZaaS8wd9pc6vbCGoTliddw2HMZP_26xr-73B0_wHcoCtg2hiy8ZRQqd_0azA75gvWqpOx-6c3PBhvPgsS5zz4Ckuc" className="w-full h-full object-cover" alt="service" />
         <div className="absolute inset-0 bg-gradient-to-t from-background-light via-transparent to-transparent"></div>
         <button onClick={() => navigate(-1)} className="absolute top-10 left-6 size-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-primary shadow-sm border border-white">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
         </button>
      </div>

      <main className="flex-1 -mt-16 relative z-10 px-8 space-y-10 bg-background-light rounded-t-[48px] pt-12 overflow-y-auto no-scrollbar pb-32">
         <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">Um toque de cuidado ✨</span>
                <h1 className="text-4xl font-display font-bold text-primary leading-tight">Lash Lifting <br/>Premium</h1>
              </div>
              <div className="bg-primary/5 p-4 rounded-2xl">
                 <span className="material-symbols-outlined text-primary !text-3xl">spa</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
               <span className="flex items-center gap-2"><span className="material-symbols-outlined !text-base text-accent-gold">schedule</span> 1h 30min</span>
               <span className="flex items-center gap-2"><span className="material-symbols-outlined !text-base text-accent-gold">payments</span> R$ 180,00</span>
            </div>
         </div>

         <div className="space-y-5">
            <h3 className="font-display font-bold text-xl text-primary">Sobre o procedimento</h3>
            <p className="text-gray-500 text-sm leading-relaxed font-medium italic">
               "Técnicas seguras, resultado elegante e duradouro. Pensado em cada detalhe para realçar seu brilho natural."
            </p>
            <p className="text-gray-500 text-sm leading-relaxed">
               A técnica Clássica é ideal para quem busca naturalidade e elegância. Aplicamos um fio sintético sobre cada fio natural, proporcionando alongamento e curvatura sem sobrecarregar o olhar.
            </p>
         </div>

         <section className="space-y-6">
            <h3 className="font-display font-bold text-xl text-primary">Sua Experiência inclui</h3>
            <div className="grid grid-cols-1 gap-4">
               {['Higienização Profunda', 'Mapeamento Personalizado', 'Aplicação Fio a Fio', 'Nano-mist para secagem rápida'].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-50 shadow-sm">
                     <span className="material-symbols-outlined text-accent-gold !text-xl">check_circle</span>
                     <span className="text-sm font-bold text-primary/80">{item}</span>
                  </div>
               ))}
            </div>
         </section>
      </main>

      <div className="fixed bottom-0 inset-x-0 p-8 glass-nav border-t border-gray-100 flex items-center justify-between gap-8 rounded-t-[40px] shadow-[0_-15px_40px_rgba(0,0,0,0.05)]">
         <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Seu Investimento</p>
            <p className="text-2xl font-black text-primary tracking-tight">R$ 180,00</p>
         </div>
         <button onClick={() => navigate('/booking')} className="flex-1 h-16 bg-primary text-white rounded-[20px] font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-primary/30 active:scale-95 transition-transform">
            AGENDAR AGORA ✨
         </button>
      </div>
    </div>
  );
};

export default ServiceDetails;
