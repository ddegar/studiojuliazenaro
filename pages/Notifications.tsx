
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const NOTIFICATIONS = [
   { id: '1', title: 'Lembrete de Agendamento', msg: 'Mal podemos esperar para ver você! Seu procedimento é amanhã às 14:00.', time: '10:30', isRead: false, icon: 'event_upcoming' },
   { id: '2', title: 'Novo post no Feed', msg: 'Confira as novas tendências de curvatura para 2024 em nosso perfil.', time: '08:15', isRead: false, icon: 'auto_awesome' },
   { id: '3', title: 'Promoção Exclusiva', msg: 'Ganhe 15% de desconto no seu próximo Lash Lifting.', time: 'Ontem', isRead: true, icon: 'sell' },
   { id: '4', title: 'Pagamento Confirmado', msg: 'Seu pagamento foi processado com sucesso. Obrigado pela preferência!', time: '2 dias atrás', isRead: true, icon: 'check_circle' },
];

const Notifications: React.FC = () => {
   const navigate = useNavigate();
   const [notifications, setNotifications] = React.useState<any[]>([]);
   const [loading, setLoading] = React.useState(true);

   React.useEffect(() => {
      fetchNotifications();
   }, []);

   const fetchNotifications = async () => {
      try {
         setLoading(true);
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) return;

         const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

         if (error) throw error;
         setNotifications(data || []);
      } catch (err) {
         console.error(err);
      } finally {
         setLoading(false);
      }
   };

   const markAsRead = async (id: string) => {
      try {
         await supabase.from('notifications').update({ is_read: true }).eq('id', id);
         setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      } catch (err) {
         console.error(err);
      }
   };

   const handleNotificationClick = (item: any) => {
      markAsRead(item.id);
      if (item.link) navigate(item.link);
   };

   const formatTime = (dateStr: string) => {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (days === 1) return 'Ontem';
      return `${days} dias atrás`;
   };

   return (
      <div className="flex flex-col h-full bg-background-light overflow-y-auto no-scrollbar selection:bg-accent-gold/30 selection:text-primary pb-32">
         {/* Dynamic Background Elements */}
         <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/30 blur-[100px] animate-float"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
         </div>

         <header className="sticky top-0 z-[100] premium-blur px-6 py-5 flex justify-between items-center border-b border-primary/5">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-white border border-primary/5 text-primary shadow-sm active:scale-90 transition-transform">
                  <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
               </button>
               <div>
                  <p className="text-[9px] font-outfit font-black uppercase tracking-[0.2em] text-primary/40 leading-none mb-1">Elite Inbox</p>
                  <h2 className="text-xl font-display italic text-primary tracking-tight">Notificações</h2>
               </div>
            </div>
            <button onClick={fetchNotifications} className="size-10 flex items-center justify-center rounded-full bg-primary/5 text-primary border border-primary/10 hover:bg-primary/10 transition-colors">
               <span className="material-symbols-outlined !text-lg">refresh</span>
            </button>
         </header>

         <main className="relative z-10 flex-1 p-8 space-y-10">
            {loading ? (
               <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <div className="relative size-12 flex items-center justify-center">
                     <div className="absolute inset-0 border-2 border-primary/10 rounded-full"></div>
                     <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-[10px] font-outfit font-bold text-primary/40 uppercase tracking-widest">Sua Linha do Tempo</p>
               </div>
            ) : notifications.length === 0 ? (
               <div className="text-center py-24 px-10 space-y-6 opacity-30">
                  <div className="size-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto">
                     <span className="material-symbols-outlined !text-4xl text-primary">notifications_off</span>
                  </div>
                  <p className="text-xs font-outfit text-primary italic tracking-wide">O silêncio é a moldura de novos momentos.</p>
               </div>
            ) : (
               <div className="space-y-4">
                  <div className="flex items-center gap-3 px-2 mb-6">
                     <span className="h-px w-6 bg-accent-gold/40"></span>
                     <h3 className="text-[10px] font-black text-primary/40 uppercase tracking-[0.3em] font-outfit">Recentes</h3>
                  </div>
                  <div className="grid gap-4">
                     {notifications.map((item, idx) => (
                        <div
                           key={item.id}
                           onClick={() => handleNotificationClick(item)}
                           className={`group relative p-6 rounded-[32px] border transition-all duration-500 animate-reveal shadow-sm cursor-pointer active:scale-[0.98] ${item.is_read ? 'bg-white/40 border-primary/5 grayscale-[50%] opacity-80' : 'bg-white border-accent-gold/20 shadow-xl'}`}
                           style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                           <div className="flex gap-5">
                              <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-500 ${item.is_read ? 'bg-gray-100 text-gray-400' : 'bg-primary text-white shadow-lg shadow-primary/20'}`}>
                                 <span className="material-symbols-outlined !text-xl">{item.icon || 'notifications'}</span>
                              </div>
                              <div className="flex-1 space-y-2">
                                 <div className="flex justify-between items-start">
                                    <h4 className="font-outfit font-bold text-sm text-primary leading-tight px-1">{item.title}</h4>
                                    <span className="text-[9px] font-outfit font-black text-primary/30 uppercase tracking-widest pt-0.5">{formatTime(item.created_at)}</span>
                                 </div>
                                 <p className="text-xs text-primary/60 leading-relaxed font-outfit font-light italic px-1">{item.message}</p>
                              </div>
                           </div>
                           {!item.is_read && (
                              <div className="absolute top-4 right-4">
                                 <div className="size-2 rounded-full bg-accent-gold ring-4 ring-accent-gold/10"></div>
                              </div>
                           )}
                           <div className={`absolute bottom-4 right-6 flex items-center gap-1.5 text-[9px] font-outfit font-black uppercase tracking-widest transition-all duration-500 ${item.is_read ? 'opacity-0' : 'opacity-30 group-hover:opacity-100 text-accent-gold'}`}>
                              <span>Abrir</span>
                              <span className="material-symbols-outlined !text-xs">east</span>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            <footer className="pt-20 pb-12 text-center opacity-20 grayscale pointer-events-none transition-all hover:opacity-100 hover:grayscale-0">
               <p className="font-display italic text-lg text-primary tracking-widest">Excelência em cada detalhe.</p>
               <div className="flex items-center justify-center gap-4 mt-4">
                  <div className="h-px w-8 bg-primary"></div>
                  <span className="font-outfit text-[8px] font-black uppercase tracking-[0.4em]">Julia Zenaro</span>
                  <div className="h-px w-8 bg-primary"></div>
               </div>
            </footer>
         </main>

         {/* Refined Persistent Navigation */}
         <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-[120]">
            <nav className="animate-reveal" style={{ animationDelay: '0.6s' }}>
               <div className="premium-blur rounded-[28px] border border-primary/10 shadow-2xl px-6 py-3 flex justify-between items-center bg-white/80">
                  <button onClick={() => navigate('/home')} className="p-2 text-primary/30 hover:text-primary transition-colors group">
                     <span className="material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform">home</span>
                  </button>
                  <button onClick={() => navigate('/services')} className="p-2 text-primary/30 hover:text-primary transition-colors group">
                     <span className="material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform">grid_view</span>
                  </button>
                  <button onClick={() => navigate('/services')} className="relative size-14 -translate-y-6 rounded-3xl bg-primary text-accent-gold shadow-lg shadow-primary/40 flex items-center justify-center border-4 border-background-light group-active:scale-90 transition-transform ring-1 ring-primary/5">
                     <span className="material-symbols-outlined !text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
                  </button>
                  <button onClick={() => navigate('/history')} className="p-2 text-primary/30 hover:text-primary transition-colors group">
                     <span className="material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform">calendar_today</span>
                  </button>
                  <button className="relative p-2 text-primary group transition-all">
                     <span className="material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
                     <span className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-1 h-1 bg-accent-gold rounded-full"></span>
                  </button>
               </div>
            </nav>
         </div>

         {/* Visual Safe Area Inset */}
         <div className="fixed bottom-0 left-0 w-full h-8 bg-background-light pointer-events-none z-[90]"></div>
      </div>
   );
};

export default Notifications;
