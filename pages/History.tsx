
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../services/supabase';

const History: React.FC = () => {
   const navigate = useNavigate();
   const [loading, setLoading] = React.useState(true);
   const [upcoming, setUpcoming] = React.useState<any[]>([]);
   const [past, setPast] = React.useState<any[]>([]);

   React.useEffect(() => {
      const fetchHistory = async () => {
         try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
               const today = new Date().toISOString().split('T')[0];

               // Upcoming
               const { data: up } = await supabase.from('appointments')
                  .select('*, services(name), professionals(name)')
                  .eq('user_id', user.id)
                  .gte('date', today)
                  .neq('status', 'CANCELLED')
                  .order('date', { ascending: true });

               if (up) setUpcoming(up);

               // Past
               const { data: ps } = await supabase.from('appointments')
                  .select('*, services(name, category), professionals(name)')
                  .eq('user_id', user.id)
                  .lt('date', today)
                  .order('date', { ascending: false });

               if (ps) setPast(ps);
            }
         } catch (err) {
            console.error('History fetch error:', err);
         } finally {
            setLoading(false);
         }
      };
      fetchHistory();
   }, []);

   if (loading) {
      return (
         <div className="flex h-screen items-center justify-center bg-background-light">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
         </div>
      );
   }

   return (
      <div className="flex flex-col h-full bg-background-light pb-24">
         <header className="sticky top-0 z-50 glass-nav p-6 flex items-center justify-between border-b">
            <button onClick={() => navigate('/home')} className="material-symbols-outlined text-primary">arrow_back_ios_new</button>
            <h2 className="font-display font-bold text-lg">Seus Agendamentos</h2>
            <span className="size-6"></span>
         </header>

         <main className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar">
            <div className="flex gap-4 border-b">
               <button className="pb-3 border-b-2 border-primary text-primary font-bold text-sm flex-1">Próximos</button>
               <button className="pb-3 border-b-2 border-transparent text-gray-400 font-bold text-sm flex-1">Anteriores</button>
            </div>

            <section className="space-y-6">
               <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Agendados</h3>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">{upcoming.length} Atendimento(s)</span>
               </div>

               <div className="relative pl-10 border-l border-gray-100 py-2 space-y-4">
                  {upcoming.length === 0 ? <p className="text-xs text-gray-400">Nenhum agendamento futuro.</p> : upcoming.map(item => (
                     <div key={item.id} className="relative">
                        <div className="absolute left-[-45px] top-4 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/10"></div>
                        <div onClick={() => navigate(`/history/details/${item.id}`)} className="bg-white p-6 rounded-[32px] premium-shadow border border-gray-50 active:scale-[0.98] transition-all cursor-pointer">
                           <div className="flex justify-between items-start mb-4">
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black text-accent-gold uppercase tracking-widest">{item.services?.name}</p>
                                 <h4 className="font-bold text-primary text-lg leading-tight">{item.services?.name}</h4>
                              </div>
                              <span className="bg-primary/5 text-primary text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-primary/10">{item.status}</span>
                           </div>
                           <div className="space-y-3 text-xs text-gray-500 font-medium">
                              <div className="flex items-center gap-2"><span className="material-symbols-outlined !text-sm text-accent-gold">calendar_today</span> {new Date(item.date).toLocaleDateString('pt-BR')}</div>
                              <div className="flex items-center gap-2"><span className="material-symbols-outlined !text-sm text-accent-gold">schedule</span> {item.time}</div>
                              <div className="flex items-center gap-2"><span className="material-symbols-outlined !text-sm text-accent-gold">person</span> com {item.professionals?.name}</div>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </section>

            <section className="space-y-6 pt-4">
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sua História Conosco</h3>
               <div className="space-y-4">
                  {past.length === 0 ? <p className="text-xs text-gray-400 pl-10 opacity-60">Histórico vazio.</p> : past.map((item, i) => (
                     <div key={item.id} className="relative pl-10 border-l border-gray-100 py-2 opacity-60">
                        <div className="absolute left-[-5px] top-4 w-2.5 h-2.5 rounded-full bg-gray-200"></div>
                        <div className="bg-white p-6 rounded-[32px] border border-gray-100">
                           <div className="flex justify-between items-start mb-3">
                              <div>
                                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.services?.category}</p>
                                 <h4 className="font-bold text-primary">{item.services?.name}</h4>
                              </div>
                              <span className="text-[9px] font-black text-gray-400 uppercase">{item.status}</span>
                           </div>
                           <p className="text-[10px] font-bold text-primary/40">{new Date(item.date).toLocaleDateString('pt-BR')} • {item.price ? `R$ ${item.price}` : '-'}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </section>
         </main>

         {/* Nav de 5 itens */}
         <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] glass-nav border-t border-gray-100 flex justify-around items-center py-6 px-4 z-50 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <button onClick={() => navigate('/home')} className="flex flex-col items-center gap-1.5 text-gray-400">
               <span className="material-symbols-outlined !text-3xl">home</span>
               <span className="text-[9px] font-black uppercase tracking-widest">Início</span>
            </button>
            <button onClick={() => navigate('/feed')} className="flex flex-col items-center gap-1.5 text-gray-400">
               <span className="material-symbols-outlined !text-3xl">grid_view</span>
               <span className="text-[9px] font-black uppercase tracking-widest">Feed</span>
            </button>
            <button onClick={() => navigate('/services')} className="flex flex-col items-center gap-1.5 text-gray-400">
               <span className="material-symbols-outlined !text-3xl">content_cut</span>
               <span className="text-[9px] font-black uppercase tracking-widest">Serviços</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 text-primary">
               <span className="material-symbols-outlined !text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
               <span className="text-[9px] font-black uppercase tracking-widest">Agenda</span>
            </button>
            <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1.5 text-gray-400">
               <span className="material-symbols-outlined !text-3xl">person</span>
               <span className="text-[9px] font-black uppercase tracking-widest">Perfil</span>
            </button>
         </nav>
      </div>
   );
};

export default History;
