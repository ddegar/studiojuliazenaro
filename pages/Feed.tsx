
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Post {
  id: string;
  imageUrl: string;
  title: string;
  caption: string;
  likes: number;
  comments: number;
  serviceId?: string;
  serviceName?: string;
}

const MOCK_POSTS: Post[] = [
  { id: '1', imageUrl: 'https://picsum.photos/600/800?sig=21', title: 'Efeito Silk Touch', caption: 'Técnicas seguras, resultado elegante e duradouro. Pensado em cada detalhe para realçar seu brilho natural.', likes: 1200, comments: 48, serviceId: 's1', serviceName: 'Lash Lifting Premium' },
  { id: '2', imageUrl: 'https://picsum.photos/600/800?sig=22', title: 'Olhar de Boneca', caption: 'O volume que você sempre sonhou, com a leveza que seus cílios precisam.', likes: 850, comments: 32, serviceId: 's2', serviceName: 'Classic Lash Design' },
  { id: '3', imageUrl: 'https://picsum.photos/600/800?sig=23', title: 'Sobrancelhas Arqueadas', caption: 'Design estratégico para levantar o olhar e harmonizar o rosto.', likes: 640, comments: 15, serviceId: 's3', serviceName: 'Design com Henna' },
  { id: '4', imageUrl: 'https://picsum.photos/600/800?sig=24', title: 'Naturalidade Todo Dia', caption: 'Acorde pronta! O segredo das nossas clientes VIP.', likes: 920, comments: 27 },
  { id: '5', imageUrl: 'https://picsum.photos/600/800?sig=25', title: 'Curvatura Perfeita', caption: 'Lash Lifting que dura e encanta. Agende seu momento.', likes: 710, comments: 19, serviceId: 's1' },
  { id: '6', imageUrl: 'https://picsum.photos/600/800?sig=26', title: 'Cuidados Essenciais', caption: 'Você sabia que pentear seus cílios ajuda na durabilidade?', likes: 530, comments: 8 },
];

const SUGGESTIONS = [
  { id: 's1', name: 'Lash Lifting', img: 'https://picsum.photos/200/200?sig=101', price: '150' },
  { id: 's2', name: 'Volume Russo', img: 'https://picsum.photos/200/200?sig=102', price: '220' },
  { id: 's3', name: 'Design Henna', img: 'https://picsum.photos/200/200?sig=103', price: '80' },
];

