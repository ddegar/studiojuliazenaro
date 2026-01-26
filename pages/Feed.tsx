
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Service } from '../types';

interface FeedItem {
  type: 'SERVICE' | 'TESTIMONIAL' | 'POST';
  data: any;
  id: string;
}

const Feed: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('Geral');
  const [heroItem, setHeroItem] = useState<any>(null);
  const [popularServices, setPopularServices] = useState<Service[]>([]);
  const [feedGrid, setFeedGrid] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const [categories, setCategories] = useState<string[]>(['Geral']);

  useEffect(() => {
    const fetchFeedData = async () => {
      try {
        setLoading(true);

        // 1. Fetch Categories
        const { data: catData } = await supabase.from('feed_categories').select('name').order('name');
        if (catData) {
          const names = catData.map(c => c.name);
          // Ensure Geral is at the start if it exists, otherwise add it
          const filteredNames = names.filter(n => n !== 'Geral');
          setCategories(['Geral', ...filteredNames]);
        }

        // 2. Fetch Posts from professionals (Wall section)
        let postsQuery = supabase.from('feed_posts').select('*').eq('active', true).order('created_at', { ascending: false });
        if (view !== 'Geral') {
          postsQuery = postsQuery.eq('category', view);
        }
        const { data: posts } = await postsQuery;

        // 3. Fetch Popular Services (Prive Experience Carousel)
        const { data: services } = await supabase.from('services').select('*').eq('active', true);

        // 4. Fetch Testimonials
        const { data: testimonials } = await supabase.from('testimonials').select('*, profiles(name)').eq('status', 'approved').limit(10);

        if (services) {
          const mappedServices = services.map((s: any) => ({
            ...s,
            imageUrl: s.image_url || 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800',
            pointsReward: s.points_reward,
            isPopular: s.is_popular
          }));

          const popular = mappedServices.filter((s: any) => s.isPopular).slice(0, 10);
          setPopularServices(popular.length > 0 ? popular : mappedServices.slice(0, 5));

          // Hero is the most recent professional post or the first popular service
          if (posts && posts.length > 0) {
            setHeroItem({ ...posts[0], type: 'POST' });
          } else if (popular.length > 0) {
            setHeroItem({ ...popular[0], type: 'SERVICE' });
          }
        }

        // 5. Build Staggered Grid Logic
        const gridItems: FeedItem[] = [];
        if (posts) {
          posts.forEach(p => gridItems.push({ type: 'POST', data: p, id: p.id }));
        }

        if (testimonials) {
          testimonials.forEach((t, i) => {
            const interval = 2;
            const position = Math.min(gridItems.length, (i + 1) * interval + i);
            gridItems.splice(position, 0, { type: 'TESTIMONIAL', data: t, id: t.id });
          });
        }

        setFeedGrid(gridItems);
      } catch (err) {
        console.error('Feed fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedData();
  }, [view]);

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newLiked = new Set(likedItems);
    if (newLiked.has(id)) newLiked.delete(id);
    else newLiked.add(id);
    setLikedItems(newLiked);
  };

  const handleShare = async (title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Studio Julia Zenaro',
          text: `Confira ${title} no Studio Julia Zenaro!`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      alert('Link copiado!');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-background-light items-center justify-center">
        <div className="relative size-16 flex items-center justify-center">
          <div className="absolute inset-0 border-2 border-primary/10 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="font-display italic text-primary text-xl">JZ</span>
        </div>
        <p className="mt-6 text-primary/40 font-black uppercase text-[8px] tracking-[0.4em] animate-pulse">Revelando Inspiração</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background-light text-primary overflow-y-auto no-scrollbar selection:bg-accent-gold/30 pb-32 relative">
      {/* Dynamic Background Engine */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/40 blur-[100px] animate-float"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/20 blur-[80px] animate-float" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <header className="sticky top-0 z-[100] premium-blur px-8 py-6 flex justify-between items-center border-b border-primary/5">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/home')} className="size-10 flex items-center justify-center rounded-full bg-white border border-primary/5 text-primary shadow-sm hover:scale-110 active:scale-90 transition-all">
            <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
          </button>
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-primary/40 leading-none mb-1">Dossiê Visual</p>
            <h1 className="text-xl font-display italic text-primary tracking-tight leading-none">Inspiration Wall</h1>
          </div>
        </div>
        <button onClick={() => navigate('/booking')} className="size-11 flex items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 active:scale-90 transition-all">
          <span className="material-symbols-outlined !text-xl">event_note</span>
        </button>
      </header>

      {/* Elite Category Filter */}
      <nav className="relative z-10 flex overflow-x-auto no-scrollbar px-8 py-6 gap-10 items-center bg-white/5 backdrop-blur-md border-b border-primary/5">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setView(cat)}
            className={`relative flex-shrink-0 text-[9px] font-black uppercase tracking-[0.3em] pb-2 transition-all duration-500 whitespace-nowrap ${view === cat ? 'text-primary' : 'text-primary/30'}`}
          >
            {cat}
            {view === cat && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-gold rounded-full shadow-[0_0_10px_rgba(201,169,97,0.5)]"></span>
            )}
          </button>
        ))}
      </nav>

      <main className="relative z-10 space-y-16 py-10">
        {/* Highlights: Prive Experience Carousel */}
        <section className="space-y-8 animate-reveal">
          <div className="px-8 flex items-end justify-between">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-accent-gold uppercase tracking-[0.4em] leading-none">Elite Selection</p>
              <h3 className="text-2xl font-display italic text-primary tracking-tight">Experiência Privé</h3>
            </div>
            <div className="flex gap-2">
              <span className="size-1 rounded-full bg-accent-gold"></span>
              <span className="size-1 rounded-full bg-primary/10"></span>
              <span className="size-1 rounded-full bg-primary/10"></span>
            </div>
          </div>

          <div className="flex gap-6 overflow-x-auto no-scrollbar px-8 pb-4 snap-x">
            {popularServices.map((service, i) => (
              <div
                key={service.id}
                onClick={() => navigate(`/service/${service.id}`, { state: { service } })}
                className="group relative flex-shrink-0 w-64 h-80 rounded-[48px] overflow-hidden snap-center active:scale-95 transition-all duration-700 shadow-xl border border-primary/5 bg-white"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <img src={service.imageUrl} className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent"></div>

                <div className="absolute inset-x-0 bottom-0 p-8 space-y-3">
                  <div className="h-px w-8 bg-accent-gold/40 group-hover:w-full transition-all duration-700"></div>
                  <p className="font-display text-xl italic text-white leading-tight pr-4">{service.name}</p>
                  <p className="text-[9px] font-outfit font-black text-accent-gold uppercase tracking-widest">{service.category || 'Protocolo Elite'}</p>
                </div>
                <div className="absolute top-6 right-6 size-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/60 group-hover:text-white group-hover:scale-110 transition-all">
                  <span className="material-symbols-outlined !text-lg">arrow_outward</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Inspiration Wall (Professional Posts + Enhanced Testimonials) */}
        <section className="px-8 space-y-10">


          <div className="grid grid-cols-2 gap-8">
            {feedGrid.map((item, idx) => {
              if (item.type === 'POST') {
                return (
                  <div
                    key={item.id}
                    className="space-y-5 group cursor-pointer animate-reveal"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="relative rounded-[40px] overflow-hidden aspect-[4/5] bg-white border border-primary/5 shadow-lg hover:border-accent-gold/40 transition-all duration-700">
                      <div className="absolute top-5 left-5 z-20">
                        <span className="premium-blur text-primary text-[7px] font-black px-3 py-1.5 rounded-xl tracking-[0.3em] uppercase border border-primary/10 shadow-sm">
                          {item.data.category || 'Geral'}
                        </span>
                      </div>
                      <img alt="Post" className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" src={item.data.image_url} />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="flex justify-between items-center px-4">
                      <div className="space-y-1 flex-1 min-w-0 pr-4">
                        <p className="text-[8px] font-black text-primary/40 uppercase tracking-widest">Moment</p>
                        <p className="text-[11px] font-outfit text-primary/60 italic line-clamp-1">{item.data.caption || 'Revelação Studio'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => handleShare(item.data.caption || 'Inspiration', e)} className="transition-all active:scale-90 size-8 flex items-center justify-center rounded-full bg-primary/5 text-primary/30 hover:text-primary">
                          <span className="material-symbols-outlined !text-sm">share</span>
                        </button>
                        <button onClick={(e) => toggleLike(item.id, e)} className="transition-all active:scale-90 size-8 flex items-center justify-center rounded-full bg-primary/5">
                          <span className={`material-symbols-outlined !text-sm ${likedItems.has(item.id) ? 'text-accent-gold' : 'text-primary/20'}`} style={{ fontVariationSettings: likedItems.has(item.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              } else if (item.type === 'TESTIMONIAL') {
                return (
                  <div key={item.id} className="relative group animate-reveal col-span-2">
                    <div className="relative bg-white border border-primary/5 rounded-[48px] p-10 shadow-huge space-y-8 hover:border-accent-gold/20 transition-all duration-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <div className="size-14 rounded-2xl bg-primary flex items-center justify-center text-accent-gold font-display text-2xl font-bold shadow-huge relative overflow-hidden group-hover:scale-110 transition-transform">
                            <div className="absolute inset-0 bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            {item.data.profiles?.name?.[0] || 'C'}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-outfit font-black text-primary uppercase tracking-[0.2em]">{item.data.profiles?.name || 'Membro Elite'}</p>
                            <div className="flex items-center gap-1 text-accent-gold">
                              {[...Array(item.data.rating || 5)].map((_, i) => (
                                <span key={i} className="material-symbols-outlined !text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                              ))}
                              <span className="text-[8px] font-black uppercase tracking-widest text-primary/30 ml-2 font-outfit">Experiência Verificada</span>
                            </div>
                          </div>
                        </div>
                        <span className="material-symbols-outlined !text-5xl text-accent-gold/5 pointer-events-none">format_quote</span>
                      </div>

                      <div className="space-y-6">
                        <blockquote className="text-xl font-display italic text-primary/80 leading-relaxed max-w-[90%]">
                          "{item.data.message}"
                        </blockquote>

                        {item.data.photo_url && (
                          <div
                            onClick={() => setExpandedImage(item.data.photo_url)}
                            className="group/img relative h-96 rounded-[40px] overflow-hidden cursor-zoom-in border border-primary/5 shadow-inner animate-reveal"
                          >
                            <img src={item.data.photo_url} className="w-full h-full object-cover grayscale-[20%] group-hover/img:grayscale-0 group-hover/img:scale-105 transition-all duration-[2s]" alt="Result" />
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="size-14 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                                <span className="material-symbols-outlined">zoom_in</span>
                              </div>
                            </div>
                            <div className="absolute bottom-6 right-8 text-white/40 text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-black/20 backdrop-blur-sm pointer-events-none">
                              Ver Resultado em Detalhes
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })}

            {feedGrid.length === 0 && (
              <div className="col-span-2 py-20 text-center opacity-20">
                <span className="material-symbols-outlined !text-6xl mb-4 text-primary">palette</span>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Telas em preparo</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Cinematic Image Expansion Modal */}
      {expandedImage && (
        <div
          onClick={() => setExpandedImage(null)}
          className="fixed inset-0 z-[1000] bg-background-light/95 backdrop-blur-2xl flex items-center justify-center p-8 cursor-zoom-out animate-reveal"
        >
          <div className="relative w-full max-w-4xl aspect-[4/5] md:aspect-auto md:h-[80vh] rounded-[48px] overflow-hidden shadow-hugest animate-reveal-vertical border border-primary/5">
            <img src={expandedImage} className="w-full h-full object-contain bg-white" alt="Expanded Result" />
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-8 right-8 size-14 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined !text-2xl">close</span>
            </button>
            <div className="absolute bottom-10 left-10 p-6 rounded-3xl bg-white/40 backdrop-blur-md border border-white/20">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/60 mb-1 leading-none">High Definition Mastery</p>
              <h4 className="text-xl font-display italic text-primary leading-none">Protocolo de Excelência</h4>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Premium Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-[120]">
        <nav className="animate-reveal" style={{ animationDelay: '0.8s' }}>
          <div className="premium-blur rounded-[28px] border border-primary/10 shadow-2xl px-6 py-3 flex justify-between items-center bg-white/80">
            <button onClick={() => navigate('/home')} className="p-2 text-primary/30 hover:text-primary transition-colors group">
              <span className="material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform">home</span>
            </button>
            <button className="relative p-2 text-primary group transition-all">
              <span className="material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
              <span className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-1 h-1 bg-accent-gold rounded-full"></span>
            </button>
            <button onClick={() => navigate('/services')} className="relative size-14 -translate-y-6 rounded-3xl bg-primary text-accent-gold shadow-lg shadow-primary/40 flex items-center justify-center border-4 border-background-light group-active:scale-90 transition-transform ring-1 ring-primary/5">
              <span className="material-symbols-outlined !text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
            </button>
            <button onClick={() => navigate('/history')} className="p-2 text-primary/30 hover:text-primary transition-colors group">
              <span className="material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform">calendar_today</span>
            </button>
            <button onClick={() => navigate('/profile')} className="p-2 text-primary/30 hover:text-primary transition-colors group">
              <span className="material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform">person_outline</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Visual Safe Area Inset */}
      <div className="fixed bottom-0 left-0 w-full h-8 bg-background-light pointer-events-none z-[90]"></div>
    </div>
  );
};

export default Feed;
