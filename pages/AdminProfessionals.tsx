
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

   const fetchPros = async () => {
      const { data } = await supabase.from('professionals').select('*').order('name');
      if (data) setPros(data);
   };

   useEffect(() => {
      fetchPros();
   }, []);

   const handleAddProfessional = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsCreating(true);

      // 1. Create Professional Record
      const { data, error } = await supabase.from('professionals').insert({
         name: newPro.name,
         role: newPro.role,
         active: true,
         image_url: `https://ui-avatars.com/api/?name=${newPro.name}&background=random`, // Placeholder
         specialties: [],
         rating: 5.0
      }).select().single();

      if (error) {
         alert('Erro ao criar profissional: ' + error.message);
      } else {
         alert('Profissional criado com sucesso!');
         setShowAdd(false);
         setNewPro({ name: '', role: '', email: '' });
         fetchPros();
      }

      setIsCreating(false);
   };

   return (
      <div className="flex flex-col h-full bg-background-dark text-white pb-32">
         <header className="p-4 border-b border-white/5 flex items-center justify-between glass-nav !bg-background-dark/80">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate('/admin')} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
               <h1 className="text-lg font-bold">Equipe do Estúdio</h1>
            </div>
            <button onClick={() => setShowAdd(true)} className="size-10 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
               <span className="material-symbols-outlined">person_add</span>
            </button>
         </header>

         <main className="flex-1 p-6 space-y-4 overflow-y-auto no-scrollbar">
            {pros.length === 0 ? <p className="text-gray-500 text-center mt-10">Nenhum profissional cadastrado.</p> : pros.map(pro => (
               <div key={pro.id} className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-4">
                  <div className="flex items-center gap-4">
                     <img src={pro.imageUrl || pro.avatar || 'https://via.placeholder.com/100'} className="size-14 rounded-2xl object-cover" alt={pro.name} />
                     <div className="flex-1">
                        <h4 className="font-bold text-base">{pro.name}</h4>
                        <p className="text-[10px] text-accent-gold font-bold uppercase tracking-widest">{pro.role}</p>
                     </div>
                     <div className={`px-3 py-1 rounded-full border ${pro.active ? 'bg-primary/10 border-primary/20' : 'bg-gray-500/10 border-gray-500/20'}`}>
                        <span className={`text-[8px] font-black uppercase ${pro.active ? 'text-primary' : 'text-gray-500'}`}>{pro.active ? 'ATIVO' : 'INATIVO'}</span>
                     </div>
                  </div>
                  <div className="pt-4 border-t border-white/5 flex justify-between">
                     {/* Bots de ação futuramente podem ser implementados */}
                     <span className="text-[10px] text-gray-600">ID: {pro.id.split('-')[0]}...</span>
                  </div>
               </div>
            ))}
         </main>

         {showAdd && (
            <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md">
               <form onSubmit={handleAddProfessional} className="bg-card-dark w-full max-w-sm rounded-[40px] p-8 border border-white/10 space-y-6 animate-slide-up">
                  <div className="flex justify-between items-center">
                     <h2 className="text-xl font-display font-bold">Nova Profissional</h2>
                     <button type="button" onClick={() => setShowAdd(false)} className="material-symbols-outlined text-gray-500">close</button>
                  </div>

                  <p className="text-[10px] text-accent-gold uppercase font-bold text-center border-b border-accent-gold/10 pb-4">
                     O sistema gerará um perfil padrão.
                  </p>

                  <div className="space-y-4">
                     <input required placeholder="Nome Completo" className="w-full h-12 bg-white/5 border-white/10 rounded-xl px-4 text-sm" value={newPro.name} onChange={e => setNewPro({ ...newPro, name: e.target.value })} />
                     <input required placeholder="Cargo (Ex: Lash Specialist)" className="w-full h-12 bg-white/5 border-white/10 rounded-xl px-4 text-sm" value={newPro.role} onChange={e => setNewPro({ ...newPro, role: e.target.value })} />
                     {/* Email removido pois criação de usuário auth é separado */}
                  </div>

                  <button disabled={isCreating} type="submit" className="w-full h-14 bg-primary text-white rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                     {isCreating ? <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'CRIAR PERFIL'}
                  </button>
               </form>
            </div>
         )}
      </div>
   );
};

export default AdminProfessionals;
