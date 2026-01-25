import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const ReferFriend: React.FC = () => {
   const navigate = useNavigate();
   const [copied, setCopied] = useState(false);
   const [referralCode, setReferralCode] = useState('...');
   const [referrals, setReferrals] = useState<any[]>([]);
   const [rewardPoints, setRewardPoints] = useState(200);

   React.useEffect(() => {
      const fetchRefData = async () => {
         // 1. Fetch Points Config
         const { data: config } = await supabase
            .from('loyalty_actions')
            .select('points_reward')
            .eq('code', 'REFERRAL')
            .single();
         if (config?.points_reward) setRewardPoints(config.points_reward);

         const { data: { user } } = await supabase.auth.getUser();
         if (user) {
            const { data: profile } = await supabase.from('profiles').select('referral_code').eq('id', user.id).single();
            if (profile) setReferralCode(profile.referral_code || '...');

            // Fetch referrals
            if (profile?.referral_code) {
               const { data: refs } = await supabase.from('profiles')
                  .select('name, created_at, id')
                  .eq('referred_by', profile.referral_code);

               if (refs) {
                  setReferrals(refs.map(r => ({
                     name: r.name || 'Usuário',
                     status: 'PENDING',
                     date: new Date(r.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                     points: 0
                  })));
               }
            }
         }
      };
      fetchRefData();
   }, []);

   const handleCopy = () => {
      navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
   };

   const handleShare = async () => {
      const shareData = {
         title: 'Studio Julia Zenaro',
         text: `Use meu código ${referralCode} e ganhe ${rewardPoints} JZ Balance de presente no seu primeiro procedimento no Studio Julia Zenaro! ✨`,
         url: window.location.origin
      };

      try {
         if (navigator.share) {
            await navigator.share(shareData);
         } else {
            handleCopy();
            alert("Link de indicação copiado! Envie para suas amigas no WhatsApp. ✨");
         }
      } catch (err) {
         console.log('Erro ao compartilhar:', err);
      }
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
                  <p className="text-[9px] font-outfit font-black uppercase tracking-[0.2em] text-primary/40 leading-none mb-1">Loyalty Growth</p>
                  <h2 className="text-xl font-display italic text-primary tracking-tight">Indique Amigas</h2>
               </div>
            </div>
            <span className="size-10"></span>
         </header>

         <main className="relative z-10 flex-1 p-8 space-y-12">
            <div className="text-center space-y-6 animate-reveal">
               <div className="size-24 rounded-full bg-accent-gold/10 flex items-center justify-center mx-auto ring-4 ring-accent-gold/5">
                  <span className="material-symbols-outlined text-accent-gold !text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
               </div>
               <div className="space-y-2">
                  <h1 className="text-4xl font-display text-primary leading-tight">Espalhe beleza,<br /><span className="italic">compartilhe</span> brilho.</h1>
                  <p className="text-xs font-outfit text-primary/50 leading-relaxed font-light max-w-[80%] mx-auto">
                     Sua indicação vale ouro. Ganhe <span className="text-primary font-bold">{rewardPoints} JZ Balance</span> por amiga e presenteie-a com mais <span className="text-primary font-bold">{rewardPoints} JZ Balance</span>.
                  </p>
               </div>
            </div>

            <div className="group bg-white p-10 rounded-[40px] shadow-xl border border-accent-gold/10 flex flex-col items-center gap-8 animate-reveal" style={{ animationDelay: '0.1s' }}>
               <div className="flex flex-col items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30">Seu código exclusivo</p>
                  <div className="h-px w-8 bg-accent-gold/40"></div>
               </div>

               <div
                  onClick={handleCopy}
                  className="w-full h-20 bg-primary/5 rounded-3xl flex items-center justify-center relative group cursor-pointer active:scale-95 transition-all overflow-hidden"
               >
                  <div className="absolute inset-0 bg-accent-gold/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="text-2xl font-black text-primary tracking-[0.5em] relative z-10">{referralCode}</span>
                  <div className={`absolute inset-y-0 right-0 w-16 flex items-center justify-center border-l border-primary/5 bg-white/40 transition-all ${copied ? 'bg-primary text-white' : 'text-primary'}`}>
                     <span className="material-symbols-outlined !text-xl">{copied ? 'done_all' : 'content_copy'}</span>
                  </div>
               </div>

               {copied ? (
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest animate-reveal">Pronto para enviar!</p>
               ) : (
                  <p className="text-[10px] text-primary/30 font-bold uppercase tracking-widest">Toque para copiar</p>
               )}
            </div>

            <section className="space-y-4 pb-12 animate-reveal" style={{ animationDelay: '0.2s' }}>
               <div className="flex items-center gap-3 px-2 mb-6">
                  <span className="h-px w-6 bg-accent-gold/40"></span>
                  <h3 className="text-[10px] font-black text-primary/40 uppercase tracking-[0.3em] font-outfit">Suas Indicações</h3>
               </div>

               <div className="grid gap-3">
                  {referrals.length === 0 ? (
                     <div className="text-center py-12 px-6 rounded-[32px] border border-dashed border-primary/10">
                        <p className="text-[10px] text-primary/30 font-bold uppercase tracking-widest">Nenhuma indicação registrada.</p>
                     </div>
                  ) : referrals.map((item, i) => (
                     <div key={i} className="p-5 bg-white/40 rounded-[24px] border border-primary/5 flex items-center justify-between group hover:bg-white hover:border-accent-gold/20 transition-all duration-500">
                        <div className="flex items-center gap-4">
                           <div className="relative size-10 rounded-xl bg-primary flex items-center justify-center text-accent-gold text-xs font-black shadow-lg">
                              <div className="absolute inset-0 bg-white/10 organic-shape-1"></div>
                              <span className="relative z-10">{item.name[0]}</span>
                           </div>
                           <div>
                              <p className="text-sm font-outfit font-bold text-primary">{item.name}</p>
                              {item.points > 0 ? (
                                 <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">+ {item.points} JZ Balance</p>
                              ) : (
                                 <p className="text-[8px] text-primary/40 font-bold uppercase tracking-widest">{item.date}</p>
                              )}
                           </div>
                        </div>
                        <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-lg border tracking-widest ${item.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white/60 text-primary/30 border-primary/5'}`}>
                           {item.status === 'COMPLETED' ? 'Confirmado' : 'Pendente'}
                        </span>
                     </div>
                  ))}
               </div>
            </section>
         </main>

         <div className="p-8 fixed bottom-0 inset-x-0 glass-nav !bg-background-light/90 border-t border-primary/5 z-[60]">
            <button
               onClick={handleShare}
               className="group relative w-full h-16 bg-primary text-white rounded-2xl font-outfit font-black text-[10px] uppercase tracking-[0.3em] overflow-hidden shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
               <div className="absolute inset-x-0 bottom-0 h-1 bg-accent-gold translate-y-full group-hover:translate-y-0 transition-transform"></div>
               <span className="material-symbols-outlined !text-xl group-hover:text-accent-gold transition-colors">share</span>
               <span className="group-hover:text-accent-gold transition-colors">Compartilhar Código</span>
            </button>
         </div>

         {/* Visual Safe Area Inset */}
         <div className="fixed bottom-0 left-0 w-full h-8 bg-background-light pointer-events-none z-[90]"></div>
      </div>
   );
};

export default ReferFriend;
