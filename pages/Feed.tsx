
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

interface Post {
  id: string;
  imageUrl: string;
  title?: string;
  caption: string;
  likes: number;
  comments: number;
  serviceId?: string;
  serviceName?: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
}

const Feed: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            id,
            media_url,
            caption,
            created_at,
            active,
            service_link_id,
            profiles (name, avatar_url),
            services (name)
          `)
          .eq('active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const formatted: Post[] = data.map((p: any) => ({
            id: p.id,
            imageUrl: p.media_url,
            caption: p.caption,
            likes: Math.floor(Math.random() * 50) + 10, // Simulated likes for now
            comments: Math.floor(Math.random() * 10), // Simulated comments
            serviceId: p.service_link_id,
            serviceName: p.services?.name,
            authorName: p.profiles?.name || 'Studio Julia Zenaro',
            authorAvatar: p.profiles?.avatar_url || `https://ui-avatars.com/api/?name=Studio`,
            createdAt: p.created_at
          }));
          setPosts(formatted);
        }
      } catch (err) {
        console.error('Error fetching feed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

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
        title: post.authorName,
        text: post.caption,
        url: window.location.href,
      }).catch(() => { });
    } else {
      alert("Link copiado para a área de transferência!");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background-light pb-24">
      <header className="sticky top-0 z-50 glass-nav p-6 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/home')} className="material-symbols-outlined text-primary">arrow_back_ios_new</button>
          <div>
            <h2 className="font-display font-bold text-lg text-primary tracking-tight">Feed Geral</h2>
            <p className="text-[9px] uppercase tracking-widest text-accent-gold font-black">Inspirações Reais</p>
          </div>
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
        {posts.length > 0 ? (
          <>
            {/* Destaque (Principal) */}
            <section className="space-y-4">
              <div
                onClick={() => setSelectedPost(posts[0])}
                className="overflow-hidden rounded-[40px] bg-white border border-gray-100 shadow-sm group cursor-pointer active:scale-[0.99] transition-all"
              >
                <div className="h-96 w-full overflow-hidden relative">
                  <img
                    src={posts[0].imageUrl}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    alt="post"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="p-8 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <img src={posts[0].authorAvatar} className="size-6 rounded-full" alt="avatar" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{posts[0].authorName}</span>
                      </div>
                      <p className="text-gray-500 text-sm leading-relaxed italic line-clamp-2">"{posts[0].caption}"</p>
                    </div>
                    <button
                      onClick={(e) => toggleLike(posts[0].id, e)}
                      className={`size-10 rounded-full flex items-center justify-center transition-all ${likedPosts.has(posts[0].id) ? 'bg-accent-gold text-primary' : 'bg-primary/5 text-primary'}`}
                    >
                      <span className="material-symbols-outlined !text-xl" style={{ fontVariationSettings: likedPosts.has(posts[0].id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                    </button>
                  </div>
                  <div className="pt-6 flex justify-between items-center border-t border-gray-50">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5 text-primary/40"><span className="material-symbols-outlined !text-sm">chat_bubble</span> <span className="text-[10px] font-black">{posts[0].comments}</span></div>
                      <div className="flex items-center gap-1.5 text-primary/40"><span className="material-symbols-outlined !text-sm">share</span> <span className="text-[10px] font-black">Share</span></div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); navigate('/booking'); }} className="bg-primary text-white h-11 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">EU QUERO ✨</button>
                  </div>
                </div>
              </div>
            </section>

            {/* Outras Inspirações */}
            <section className="space-y-4">
              <div className="px-1">
                <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">Minhas Inspirações</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {posts.slice(1).map(post => (
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
                      <img src={post.authorAvatar} className="size-8 rounded-full border-2 border-white shadow-lg" alt="avatar" />
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
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
            <span className="material-symbols-outlined !text-6xl">grid_off</span>
            <p className="font-display italic text-lg">Nenhuma publicação ainda...</p>
          </div>
        )}
      </main>

      {/* Modal Detalhes */}
      {selectedPost && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-end justify-center animate-fade-in">
          <div className="bg-background-light w-full max-w-[430px] rounded-t-[48px] overflow-hidden flex flex-col max-h-[95vh] animate-slide-up">
            <div className="relative h-[450px] shrink-0">
              <img src={selectedPost.imageUrl} className="w-full h-full object-cover" alt="detail" />
              <div className="absolute top-8 inset-x-0 flex justify-between px-8">
                <button onClick={() => setSelectedPost(null)} className="size-12 rounded-full bg-black/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all">
                  <span className="material-symbols-outlined">close</span>
                </button>
                <button onClick={() => handleShare(selectedPost)} className="size-12 rounded-full bg-black/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all">
                  <span className="material-symbols-outlined">share</span>
                </button>
              </div>
            </div>

            <div className="flex-1 p-10 space-y-8 overflow-y-auto no-scrollbar pb-32">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <img src={selectedPost.authorAvatar} className="size-12 rounded-full border-2 border-primary/10" alt="author" />
                    <div>
                      <h4 className="font-bold text-primary">{selectedPost.authorName}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(selectedPost.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <button onClick={() => toggleLike(selectedPost.id)} className="flex flex-col items-center gap-1 group">
                      <span className={`material-symbols-outlined !text-3xl transition-all ${likedPosts.has(selectedPost.id) ? 'text-rose-500 scale-110' : 'text-primary/20 group-hover:text-rose-500/40'}`} style={{ fontVariationSettings: likedPosts.has(selectedPost.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                      <span className="text-[9px] font-black text-gray-400">{selectedPost.likes + (likedPosts.has(selectedPost.id) ? 1 : 0)}</span>
                    </button>
                  </div>
                </div>
                <p className="text-gray-500 text-lg leading-relaxed font-medium italic">"{selectedPost.caption}"</p>
              </div>

              {selectedPost.serviceId && (
                <div className="bg-primary/5 p-8 rounded-[40px] border border-primary/10 flex items-center justify-between group">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase text-primary/40 tracking-[0.2em]">Procedimento Destaque</p>
                    <h4 className="font-bold text-primary text-xl">{selectedPost.serviceName || 'Agende Agora'}</h4>
                  </div>
                  <button onClick={() => navigate('/booking')} className="size-16 rounded-full bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/20 active:scale-90 transition-all group-hover:rotate-12">
                    <span className="material-symbols-outlined !text-3xl">calendar_add_on</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] glass-nav border-t border-gray-100 flex justify-around items-center py-6 px-4 z-50 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button onClick={() => navigate('/home')} className="flex flex-col items-center gap-1.5 text-gray-400">
          <span className="material-symbols-outlined !text-3xl">home</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Início</span>
        </button>
        <button onClick={() => navigate('/feed')} className="flex flex-col items-center gap-1.5 text-primary">
          <span className="material-symbols-outlined !text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
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
