
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Audience = 'ALL' | 'VIPS' | 'INACTIVE';

const AdminNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [audience, setAudience] = useState<Audience>('ALL');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    setSending(true);
    // Simulação de disparo de Push via FCM
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setTimeout(() => {
        setSent(false);
        navigate('/admin');
      }, 2000);
    }, 2500);
  };

  if (sent) {
    return (
      <div className="flex flex-col h-full bg-background-dark text-white items-center justify-center p-8 text-center animate-fade-in">
         <div className="size-24 rounded-full bg-primary flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 ring-4 ring-primary/20">
            <span className="material-symbols-outlined !text-5xl">send_and_archive</span>
         </div>
         <h2 className="text-3xl font-display font-bold text-accent-gold">Mensagens Disparadas!</h2>
         <p className="text-gray-400 mt-2 text-sm">O público selecionado receberá a notificação em instantes.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background-dark text-white">
      <header className="p-4 border-b border-white/5 flex items-center justify-between glass-nav !bg-background-dark/80">
         <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
            <h1 className="text-lg font-bold">Marketing & Push</h1>
         </div>
         <span className="material-symbols-outlined text-accent-gold">campaign</span>
      </header>

      <main className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar pb-32">
         <div className="space-y-4">
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest pl-1">Público Alvo</label>
            <div className="grid grid-cols-1 gap-3">
               {[
                 { id: 'ALL', label: 'Todas as Clientes', count: 124, icon: 'groups' },
                 { id: 'VIPS', label: 'Clientes VIP (Diamante)', count: 32, icon: 'stars' },
                 { id: 'INACTIVE', label: 'Inativas (+30 dias)', count: 18, icon: 'person_off' }
               ].map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => setAudience(item.id as Audience)}
                    className={`p-5 rounded-3xl border text-left flex items-center justify-between transition-all ${audience === item.id ? 'bg-primary/20 border-primary ring-1 ring-primary' : 'bg-white/5 border-white/10 opacity-60'}`}
                  >
                     <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-accent-gold">{item.icon}</span>
                        <div>
                           <p className="font-bold text-sm">{item.label}</p>
                           <p className="text-[10px] text-gray-500 uppercase">{item.count} destinatários</p>
                        </div>
                     </div>
                     {audience === item.id && <span className="material-symbols-outlined text-primary">check_circle</span>}
                  </button>
               ))}
            </div>
         </div>

         <div className="space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest pl-1">Assunto do Push</label>
               <input type="text" placeholder="Ex: Saudades de você! ✨" className="w-full h-14 bg-white/5 border-white/10 rounded-2xl px-5 text-sm focus:ring-accent-gold" />
            </div>

            <div className="space-y-2">
               <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest pl-1">Corpo da Mensagem</label>
               <textarea placeholder="Escreva o texto da notificação..." className="w-full bg-white/5 border-white/10 rounded-3xl p-6 text-sm focus:ring-accent-gold h-40" />
            </div>
            
            <div className="bg-primary/10 p-5 rounded-3xl border border-primary/20 flex gap-4">
               <span className="material-symbols-outlined text-primary">smart_toy</span>
               <p className="text-[10px] text-gray-400 leading-relaxed italic">
                 Dica: Use emojis e uma linguagem acolhedora para aumentar a taxa de conversão em até 40%.
               </p>
            </div>
         </div>
      </main>

      <div className="p-6 fixed bottom-0 inset-x-0 glass-nav !bg-background-dark/90 border-t border-white/5">
         <button 
          onClick={handleSend}
          disabled={sending}
          className="w-full h-16 bg-primary text-white rounded-2xl font-bold text-xs uppercase tracking-[0.3em] shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
         >
            {sending ? <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'DISPARAR AGORA'}
         </button>
      </div>
    </div>
  );
};

export default AdminNotifications;
