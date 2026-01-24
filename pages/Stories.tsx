
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
  const navigate = useNavigate();
  const [items, setItems] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Fetching Logic
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

        if (error) {
          console.error('Stories DB Error:', error);
          throw error;
        }

        if (data && data.length > 0) {
          const formatted: StoryItem[] = data.map((s: any) => ({
            id: s.id,
            url: s.image_url,
            type: 'image',
            authorName: s.profiles?.name || 'Studio Julia Zenaro',
            authorAvatar: s.profiles?.profile_pic || `https://ui-avatars.com/api/?name=Studio`,
            createdAt: s.created_at
          }));
          setItems(formatted);
        } else {
          console.log('No active stories found, redirecting home.');
          navigate('/home');
        }
      } catch (err) {
        console.error('Critical Fetch Error:', err);
        navigate('/home');
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, [navigate]);

  // Timer Logic
  useEffect(() => {
    if (items.length === 0 || loading) return;

    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (currentIndex < items.length - 1) {
            setCurrentIndex(prev => prev + 1);
            return 0;
          } else {
            navigate('/home');
            return 100;
          }
        }
        return p + 1.2;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [currentIndex, items.length, loading, navigate]);

  // Like Check Logic
  useEffect(() => {
    const checkLike = async () => {
      if (items.length === 0 || !items[currentIndex]) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('story_likes')
          .select('id')
          .eq('story_id', items[currentIndex].id)
          .eq('user_id', user.id)
          .maybeSingle();

        setLiked(!!data);
      } catch (e) {
        console.error('Error checking like:', e);
      }
    };

    if (!loading && items.length > 0) {
      checkLike();
    }
  }, [currentIndex, items, loading]);

  const handleTouch = (e: React.MouseEvent) => {
    const { clientX } = e;
    const width = window.innerWidth;
    if (clientX < width / 3) {
      if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        setProgress(0);
      }
    } else {
      if (currentIndex < items.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setProgress(0);
      } else {
        navigate('/home');
      }
    }
  };

  const handleLike = async () => {
    if (liked || likeLoading || !items[currentIndex]) return;
    setLikeLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentStory = items[currentIndex];

      const { data: rule } = await supabase
        .from('loyalty_actions')
        .select('points_reward, is_active')
        .eq('code', 'STORY_LIKE')
        .single();

      const { data: storyData } = await supabase
        .from('stories')
        .select('user_id')
        .eq('id', currentStory.id)
        .single();

      if (!storyData) throw new Error('Story not found');

      const { error: likeError } = await supabase
        .from('story_likes')
        .insert({
          story_id: currentStory.id,
          user_id: user.id
        });

      if (likeError) throw likeError;

      if (rule?.is_active && storyData.user_id !== user.id) {
        const points = rule.points_reward;
        await supabase.from('point_transactions').insert({
          user_id: storyData.user_id,
          amount: points,
          description: `Curtida no Story: ${currentStory.authorName}`,
          source: 'STORY_LIKE'
        });

        await supabase.rpc('increment_lash_points', {
          user_id_param: storyData.user_id,
          amount_param: points
        });
      }

      setLiked(true);
    } catch (err) {
      console.error('Error liking story:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  // Rendering States
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="size-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return <div className="h-screen bg-black"></div>; // Fast blank before redirect
  }

  const current = items[currentIndex];
  if (!current) return null;

  return (
    <div className="flex flex-col h-screen bg-background-dark relative overflow-hidden select-none">
      {/* Immersive Progress System */}
      <div className="absolute top-6 left-0 w-full flex gap-2 px-6 z-[60]">
        {items.map((item, idx) => (
          <div key={item.id} className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-md ring-1 ring-white/5">
            <div
              className={`h-full bg-gradient-to-r from-accent-gold to-white transition-all duration-50 ${idx === currentIndex ? '' : 'duration-0'}`}
              style={{ width: `${idx < currentIndex ? 100 : idx === currentIndex ? progress : 0}%` }}
            ></div>
          </div>
        ))}
      </div>

      {/* Narrative Overlay Header */}
      <header className="absolute top-10 left-0 w-full flex items-center justify-between px-8 z-[60] animate-reveal">
        <div className="flex items-center gap-4">
          <div className="relative size-12 rounded-2xl border border-white/20 p-1 overflow-hidden bg-white/5 backdrop-blur-xl">
            <div className="absolute inset-0 bg-accent-gold organic-shape-1 opacity-10"></div>
            <img src={current.authorAvatar} alt="author" className="w-full h-full object-cover rounded-xl shadow-inner grayscale-[20%]" />
          </div>
          <div className="flex flex-col">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-accent-gold drop-shadow-md">Professional Squad</p>
            <h3 className="text-sm font-display font-bold text-white drop-shadow-lg tracking-wide">{current.authorName}</h3>
            <p className="text-[8px] opacity-40 font-black text-white uppercase tracking-widest mt-0.5">{new Date(current.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/home')}
          className="size-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined !text-2xl">close</span>
        </button>
      </header>

      {/* Immersive Content Engine */}
      <div
        className="flex-1 w-full bg-cover bg-center bg-no-repeat transition-all duration-700 relative group cursor-pointer"
        style={{ backgroundImage: `url(${current.url})` }}
        onClick={handleTouch}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background-dark/60 via-transparent to-background-dark/80 pointer-events-none"></div>

        {/* Visual Cues for Navigation (Desktop/Large UI) */}
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="material-symbols-outlined text-white/20 !text-4xl">chevron_left</span>
        </div>
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="material-symbols-outlined text-white/20 !text-4xl">chevron_right</span>
        </div>
      </div>

      {/* interaction Ecosystem */}
      <footer className="px-8 pt-6 pb-12 flex flex-col items-center justify-center absolute bottom-0 inset-x-0 z-[60] backdrop-blur-lg bg-background-dark/40 border-t border-white/5 animate-reveal" style={{ animationDelay: '0.3s' }}>
        <div className="flex flex-col items-center gap-6 w-full max-w-[280px]">
          <button
            onClick={(e) => { e.stopPropagation(); handleLike(); }}
            disabled={liked || likeLoading}
            className={`
               size-16 rounded-full flex items-center justify-center transition-all duration-500
               ${liked ? 'bg-rose-500 text-white shadow-2xl shadow-rose-500/40 scale-110' : 'bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-white/30'}
             `}
          >
            <span className="material-symbols-outlined !text-3xl active:scale-150 transition-transform" style={{ fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
          </button>

          <div className="flex flex-col items-center gap-2 opacity-30 select-none">
            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white">Julia Zenaro</p>
            <div className="h-px w-6 bg-accent-gold/40"></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Stories;
