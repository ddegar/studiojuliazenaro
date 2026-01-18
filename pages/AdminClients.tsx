
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const AdminClients: React.FC = () => {
   const navigate = useNavigate();
   const [search, setSearch] = useState('');
   const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'VIPS'>('ALL');
   const [clients, setClients] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      fetchClients();
   }, []);

   const fetchClients = async () => {
      setLoading(true);
      const { data, error } = await supabase
         .from('profiles')
         .select(`
            *,
            preferences,
            appointments (
                date,
                professional_name
            )
         `)
         .order('name');

      if (error) {
         console.error(error);
         setLoading(false);
         return;
      }

      const formatted = data.map((p: any) => {
         const appts = p.appointments?.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];
         const lastAppt = appts[0];
         const points = p.lash_points || 0;

         let status = 'Silver';
         if (points > 500) status = 'Ouro';
         if (points > 1000) status = 'Diamante';

         return {
            id: p.id,
            name: p.name || 'Sem Nome',
            status,
            points,
            last: lastAppt ? new Date(lastAppt.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Novo',
            pro: lastAppt?.professional_name || '-',
            phone: p.phone || '-',
            img: p.avatar_url || `https://ui-avatars.com/api/?name=${p.name}&background=random`,
            active: lastAppt ? (new Date().getTime() - new Date(lastAppt.date).getTime()) < 30 * 24 * 60 * 60 * 1000 : false,
            preferences: p.preferences
         };
      });

      setClients(formatted);
      setLoading(false);
   };

   const filteredClients = clients.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
         c.phone.toLowerCase().includes(search.toLowerCase());
      if (filter === 'ACTIVE') return matchesSearch && c.active;
      if (filter === 'VIPS') return matchesSearch && c.status === 'Diamante';
      return matchesSearch;
   });

   return (
      <div className="flex flex-col h-full bg-background-dark text-white pb-32">
         <header className="sticky top-0 z-50 glass-nav !bg-background-dark/80 p-6 border-b border-white/5 space-y-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <button onClick={() => navigate('/admin')} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
                  <div>
                     <h1 className="text-xl font-display font-bold">Gestão de Clientes</h1>
                     <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{clients.length} Cadastradas</p>
                  </div>
               </div>
               <button className="size-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">person_add</span>
               </button>
            </div>

            <div className="space-y-4">
               <div className="relative">
                  <input
                     type="text"
                     placeholder="Buscar por nome ou celular..."
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-14 text-sm focus:ring-accent-gold focus:border-accent-gold transition-all"
                  />
                  <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-gray-500">search</span>
               </div>

               <div className="flex gap-2">
                  <button onClick={() => setFilter('ALL')} className={`flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${filter === 'ALL' ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}>Todas</button>
                  <button onClick={() => setFilter('ACTIVE')} className={`flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${filter === 'ACTIVE' ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}>Ativas</button>
                  <button onClick={() => setFilter('VIPS')} className={`flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${filter === 'VIPS' ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}>VIPs</button>
               </div>
            </div>
         </header>

         <main className="flex-1 p-4 space-y-3 overflow-y-auto no-scrollbar">
            {loading ? <p className="text-center text-gray-500 py-10">Carregando...</p> : filteredClients.map(client => (
               <div
                  key={client.id}
                  onClick={() => navigate(`/admin/client/${client.id}`)}
                  className="bg-card-dark p-5 rounded-[32px] border border-white/5 flex items-center justify-between active:scale-[0.98] transition-all group hover:bg-white/5 cursor-pointer"
               >
                  <div className="flex items-center gap-4">
                     <div className={`size-14 rounded-2xl overflow-hidden border-2 p-0.5 transition-all ${client.status === 'Diamante' ? 'border-accent-gold' : 'border-primary/20'}`}>
                        <img src={client.img} alt={client.name} className="w-full h-full object-cover rounded-xl" />
                     </div>
                     <div className="space-y-1">
                        <h4 className="font-bold text-sm leading-tight text-white group-hover:text-accent-gold transition-colors">{client.name}</h4>
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-2">
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${client.status === 'Diamante' ? 'bg-accent-gold text-primary shadow-lg shadow-accent-gold/20' : 'bg-white/10 text-gray-400'}`}>{client.status}</span>
                              <span className="text-[9px] text-gray-500 font-bold uppercase">{client.points} pts</span>
                           </div>
                           {client.preferences && (
                              <div className="flex flex-wrap gap-1">
                                 {Object.entries(client.preferences).slice(0, 3).map(([k, v]) => (
                                    <span key={k} className="text-[7px] text-accent-gold/50 font-bold uppercase border border-accent-gold/20 px-1 rounded-sm">{String(v)}</span>
                                 ))}
                              </div>
                           )}
                           <p className="text-[9px] text-gray-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">Último: {client.last} com {client.pro}</p>
                        </div>
                     </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                     <div className={`size-2 rounded-full ${client.active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-600'}`}></div>
                     <span className="material-symbols-outlined text-gray-700 !text-sm">chevron_right</span>
                  </div>
               </div>
            ))}

            {!loading && filteredClients.length === 0 && (
               <div className="py-20 text-center opacity-20">
                  <span className="material-symbols-outlined !text-6xl">person_search</span>
                  <p className="mt-4 font-bold text-sm">Nenhuma cliente encontrada.</p>
               </div>
            )}
         </main>

         <nav className="fixed bottom-0 inset-x-0 bg-background-dark/95 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex justify-between items-center z-50 rounded-t-[32px]">
            <button onClick={() => navigate('/admin')} className="flex flex-col items-center gap-1.5 text-gray-500">
               <span className="material-symbols-outlined !text-3xl">grid_view</span>
               <span className="text-[8px] font-black uppercase tracking-widest">Painel</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 text-accent-gold">
               <span className="material-symbols-outlined !text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
               <span className="text-[8px] font-black uppercase tracking-widest">Clientes</span>
            </button>
            <div className="relative -top-8">
               <button onClick={() => navigate('/admin/content')} className="size-16 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 border-4 border-background-dark">
                  <span className="material-symbols-outlined text-white !text-4xl">add</span>
               </button>
            </div>
            <button onClick={() => navigate('/admin/agenda')} className="flex flex-col items-center gap-1.5 text-gray-500">
               <span className="material-symbols-outlined !text-3xl">calendar_month</span>
               <span className="text-[8px] font-black uppercase tracking-widest">Agenda</span>
            </button>
            <button onClick={() => navigate('/admin/finance')} className="flex flex-col items-center gap-1.5 text-gray-500">
               <span className="material-symbols-outlined !text-3xl">payments</span>
               <span className="text-[8px] font-black uppercase tracking-widest">Caixa</span>
            </button>
         </nav>
      </div>
   );
};

export default AdminClients;
