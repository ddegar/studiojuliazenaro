
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
            profiles (name, profile_pic),
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
            likes: Math.floor(Math.random() * 50) + 10,
            comments: Math.floor(Math.random() * 10),
            serviceId: p.service_link_id,
            serviceName: p.services?.name,
            authorName: p.profiles?.name || 'Studio Julia Zenaro',
            authorAvatar: p.profiles?.profile_pic || `https://ui-avatars.com/api/?name=Studio`,
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
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-10">
        {posts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {posts.map(post => (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="group relative rounded-[32px] overflow-hidden shadow-sm aspect-square border border-gray-50 cursor-pointer active:scale-95 transition-all"
              >
                <img
                  src={post.imageUrl}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                  alt="post"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <img src={post.authorAvatar} className="size-8 rounded-full border-2 border-white shadow-lg" alt="avatar" />
                  <span className="text-[8px] text-white font-black uppercase tracking-widest">{post.authorName.split(' ')[0]}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
            <span className="material-symbols-outlined !text-6xl">grid_off</span>
            <p className="font-display italic text-lg">Nenhuma publicação ainda...</p>
          </div>
        )}
      </main>

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
