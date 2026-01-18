
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

   useEffect(() => {
      const fetchServices = async () => {
         const { data } = await supabase.from('services').select('id, name').eq('active', true);
         if (data) setServices(data);
      };
      fetchServices();
   }, []);

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
            const { error: dbError } = await supabase.from('posts').insert({
               user_id: user.id,
               type: contentType,
               media_url: publicUrl,
               caption: caption,
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
         <div className="flex flex-col h-full bg-background-dark text-white items-center justify-center p-8 text-center animate-fade-in">
            <div className="size-24 rounded-full bg-primary flex items-center justify-center mb-6 shadow-2xl shadow-primary/20">
               <span className="material-symbols-outlined !text-5xl">check</span>
            </div>
            <h2 className="text-3xl font-display font-bold text-accent-gold">Publicado!</h2>
            <p className="text-gray-400 mt-2">Suas clientes já podem ver sua nova atualização.</p>
         </div>
      );
   }

   return (
      <div className="flex flex-col h-full bg-background-dark text-white">
         <header className="p-6 border-b border-white/5 flex items-center justify-between glass-nav !bg-background-dark/80 z-20 sticky top-0">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors">
                  <span className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</span>
               </button>
               <div>
                  <h1 className="text-lg font-bold">Criar Conteúdo</h1>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Studio Julia Zenaro</p>
               </div>
            </div>
         </header>

         <main className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar pb-32">
            <div className="grid grid-cols-2 gap-4">
               <button
                  onClick={() => setContentType('STORY')}
                  className={`p-6 rounded-[32px] border-2 flex flex-col items-center gap-3 transition-all ${contentType === 'STORY' ? 'bg-primary/10 border-primary ring-4 ring-primary/5' : 'bg-white/5 border-white/5 opacity-40'}`}
               >
                  <span className="material-symbols-outlined !text-3xl">history_toggle_off</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-center">Story <br />(24 horas)</span>
               </button>
               <button
                  onClick={() => setContentType('POST')}
                  className={`p-6 rounded-[32px] border-2 flex flex-col items-center gap-3 transition-all ${contentType === 'POST' ? 'bg-primary/10 border-primary ring-4 ring-primary/5' : 'bg-white/5 border-white/5 opacity-40'}`}
               >
                  <span className="material-symbols-outlined !text-3xl">grid_view</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-center">Post de <br />Feed</span>
               </button>
            </div>

            <div className="aspect-[3/4] bg-white/5 border-2 border-dashed border-white/10 rounded-[40px] flex flex-col items-center justify-center gap-4 group cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden shadow-2xl">
               <input type="file" accept="image/*" onChange={e => e.target.files && setFile(e.target.files[0])} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
               {file ? (
                  <div className="absolute inset-0">
                     <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />
                  </div>
               ) : (
                  <>
                     <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-lg shadow-black/20">
                        <span className="material-symbols-outlined !text-4xl">add_a_photo</span>
                     </div>
                     <div className="text-center">
                        <p className="text-sm font-bold">Upload da Mídia</p>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Até 10MB • JPG, PNG</p>
                     </div>
                  </>
               )}
            </div>

            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 pl-2 tracking-widest">Legenda / Bio do Post</label>
                  <textarea
                     value={caption}
                     onChange={e => setCaption(e.target.value)}
                     placeholder="Dê um toque de carinho à sua publicação..."
                     className="w-full bg-white/5 border border-white/10 rounded-[32px] p-6 text-sm focus:ring-primary h-36 italic placeholder:text-gray-600 transition-all outline-none"
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 pl-2 tracking-widest">Vincular Serviço (CTA)</label>
                  <div className="relative">
                     <select
                        value={selectedServiceId}
                        onChange={e => setSelectedServiceId(e.target.value)}
                        className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm focus:ring-primary appearance-none outline-none"
                     >
                        <option value="" className="bg-background-dark text-white">Nenhum serviço vinculado</option>
                        {services.map(s => (
                           <option key={s.id} value={s.id} className="bg-background-dark text-white">{s.name}</option>
                        ))}
                     </select>
                     <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none">unfold_more</span>
                  </div>
               </div>
            </div>
         </main>

         <div className="p-6 fixed bottom-0 inset-x-0 glass-nav !bg-background-dark/95 border-t border-white/5 z-30">
            <button
               onClick={handlePublish}
               disabled={loading || !file}
               className="w-full h-18 bg-primary text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-primary/40 flex items-center justify-center gap-4 disabled:opacity-30 active:scale-95 transition-all"
            >
               {loading ? <div className="size-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (
                  <>
                     PUBLICAR AGORA
                     <span className="material-symbols-outlined !text-sm">send</span>
                  </>
               )}
            </button>
         </div>
      </div>
   );
};

export default AdminContentCreator;
