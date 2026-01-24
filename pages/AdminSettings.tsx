
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminBottomNav from '../components/AdminBottomNav';

const AdminSettings: React.FC = () => {
   const navigate = useNavigate();

   const settingsItems = [
      { icon: 'store', label: 'Dados do Estúdio', desc: 'Identidade e Presença Digital', path: '/admin/studio-details' },
      { icon: 'schedule', label: 'Jornada de Trabalho', desc: 'Protocolos de Disponibilidade', path: '/admin/working-hours' },
      { icon: 'category', label: 'Protocolos de Serviço', desc: 'Curadoria de Procedimentos & Pontos', path: '/admin/services' },
      { icon: 'groups', label: 'Elite Academy', desc: 'Gestão de Especialistas JZ', path: '/admin/professionals' },
      { icon: 'help', label: 'Suporte & FAQ', desc: 'Central de Inteligência da Cliente', path: '/admin/faq' },
      { icon: 'lightbulb', label: 'Rituais de Cuidado', desc: 'Orientações Pré & Pós Elite', path: '/admin/tips' },
      { icon: 'reviews', label: 'Gestão de Depoimentos', desc: 'Curadoria de Prova Social', path: '/admin/testimonials' },
      { icon: 'gavel', label: 'Políticas de Elite', desc: 'Padrões de Cancelamento & Ética' },
      { icon: 'notifications_active', label: 'Central de Canais', desc: 'Configuração de Alertas de Elite' },
   ];

   return (
      <div className="flex flex-col h-full bg-background-dark text-white overflow-hidden selection:bg-accent-gold/20 relative">
         {/* Dynamic Background Engine */}
         <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/30 blur-[100px] animate-float"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-10 mix-blend-overlay"></div>
         </div>

         <header className="sticky top-0 z-[100] premium-nav-dark px-8 py-6 flex items-center justify-between border-b border-white/5 bg-background-dark/95 backdrop-blur-xl">
            <div className="flex items-center gap-6">
               <button onClick={() => navigate('/admin')} className="size-11 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-accent-gold hover:bg-white/10 active:scale-90 transition-all shadow-huge">
                  <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
               </button>
               <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mb-1">Elite Control Hub</p>
                  <h1 className="text-xl font-display italic text-white tracking-tight">Ajustes Estratégicos</h1>
               </div>
            </div>
            <div className="size-10"></div>
         </header>

         <main className="relative z-10 flex-1 p-8 space-y-12 overflow-y-auto no-scrollbar pb-32 animate-reveal">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {settingsItems.map((item, i) => (
                  <button
                     key={i}
                     onClick={() => item.path && navigate(item.path)}
                     className="group relative w-full bg-surface-dark/40 border border-white/5 p-7 rounded-[40px] flex items-center justify-between transition-all duration-700 hover:border-accent-gold/20 hover:bg-surface-dark active:scale-[0.98] animate-reveal shadow-huge overflow-hidden"
                     style={{ animationDelay: `${i * 0.05}s` }}
                  >
                     <div className="absolute inset-0 bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <div className="flex items-center gap-6 relative z-10">
                        <div className="size-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-accent-gold group-hover:bg-accent-gold/20 group-hover:scale-110 transition-all duration-500 shadow-inner">
                           <span className="material-symbols-outlined !text-2xl">{item.icon}</span>
                        </div>
                        <div className="text-left space-y-1.5 min-w-0">
                           <h4 className="font-outfit font-bold text-sm text-white group-hover:text-accent-gold transition-colors duration-500 truncate pr-2">{item.label}</h4>
                           <p className="text-[9px] text-white/20 uppercase tracking-[0.15em] font-black leading-tight line-clamp-1">{item.desc}</p>
                        </div>
                     </div>
                     <span className="material-symbols-outlined text-white/5 group-hover:text-accent-gold group-hover:translate-x-2 transition-all duration-500 relative z-10">east</span>
                  </button>
               ))}
            </div>

            <div className="pt-10 space-y-8">
               <div className="flex items-center justify-center gap-3 opacity-20">
                  <div className="h-px w-6 bg-white"></div>
                  <p className="text-[9px] font-black uppercase tracking-[0.5em]">System Core Architecture</p>
                  <div className="h-px w-6 bg-white"></div>
               </div>

               <div className="bg-surface-dark/60 backdrop-blur-xl p-12 rounded-[56px] border border-white/5 flex flex-col items-center gap-8 shadow-hugest relative overflow-hidden group max-w-2xl mx-auto">
                  <div className="absolute inset-0 bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                  <div className="relative size-24">
                     <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
                     <div className="relative size-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-huge ring-8 ring-primary/5">
                        <span className="material-symbols-outlined !text-[44px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                     </div>
                  </div>

                  <div className="text-center space-y-3 relative z-10">
                     <h3 className="text-2xl font-display italic text-white tracking-tight">Julia Zenaro • Elite Ecosystem</h3>
                     <div className="flex items-center justify-center gap-3">
                        <span className="size-1.5 rounded-full bg-accent-gold animate-pulse"></span>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Stable Build • Version 2.5 Elite</p>
                     </div>
                  </div>

                  <div className="pt-2 relative z-10">
                     <div className="px-6 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur flex items-center gap-3">
                        <span className="size-1 rounded-full bg-emerald-500"></span>
                        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/40">Secure Neural Link Established</span>
                     </div>
                  </div>
               </div>
            </div>
         </main>

         <AdminBottomNav />
      </div>
   );
};

export default AdminSettings;