const Feed: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const toggleLike = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newLiked = new Set(likedPosts);
    if (newLiked.has(id)) newLiked.delete(id);
    else newLiked.add(id);
    setLikedPosts(newLiked);
  };

  const handleShare = (post: Post, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.caption,
        url: window.location.href,
      }).catch(() => {});
    } else {
      alert("Link copiado para a área de transferência!");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-light pb-24">
      <header className="sticky top-0 z-50 glass-nav p-6 flex items-center justify-between border-b">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate('/home')} className="material-symbols-outlined text-primary">arrow_back_ios_new</button>
           <h2 className="font-display font-bold text-lg text-primary tracking-tight">Feed Geral</h2>
        </div>
        <button className="material-symbols-outlined text-primary relative">
          favorite
          {likedPosts.size > 0 && (
            <span className="absolute -top-1 -right-1 size-4 bg-accent-gold text-primary text-[8px] font-black rounded-full flex items-center justify-center border-2 border-background-light">
              {likedPosts.size}
            </span>
          )}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-10">
         {/* Destaque da Semana (Featured) */}
         <section className="space-y-4">
           <div className="flex justify-between items-center px-1">
             <h3 className="text-[10px] font-black uppercase text-accent-gold tracking-[0.3em]">Em Alta ✨</h3>
           </div>
           <div 
             onClick={() => setSelectedPost(MOCK_POSTS[0])}
             className="overflow-hidden rounded-[40px] bg-white border border-gray-100 shadow-sm group cursor-pointer active:scale-[0.99] transition-all"
           >
              <div className="h-80 w-full overflow-hidden relative">
                 <img 
                   src={MOCK_POSTS[0].imageUrl} 
                   className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                   alt="post" 
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="p-8 space-y-4">
                 <div className="flex justify-between items-start">
                    <div className="space-y-1">
                       <h3 className="font-display text-2xl font-bold text-primary">{MOCK_POSTS[0].title}</h3>
                       <p className="text-gray-500 text-sm leading-relaxed italic line-clamp-2">"{MOCK_POSTS[0].caption}"</p>
                    </div>
                    <button 
                      onClick={(e) => toggleLike(MOCK_POSTS[0].id, e)}
                      className={`size-10 rounded-full flex items-center justify-center transition-all ${likedPosts.has(MOCK_POSTS[0].id) ? 'bg-accent-gold text-primary' : 'bg-primary/5 text-primary'}`}
                    >
                      <span className="material-symbols-outlined !text-xl" style={{ fontVariationSettings: likedPosts.has(MOCK_POSTS[0].id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                    </button>
                 </div>
                 <div className="pt-6 flex justify-between items-center border-t border-gray-50">
                    <div className="flex gap-4">
                       <div className="flex items-center gap-1.5 text-primary/40"><span className="material-symbols-outlined !text-sm">chat_bubble</span> <span className="text-[10px] font-black">{MOCK_POSTS[0].comments}</span></div>
                       <div className="flex items-center gap-1.5 text-primary/40"><span className="material-symbols-outlined !text-sm">share</span> <span className="text-[10px] font-black">Share</span></div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); navigate('/booking'); }} className="bg-primary text-white h-11 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">EU QUERO ✨</button>
                 </div>
              </div>
           </div>
         </section>

         {/* Sugestões para Você */}
         <section className="space-y-4">
           <div className="px-1">
             <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">Sugestões para você 💖</h3>
           </div>
           <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x">
             {SUGGESTIONS.map(s => (
               <div key={s.id} onClick={() => navigate('/booking')} className="min-w-[140px] bg-white p-4 rounded-3xl border border-gray-50 premium-shadow snap-center flex flex-col items-center gap-3 active:scale-95 transition-all">
                 <div className="size-16 rounded-2xl overflow-hidden border border-primary/5">
                   <img src={s.img} className="w-full h-full object-cover" alt={s.name} />
                 </div>
                 <div className="text-center">
                   <p className="text-xs font-bold text-primary">{s.name}</p>
                   <p className="text-[9px] text-accent-gold font-black mt-0.5">R$ {s.price}</p>
                 </div>
               </div>
             ))}
           </div>
         </section>

         {/* Grid de Posts com Efeitos de Hover */}
         <section className="space-y-4">
           <div className="px-1">
             <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">Inpirações</h3>
           </div>
           <div className="grid grid-cols-2 gap-4">
              {MOCK_POSTS.slice(1).map(post => (
                <div 
                  key={post.id} 
                  onClick={() => setSelectedPost(post)}
                  className="group relative rounded-[32px] overflow-hidden shadow-sm aspect-square border border-gray-50 cursor-pointer active:scale-95 transition-all"
                >
                   <img 
                    src={post.imageUrl} 
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:blur-[2px] group-hover:opacity-70" 
                    alt="post" 
                   />
                   <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 text-center">
                     <span className="material-symbols-outlined text-white !text-3xl">visibility</span>
                     <p className="text-white text-[10px] font-black uppercase tracking-widest">{post.title}</p>
                   </div>
                   <button 
                    onClick={(e) => toggleLike(post.id, e)}
                    className="absolute top-4 right-4 size-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                   >
                     <span className="material-symbols-outlined !text-lg" style={{ fontVariationSettings: likedPosts.has(post.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                   </button>
                </div>
              ))}
           </div>
         </section>
      </main>

      {/* Modal de Detalhes do Post */}
      {selectedPost && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-end justify-center animate-fade-in">
          <div className="bg-background-light w-full max-w-[430px] rounded-t-[48px] overflow-hidden flex flex-col max-h-[95vh] animate-slide-up">
            <div className="relative h-[400px] shrink-0">
               <img src={selectedPost.imageUrl} className="w-full h-full object-cover" alt="detail" />
               <div className="absolute top-6 inset-x-0 flex justify-between px-8">
                 <button onClick={() => setSelectedPost(null)} className="size-12 rounded-full bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all">
                   <span className="material-symbols-outlined">close</span>
                 </button>
                 <button onClick={() => handleShare(selectedPost)} className="size-12 rounded-full bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all">
                   <span className="material-symbols-outlined">share</span>
                 </button>
               </div>
            </div>

            <div className="flex-1 p-10 space-y-8 overflow-y-auto no-scrollbar pb-32">
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-display text-3xl font-bold text-primary leading-tight">{selectedPost.title}</h3>
                    <div className="flex items-center gap-6">
                      <button onClick={() => toggleLike(selectedPost.id)} className="flex flex-col items-center gap-1 group">
                        <span className={`material-symbols-outlined !text-3xl transition-all ${likedPosts.has(selectedPost.id) ? 'text-rose-500 scale-110' : 'text-primary/20 group-hover:text-rose-500/40'}`} style={{ fontVariationSettings: likedPosts.has(selectedPost.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                        <span className="text-[9px] font-black text-gray-400">{selectedPost.likes + (likedPosts.has(selectedPost.id) ? 1 : 0)}</span>
                      </button>
                      <button className="flex flex-col items-center gap-1 group">
                        <span className="material-symbols-outlined !text-3xl text-primary/20 group-hover:text-primary/40">chat_bubble</span>
                        <span className="text-[9px] font-black text-gray-400">{selectedPost.comments}</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-500 text-base leading-relaxed font-medium italic">"{selectedPost.caption}"</p>
               </div>

               {selectedPost.serviceId && (
                 <div className="bg-primary/5 p-8 rounded-[40px] border border-primary/10 flex items-center justify-between group">
                    <div className="space-y-1">
                       <p className="text-[9px] font-black uppercase text-primary/40 tracking-[0.2em]">Serviço Vinculado</p>
                       <h4 className="font-bold text-primary text-lg">{selectedPost.serviceName || 'Procedimento VIP'}</h4>
                    </div>
                    <button onClick={() => navigate('/booking')} className="size-14 rounded-full bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/20 active:scale-90 transition-all group-hover:rotate-12">
                       <span className="material-symbols-outlined !text-2xl">calendar_add_on</span>
                    </button>
                 </div>
               )}

               <div className="pt-4 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Comentários (Simulação)</p>
                  <div className="flex gap-4 p-4 bg-white rounded-3xl border border-gray-50">
                    <div className="size-10 rounded-full bg-primary/10 shrink-0"></div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-primary">Ana Carolina</p>
                      <p className="text-xs text-gray-500 leading-relaxed italic">"Ficou maravilhoso! Julia é a melhor ❤️"</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav de 5 itens */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] glass-nav border-t border-gray-100 flex justify-around items-center py-6 px-4 z-50 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button onClick={() => navigate('/home')} className="flex flex-col items-center gap-1.5 text-gray-400">
          <span className="material-symbols-outlined !text-3xl">home</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Início</span>
        </button>
        <button onClick={() => navigate('/feed')} className="flex flex-col items-center gap-1.5 text-primary">
          <span className="material-symbols-outlined !text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>grid_view</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Feed</span>
        </button>
        <button onClick={() => navigate('/services')} className="flex flex-col items-center gap-1.5 text-gray-400">
          <span className="material-symbols-outlined !text-3xl">content_cut</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Serviços</span>
        </button>
        <button onClick={() => navigate('/history')} className="flex flex-col items-center gap-1.5 text-gray-400">
          <span className="material-symbols-outlined !text-3xl">calendar_today</span>
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

export default Feed;
