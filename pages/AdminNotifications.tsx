
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import AdminBottomNav from '../components/AdminBottomNav';

type Audience = 'ALL' | 'PRIVE' | 'SIGNATURE' | 'PRIME' | 'SELECT' | 'INACTIVE';
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

         if (audience === 'PRIVE') query = query.gte('lash_points', 2000);
         else if (audience === 'SIGNATURE') query = query.gte('lash_points', 1000).lt('lash_points', 2000);
         else if (audience === 'PRIME') query = query.gte('lash_points', 500).lt('lash_points', 1000);
         else if (audience === 'SELECT') query = query.lt('lash_points', 500);

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
         }, 2500);

      } catch (err: any) {
         alert('Erro ao enviar: ' + err.message);
         setSending(false);
      }
   };

   if (sent) {
      return (
         <div className="flex flex-col h-full bg-background-dark text-white items-center justify-center p-12 text-center animate-reveal selection:bg-accent-gold/20 relative">
            {/* Dynamic Background */}
            <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
               <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/30 blur-[100px] animate-float"></div>
               <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-emerald-500/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative size-32 mb-10 z-10">
               <div className="absolute inset-0 bg-accent-gold/20 rounded-full blur-3xl animate-pulse"></div>
               <div className="relative size-32 rounded-full bg-primary flex items-center justify-center shadow-hugest ring-4 ring-primary/20">
                  <span className="material-symbols-outlined !text-[64px] text-accent-gold">send_and_archive</span>
               </div>
            </div>
            <div className="space-y-4 z-10">
               <h2 className="text-4xl font-display italic text-white leading-tight">Comunicação Expandida.</h2>
               <p className="text-white/40 font-outfit text-sm font-light max-w-[280px] mx-auto italic">Sua mensagem foi enviada com sucesso para o público selecionado via JZ Protocol.</p>
            </div>
            <div className="mt-12 opacity-20 select-none z-10">
               <p className="text-[10px] font-black uppercase tracking-[0.5em]">Julia Zenaro Studio • Elite Admin</p>
            </div>
         </div>
      );
   }

   return (
      <div className="flex flex-col h-full bg-background-dark text-white overflow-hidden selection:bg-accent-gold/20 relative">
         {/* Dynamic Background Engine */}
         <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/30 blur-[100px] animate-float"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-10 mix-blend-overlay"></div>
         </div>

         <header className="sticky top-0 z-[100] premium-nav-dark px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 bg-background-dark/95 backdrop-blur-xl">
            <div className="flex items-center gap-6">
               <button onClick={() => navigate('/admin/settings')} className="size-11 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-accent-gold hover:bg-white/10 active:scale-90 transition-all shadow-huge">
                  <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
               </button>
               <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mb-1">Administrative Suite</p>
                  <h1 className="text-xl font-display italic text-white tracking-tight">Comunicados de Elite</h1>
               </div>
            </div>
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 shadow-huge self-start md:self-center">
               <button
                  onClick={() => setActiveTab('SYSTEM')}
                  className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${activeTab === 'SYSTEM' ? 'bg-primary text-white shadow-lg' : 'text-white/20 hover:text-white/40'}`}
               >
                  Histórico
               </button>
               <button
                  onClick={() => setActiveTab('MARKETING')}
                  className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${activeTab === 'MARKETING' ? 'bg-primary text-white shadow-lg' : 'text-white/20 hover:text-white/40'}`}
               >
                  Novo Disparo
               </button>
            </div>
         </header>

         <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar pb-32">
            {activeTab === 'MARKETING' ? (
               <div className="p-8 space-y-12 animate-reveal">
                  <div className="space-y-6">
                     <div className="flex items-center gap-3 px-2">
                        <div className="h-px w-6 bg-accent-gold/20"></div>
                        <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.4em] font-outfit">Público Selecionado</label>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                           { id: 'ALL', label: 'Todas as Clientes', icon: 'groups', desc: 'Broadcast global' },
                           { id: 'PRIVE', label: 'Privé Club - Elite', icon: 'diamond', desc: 'Acima de 2.000 pts' },
                           { id: 'SIGNATURE', label: 'Privé Club - Signature', icon: 'stars', desc: '1.000 a 2.000 pts' },
                           { id: 'PRIME', label: 'Privé Club - Prime', icon: 'star', desc: '500 a 1.000 pts' },
                           { id: 'SELECT', label: 'Privé Club - Select', icon: 'person', desc: 'Novas membras' },
                           { id: 'INACTIVE', label: 'Status: Adormecidas', icon: 'person_off', desc: '+30 dias inativas' }
                        ].map((item, idx) => (
                           <button
                              key={item.id}
                              onClick={() => setAudience(item.id as Audience)}
                              className={`group relative p-6 rounded-[32px] border transition-all duration-700 text-left flex items-center justify-between overflow-hidden ${audience === item.id ? 'bg-white/5 border-accent-gold/40 shadow-huge' : 'bg-surface-dark/40 border-white/5 opacity-60 hover:opacity-100 hover:border-white/10'}`}
                              style={{ animationDelay: `${idx * 0.05}s` }}
                           >
                              <div className="absolute inset-0 bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <div className="flex items-center gap-5 relative z-10">
                                 <div className={`size-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${audience === item.id ? 'bg-accent-gold text-primary scale-110' : 'bg-white/5 text-white/20'}`}>
                                    <span className="material-symbols-outlined !text-2xl">{item.icon}</span>
                                 </div>
                                 <div>
                                    <p className={`font-outfit font-bold text-sm ${audience === item.id ? 'text-white' : 'text-white/40 group-hover:text-white'}`}>{item.label}</p>
                                    <p className="text-[9px] text-white/20 uppercase tracking-widest mt-0.5">{item.desc}</p>
                                 </div>
                              </div>
                              {audience === item.id && (
                                 <div className="size-6 rounded-full bg-accent-gold text-primary flex items-center justify-center animate-reveal relative z-10">
                                    <span className="material-symbols-outlined !text-sm font-black">done</span>
                                 </div>
                              )}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-10">
                     <div className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                           <div className="h-px w-6 bg-accent-gold/20"></div>
                           <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.4em] font-outfit">Mensagem Narrativa</label>
                        </div>
                        <input
                           type="text"
                           placeholder="Ex: Seu próximo momento de beleza aguarda! ✨"
                           className="w-full h-18 bg-surface-dark/40 border border-white/5 rounded-2xl px-8 text-sm focus:border-accent-gold/40 focus:bg-surface-dark outline-none transition-all placeholder:text-white/10 font-outfit"
                        />
                     </div>

                     <div className="space-y-4">
                        <textarea
                           placeholder="Escreva o conteúdo da notificação exclusiva..."
                           className="w-full bg-surface-dark/40 border border-white/5 rounded-[40px] p-8 text-sm focus:border-accent-gold/40 focus:bg-surface-dark h-48 outline-none transition-all placeholder:text-white/10 font-outfit font-light leading-relaxed"
                        />
                     </div>

                     <div className="bg-primary/5 p-8 rounded-[40px] border border-primary/10 flex gap-6 items-start relative overflow-hidden group">
                        <div className="absolute inset-0 bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shrink-0 shadow-lg relative z-10">
                           <span className="material-symbols-outlined !text-2xl">auto_fix_high</span>
                        </div>
                        <div className="space-y-1 relative z-10">
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 font-outfit leading-none mb-1">Dica de Gestão</p>
                           <p className="text-[12px] text-white/30 leading-relaxed italic font-light pt-1">
                              Utilize linguagem acolhedora e descritiva. Membros do <span className="text-accent-gold font-bold">JZ Privé Club</span> valorizam a curadoria e a exclusividade em cada contato.
                           </p>
                        </div>
                     </div>
                  </div>
               </div>
            ) : (
               <div className="p-8 space-y-10 animate-reveal">
                  <div className="flex items-center justify-between px-2">
                     <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 font-outfit">Logs de Comunicação</h2>
                     <button onClick={fetchSystemNotifications} className="group size-10 flex items-center justify-center rounded-full bg-white/5 text-white/20 hover:text-accent-gold hover:bg-white/10 transition-all duration-500">
                        <span className="material-symbols-outlined !text-xl group-active:rotate-180 transition-transform duration-500">refresh</span>
                     </button>
                  </div>

                  {loadingSystem ? (
                     <div className="py-32 flex flex-col items-center gap-6 animate-pulse">
                        <div className="size-10 border-2 border-accent-gold/20 border-t-accent-gold rounded-full animate-spin"></div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/10">Sincronizando Histórico</p>
                     </div>
                  ) : systemNotifications.length === 0 ? (
                     <div className="py-32 text-center opacity-10 space-y-6">
                        <span className="material-symbols-outlined !text-[64px]">notifications_off</span>
                        <p className="font-display italic text-2xl">O console está em silêncio.</p>
                     </div>
                  ) : (
                     <div className="grid gap-6">
                        {systemNotifications.map((notif, idx) => (
                           <div
                              key={notif.id}
                              className="group relative bg-surface-dark/40 border border-white/5 p-8 rounded-[40px] flex gap-6 transition-all duration-700 hover:border-accent-gold/20 hover:bg-surface-dark overflow-hidden animate-reveal"
                              style={{ animationDelay: `${idx * 0.05}s` }}
                           >
                              <div className="absolute inset-0 bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <div className={`size-14 rounded-[24px] flex items-center justify-center shrink-0 shadow-huge relative z-10 ${notif.type === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10' :
                                 notif.type === 'cancelled' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/10' :
                                    notif.type === 'completed' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/10' :
                                       'bg-primary/20 text-accent-gold border border-white/5'
                                 }`}>
                                 <span className="material-symbols-outlined !text-[28px]">
                                    {notif.type === 'confirmed' ? 'check_circle' :
                                       notif.type === 'cancelled' ? 'cancel' :
                                          notif.type === 'completed' ? 'verified' :
                                             'notifications'}
                                 </span>
                              </div>
                              <div className="flex-1 space-y-3 relative z-10">
                                 <div className="flex justify-between items-start pt-1">
                                    <h4 className="font-outfit font-bold text-base text-white group-hover:text-accent-gold transition-colors duration-500">{notif.title}</h4>
                                    <p className="text-[8px] text-white/10 font-black uppercase tracking-widest mt-1">
                                       {new Date(notif.created_at).toLocaleDateString('pt-BR')}
                                    </p>
                                 </div>
                                 <p className="text-[13px] text-white/30 font-light leading-relaxed italic pr-4">{notif.message}</p>
                              </div>
                              {!notif.read && (
                                 <div className="absolute top-8 right-8 size-2.5 bg-accent-gold rounded-full shadow-[0_0_15px_rgba(201,169,97,0.8)]"></div>
                              )}
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            )}
         </main>

         {activeTab === 'MARKETING' && (
            <div className="p-8 fixed bottom-0 inset-x-0 glass-nav !bg-background-dark/95 border-t border-white/5 z-[60]">
               <button
                  onClick={handleSend}
                  disabled={sending}
                  className="group relative w-full h-18 bg-primary text-white rounded-[32px] font-outfit font-black text-[10px] uppercase tracking-[0.4em] shadow-hugest overflow-hidden active:scale-95 transition-all disabled:opacity-50"
               >
                  <div className="absolute inset-0 bg-accent-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
                  {sending ? (
                     <div className="size-6 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                     <span className="relative z-10 flex items-center justify-center gap-4">
                        Disparar Comunicado
                        <span className="material-symbols-outlined !text-xl text-accent-gold transition-transform group-hover:translate-x-3">rocket_launch</span>
                     </span>
                  )}
               </button>
            </div>
         )}

         <AdminBottomNav />

         {/* Visual Safe Area Inset */}
         <div className="fixed bottom-0 left-0 w-full h-8 bg-black pointer-events-none z-[90]"></div>
      </div>
   );
};

export default AdminNotifications;
