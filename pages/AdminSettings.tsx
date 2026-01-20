
import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminSettings: React.FC = () => {
   const navigate = useNavigate();

   const settingsItems = [
      { icon: 'store', label: 'Dados do Estúdio', desc: 'Nome, logo, contato e endereço', path: '/admin/studio-details' },
      { icon: 'schedule', label: 'Horários de Funcionamento', desc: 'Dias e horários de abertura', path: '/admin/working-hours' },
      { icon: 'category', label: 'Catálogo de Serviços', desc: 'Gerir procedimentos, preços e pontos', path: '/admin/services' },
      { icon: 'groups', label: 'Gestão de Profissionais', desc: 'Cadastrar e gerenciar equipe', path: '/admin/professionals' },
      { icon: 'help', label: 'Gestão de FAQ', desc: 'Dúvidas frequentes das clientes', path: '/admin/faq' },
      { icon: 'lightbulb', label: 'Dicas de Cuidado', desc: 'Orientações Pré e Pós procedimento', path: '/admin/tips' },
      { icon: 'workspace_premium', label: 'Regras de Fidelidade', desc: 'Pontuação, níveis e indicações', path: '/admin/loyalty' },
      { icon: 'gavel', label: 'Políticas de Cancelamento', desc: 'Regras e taxas de reagendamento' },
      { icon: 'notifications_active', label: 'Configuração de Alertas', desc: 'Lembretes automáticos (Push/WhatsApp)' },
   ];

   return (
      <div className="flex flex-col h-full bg-background-dark text-white">
         <header className="p-4 border-b border-white/5 flex items-center justify-between glass-nav !bg-background-dark/80">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate('/admin')} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
               <h1 className="text-lg font-bold">Ajustes Gerais</h1>
            </div>
         </header>

         <main className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar pb-32">
            <div className="space-y-3">
               {settingsItems.map((item, i) => (
                  <button
                     key={i}
                     onClick={() => item.path && navigate(item.path)}
                     className="w-full bg-card-dark p-5 rounded-2xl border border-white/5 flex items-center justify-between group active:scale-[0.98] transition-all"
                  >
                     <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center text-accent-gold group-hover:bg-accent-gold/10 transition-colors">
                           <span className="material-symbols-outlined">{item.icon}</span>
                        </div>
                        <div className="text-left">
                           <h4 className="font-bold text-sm">{item.label}</h4>
                           <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight mt-1">{item.desc}</p>
                        </div>
                     </div>
                     <span className="material-symbols-outlined text-gray-600">chevron_right</span>
                  </button>
               ))}
            </div>

            <div className="pt-8 space-y-4">
               <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest text-center">Sobre o Sistema</p>
               <div className="bg-card-dark p-6 rounded-3xl border border-white/5 flex flex-col items-center gap-4">
                  <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center">
                     <span className="material-symbols-outlined text-primary !text-3xl">verified_user</span>
                  </div>
                  <div className="text-center">
                     <p className="font-bold text-primary">Studio Julia Zenaro App</p>
                     <p className="text-xs text-gray-500 mt-1">Versão 2.5.0 (Build 112)</p>
                  </div>
               </div>
            </div>
         </main>

         <nav className="fixed bottom-0 inset-x-0 bg-background-dark/95 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex justify-between items-center z-50">
            <button onClick={() => navigate('/admin')} className="flex flex-col items-center gap-1 text-slate-500">
               <span className="material-symbols-outlined text-[24px]">grid_view</span>
               <span className="text-[10px] font-bold uppercase">Dash</span>
            </button>
            <button onClick={() => navigate('/admin/agenda')} className="flex flex-col items-center gap-1 text-slate-500">
               <span className="material-symbols-outlined text-[24px]">calendar_month</span>
               <span className="text-[10px] font-bold uppercase">Agenda</span>
            </button>
            <div className="relative -top-8">
               <button onClick={() => navigate('/admin/content')} className="size-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 border-4 border-background-dark">
                  <span className="material-symbols-outlined text-white text-[28px]">add</span>
               </button>
            </div>
            <button onClick={() => navigate('/admin/finance')} className="flex flex-col items-center gap-1 text-slate-500">
               <span className="material-symbols-outlined text-[24px]">payments</span>
               <span className="text-[10px] font-bold uppercase">Caixa</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-primary">
               <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
               <span className="text-[10px] font-bold uppercase">Ajustes</span>
            </button>
         </nav>
      </div>
   );
};

export default AdminSettings;
