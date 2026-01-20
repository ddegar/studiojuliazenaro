
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tip } from '../types';
import { supabase } from '../services/supabase';

const AdminTipsManagement: React.FC = () => {
   const navigate = useNavigate();
   const [tips, setTips] = useState<Tip[]>([]);
   const [editing, setEditing] = useState<Partial<Tip> | null>(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      fetchTips();
   }, []);

   const fetchTips = async () => {
      try {
         setLoading(true);
         const { data: { user: authUser } } = await supabase.auth.getUser();
         const { data: profile } = await supabase.from('profiles').select('id, role').eq('id', authUser?.id).single();
         const isMaster = ['MASTER_ADMIN', 'ADMIN', 'PROFESSIONAL_ADMIN'].includes(profile?.role || '');

         let { data, error } = await supabase.from('tips').select('*').order('created_at', { ascending: false });
         if (error) throw error;

         if (!isMaster) {
            // Filter tips linked to services of this specific professional
            const { data: pro } = await supabase.from('professionals').select('id').eq('email', authUser?.email).single();
            if (pro) {
               const { data: myServices } = await supabase.from('services').select('id').contains('professional_ids', [pro.id]);
               const myServIds = myServices?.map(s => s.id) || [];
               data = (data || []).filter(t =>
                  Array.isArray(t.service_ids) && t.service_ids.some((id: string) => myServIds.includes(id))
               );
            } else {
               data = [];
            }
         }

         setTips(data || []);
      } catch (error) {
         console.error('Error fetching tips:', error);
      } finally {
         setLoading(false);
      }
   };

   const handleSave = async () => {
      if (!editing?.title || !editing?.content) return;

      try {
         const payload = {
            title: editing.title,
            content: editing.content,
            type: editing.type || 'PRE_CARE',
            active: true,
            // icon: editing.icon (future implementation)
         };

         if (editing.id) {
            await supabase.from('tips').update(payload).eq('id', editing.id);
         } else {
            await supabase.from('tips').insert(payload);
         }

         await fetchTips();
         setEditing(null);
      } catch (error) {
         alert('Erro ao salvar dica');
         console.error(error);
      }
   };

   const handleDelete = async (id: string) => {
      if (!confirm('Tem certeza que deseja excluir?')) return;
      try {
         await supabase.from('tips').delete().eq('id', id);
         setTips(tips.filter(t => t.id !== id));
      } catch (error) {
         console.error(error);
      }
   };

   return (
      <div className="flex flex-col h-full bg-background-dark text-white">
         <header className="p-4 border-b border-white/5 flex items-center justify-between glass-nav !bg-background-dark/80">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate(-1)} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
               <h1 className="text-lg font-bold">Dicas de Cuidado</h1>
            </div>
            <button onClick={() => setEditing({ type: 'PRE_CARE' })} className="size-10 rounded-full bg-primary flex items-center justify-center">
               <span className="material-symbols-outlined">add</span>
            </button>
         </header>

         <main className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar pb-32">
            {loading ? <p className="text-center text-gray-500">Carregando...</p> : (
               <>
                  <section className="space-y-4">
                     <h3 className="text-xs font-bold text-accent-gold uppercase tracking-[0.3em] px-2">Pré-Procedimento</h3>
                     <div className="space-y-3">
                        {tips.filter(t => t.type === 'PRE_CARE').map(tip => (
                           <div key={tip.id} className="bg-card-dark p-5 rounded-3xl border border-white/5 flex justify-between items-center group">
                              <div className="flex-1">
                                 <h4 className="font-bold text-sm">{tip.title}</h4>
                                 <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{tip.content}</p>
                              </div>
                              <div className="flex gap-2 ml-4">
                                 <button onClick={() => setEditing(tip)} className="size-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:bg-white/10 transition-colors">
                                    <span className="material-symbols-outlined !text-sm">edit</span>
                                 </button>
                                 <button onClick={() => handleDelete(tip.id)} className="size-8 rounded-full bg-white/5 flex items-center justify-center text-rose-500 hover:bg-rose-500/10 transition-colors">
                                    <span className="material-symbols-outlined !text-sm">delete</span>
                                 </button>
                              </div>
                           </div>
                        ))}
                        {tips.filter(t => t.type === 'PRE_CARE').length === 0 && <p className="text-[10px] text-gray-600 text-center italic">Nenhuma dica cadastrada.</p>}
                     </div>
                  </section>

                  <section className="space-y-4">
                     <h3 className="text-xs font-bold text-accent-gold uppercase tracking-[0.3em] px-2">Pós-Procedimento</h3>
                     <div className="space-y-3">
                        {tips.filter(t => t.type === 'POST_CARE').map(tip => (
                           <div key={tip.id} className="bg-card-dark p-5 rounded-3xl border border-white/5 flex justify-between items-center group">
                              <div className="flex-1">
                                 <h4 className="font-bold text-sm">{tip.title}</h4>
                                 <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{tip.content}</p>
                              </div>
                              <div className="flex gap-2 ml-4">
                                 <button onClick={() => setEditing(tip)} className="size-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:bg-white/10 transition-colors">
                                    <span className="material-symbols-outlined !text-sm">edit</span>
                                 </button>
                                 <button onClick={() => handleDelete(tip.id)} className="size-8 rounded-full bg-white/5 flex items-center justify-center text-rose-500 hover:bg-rose-500/10 transition-colors">
                                    <span className="material-symbols-outlined !text-sm">delete</span>
                                 </button>
                              </div>
                           </div>
                        ))}
                        {tips.filter(t => t.type === 'POST_CARE').length === 0 && <p className="text-[10px] text-gray-600 text-center italic">Nenhuma dica cadastrada.</p>}
                     </div>
                  </section>
               </>
            )}
         </main>

         {editing && (
            <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm">
               <div className="bg-card-dark w-full max-w-sm rounded-[40px] p-8 border border-white/10 space-y-6">
                  <h2 className="text-xl font-display font-bold">{editing.id ? 'Editar Dica' : 'Nova Dica'}</h2>
                  <div className="space-y-4">
                     <input
                        type="text"
                        placeholder="Título da dica..."
                        className="w-full h-12 bg-white/5 border-white/10 rounded-xl px-4 text-sm focus:ring-1 focus:ring-accent-gold outline-none"
                        value={editing.title || ''}
                        onChange={e => setEditing({ ...editing, title: e.target.value })}
                     />
                     <textarea
                        placeholder="Conteúdo detalhado..."
                        className="w-full h-32 bg-white/5 border-white/10 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-accent-gold outline-none"
                        value={editing.content || ''}
                        onChange={e => setEditing({ ...editing, content: e.target.value })}
                     />
                     <div className="flex bg-white/5 p-1 rounded-xl">
                        <button
                           onClick={() => setEditing({ ...editing, type: 'PRE_CARE' })}
                           className={`flex-1 h-10 rounded-lg text-[10px] font-bold uppercase transition-all ${editing.type === 'PRE_CARE' ? 'bg-primary text-white' : 'text-gray-500'}`}
                        >Pré-Procedimento</button>
                        <button
                           onClick={() => setEditing({ ...editing, type: 'POST_CARE' })}
                           className={`flex-1 h-10 rounded-lg text-[10px] font-bold uppercase transition-all ${editing.type === 'POST_CARE' ? 'bg-primary text-white' : 'text-gray-500'}`}
                        >Pós-Procedimento</button>
                     </div>
                  </div>
                  <div className="flex gap-3">
                     <button onClick={() => setEditing(null)} className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest">Cancelar</button>
                     <button onClick={handleSave} className="flex-1 h-12 rounded-xl bg-primary text-white text-[10px] font-bold uppercase tracking-widest">Salvar</button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default AdminTipsManagement;
