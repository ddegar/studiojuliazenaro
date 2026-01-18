
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const AdminContentCreator: React.FC = () => {
   const navigate = useNavigate();
   const [contentType, setContentType] = useState<'STORY' | 'POST'>('POST');
   const [loading, setLoading] = useState(false);
   const [success, setSuccess] = useState(false);
   const [file, setFile] = useState<File | null>(null);
   const [caption, setCaption] = useState('');

   const handlePublish = async () => {
      if (!file) return alert("Selecione uma imagem");
      setLoading(true);

      try {
         const fileExt = file.name.split('.').pop();
         const fileName = `${Math.random()}.${fileExt}`;
         const filePath = `${fileName}`;

         const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
         if (uploadError) throw uploadError;

         const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);

         const { error: dbError } = await supabase.from('posts').insert({
            type: contentType,
            media_url: publicUrl,
            caption: caption,
            active: true
         });
         if (dbError) throw dbError;

         setSuccess(true);
         setTimeout(() => {
            setSuccess(false);
            navigate('/admin');
         }, 2000);

      } catch (e: any) {
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
         <header className="p-4 border-b border-white/5 flex items-center justify-between glass-nav !bg-background-dark/80">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate(-1)} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
               <h1 className="text-lg font-bold">Criar Conteúdo</h1>
            </div>
         </header>

         <main className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar pb-32">
            <div className="grid grid-cols-2 gap-4">
               <button
                  onClick={() => setContentType('STORY')}
                  className={`p-6 rounded-3xl border flex flex-col items-center gap-3 transition-all ${contentType === 'STORY' ? 'bg-primary/20 border-primary' : 'bg-white/5 border-white/10 opacity-40'}`}
               >
                  <span className="material-symbols-outlined !text-3xl">history_toggle_off</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-center">Story <br />(24 horas)</span>
               </button>
               <button
                  onClick={() => setContentType('POST')}
                  className={`p-6 rounded-3xl border flex flex-col items-center gap-3 transition-all ${contentType === 'POST' ? 'bg-primary/20 border-primary' : 'bg-white/5 border-white/10 opacity-40'}`}
               >
                  <span className="material-symbols-outlined !text-3xl">grid_view</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-center">Post de <br />Feed</span>
               </button>
            </div>

            <div className="aspect-[4/5] bg-white/5 border-2 border-dashed border-white/10 rounded-[40px] flex flex-col items-center justify-center gap-4 group cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden">
               <input type="file" onChange={e => e.target.files && setFile(e.target.files[0])} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
               {file ? (
                  <div className="absolute inset-0">
                     <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="Preview" />
                  </div>
               ) : (
                  <>
                     <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined !text-3xl">add_a_photo</span>
                     </div>
                     <div className="text-center">
                        <p className="text-sm font-bold">Upload da Mídia</p>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Até 50MB • JPG, PNG, MP4</p>
                     </div>
                  </>
               )}
            </div>

            <div className="space-y-4">
               <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 pl-1">Legenda / Descrição</label>
                  <textarea
                     value={caption}
                     onChange={e => setCaption(e.target.value)}
                     placeholder="No que você está pensando hoje?"
                     className="w-full bg-white/5 border-white/10 rounded-3xl p-5 text-sm focus:ring-accent-gold h-32"
                  />
               </div>

               <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 pl-1">Vincular a Serviço</label>
                  <select className="w-full h-14 bg-white/5 border-white/10 rounded-2xl px-5 text-sm focus:ring-accent-gold appearance-none">
                     <option>Nenhum</option>
                     <option>Lash Lifting Premium</option>
                     <option>Classic Lash Design</option>
                  </select>
               </div>
            </div>
         </main>

         <div className="p-6 fixed bottom-0 inset-x-0 glass-nav !bg-background-dark/90 border-t border-white/5">
            <button
               onClick={handlePublish}
               disabled={loading}
               className="w-full h-16 bg-primary text-white rounded-2xl font-bold text-xs uppercase tracking-[0.3em] shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
               {loading ? <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'PUBLICAR AGORA'}
            </button>
         </div>
      </div>
   );
};

export default AdminContentCreator;
