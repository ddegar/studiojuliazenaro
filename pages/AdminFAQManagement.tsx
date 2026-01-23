
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FAQ } from '../types';
import { supabase } from '../services/supabase';

const AdminFAQManagement: React.FC = () => {
   const navigate = useNavigate();
   const [faqs, setFaqs] = useState<FAQ[]>([]);
   const [categories, setCategories] = useState<any[]>([]);
   const [editing, setEditing] = useState<Partial<FAQ> | null>(null);
   const [showCategoryManager, setShowCategoryManager] = useState(false);
   const [newCategoryName, setNewCategoryName] = useState('');
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      fetchInitialData();
   }, []);

   const fetchInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchFaqs(), fetchCategories()]);
      setLoading(false);
   };

   const fetchCategories = async () => {
      const { data } = await supabase.from('faq_categories').select('*').order('display_order', { ascending: true });
      if (data) setCategories(data);
   };

   const fetchFaqs = async () => {
      try {
         setLoading(true);
         const { data, error } = await supabase.from('faqs').select('*').order('display_order', { ascending: true });
         if (error) throw error;
         setFaqs(data || []);
      } catch (error) {
         console.error('Error fetching FAQs:', error);
      } finally {
         setLoading(false);
      }
   };

   const handleSave = async () => {
      if (!editing?.question || !editing?.answer) return;

      try {
         const payload = {
            question: editing.question,
            answer: editing.answer,
            category: editing.category || 'GENERAL',
            display_order: faqs.length + 1,
            active: true
         };

         if (editing.id) {
            const { error: updateError } = await supabase.from('faqs').update(payload).eq('id', editing.id);
            if (updateError) throw updateError;
         } else {
            const { error: insertError } = await supabase.from('faqs').insert(payload);
            if (insertError) throw insertError;
         }

         await fetchFaqs();
         setEditing(null);
         alert('FAQ salvo com sucesso! ✨');
      } catch (error: any) {
         alert(`Erro ao salvar FAQ: ${error.message || 'Erro desconhecido'}`);
         console.error(error);
      }
   };

   const handleAddCategory = async () => {
      if (!newCategoryName.trim()) return;
      try {
         const { error } = await supabase.from('faq_categories').insert({ name: newCategoryName.toUpperCase() });
         if (error) throw error;
         setNewCategoryName('');
         fetchCategories();
      } catch (error: any) {
         alert('Erro ao criar categoria: ' + error.message);
      }
   };

   const handleDeleteCategory = async (id: string) => {
      if (!confirm('Excluir esta categoria? FAQs vinculadas podem parar de aparecer corretamente.')) return;
      try {
         const { error } = await supabase.from('faq_categories').delete().eq('id', id);
         if (error) throw error;
         fetchCategories();
      } catch (error: any) {
         alert('Erro ao excluir categoria: ' + error.message);
      }
   };

   const handleDelete = async (id: string) => {
      if (!confirm('Tem certeza que deseja excluir?')) return;
      try {
         await supabase.from('faqs').delete().eq('id', id);
         setFaqs(faqs.filter(f => f.id !== id));
      } catch (error) {
         console.error(error);
      }
   };

   return (
      <div className="flex flex-col h-full bg-background-dark text-white">
         <header className="p-4 lg:px-6 border-b border-white/5 flex items-center justify-center glass-nav !bg-background-dark/80">
            <div className="w-full max-w-7xl flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <button onClick={() => navigate(-1)} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
                  <h1 className="text-lg font-bold">Gestão de FAQ</h1>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => setShowCategoryManager(true)} className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                     <span className="material-symbols-outlined !text-sm text-accent-gold">style</span>
                  </button>
                  <button onClick={() => setEditing({ category: categories[0]?.name || 'GERAL' as any })} className="size-10 rounded-full bg-primary flex items-center justify-center">
                     <span className="material-symbols-outlined">add</span>
                  </button>
               </div>
            </div>
         </header>

         {showCategoryManager && (
            <div className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-6 backdrop-blur-md">
               <div className="bg-card-dark w-full max-w-sm rounded-[40px] p-8 border border-white/10 space-y-6">
                  <header className="flex justify-between items-center">
                     <h3 className="text-lg font-display font-bold">Categorias do FAQ</h3>
                     <button onClick={() => setShowCategoryManager(false)} className="text-gray-500 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </header>

                  <div className="flex gap-2">
                     <input
                        className="flex-1 bg-white/5 border-white/10 rounded-xl px-4 text-sm outline-none"
                        placeholder="Nome (ex: Manutenção)"
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                     />
                     <button onClick={handleAddCategory} className="bg-primary px-4 rounded-xl font-bold text-[10px] uppercase">Add</button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                     {categories.map(cat => (
                        <div key={cat.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                           <span className="text-xs font-bold text-gray-300">{cat.name}</span>
                           <button onClick={() => handleDeleteCategory(cat.id)} className="text-rose-500/50 hover:text-rose-500 transition-colors">
                              <span className="material-symbols-outlined !text-sm">delete_sweep</span>
                           </button>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}

         <main className="flex-1 p-6 lg:p-6 w-full max-w-7xl mx-auto space-y-4 overflow-y-auto no-scrollbar pb-32">
            {loading ? <p className="text-center text-gray-500">Carregando...</p> : faqs.map(faq => (
               <div key={faq.id} className="bg-card-dark p-5 rounded-3xl border border-white/5 space-y-3">
                  <div className="flex justify-between items-start">
                     <div className="space-y-1">
                        <span className="text-[9px] font-bold text-accent-gold uppercase tracking-[0.2em]">{faq.category}</span>
                        <h3 className="font-bold text-sm">{faq.question}</h3>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => setEditing(faq)} className="text-gray-500 hover:text-accent-gold">
                           <span className="material-symbols-outlined !text-sm">edit</span>
                        </button>
                        <button onClick={() => handleDelete(faq.id)} className="text-gray-500 hover:text-rose-500">
                           <span className="material-symbols-outlined !text-sm">delete</span>
                        </button>
                     </div>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2 italic">{faq.answer}</p>
               </div>
            ))}
            {!loading && faqs.length === 0 && <p className="text-center text-gray-600 text-sm italic">Nenhuma pergunta cadastrada.</p>}
         </main>

         {editing && (
            <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm">
               <div className="bg-card-dark w-full max-w-sm rounded-[40px] p-8 border border-white/10 space-y-6">
                  <h2 className="text-xl font-display font-bold">{editing.id ? 'Editar Pergunta' : 'Nova Pergunta'}</h2>
                  <div className="space-y-4">
                     <input
                        type="text"
                        placeholder="A pergunta..."
                        className="w-full h-12 bg-white/5 border-white/10 rounded-xl px-4 text-sm focus:ring-1 focus:ring-accent-gold outline-none"
                        value={editing.question || ''}
                        onChange={e => setEditing({ ...editing, question: e.target.value })}
                     />
                     <textarea
                        placeholder="A resposta explicativa..."
                        className="w-full h-32 bg-white/5 border-white/10 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-accent-gold outline-none"
                        value={editing.answer || ''}
                        onChange={e => setEditing({ ...editing, answer: e.target.value })}
                     />
                     <select
                        className="w-full h-12 bg-white/5 border-white/10 rounded-xl px-4 text-sm outline-none"
                        value={editing.category || (categories[0]?.name || 'GERAL')}
                        onChange={e => setEditing({ ...editing, category: e.target.value as any })}
                     >
                        {categories.map(cat => (
                           <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                     </select>
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

export default AdminFAQManagement;
