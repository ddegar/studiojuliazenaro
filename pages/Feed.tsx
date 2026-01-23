
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
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Posts
        const { data: postsData } = await supabase
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
          .eq('active', true);

        // 2. Fetch Approved Testimonials
        const { data: testimonialsData } = await supabase
          .from('testimonials')
          .select(`
            id,
            message,
            photo_url,
            rating,
            created_at,
            profiles (name, profile_pic),
            professionals (name)
          `)
          .or('status.eq.approved,show_on_feed.eq.true');

        // 3. Format & Merge
        const formattedPosts = (postsData || []).map((p: any) => ({
          type: 'post',
          id: p.id,
          imageUrl: p.media_url,
          caption: p.caption,
          likes: Math.floor(Math.random() * 50) + 10,
          authorName: p.profiles?.name || 'Studio Julia Zenaro',
          authorAvatar: p.profiles?.profile_pic || `https://ui-avatars.com/api/?name=Studio`,
          createdAt: p.created_at,
          serviceName: p.services?.name
        }));

        const formattedTestimonials = (testimonialsData || []).map((t: any) => ({
          type: 'testimonial',
          id: t.id,
          imageUrl: t.photo_url, // Might be null
          caption: t.message,
          rating: t.rating,
          authorName: t.profiles?.name || 'Cliente',
          authorAvatar: t.profiles?.profile_pic,
          createdAt: t.created_at,
          professionalName: t.professionals?.name
        }));

        const combined = [...formattedPosts, ...formattedTestimonials].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setItems(combined);
      } catch (err) {
        console.error('Error fetching feed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
            <p className="text-[9px] uppercase tracking-widest text-accent-gold font-black">Inspirações & Love</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-10">
        {items.length > 0 ? (
          <div className="columns-2 gap-4 space-y-4">
            {items.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="break-inside-avoid group relative rounded-[32px] overflow-hidden shadow-sm border border-gray-50 cursor-pointer active:scale-95 transition-all bg-white"
              >
                {item.type === 'post' || (item.type === 'testimonial' && item.imageUrl) ? (
                  <>
                    <img
                      src={item.imageUrl}
                      className="w-full h-auto object-cover transition-all duration-700 group-hover:scale-110"
                      alt="content"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      {item.type === 'testimonial' && (
                        <div className="flex text-[#C5A059] mb-2">
                          {[...Array(item.rating || 5)].map((_, i) => <span key={i} className="material-symbols-outlined !text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
                        </div>
                      )}
                      <span className="text-[8px] text-white font-black uppercase tracking-widest">{item.authorName.split(' ')[0]}</span>
                    </div>
                  </>
                ) : (
                  // Testimonial without image (Text Card)
                  <div className="p-6 flex flex-col justify-between min-h-[160px] bg-gradient-to-br from-[#f8f7f4] to-white">
                    <span className="material-symbols-outlined text-[#C5A059] text-2xl mb-2">format_quote</span>
                    <p className="text-xs text-[#1a1c1a]/80 italic font-medium line-clamp-4">"{item.caption}"</p>
                    <div className="flex justify-between items-end mt-4">
                      <span className="text-[8px] font-black uppercase tracking-widest text-primary/40">{item.authorName.split(' ')[0]}</span>
                      <div className="flex text-[#C5A059]">
                        {[...Array(item.rating || 5)].map((_, i) => <span key={i} className="material-symbols-outlined !text-[8px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Type Badge */}
                {item.type === 'testimonial' && (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur rounded-lg shadow-sm z-10">
                    <span className="material-symbols-outlined text-[#C5A059] !text-[10px]">favorite</span>
                  </div>
                )}
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
