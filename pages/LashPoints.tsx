
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../services/supabase';

const LashPoints: React.FC = () => {
   const navigate = useNavigate();
   const [points, setPoints] = useState(0);
   const [redeeming, setRedeeming] = useState<string | null>(null);

   React.useEffect(() => {
      const fetchPoints = async () => {
         const { data: { user } } = await supabase.auth.getUser();
         if (user) {
            const { data } = await supabase.from('profiles').select('loyalty_points').eq('id', user.id).single();
            if (data) setPoints(data.loyalty_points || 0);
         }
      };
      fetchPoints();
   }, []);

   const rewards = [
      { id: '1', title: 'Design de Sobrancelha', points: 300, icon: 'brush' },
      { id: '2', title: 'Hidratação Lash Botox', points: 500, icon: 'water_drop' },
      { id: '3', title: 'Manutenção Cortesia', points: 1200, icon: 'auto_awesome' }
   ];

   const handleRedeem = async (reward: typeof rewards[0]) => {
      if (points >= reward.points) {
         setRedeeming(reward.id);
         try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const newPoints = points - reward.points;
            const { error } = await supabase.from('profiles').update({ loyalty_points: newPoints }).eq('id', user.id);

            if (error) throw error;

            await supabase.from('point_transactions').insert({
               user_id: user.id,
               amount: -reward.points,
               source: 'REDEMPTION',
               description: `Resgate: ${reward.title}`
            });

            setPoints(newPoints);
            alert(`Um mimo especial para você! Cupom para ${reward.title} gerado.`);
         } catch (error: any) {
            alert('Erro ao resgatar: ' + error.message);
         } finally {
            setRedeeming(null);
         }
      }
   };

   return (
      <div className="flex flex-col h-full bg-background-light">
         <header className="glass-nav p-8 flex items-center justify-between border-b">
            <button onClick={() => navigate(-1)} className="material-symbols-outlined text-primary">arrow_back_ios_new</button>
            <h2 className="font-display font-bold text-xl text-primary">Seus Lash Points ✨</h2>
            <span className="size-6"></span>
         </header>

         <main className="flex-1 p-8 space-y-12 overflow-y-auto no-scrollbar pb-32">
            {/* Card VIP Emocional */}
            <div className="bg-primary rounded-[48px] p-10 text-white relative overflow-hidden shadow-2xl shadow-primary/30">
               <div className="relative z-10 space-y-4">
                  <p className="text-[10px] uppercase font-black tracking-[0.3em] opacity-60">Você ganhou pontos ✨</p>
                  <div className="flex items-baseline gap-3">
                     <h3 className="text-7xl font-display font-bold tracking-tighter">{points}</h3>
                     <span className="text-sm font-black uppercase tracking-[0.2em] opacity-60">Lash Points</span>
                  </div>
                  <p className="text-sm italic opacity-80">Cada visita te aproxima de benefícios especiais</p>
               </div>

               <div className="mt-12 pt-10 border-t border-white/10 flex justify-between items-center relative z-10">
                  <div className="space-y-2">
                     <p className="text-[10px] uppercase font-black opacity-60">Sua jornada VIP</p>
                     <p className="font-bold text-accent-gold tracking-[0.2em] text-sm">NÍVEL DIAMANTE ✨</p>
                  </div>
                  <button onClick={() => navigate('/profile/levels')} className="size-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md">
                     <span className="material-symbols-outlined text-accent-gold !text-3xl">workspace_premium</span>
                  </button>
               </div>

               <div className="absolute -right-16 -top-16 size-80 bg-accent-gold/10 rounded-full blur-[100px]"></div>
            </div>

            <section className="space-y-8">
               <div className="text-center space-y-3">
                  <h4 className="text-2xl font-display font-bold text-primary">Mimos para você</h4>
                  <p className="text-sm text-gray-500 italic">Escolha o presente que você merece hoje 🌷</p>
               </div>

               <div className="space-y-4">
                  {rewards.map((reward) => (
                     <div key={reward.id} className={`bg-white p-8 rounded-[40px] border transition-all ${points >= reward.points ? 'border-gray-100 premium-shadow' : 'border-gray-50 opacity-50'}`}>
                        <div className="flex items-center justify-between mb-8">
                           <div className="flex items-center gap-6">
                              <div className="size-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/5">
                                 <span className="material-symbols-outlined !text-4xl">{reward.icon}</span>
                              </div>
                              <div>
                                 <p className="text-xl font-bold text-primary">{reward.title}</p>
                                 <p className="text-[11px] font-black text-accent-gold uppercase tracking-[0.2em] mt-1">{reward.points} Pontos ✨</p>
                              </div>
                           </div>
                        </div>
                        <button
                           onClick={() => handleRedeem(reward)}
                           disabled={points < reward.points || redeeming === reward.id}
                           className={`w-full h-16 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 ${points >= reward.points ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-gray-100 text-gray-400'}`}
                        >
                           {redeeming === reward.id ? <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (points >= reward.points ? 'RESGATAR MEU MIMO ✨' : 'CONTINUE SE CUIDANDO')}
                        </button>
                     </div>
                  ))}
               </div>
            </section>
         </main>
      </div>
   );
};

export default LashPoints;
