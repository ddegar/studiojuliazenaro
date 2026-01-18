
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

type Audience = 'ALL' | 'VIPS' | 'INACTIVE';
type Tab = 'MARKETING' | 'SYSTEM';

const AdminNotifications: React.FC = () => {
   const navigate = useNavigate();
   const [activeTab, setActiveTab] = useState<Tab>('SYSTEM');
   const [audience, setAudience] = useState<Audience>('ALL');
   const [sending, setSending] = useState(false);
   const [sent, setSent] = useState(false);
   const [systemNotifications, setSystemNotifications] = useState<any[]>([]);
   const [loadingSystem, setLoadingSystem] = useState(false);

   useEffect(() => {
      if (activeTab === 'SYSTEM') {
         fetchSystemNotifications();
      }
   }, [activeTab]);

   const fetchSystemNotifications = async () => {
      setLoadingSystem(true);
      try {
         const { data } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
         setSystemNotifications(data || []);
      } catch (err) {
         console.error('Error fetching notifications:', err);
      } finally {
         setLoadingSystem(false);
      }
   };

   const handleSend = async () => {
      setSending(true);
      try {
         // 1. Fetch audience
         let query = supabase.from('profiles').select('id').eq('role', 'CLIENT');

         if (audience === 'VIPS') {
            query = query.gte('lash_points', 1000);
         } else if (audience === 'INACTIVE') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            // This is a simplified check, real inactive logic would check last appointment
         }

         const { data: targets } = await query;

         if (targets && targets.length > 0) {
            const notifications = targets.map(t => ({
               user_id: t.id,
               title: (document.querySelector('input[type="text"]') as HTMLInputElement)?.value || 'Novidade no Studio!',
               message: (document.querySelector('textarea') as HTMLTextAreaElement)?.value || 'Confira as novidades no seu app.',
               type: 'marketing',
               read: false
            }));

            const { error } = await supabase.from('notifications').insert(notifications);
            if (error) throw error;
         }

         setSending(false);
         setSent(true);
         setTimeout(() => {
            setSent(false);
            navigate('/admin');
         }, 2000);

      } catch (err: any) {
         alert('Erro ao enviar: ' + err.message);
         setSending(false);
      }
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
               <h1 className="text-lg font-bold">Notificações</h1>
            </div>
            <div className="flex bg-white/5 p-1 rounded-xl">
               <button
                  onClick={() => setActiveTab('SYSTEM')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'SYSTEM' ? 'bg-primary text-white' : 'text-gray-500'}`}
               >
                  Alertas
               </button>
               <button
                  onClick={() => setActiveTab('MARKETING')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'MARKETING' ? 'bg-primary text-white' : 'text-gray-500'}`}
               >
                  Marketing
               </button>
            </div>
         </header>

         <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
            {activeTab === 'MARKETING' ? (
               <div className="p-6 space-y-8 animate-fade-in">
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
                        <input type="text" placeholder="Ex: Saudades de você! ✨" className="w-full h-14 bg-white/5 border-white/10 rounded-2xl px-5 text-sm focus:ring-accent-gold outline-none" />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest pl-1">Corpo da Mensagem</label>
                        <textarea placeholder="Escreva o texto da notificação..." className="w-full bg-white/5 border-white/10 rounded-3xl p-6 text-sm focus:ring-accent-gold h-40 outline-none" />
                     </div>

                     <div className="bg-primary/10 p-5 rounded-3xl border border-primary/20 flex gap-4">
                        <span className="material-symbols-outlined text-primary">smart_toy</span>
                        <p className="text-[10px] text-gray-400 leading-relaxed italic">
                           Dica: Use emojis e uma linguagem acolhedora para aumentar a taxa de conversão em até 40%.
                        </p>
                     </div>
                  </div>
               </div>
            ) : (
               <div className="p-6 space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between px-2">
                     <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Últimos Alertas do Sistema</h2>
                     <button onClick={fetchSystemNotifications} className="material-symbols-outlined text-gray-500 !text-sm">refresh</button>
                  </div>

                  {loadingSystem ? (
                     <div className="py-20 flex justify-center">
                        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                     </div>
                  ) : systemNotifications.length === 0 ? (
                     <div className="py-20 text-center opacity-30 space-y-4">
                        <span className="material-symbols-outlined !text-4xl text-gray-500">notifications_off</span>
                        <p className="text-sm italic">Nenhum alerta recente.</p>
                     </div>
                  ) : (
                     <div className="space-y-3">
                        {systemNotifications.map((notif) => (
                           <div key={notif.id} className="bg-card-dark p-5 rounded-[24px] border border-white/5 flex gap-4 transition-all hover:border-white/10 relative overflow-hidden group">
                              <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' :
                                 notif.type === 'cancelled' ? 'bg-rose-500/10 text-rose-500' :
                                    notif.type === 'completed' ? 'bg-blue-500/10 text-blue-500' :
                                       'bg-accent-gold/10 text-accent-gold'
                                 }`}>
                                 <span className="material-symbols-outlined !text-lg">
                                    {notif.type === 'confirmed' ? 'check_circle' :
                                       notif.type === 'cancelled' ? 'cancel' :
                                          notif.type === 'completed' ? 'verified' :
                                             'notifications'}
                                 </span>
                              </div>
                              <div className="flex-1 space-y-1">
                                 <h4 className="font-bold text-sm text-white">{notif.title}</h4>
                                 <p className="text-[11px] text-gray-400 leading-relaxed">{notif.message}</p>
                                 <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest pt-1">
                                    {new Date(notif.created_at).toLocaleString('pt-BR')}
                                 </p>
                              </div>
                              {!notif.read && (
                                 <div className="absolute top-4 right-4 size-2 bg-primary rounded-full"></div>
                              )}
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            )}
         </main>

         {activeTab === 'MARKETING' && (
            <div className="p-6 fixed bottom-0 inset-x-0 glass-nav !bg-background-dark/90 border-t border-white/5 z-[60]">
               <button
                  onClick={handleSend}
                  disabled={sending}
                  className="w-full h-16 bg-primary text-white rounded-2xl font-bold text-xs uppercase tracking-[0.3em] shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
               >
                  {sending ? <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'DISPARAR AGORA'}
               </button>
            </div>
         )}

         <AdminBottomNav />
      </div>
   );
};

export default AdminNotifications;
