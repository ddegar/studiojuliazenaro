
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
    <div className="flex flex-col h-screen bg-black relative overflow-hidden select-none">
      {/* Bars */}
      <div className="absolute top-6 left-0 w-full flex gap-1.5 px-4 z-[60]">
        {items.map((item, idx) => (
          <div key={item.id} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-md">
            <div
              className={`h-full bg-white transition-all duration-50 ${idx === currentIndex ? '' : 'duration-0'}`}
              style={{ width: `${idx < currentIndex ? 100 : idx === currentIndex ? progress : 0}%` }}
            ></div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-12 left-0 w-full flex items-center justify-between px-6 z-[60]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-white/30 overflow-hidden shadow-2xl bg-gray-800">
            {current.authorAvatar && <img src={current.authorAvatar} alt="author" className="w-full h-full object-cover" />}
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
        className="flex-1 w-full bg-cover bg-center bg-no-repeat transition-all duration-500 animate-fade-in relative"
        style={{ backgroundImage: `url(${current.url})` }}
        onClick={handleTouch}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none"></div>
      </div>

      {/* Footer */}
      <div className="p-8 pb-12 flex items-center justify-center absolute bottom-0 inset-x-0 z-[60] backdrop-blur-sm bg-black/10">
        <button
          onClick={(e) => { e.stopPropagation(); handleLike(); }}
          disabled={liked || likeLoading}
          className={`
            material-symbols-outlined text-4xl active:scale-150 transition-all duration-300
            ${liked ? 'text-rose-500 scale-110' : 'text-white/60 hover:text-white'}
          `}
          style={{ fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}
        >
          favorite
        </button>
      </div>
    </div>
  );
};

export default Stories;
