
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const AdminContentCreator: React.FC = () => {
   const navigate = useNavigate();
   const [contentType, setContentType] = useState<'STORY' | 'POST'>('POST');
   const [loading, setLoading] = useState(false);
   const [success, setSuccess] = useState(false);
   const [file, setFile] = useState<File | null>(null);
   const [caption, setCaption] = useState('');
   const [services, setServices] = useState<any[]>([]);
   const [selectedServiceId, setSelectedServiceId] = useState('');
   const [categories, setCategories] = useState<any[]>([]);
   const [selectedCategory, setSelectedCategory] = useState('Geral');
   const [newCategoryName, setNewCategoryName] = useState('');
   const [isManagingCategories, setIsManagingCategories] = useState(false);

   useEffect(() => {
      fetchServices();
      fetchCategories();
   }, []);

   const fetchServices = async () => {
      const { data } = await supabase.from('services').select('id, name').eq('active', true);
      if (data) setServices(data);
   };

   const fetchCategories = async () => {
      const { data } = await supabase.from('feed_categories').select('*').order('name');
      if (data) setCategories(data);
   };

   const handleAddCategory = async () => {
      if (!newCategoryName.trim()) return;
      try {
         const { error } = await supabase.from('feed_categories').insert({ name: newCategoryName.trim() });
         if (error) throw error;
         setNewCategoryName('');
         fetchCategories();
      } catch (err: any) {
         alert('Erro ao adicionar categoria: ' + err.message);
      }
   };

   const handleDeleteCategory = async (id: string, name: string) => {
      if (name === 'Geral') return alert('A categoria Geral é protegida pelo sistema.');
      if (!confirm(`Deseja remover a categoria "${name}"? Posts vinculados precisarão ser reatribuídos.`)) return;

      try {
         const { error } = await supabase.from('feed_categories').delete().eq('id', id);
         if (error) throw error;
         fetchCategories();
      } catch (err: any) {
         alert('Erro ao remover: ' + err.message);
      }
   };

   const handlePublish = async () => {
      if (!file) return alert("Selecione uma imagem");
      setLoading(true);

      try {
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) throw new Error("Usuário não autenticado");

         const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
         const isPro = profile?.role === 'PROFESSIONAL' || profile?.role === 'MASTER_ADMIN';

         const fileExt = file.name.split('.').pop();
         const fileName = `${user.id}-${Math.random()}.${fileExt}`;
         const filePath = `content/${fileName}`;

         const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
         if (uploadError) throw uploadError;

         const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);

         if (contentType === 'STORY') {
            const { error: dbError } = await supabase.from('stories').insert({
               user_id: user.id,
               image_url: publicUrl,
               type: isPro ? 'PROFESSIONAL' : 'CLIENT'
            });
            if (dbError) throw dbError;
         } else {
            const { error: dbError } = await supabase.from('feed_posts').insert({
               type: 'image',
               image_url: publicUrl,
               caption: caption,
               category: selectedCategory,
               service_link_id: selectedServiceId || null,
               active: true
            });
            if (dbError) throw dbError;
         }

         setSuccess(true);
         setTimeout(() => {
            setSuccess(false);
            navigate('/admin');
         }, 2000);

      } catch (e: any) {
         console.error('Publish error:', e);
         alert('Erro ao publicar: ' + e.message);
      } finally {
         setLoading(false);
      }
   };

   if (success) {
      return (
         <div className="flex flex-col h-full bg-background-dark text-white items-center justify-center p-8 text-center animate-reveal">
            <div className="size-24 rounded-full bg-primary flex items-center justify-center mb-6 shadow-hugest relative">
               <div className="absolute inset-0 border-2 border-accent-gold/20 rounded-full animate-ping"></div>
               <span className="material-symbols-outlined !text-5xl text-accent-gold">check</span>
            </div>
            <h2 className="text-3xl font-display italic text-white leading-tight">Publicado com <span className="text-accent-gold">Maestria</span></h2>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mt-4">Sincronizando Ecossistema Julia Zenaro</p>
         </div>
      );
   }

   return (
      <div className="flex flex-col h-full bg-background-dark text-white overflow-hidden selection:bg-accent-gold/20 relative">
         {/* Dynamic Background Engine */}
         <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/30 blur-[100px] animate-float"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-10 mix-blend-overlay"></div>
         </div>

         <header className="sticky top-0 z-[100] premium-nav-dark px-8 py-6 flex items-center justify-between border-b border-white/5 bg-background-dark/95 backdrop-blur-xl">
            <div className="flex items-center gap-6">
               <button onClick={() => navigate(-1)} className="size-11 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-accent-gold hover:bg-white/10 active:scale-90 transition-all shadow-huge">
                  <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
               </button>
               <div>
                  <h1 className="text-xl font-display italic text-white tracking-tight">Criação de Conteúdo Elite</h1>
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mt-1">Professional Broadcast Studio</p>
               </div>
            </div>

            <button
               onClick={handlePublish}
               disabled={loading || !file}
               className="h-14 px-8 bg-accent-gold text-primary rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] font-outfit shadow-huge hover:bg-white transition-all active:scale-95 flex items-center gap-3 disabled:opacity-20"
            >
               {loading ? <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : (
                  <>
                     <span className="material-symbols-outlined !text-xl">send</span>
                     Transmitir Ritual
                  </>
               )}
            </button>
         </header>

         <main className="relative z-10 flex-1 p-8 overflow-y-auto no-scrollbar pb-32">
            <div className="max-w-4xl mx-auto space-y-12 animate-reveal">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                     onClick={() => setContentType('STORY')}
                     className={`group relative h-32 rounded-[32px] border transition-all duration-500 overflow-hidden text-left p-8 shadow-hugest ${contentType === 'STORY' ? 'bg-accent-gold border-accent-gold' : 'bg-surface-dark/40 border-white/5 hover:border-white/10'}`}
                  >
                     <div className="flex flex-col h-full justify-between relative z-10">
                        <span className={`material-symbols-outlined !text-3xl ${contentType === 'STORY' ? 'text-primary' : 'text-accent-gold'}`}>history_toggle_off</span>
                        <div>
                           <p className={`text-[10px] font-black uppercase tracking-[0.2em] font-outfit ${contentType === 'STORY' ? 'text-primary' : 'text-white'}`}>Ephemeral Moment</p>
                           <p className={`text-xl font-display italic ${contentType === 'STORY' ? 'text-primary/70' : 'text-white/40'}`}>Story (24 Horas)</p>
                        </div>
                     </div>
                  </button>
                  <button
                     onClick={() => setContentType('POST')}
                     className={`group relative h-32 rounded-[32px] border transition-all duration-500 overflow-hidden text-left p-8 shadow-hugest ${contentType === 'POST' ? 'bg-accent-gold border-accent-gold' : 'bg-surface-dark/40 border-white/5 hover:border-white/10'}`}
                  >
                     <div className="flex flex-col h-full justify-between relative z-10">
                        <span className={`material-symbols-outlined !text-3xl ${contentType === 'POST' ? 'text-primary' : 'text-accent-gold'}`}>grid_view</span>
                        <div>
                           <p className={`text-[10px] font-black uppercase tracking-[0.2em] font-outfit ${contentType === 'POST' ? 'text-primary' : 'text-white'}`}>Permanent Inspiration</p>
                           <p className={`text-xl font-display italic ${contentType === 'POST' ? 'text-primary/70' : 'text-white/40'}`}>Post de Feed</p>
                        </div>
                     </div>
                  </button>
               </div>

               <div className="bg-surface-dark/40 border border-white/5 rounded-[48px] p-12 space-y-10 shadow-hugest relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>

                  <div className="h-96 w-full max-w-sm mx-auto bg-white/5 border-2 border-dashed border-white/5 rounded-[48px] flex flex-col items-center justify-center gap-6 group/upload cursor-pointer active:scale-95 transition-all relative overflow-hidden shadow-inner hover:border-accent-gold/40">
                     <input type="file" accept="image/*" onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                           setFile(e.target.files[0]);
                           setIsManagingCategories(false);
                        }
                     }} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                     {file ? (
                        <img src={URL.createObjectURL(file)} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover/upload:scale-110" alt="Preview" />
                     ) : (
                        <div className="text-center space-y-4">
                           <div className="size-20 rounded-full bg-accent-gold/10 flex items-center justify-center text-accent-gold group-hover/upload:scale-110 transition-all shadow-huge">
                              <span className="material-symbols-outlined !text-4xl">add_a_photo</span>
                           </div>
                           <div className="space-y-1">
                              <p className="text-base font-outfit font-bold text-white">Capturar Essência</p>
                              <p className="text-[10px] text-white/20 uppercase font-black tracking-[0.3em]">Resolução sugerida: 1080x1350</p>
                           </div>
                        </div>
                     )}
                  </div>

                  <div className="space-y-10 max-w-2xl mx-auto">
                     <div className="space-y-4">
                        <label className="text-[9px] font-black text-accent-gold/40 uppercase tracking-[0.4em] px-4">Narrativa da Imagem</label>
                        <textarea
                           value={caption}
                           onChange={e => setCaption(e.target.value)}
                           placeholder="Dê um toque de luxo e carinho à sua publicação..."
                           className="w-full bg-background-dark/40 border border-white/5 rounded-[32px] p-8 text-sm focus:border-accent-gold/40 focus:bg-background-dark transition-all outline-none h-40 italic placeholder:text-white/10"
                        />
                     </div>

                     {contentType === 'POST' && (
                        <section className="space-y-6">
                           <div className="flex items-center justify-between px-4">
                              <label className="text-[9px] font-black text-accent-gold/40 uppercase tracking-[0.4em]">Curadoria de Categoria</label>
                              <button
                                 onClick={() => setIsManagingCategories(!isManagingCategories)}
                                 className="text-[9px] font-black text-accent-gold uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2"
                              >
                                 <span className="material-symbols-outlined !text-sm">{isManagingCategories ? 'close' : 'settings'}</span>
                                 {isManagingCategories ? 'Fechar Gestão' : 'Gerenciar Filtros'}
                              </button>
                           </div>

                           {isManagingCategories ? (
                              <div className="bg-white/5 border border-white/5 rounded-[32px] p-8 space-y-6 animate-reveal shadow-huge">
                                 <div className="flex gap-4">
                                    <input
                                       type="text"
                                       placeholder="Nova categoria (ex: Extensões)"
                                       className="flex-1 h-16 bg-background-dark/60 border border-white/5 rounded-2xl px-6 text-sm outline-none focus:border-accent-gold/40 transition-all placeholder:text-white/10"
                                       value={newCategoryName}
                                       onChange={e => setNewCategoryName(e.target.value)}
                                    />
                                    <button onClick={handleAddCategory} className="size-16 rounded-2xl bg-accent-gold text-primary flex items-center justify-center shadow-huge active:scale-90 transition-all">
                                       <span className="material-symbols-outlined">add</span>
                                    </button>
                                 </div>
                                 <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
                                    {categories.map(cat => (
                                       <div key={cat.id} className="flex items-center gap-3 pl-5 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 group">
                                          {cat.name}
                                          {cat.name !== 'Geral' && (
                                             <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="size-6 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center justify-center">
                                                <span className="material-symbols-outlined !text-xs">close</span>
                                             </button>
                                          )}
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           ) : (
                              <div className="relative group/select">
                                 <select
                                    value={selectedCategory}
                                    onChange={e => setSelectedCategory(e.target.value)}
                                    className="w-full h-18 bg-background-dark/40 border border-white/5 rounded-[24px] px-8 text-sm focus:border-accent-gold/40 focus:bg-background-dark appearance-none outline-none transition-all font-medium text-white/80"
                                 >
                                    {categories.map(cat => (
                                       <option key={cat.id} value={cat.name} className="bg-surface-dark text-white">{cat.name}</option>
                                    ))}
                                 </select>
                                 <span className="material-symbols-outlined absolute right-8 top-1/2 -translate-y-1/2 text-accent-gold group-hover/select:rotate-180 transition-transform pointer-events-none">expand_more</span>
                              </div>
                           )}
                        </section>
                     )}

                     <div className="space-y-4">
                        <label className="text-[9px] font-black text-accent-gold/40 uppercase tracking-[0.4em] px-4">Vincular Ritual (CTA)</label>
                        <div className="relative group/select">
                           <select
                              value={selectedServiceId}
                              onChange={e => setSelectedServiceId(e.target.value)}
                              className="w-full h-18 bg-background-dark/40 border border-white/5 rounded-[24px] px-8 text-sm focus:border-accent-gold/40 focus:bg-background-dark appearance-none outline-none transition-all font-medium text-white/80"
                           >
                              <option value="" className="bg-surface-dark text-white">Nenhum serviço vinculado</option>
                              {services.map(s => (
                                 <option key={s.id} value={s.id} className="bg-surface-dark text-white">{s.name}</option>
                              ))}
                           </select>
                           <span className="material-symbols-outlined absolute right-8 top-1/2 -translate-y-1/2 text-accent-gold pointer-events-none">unfold_more</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </main>

         {/* Visual Safe Area Inset */}
         <div className="fixed bottom-0 left-0 w-full h-8 bg-black pointer-events-none z-[90]"></div>
      </div>
   );
};

export default AdminContentCreator;
