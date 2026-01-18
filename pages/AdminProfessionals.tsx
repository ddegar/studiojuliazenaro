
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Professional } from '../types';
import { supabase } from '../services/supabase';

const AdminProfessionals: React.FC = () => {
   const navigate = useNavigate();
   const [pros, setPros] = useState<Professional[]>([]);
   const [showAdd, setShowAdd] = useState(false);
   const [newPro, setNewPro] = useState({ name: '', role: '', email: '' });
   const [isCreating, setIsCreating] = useState(false);
   const [loading, setLoading] = useState(true);

   const fetchPros = async () => {
      setLoading(true);
      try {
         const { data } = await supabase.from('professionals').select('*').order('name');
         if (data) setPros(data);
      } catch (err) {
         console.error('Fetch pros error:', err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchPros();
   }, []);

   const handleAddProfessional = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsCreating(true);

      try {
         const { data: { user: authUser } } = await supabase.auth.getUser();
         if (!authUser) throw new Error("Não autorizado");

         const { error } = await supabase.from('professionals').insert({
            name: newPro.name,
            role: newPro.role,
            active: true,
            image_url: `https://ui-avatars.com/api/?name=${newPro.name}&background=random&color=fff`,
            specialties: [],
            rating: 5.0
         });

         if (error) throw error;

         alert('Profissional criada com sucesso! ✨');
         setShowAdd(false);
         setNewPro({ name: '', role: '', email: '' });
         fetchPros();
      } catch (err: any) {
         alert('Erro ao criar: ' + err.message);
      } finally {
         setIsCreating(false);
      }
   };

   return (
      <div className="flex flex-col h-full bg-background-dark text-white pb-32">
         <header className="p-6 border-b border-white/5 flex items-center justify-between glass-nav !bg-background-dark/80 sticky top-0 z-40">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate('/admin')} className="size-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors">
                  <span className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</span>
               </button>
               <div>
                  <h1 className="text-xl font-display font-bold">Equipe Estrela</h1>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{pros.length} Profissionais Ativos</p>
               </div>
            </div>
            <button onClick={() => setShowAdd(true)} className="size-11 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/20 ring-4 ring-primary/5 active:scale-95 transition-transform">
               <span className="material-symbols-outlined">person_add</span>
            </button>
         </header>

         <main className="flex-1 p-6 space-y-4 overflow-y-auto no-scrollbar">
            {loading ? (
               <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                  <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold uppercase tracking-widest">Carregando mentes brilhantes...</p>
               </div>
            ) : pros.length === 0 ? (
               <div className="text-center py-20 space-y-4 opacity-30">
                  <span className="material-symbols-outlined !text-6xl">group_off</span>
                  <p className="font-display italic text-lg">Nenhum talento cadastrado.</p>
               </div>
            ) : pros.map(pro => (
               <div
                  key={pro.id}
                  onClick={() => navigate(`/admin/professional/${pro.id}`)}
                  className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-5 transition-all hover:border-white/10 active:scale-[0.98] group cursor-pointer"
               >
                  <div className="flex items-center gap-5">
                     <div className="size-16 rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg shadow-black/40">
                        <img src={pro.image_url || pro.imageUrl || `https://ui-avatars.com/api/?name=${pro.name}&background=random`} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={pro.name} />
                     </div>
                     <div className="flex-1">
                        <h4 className="font-bold text-base text-white group-hover:text-accent-gold transition-colors">{pro.name}</h4>
                        <p className="text-[10px] text-accent-gold font-black uppercase tracking-[0.2em] mt-0.5">{pro.role}</p>
                     </div>
                     <div className={`px-3 py-1.5 rounded-full border-2 ${pro.active ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-gray-500/10 border-gray-500/20'}`}>
                        <span className={`text-[8px] font-black uppercase tracking-widest ${pro.active ? 'text-emerald-500' : 'text-gray-500'}`}>{pro.active ? 'ON' : 'OFF'}</span>
                     </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                     <div className="flex items-center gap-1.5 opacity-40">
                        <span className="material-symbols-outlined !text-xs">id_card</span>
                        <span className="text-[9px] font-mono tracking-tighter uppercase">{pro.id.split('-')[0]}</span>
                     </div>
                     <div className="flex items-center gap-1 text-accent-gold">
                        <span className="material-symbols-outlined !text-sm">star</span>
                        <span className="text-[10px] font-black">{pro.rating?.toFixed(1) || '5.0'}</span>
                     </div>
                  </div>
               </div>
            ))}
         </main>

         {showAdd && (
            <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md animate-fade-in">
               <div className="fixed inset-0" onClick={() => setShowAdd(false)}></div>
               <form onSubmit={handleAddProfessional} className="bg-card-dark w-full max-w-sm rounded-[40px] p-10 border border-white/10 space-y-8 animate-slide-up relative z-10 shadow-2xl">
                  <div className="flex justify-between items-center">
                     <div>
                        <h2 className="text-2xl font-display font-bold">Novo Talento</h2>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">Expansão de Equipe</p>
                     </div>
                     <button type="button" onClick={() => setShowAdd(false)} className="size-10 flex items-center justify-center rounded-full bg-white/5 text-gray-500 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-1">Nome da Profissional</label>
                        <input required placeholder="Ex: Julia Zenaro" className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold focus:ring-primary outline-none" value={newPro.name} onChange={e => setNewPro({ ...newPro, name: e.target.value })} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-1">Especialidade / Cargo</label>
                        <input required placeholder="Ex: Lash Designer Master" className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm focus:ring-primary outline-none italic" value={newPro.role} onChange={e => setNewPro({ ...newPro, role: e.target.value })} />
                     </div>
                  </div>

                  <button disabled={isCreating} type="submit" className="w-full h-18 bg-primary text-white rounded-[24px] font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl shadow-primary/30 active:scale-95 transition-all disabled:opacity-50">
                     {isCreating ? <div className="size-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'CRIAR PERFIL ✨'}
                  </button>
               </form>
            </div>
         )}
      </div>
   );
};

export default AdminProfessionals;
