
import React from 'react';
import { useNavigate } from 'react-router-dom';

const NOTIFICATIONS = [
  { id: '1', title: 'Lembrete de Agendamento', msg: 'Mal podemos esperar para ver você! Seu procedimento é amanhã às 14:00.', time: '10:30', isRead: false, icon: 'event_upcoming' },
  { id: '2', title: 'Novo post no Feed', msg: 'Confira as novas tendências de curvatura para 2024 em nosso perfil.', time: '08:15', isRead: false, icon: 'auto_awesome' },
  { id: '3', title: 'Promoção Exclusiva', msg: 'Ganhe 15% de desconto no seu próximo Lash Lifting.', time: 'Ontem', isRead: true, icon: 'sell' },
  { id: '4', title: 'Pagamento Confirmado', msg: 'Seu pagamento foi processado com sucesso. Obrigado pela preferência!', time: '2 dias atrás', isRead: true, icon: 'check_circle' },
];

const Notifications: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-background-light">
      <header className="sticky top-0 z-50 glass-nav p-4 flex items-center justify-between border-b">
         <button onClick={() => navigate(-1)} className="material-symbols-outlined text-primary">arrow_back_ios_new</button>
         <h2 className="font-display font-bold text-lg">Notificações</h2>
         <button className="text-primary text-xs font-bold uppercase">Limpar</button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-8">
         <section className="space-y-4">
            <h3 className="text-xl font-display font-bold px-2">Hoje</h3>
            <div className="space-y-3">
               {NOTIFICATIONS.filter(n => !n.isRead).map(item => (
                  <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex gap-4 relative group active:scale-[0.98] transition-all">
                     <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined">{item.icon}</span>
                     </div>
                     <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                           <p className="font-bold text-sm leading-tight text-gray-900">{item.title}</p>
                           <p className="text-[10px] text-gray-400 font-bold">{item.time}</p>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{item.msg}</p>
                     </div>
                     <div className="absolute top-4 right-1 translate-x-1/2">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/10"></div>
                     </div>
                  </div>
               ))}
            </div>
         </section>

         <section className="space-y-4">
            <h3 className="text-xl font-display font-bold px-2 opacity-40">Anteriores</h3>
            <div className="space-y-3">
               {NOTIFICATIONS.filter(n => n.isRead).map(item => (
                  <div key={item.id} className="bg-white/60 p-5 rounded-2xl border border-gray-100 flex gap-4 opacity-70">
                     <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
                        <span className="material-symbols-outlined">{item.icon}</span>
                     </div>
                     <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                           <p className="font-bold text-sm leading-tight text-gray-900">{item.title}</p>
                           <p className="text-[10px] text-gray-400 font-bold">{item.time}</p>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{item.msg}</p>
                     </div>
                  </div>
               ))}
            </div>
         </section>

         <div className="pt-12 pb-8 flex flex-col items-center opacity-10 grayscale pointer-events-none">
            <p className="font-display italic text-lg text-primary">Studio Julia Zenaro</p>
            <div className="h-[1px] w-12 bg-primary mt-2"></div>
         </div>
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] glass-nav border-t border-gray-100 flex justify-around items-center py-4 px-2 z-50 rounded-t-2xl">
        <button onClick={() => navigate('/home')} className="flex flex-col items-center gap-1 text-gray-400">
          <span className="material-symbols-outlined">home</span>
        </button>
        <button onClick={() => navigate('/services')} className="flex flex-col items-center gap-1 text-gray-400">
          <span className="material-symbols-outlined">content_cut</span>
        </button>
        <button onClick={() => navigate('/history')} className="flex flex-col items-center gap-1 text-gray-400">
          <span className="material-symbols-outlined">calendar_today</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>notifications</span>
        </button>
      </nav>
    </div>
  );
};

export default Notifications;
