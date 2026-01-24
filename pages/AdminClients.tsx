
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import AdminBottomNav from '../components/AdminBottomNav';

const AdminClients: React.FC = () => {
   const navigate = useNavigate();
   const [search, setSearch] = useState('');
   const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'VIPS'>('ALL');
   const [clients, setClients] = useState<any[]>([]);
   const [levels, setLevels] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      fetchClients();
   }, []);

   const calculateTier = (points: number, currentLevels: any[]) => {
      if (currentLevels.length === 0) return 'Membro';
      const sortedLevels = [...currentLevels].sort((a, b) => b.min_points - a.min_points);
      const match = sortedLevels.find(l => points >= l.min_points);
      return match ? match.name : 'Membro';
   };

   const fetchClients = async () => {
      setLoading(true);
      try {
         const [clientsRes, levelsRes] = await Promise.all([
            supabase.from('profiles').select(`*, appointments (date, professional_name)`).eq('role', 'CLIENT').order('name'),
            supabase.from('loyalty_tiers').select('*').order('min_points', { ascending: true })
         ]);

         if (clientsRes.error) throw clientsRes.error;
         const fetchedLevels = levelsRes.data || [];
         setLevels(fetchedLevels);

         const formatted = (clientsRes.data || []).map((p: any) => {
            const appts = p.appointments?.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];
            const lastAppt = appts[0];
            const points = p.lash_points || 0;
            const tier = calculateTier(points, fetchedLevels);

            return {
               id: p.id,
               name: p.name || 'Sem Nome',
               status: tier,
               points,
               last: (lastAppt && !isNaN(new Date(lastAppt.date).getTime()))
                  ? new Date(lastAppt.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                  : 'Acervo Novo',
               pro: lastAppt?.professional_name || '—',
               phone: p.phone || '—',
               img: p.avatar_url || `https://ui-avatars.com/api/?name=${p.name}&background=0f3e29&color=C9A961`,
               active: lastAppt ? (new Date().getTime() - new Date(lastAppt.date + 'T00:00:00').getTime()) < 30 * 24 * 60 * 60 * 1000 : false,
            };
         });

         setClients(formatted);
      } catch (err) {
         console.error('Error fetching clients:', err);
      } finally {
         setLoading(false);
      }
   };

   const filteredClients = clients.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
         c.phone.toLowerCase().includes(search.toLowerCase());
      if (filter === 'ACTIVE') return matchesSearch && c.active;
      if (filter === 'VIPS') {
         const tierUpper = c.status.toUpperCase();
         return matchesSearch && (tierUpper === 'PRIVÉ' || tierUpper === 'SIGNATURE' || tierUpper === 'DIAMANTE');
      }
      return matchesSearch;
   });

   return (
      <div className="flex flex-col min-h-screen bg-background-dark text-white font-outfit antialiased selection:bg-accent-gold/20 selection:text-white">
         <header className="relative z-[60] premium-blur-dark sticky top-0 px-8 py-10 flex flex-col gap-8 border-b border-white/5 bg-background-dark/80 backdrop-blur-xl">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <button
                     onClick={() => navigate('/admin')}
                     className="size-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-accent-gold group active:scale-95 transition-all"
                  >
                     <span className="material-symbols-outlined !text-xl group-hover:-translate-x-1 transition-transform">west</span>
                  </button>
                  <div className="space-y-1">
                     <p className="text-[8px] font-black uppercase tracking-[0.5em] text-accent-gold/40 leading-none">Concierge CRM</p>
                     <h1 className="font-display italic text-2xl text-white">Diretório de Membros</h1>
                  </div>
               </div>

               <button
                  onClick={() => navigate('/admin/clients/new')}
                  className="size-12 rounded-2xl bg-accent-gold flex items-center justify-center text-primary shadow-huge active:scale-90 transition-all"
               >
                  <span className="material-symbols-outlined">person_add</span>
               </button>
            </div>

            <div className="space-y-6">
               <div className="relative group/search">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/search:text-accent-gold transition-colors">
                     <span className="material-symbols-outlined !text-xl">search</span>
                  </div>
                  <input
                     type="text"
                     placeholder="Buscar por nome ou identidade..."
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     className="w-full h-18 bg-surface-dark border border-white/5 rounded-[28px] pl-16 pr-8 text-sm focus:border-accent-gold/40 outline-none transition-all placeholder:text-white/10 shadow-huge"
                  />
               </div>

               <div className="flex bg-white/5 p-2 rounded-3xl border border-white/10 shadow-lg">
                  {['ALL', 'ACTIVE', 'VIPS'].map((f) => (
                     <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`flex-1 h-12 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${filter === f ? 'bg-white text-primary shadow-huge' : 'text-white/20 hover:text-white/40'}`}
                     >
                        {f === 'ALL' ? 'Total' : f === 'ACTIVE' ? 'Ativos' : 'Elite'}
                     </button>
                  ))}
               </div>
            </div>
         </header>

         <main className="relative z-10 p-8 lg:p-12 space-y-6 pb-48 w-full max-w-screen-xl mx-auto overflow-x-hidden">
            {loading ? (
               <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-50 animate-pulse">
                  <div className="size-10 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando Banco de Dados...</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-reveal">
                  {filteredClients.map(client => (
                     <div
                        key={client.id}
                        onClick={() => navigate(`/admin/client/${client.id}`)}
                        className="relative group bg-surface-dark/40 border border-white/5 rounded-[40px] p-6 flex flex-col gap-6 hover:border-accent-gold/20 hover:bg-surface-dark transition-all duration-700 cursor-pointer overflow-hidden shadow-huge active:scale-[0.98]"
                     >
                        <div className="flex justify-between items-start relative z-10">
                           <div className="flex items-center gap-5">
                              <div className={`size-16 rounded-2xl overflow-hidden border transition-all duration-700 ${client.status === 'Diamante' || client.status === 'Privé' ? 'border-accent-gold p-0.5' : 'border-white/10'}`}>
                                 <img src={client.img} alt="" className="w-full h-full object-cover rounded-xl" />
                              </div>
                              <div className="space-y-1">
                                 <h4 className="font-bold text-sm leading-tight text-white group-hover:text-accent-gold transition-colors">{client.name}</h4>
                                 <div className="flex items-center gap-2">
                                    <span className="bg-white/5 text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-full border border-white/5 text-white/40">{client.status}</span>
                                    <div className="size-1 rounded-full bg-white/10"></div>
                                    <span className="text-[8px] text-accent-gold font-black uppercase tracking-widest">{client.points} pts</span>
                                 </div>
                              </div>
                           </div>
                           <div className={`size-2.5 rounded-full shadow-lg ${client.active ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-white/10 opacity-20'}`}></div>
                        </div>

                        <div className="pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                           <div className="flex flex-col gap-0.5">
                              <p className="text-[7px] font-black text-white/10 uppercase tracking-widest">Atendimento de Elite</p>
                              <p className="text-[10px] text-white/40 font-medium italic truncate max-w-[180px]">{client.last} • {client.pro}</p>
                           </div>
                           <span className="material-symbols-outlined text-white/10 group-hover:text-accent-gold group-hover:translate-x-1 transition-all">chevron_right</span>
                        </div>

                        {/* Shadow Decor */}
                        <div className="absolute -bottom-8 -right-8 size-24 bg-accent-gold/5 blur-3xl rounded-full group-hover:bg-accent-gold/10 transition-all duration-700"></div>
                     </div>
                  ))}
               </div>
            )}

            {!loading && filteredClients.length === 0 && (
               <div className="py-40 text-center space-y-6 opacity-20 animate-fade-in">
                  <span className="material-symbols-outlined !text-7xl">person_search</span>
                  <div className="space-y-1">
                     <p className="font-display italic text-2xl">Vazio no momento</p>
                     <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma cliente identificada neste filtro</p>
                  </div>
               </div>
            )}
         </main>

         <div className="lg:hidden">
            <AdminBottomNav />
         </div>

         {/* Elite Background Layout */}
         <div className="fixed top-0 right-0 w-[40vw] h-[40vh] bg-accent-gold/5 blur-[120px] pointer-events-none z-0"></div>
         <div className="fixed bottom-0 left-0 w-[40vw] h-[40vh] bg-primary/20 blur-[120px] pointer-events-none z-0 opacity-40"></div>
      </div>
   );
};

export default AdminClients;
