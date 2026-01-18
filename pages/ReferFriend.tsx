
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ReferFriend: React.FC = () => {
   const navigate = useNavigate();
   const [copied, setCopied] = useState(false);
   const [referralCode, setReferralCode] = useState('...');
   const [referrals, setReferrals] = useState<any[]>([]);

   React.useEffect(() => {
      const fetchRefData = async () => {
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
                  // Check status for each (mocking logic: if exists, assume pending unless checked against appointments)
                  // For valid MVP transition, just listing them is good.
                  setReferrals(refs.map(r => ({
                     name: r.name || 'Usuário',
                     status: 'PENDING', // Logic to check appointments later
                     date: new Date(r.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                     points: 0 // Fetch real points from ledger if needed
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
         text: `Use meu código ${referralCode} e ganhe 10% de desconto no seu primeiro procedimento no Studio Julia Zenaro! ✨`,
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
      <div className="flex flex-col h-full bg-background-light">
         <header className="glass-nav p-4 flex items-center justify-between border-b">
            <button onClick={() => navigate(-1)} className="material-symbols-outlined text-primary">arrow_back_ios_new</button>
            <h2 className="font-display font-bold text-lg text-primary">Indique Amigas</h2>
            <span className="size-6"></span>
         </header>

         <main className="flex-1 p-8 space-y-10 overflow-y-auto no-scrollbar">
            <div className="text-center space-y-4">
               <div className="size-24 rounded-full bg-accent-gold/10 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-accent-gold !text-5xl">volunteer_activism</span>
               </div>
               <h1 className="text-3xl font-display font-bold text-primary leading-tight">Espalhe beleza,<br />ganhe benefícios</h1>
               <p className="text-sm text-gray-500 leading-relaxed">
                  Cada amiga indicada que realizar um procedimento rende <span className="text-primary font-bold">50 Lash Points</span> para você e um desconto de <span className="text-primary font-bold">10%</span> para ela.
               </p>
            </div>

            <div className="bg-white p-6 rounded-3xl premium-shadow border border-gray-100 flex flex-col items-center gap-6">
               <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Seu código exclusivo</p>
               <div
                  onClick={handleCopy}
                  className="w-full h-16 border-2 border-dashed border-primary/20 bg-primary/5 rounded-2xl flex items-center justify-center relative group cursor-pointer active:scale-95 transition-all"
               >
                  <span className="text-2xl font-black text-primary tracking-[0.4em]">{referralCode}</span>
                  <button className="absolute right-4 text-primary">
                     <span className="material-symbols-outlined">{copied ? 'check' : 'content_copy'}</span>
                  </button>
               </div>
               {copied && <p className="text-[10px] text-primary font-bold animate-fade-in">Código copiado!</p>}
            </div>

            <section className="space-y-4 pb-20">
               <h3 className="text-xs font-bold uppercase text-primary tracking-widest px-2">Suas Indicações</h3>
               <div className="space-y-3">
                  {referrals.length === 0 ? <p className="text-xs text-gray-400 px-4">Nenhuma indicação ainda.</p> : referrals.map((item, i) => (
                     <div key={i} className="p-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">{item.name[0]}</div>
                           <div>
                              <p className="text-sm font-bold text-gray-800">{item.name}</p>
                              {item.points > 0 && <p className="text-[8px] text-primary font-bold">+ {item.points} Lash Points creditados</p>}
                           </div>
                        </div>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${item.status === 'COMPLETED' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                           {item.status === 'COMPLETED' ? 'Concluído' : 'Aguardando'}
                        </span>
                     </div>
                  ))}
               </div>
            </section>
         </main>

         <div className="p-6 glass-nav border-t sticky bottom-0">
            <button
               onClick={handleShare}
               className="w-full h-14 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-transform"
            >
               <span className="material-symbols-outlined">share</span> COMPARTILHAR CÓDIGO
            </button>
         </div>
      </div>
   );
};

export default ReferFriend;
