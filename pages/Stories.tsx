
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

interface StoryItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  authorName: string;
  authorAvatar: string;
  createdAt: string;
}

const Stories: React.FC = () => {
  const [items, setItems] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('stories')
          .select(`
            id,
            image_url,
            type,
            created_at,
            profiles (name, profile_pic)
          `)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          const formatted: StoryItem[] = data.map((s: any) => ({
            id: s.id,
            url: s.image_url,
            type: 'image', // Default to image for now
            authorName: s.profiles?.name || 'Studio Julia Zenaro',
            authorAvatar: s.profiles?.profile_pic || `https://ui-avatars.com/api/?name=Studio`,
            createdAt: s.created_at
          }));
          setItems(formatted);
        } else {
          // If no stories, go back home
          navigate('/home');
        }
      } catch (err) {
        console.error('Error fetching stories:', err);
        navigate('/home');
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, [navigate]);

  useEffect(() => {
    if (items.length === 0) return;

    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (currentIndex < items.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            navigate('/home');
            return 100;
          }
        }
        return p + 1.2; // Adjusted speed
      });
    }, 50);

    return () => clearInterval(timer);
  }, [currentIndex, items, navigate]);

  const handleTouch = (e: React.MouseEvent) => {
    const { clientX } = e;
    const width = window.innerWidth;
    if (clientX < width / 3) {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        setProgress(0);
      }
    } else {
      if (currentIndex < items.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setProgress(0);
      } else {
        navigate('/home');
      }
    }
  };

  if (loading || items.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="size-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  const current = items[currentIndex];

  return (
    <div className="flex flex-col h-screen bg-black relative overflow-hidden select-none">
      {/* Bars */}
      <div className="absolute top-6 left-0 w-full flex gap-1.5 px-4 z-[60]">
        {items.map((item, idx) => (
          <div key={item.id} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-md">
            <div
              className="h-full bg-white transition-all duration-50"
              style={{ width: `${idx < currentIndex ? 100 : idx === currentIndex ? progress : 0}%` }}
            ></div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-12 left-0 w-full flex items-center justify-between px-6 z-[60]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-white/30 overflow-hidden shadow-2xl">
            <img src={current.authorAvatar} alt="author" className="w-full h-full object-cover" />
          </div>
          <div className="text-white drop-shadow-lg">
            <p className="text-sm font-black tracking-wide">{current.authorName}</p>
            <p className="text-[10px] opacity-60 font-medium">{new Date(current.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        <button onClick={() => navigate('/home')} className="material-symbols-outlined text-white text-4xl drop-shadow-lg active:scale-90 transition-transform">close</button>
      </div>

      {/* Content */}
      <div
        className="flex-1 w-full bg-cover bg-center bg-no-repeat transition-all duration-500 animate-fade-in"
        style={{ backgroundImage: `url(${current.url})` }}
        onClick={handleTouch}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>
      </div>

      {/* Footer */}
      <div className="p-8 pb-12 flex items-center gap-6 absolute bottom-0 inset-x-0 z-[60] backdrop-blur-sm bg-black/10">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Responder carinhosamente..."
            className="w-full bg-white/10 border border-white/20 text-white rounded-[24px] h-14 px-8 text-sm placeholder:text-white/40 focus:ring-accent-gold outline-none italic transition-all"
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/40">send</button>
        </div>
        <button className="material-symbols-outlined text-white text-3xl active:scale-125 transition-transform text-rose-500" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</button>
      </div>
    </div>
  );
};

export default Stories;
