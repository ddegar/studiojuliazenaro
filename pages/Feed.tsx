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
  const [heroItem, setHeroItem] = useState<Service | null>(null);
  const [popularServices, setPopularServices] = useState<Service[]>([]);
  const [feedGrid, setFeedGrid] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchFeedData = async () => {
      try {
        setLoading(true);
        // Fetch Services
        const { data: services } = await supabase
          .from('services')
          .select('*')
          .eq('active', true);

        // Fetch Testimonials
        const { data: testimonials } = await supabase
          .from('testimonials')
          .select('*, profiles(name)')
          .eq('status', 'approved')
          .limit(5);

        if (services) {
          // Map Services to CamelCase
          const mappedServices = services.map((s: any) => ({
            ...s,
            imageUrl: s.image_url || 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800',
            professionalIds: s.professional_ids,
            pointsReward: s.points_reward,
            isPopular: s.is_popular
          }));

          // 1. Hero Item (Random Popular or First)
          let popular = mappedServices.filter((s: any) => s.isPopular);

          // Fallback: If no popular services, take the first 5
          if (popular.length === 0) {
            popular = mappedServices.slice(0, 5);
          }

          setPopularServices(popular);

          if (popular.length > 0) {
            setHeroItem(popular[0]); // First popular as Hero
          } else if (mappedServices.length > 0) {
            setHeroItem(mappedServices[0]);
          }

          // 2. Build Grid (Services + Testimonials)
          const serviceItems: FeedItem[] = mappedServices.map((s: any) => ({
            type: 'SERVICE',
            data: s,
            id: s.id
          }));

          const reviewItems: FeedItem[] = (testimonials || []).map((t: any) => ({
            type: 'TESTIMONIAL',
            data: t,
            id: t.id
          }));

          // Interleave: 3 Services then 1 Testimonial
          const mixed: FeedItem[] = [];
          let sIdx = 0, rIdx = 0;
          while (sIdx < serviceItems.length) {
            mixed.push(serviceItems[sIdx++]);
            if (sIdx < serviceItems.length) mixed.push(serviceItems[sIdx++]);
            if (sIdx < serviceItems.length) mixed.push(serviceItems[sIdx++]);
            if (rIdx < reviewItems.length) mixed.push(reviewItems[rIdx++]);
          }

          setFeedGrid(mixed);
        }
      } catch (err) {
        console.error('Feed fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedData();
  }, []);

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newLiked = new Set(likedItems);
    if (newLiked.has(id)) newLiked.delete(id);
    else newLiked.add(id);
    setLikedItems(newLiked);
  };

  const handleShare = async (title: string) => {
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
      alert('Link copiado para a área de transferência!');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-background-light items-center justify-center">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-primary font-bold animate-pulse uppercase text-[10px] tracking-widest">Carregando Feed...</p>
      </div>
    );
  }

  return (
    <div className="bg-background-light min-h-screen pb-32 font-sans text-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background-light/95 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <button className="text-primary/70">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="font-display text-xl font-bold tracking-tight text-primary">Studio Julia Zenaro</h1>
        <button onClick={() => navigate('/booking')} className="text-[#c5a059]">
          <span className="material-symbols-outlined">event_note</span>
        </button>
      </header>

      {/* Category Nav */}
      <nav className="flex overflow-x-auto no-scrollbar px-6 py-4 gap-6 items-center bg-background-light">
        {['Geral', 'Cílios', 'Sobrancelhas', 'Lábios'].map(cat => (
          <button
            key={cat}
            onClick={() => setView(cat)}
            className={`relative flex-shrink-0 text-sm font-semibold pb-1 transition-colors ${view === cat ? 'text-primary' : 'text-gray-400'}`}
          >
            Feed {cat}
            {view === cat && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></span>}
          </button>
        ))}
      </nav>

      <main className="px-5 space-y-8">
        {/* Hero Section */}
        {heroItem && (
          <section className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer group" onClick={() => navigate(`/service/${heroItem.id}`, { state: { service: heroItem } })}>
            <div className="relative h-64 overflow-hidden">
              <img alt={heroItem.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={heroItem.imageUrl} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">Destaque da Semana</span>
                <span className="material-symbols-outlined text-[#D4AF37] text-lg">verified</span>
              </div>
              <h2 className="font-display text-2xl font-bold mb-2 text-primary">{heroItem.name}</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 font-light line-clamp-2">
                {heroItem.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-gray-400">
                  <button onClick={(e) => toggleLike(heroItem.id, e)} className="flex items-center gap-1 hover:text-rose-500 transition-colors">
                    <span className={`material-symbols-outlined text-sm ${likedItems.has(heroItem.id) ? 'text-rose-500 fill-current' : ''}`} style={{ fontVariationSettings: likedItems.has(heroItem.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                    <span className="text-xs font-medium">1.2k</span>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleShare(heroItem.name); }} className="flex items-center gap-1 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-sm">share</span>
                    <span className="text-xs font-medium">Share</span>
                  </button>
                </div>
                <button className="bg-primary text-white text-xs font-bold px-6 py-3 rounded-md tracking-widest uppercase hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20">
                  Ver Detalhes
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Popular Services 'Reels' */}
        {popularServices.length > 0 && (
          <section className="space-y-4 pt-2">
            <div className="flex justify-between items-end px-1">
              <h3 className="font-display text-xl font-bold text-primary">Experiências Privé</h3>
              <button onClick={() => navigate('/services')} className="text-[10px] font-black tracking-[0.2em] text-[#c5a059] uppercase mb-1">Ver Todas</button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-8 snap-x px-1">
              {popularServices.map(service => (
                <div
                  key={service.id}
                  onClick={() => navigate(`/service/${service.id}`, { state: { service } })}
                  className="relative flex-shrink-0 w-36 h-48 rounded-[32px] overflow-hidden snap-center active:scale-95 transition-transform shadow-lg shadow-black/5"
                >
                  <img src={service.imageUrl} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <p className="text-[8px] font-black text-[#c5a059] uppercase tracking-[0.2em] mb-1">Signature</p>
                    <p className="font-display text-base font-bold leading-tight">{service.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mixed Grid */}
        <div className="grid grid-cols-2 gap-4">
          {feedGrid.map((item, idx) => {
            if (item.type === 'SERVICE') {
              return (
                <div key={item.id} className="space-y-2 group cursor-pointer" onClick={() => navigate(`/service/${item.data.id}`, { state: { service: item.data } })}>
                  <div className="relative rounded-xl overflow-hidden aspect-[4/5] bg-gray-100 shadow-sm border border-gray-100">
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-primary text-[9px] font-bold px-2 py-1 rounded-sm tracking-tighter uppercase z-10 shadow-sm">
                      {item.data.category || 'Serviço'}
                    </span>
                    <img alt={item.data.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={item.data.imageUrl} />
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-medium text-gray-600 truncate max-w-[80%]">{item.data.name}</span>
                    <button onClick={(e) => toggleLike(item.id, e)} className="text-gray-300 hover:text-rose-500 transition-colors">
                      <span className={`material-symbols-outlined text-sm ${likedItems.has(item.id) ? 'text-rose-500 fill-current' : ''}`} style={{ fontVariationSettings: likedItems.has(item.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                    </button>
                  </div>
                </div>
              );
            } else if (item.type === 'POST') {
              return (
                <div key={item.id} className="space-y-2 group cursor-pointer">
                  <div className="relative rounded-xl overflow-hidden aspect-[4/5] bg-gray-100 shadow-sm border border-gray-100">
                    {item.data.caption && (
                      <span className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-[10px] text-white backdrop-blur-sm truncate">
                        {item.data.caption}
                      </span>
                    )}
                    <img alt="Post" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={item.data.image_url} />
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Feed</span>
                    <button onClick={(e) => toggleLike(item.id, e)} className="text-gray-300 hover:text-rose-500 transition-colors">
                      <span className={`material-symbols-outlined text-sm ${likedItems.has(item.id) ? 'text-rose-500 fill-current' : ''}`} style={{ fontVariationSettings: likedItems.has(item.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                    </button>
                  </div>
                </div>
              );
            } else {
              // Testimonial Card
              return (
                <div key={item.id} className="col-span-2 bg-white rounded-xl p-5 border border-gray-100 shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-primary/5 flex items-center justify-center text-[#c5a059] font-bold text-xs ring-2 ring-white shadow-sm">
                      {item.data.profiles?.name?.[0] || 'C'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary">{item.data.profiles?.name || 'Cliente'}</p>
                      <div className="flex text-[#c5a059]">
                        {[...Array(item.data.rating || 5)].map((_, i) => (
                          <span key={i} className="material-symbols-outlined !text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        ))}
                      </div>
                    </div>
                    <span className="ml-auto material-symbols-outlined text-gray-300 !text-lg">format_quote</span>
                  </div>
                  <p className="text-sm text-gray-500 italic leading-relaxed">"{item.data.message}"</p>
                  {item.data.photo_url && (
                    <div className="h-40 rounded-lg overflow-hidden mt-2">
                      <img src={item.data.photo_url} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              );
            }
          })}
        </div>
      </main>



      {/* Bottom Nav (App Standard) */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] glass-nav px-8 pt-4 pb-10 flex justify-between items-center shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-50 bg-[#fdfcf9]/80 backdrop-blur-xl border-t border-[#d4af37]/10 rounded-t-[32px]">
        <button onClick={() => navigate('/home')} className="flex flex-col items-center gap-1 text-primary/40 hover:text-primary transition-colors">
          <span className="material-symbols-outlined !text-2xl">home</span>
          <span className="text-[9px] uppercase tracking-tighter font-bold">Início</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined !text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
          <span className="text-[9px] uppercase tracking-tighter font-bold">Feed</span>
        </button>
        <button onClick={() => navigate('/services')} className="flex flex-col items-center gap-1 text-primary/40 hover:text-[#c5a059] transition-colors">
          <span className="material-symbols-outlined !text-3xl">diamond</span>
          <span className="text-[9px] uppercase tracking-tighter font-bold">Serviços</span>
        </button>
        <button onClick={() => navigate('/history')} className="flex flex-col items-center gap-1 text-primary/40 hover:text-primary transition-colors">
          <span className="material-symbols-outlined !text-2xl">calendar_today</span>
          <span className="text-[9px] uppercase tracking-tighter font-bold">Agenda</span>
        </button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1 text-primary/40 hover:text-primary transition-colors">
          <span className="material-symbols-outlined !text-2xl">person_outline</span>
          <span className="text-[9px] uppercase tracking-tighter font-bold">Perfil</span>
        </button>
      </nav>
      <div className="fixed bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-primary/5 rounded-full z-[60]"></div>
    </div>
  );
};

export default Feed;
