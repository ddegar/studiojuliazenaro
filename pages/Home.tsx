
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { usePushNotifications } from '../hooks/usePushNotifications';

const Home: React.FC = () => {
  const { subscribeToPush, permission } = usePushNotifications();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Visitante');
  const [profileImg, setProfileImg] = useState('');
  const [nextAppt, setNextAppt] = useState<any>(null);
  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        // Parallel fetching
        const [storiesRes, profileRes] = await Promise.all([
          supabase
            .from('stories')
            .select(`
              id,
              image_url,
              type,
              profiles (name, avatar_url)
            `)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false }),
          user ? supabase.from('profiles').select('name, avatar_url').eq('id', user.id).single() : Promise.resolve({ data: null })
        ]);

        if (storiesRes.data) {
          const formatted = storiesRes.data.map(s => ({
            id: s.id,
            name: s.type === 'PROFESSIONAL' ? (s.profiles?.name?.split(' ')[0] || 'Studio') : (s.profiles?.name?.split(' ')[0] || 'Cliente'),
            img: s.image_url,
            isLive: s.type === 'PROFESSIONAL',
            avatar: s.profiles?.avatar_url
          }));
          setStories(formatted);
        }

        if (user && profileRes.data) {
          setUserName(profileRes.data.name?.split(' ')[0] || 'Visitante');
          setProfileImg(profileRes.data.avatar_url || `https://ui-avatars.com/api/?name=${profileRes.data.name}&background=random`);

          const today = new Date().toISOString().split('T')[0];
          const { data: appts } = await supabase.from('appointments')
            .select(`
                      id,
                      date,
                      time,
                      status,
                      service_name,
                      professional_name
                  `)
            .eq('user_id', user.id)
            .gte('date', today)
            .neq('status', 'CANCELLED')
            .order('date', { ascending: true })
            .order('time', { ascending: true })
            .limit(1);

          if (appts && appts.length > 0) {
            setNextAppt(appts[0]);
          }
        }
      } catch (err) {
        console.error('Home data error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-primary font-display font-bold animate-pulse">Preparando seu espaço...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full pb-20 bg-background-light overflow-y-auto no-scrollbar">
      {/* Header Premium */}
      <header className="sticky top-0 z-50 glass-nav p-6 pb-3 flex justify-between items-center rounded-b-[28px]">
        <div className="flex items-center gap-3">
          <div className="ring-2 ring-accent-gold ring-offset-1 rounded-full overflow-hidden w-10 h-10 shadow-md">
            <img src={profileImg} alt="profile" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/60">Seu momento 💖</p>
            <h2 className="text-xl font-display font-bold text-primary leading-tight">Olá, {userName}</h2>
          </div>
        </div>

        <div className="flex gap-2">
          {permission === 'default' && (
            <button onClick={subscribeToPush} className="size-10 flex items-center justify-center rounded-full bg-accent-gold text-primary premium-shadow border border-white/20 active:scale-90 transition-transform animate-pulse">
              <span className="material-symbols-outlined !text-xl">notifications_active</span>
            </button>
          )}
          <button onClick={() => navigate('/notifications')} className="relative size-10 flex items-center justify-center rounded-full bg-white premium-shadow border border-gray-50 active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-primary !text-xl">notifications</span>
            <span className="absolute top-2.5 right-2.5 size-2 bg-rose-500 rounded-full border border-white"></span>
          </button>
        </div>
      </header>

      <main className="px-5 py-4 space-y-6">
        {/* Stories Tray */}
        <section className="space-y-3">
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-1 snap-x px-1">
            {stories.length > 0 ? stories.map(story => (
              <div key={story.id} onClick={() => navigate('/stories')} className="flex flex-col items-center gap-2 cursor-pointer shrink-0 snap-center">
                <div className={`p-0.5 rounded-full border-2 ${story.isLive ? 'border-primary' : 'border-accent-gold/40'}`}>
                  <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-white">
                    <img src={story.img} className="w-full h-full object-cover" alt={story.name} />
                  </div>
                </div>
                <span className="text-[8px] font-black text-primary uppercase tracking-widest text-center truncate w-16">{story.name}</span>
              </div>
            )) : (
              <div className="flex flex-col items-center gap-2 opacity-30">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center">
                  <span className="material-symbols-outlined !text-sm">photo_camera</span>
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest">Poste o seu</span>
              </div>
            )}
          </div>
        </section>

        {/* Check-in Emocional */}
        <div
          onClick={() => navigate('/checkin')}
          className="bg-primary p-4 rounded-[24px] text-white flex items-center justify-between shadow-xl shadow-primary/10 active:scale-[0.98] transition-transform cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-accent-gold !text-2xl">location_on</span>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-60">No Studio?</p>
              <p className="text-sm font-bold">Seja bem-vinda ✨</p>
            </div>
          </div>
          <span className="material-symbols-outlined opacity-40 !text-xl">east</span>
        </div>

        {/* Próximo Atendimento */}
        {nextAppt ? (
          <div onClick={() => navigate('/history')} className="relative overflow-hidden rounded-[32px] bg-white p-5 premium-shadow border border-accent-gold/5 group cursor-pointer active:scale-[0.99] transition-all">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5 flex-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 text-primary text-[8px] font-black uppercase tracking-widest">
                  Seu cuidado 💖
                </span>
                <h3 className="text-lg font-display font-bold text-primary">{nextAppt.service_name || 'Atendimento'}</h3>
                <div className="flex flex-col gap-0.5">
                  <p className="text-xs font-bold text-gray-700">{nextAppt.date.split('-').reverse().join('/')} • {nextAppt.time}</p>
                  <p className="text-[10px] text-gray-400 font-medium">Com {nextAppt.professional_name || 'Studio'}</p>
                </div>
              </div>
              <div className="bg-primary/5 p-3 rounded-xl shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl">event_upcoming</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
              <button onClick={(e) => { e.stopPropagation(); navigate('/care/pre'); }} className="text-[9px] font-black text-accent-gold uppercase tracking-widest underline underline-offset-4">Dicas pré-procedimento</button>
              <span className="material-symbols-outlined !text-sm text-gray-300">chevron_right</span>
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-[24px] border border-gray-100 flex items-center justify-between opacity-80">
            <p className="text-xs text-gray-500">Nenhum agendamento futuro.</p>
            <button onClick={() => navigate('/services')} className="text-[10px] font-bold text-primary underline">Agendar</button>
          </div>
        )}

        {/* Botão Agendar Principal */}
        <div onClick={() => navigate('/services')} className="relative overflow-hidden rounded-[28px] bg-primary-dark p-6 text-white shadow-xl cursor-pointer active:scale-[0.98] transition-transform group">
          <div className="absolute inset-0 bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-display font-bold tracking-tight">Novo Agendamento</h3>
              <p className="text-white/60 text-[9px] font-black uppercase tracking-widest">Encontre seu horário perfeito ✨</p>
            </div>
            <div className="bg-accent-gold p-3.5 rounded-full shadow-lg ring-4 ring-white/5">
              <span className="material-symbols-outlined text-primary text-2xl font-bold">calendar_add_on</span>
            </div>
          </div>
        </div>

        {/* Grid de Links Rápidos */}
        <div className="grid grid-cols-2 gap-3">
          <div onClick={() => navigate('/profile/refer')} className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex flex-col gap-2 cursor-pointer active:scale-95 transition-all">
            <div className="size-9 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
              <span className="material-symbols-outlined !text-xl">diversity_3</span>
            </div>
            <div>
              <h4 className="font-bold text-xs text-primary">Indique Amigas</h4>
              <p className="text-[8px] text-accent-gold font-black uppercase tracking-widest">Ganhe pontos 💖</p>
            </div>
          </div>

          <div onClick={() => navigate('/testimonials')} className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex flex-col gap-2 cursor-pointer active:scale-95 transition-all">
            <div className="size-9 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
              <span className="material-symbols-outlined !text-xl">reviews</span>
            </div>
            <div>
              <h4 className="font-bold text-xs text-primary">Depoimentos</h4>
              <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Prova social</p>
            </div>
          </div>

          <div onClick={() => navigate('/profile/points')} className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex flex-col gap-2 cursor-pointer active:scale-95 transition-all">
            <div className="size-9 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
              <span className="material-symbols-outlined !text-xl">stars</span>
            </div>
            <div>
              <h4 className="font-bold text-xs text-primary">Lash Points</h4>
              <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Seus prêmios</p>
            </div>
          </div>

          <div onClick={() => navigate('/faq')} className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex flex-col gap-2 cursor-pointer active:scale-95 transition-all">
            <div className="size-9 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
              <span className="material-symbols-outlined !text-xl">help_center</span>
            </div>
            <div>
              <h4 className="font-bold text-xs text-primary">Dúvidas</h4>
              <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Fale conosco</p>
            </div>
          </div>
        </div>

        <div className="py-6 text-center space-y-2 opacity-30 select-none">
          <p className="font-display italic text-base text-primary tracking-widest">Seu espaço de cuidado sempre te espera</p>
          <div className="h-px w-8 bg-primary mx-auto"></div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] glass-nav border-t border-gray-100 flex justify-around items-center py-4 px-4 z-50 rounded-t-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button onClick={() => navigate('/home')} className="flex flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined !text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Início</span>
        </button>
        <button onClick={() => navigate('/feed')} className="flex flex-col items-center gap-1 text-gray-400">
          <span className="material-symbols-outlined !text-2xl">grid_view</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Feed</span>
        </button>
        <button onClick={() => navigate('/services')} className="flex flex-col items-center gap-1 text-gray-400">
          <span className="material-symbols-outlined !text-2xl">content_cut</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Serviços</span>
        </button>
        <button onClick={() => navigate('/history')} className="flex flex-col items-center gap-1 text-gray-400">
          <span className="material-symbols-outlined !text-2xl">calendar_today</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Agenda</span>
        </button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1 text-gray-400">
          <span className="material-symbols-outlined !text-2xl">person</span>
          <span className="text-[8px] font-black uppercase tracking-widest">Perfil</span>
        </button>
      </nav>
    </div>
  );
};

export default Home;
