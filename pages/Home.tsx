
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { usePushNotifications } from '../hooks/usePushNotifications';
import JZPriveCard from '../components/JZPriveCard';

const Home: React.FC = () => {
  const { subscribeToPush, permission } = usePushNotifications();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Visitante');
  const [profileImg, setProfileImg] = useState('');
  const [nextAppt, setNextAppt] = useState<any>(null);
  const [isApptToday, setIsApptToday] = useState(false);
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
              profiles (name, profile_pic)
            `)
            .gt('expires_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false }),
          user ? supabase.from('profiles').select('name, profile_pic').eq('id', user.id).single() : Promise.resolve({ data: null })
        ]);

        if (storiesRes.data) {
          const formatted = storiesRes.data.map(s => ({
            id: s.id,
            name: s.type === 'PROFESSIONAL' ? (s.profiles?.name?.split(' ')[0] || 'Studio') : (s.profiles?.name?.split(' ')[0] || 'Cliente'),
            img: s.image_url,
            isLive: s.type === 'PROFESSIONAL',
            avatar: s.profiles?.profile_pic
          }));
          setStories(formatted);
        }

        if (user && profileRes.data) {
          setUserName(profileRes.data.name?.split(' ')[0] || 'Visitante');
          setProfileImg(profileRes.data.profile_pic || `https://ui-avatars.com/api/?name=${profileRes.data.name}&background=random`);

          // Get today's date in local YYYY-MM-DD format
          const now = new Date();
          const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const nowISO = now.toISOString();

          const { data: appts } = await supabase.from('appointments')
            .select(`
                      id,
                      date,
                      time,
                      status,
                      service_name,
                      professional_name,
                      start_time
                  `)
            .eq('user_id', user.id)
            .gte('start_time', nowISO) // Better: only show future appointments
            .in('status', ['CONFIRMED', 'PENDING', 'scheduled'])
            .order('start_time', { ascending: true })
            .limit(1);

          if (appts && appts.length > 0) {
            setNextAppt(appts[0]);
            // Check if appointment is TODAY
            setIsApptToday(appts[0].date === today);
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

        {/* Check-in VIP - ONLY shows on appointment day */}
        {isApptToday && nextAppt && (
          <div
            onClick={() => navigate('/checkin')}
            className="relative bg-primary p-5 rounded-[24px] text-white shadow-xl shadow-primary/20 active:scale-[0.98] transition-transform cursor-pointer overflow-hidden"
          >
            {/* Shimmer effect */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.3) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s infinite linear'
              }}
            />
            <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-accent-gold/20 flex items-center justify-center border border-accent-gold/30">
                  <span className="material-symbols-outlined text-accent-gold !text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-accent-gold mb-0.5">Chegou ao Studio? ✨</p>
                  <p className="text-base font-display font-bold">Sua experiência VIP te aguarda</p>
                  <p className="text-[10px] text-white/60 mt-0.5">Toque para realizar seu check-in</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-white/40 !text-xl">arrow_forward</span>
            </div>
          </div>
        )}

        {/* Próximo Atendimento - Only shows when there's an active appointment */}
        {nextAppt && (
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
        )}

        {/* JZ Privé Club Card - New Component */}
        <JZPriveCard variant="compact" />

        {/* Featured Card - Novo Agendamento Premium */}
        <div className="relative overflow-hidden rounded-[32px] bg-white premium-shadow border border-accent-gold/5 group">
          <div
            className="w-full bg-center bg-no-repeat aspect-[16/10] bg-cover transition-transform duration-[2s] group-hover:scale-110"
            style={{
              backgroundImage: 'linear-gradient(to bottom, rgba(54, 89, 77, 0.1), rgba(54, 89, 77, 0.7)), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAxlUGcpS4edabXPANz7RkbUoCpulA5LlKSZ0tUKhy4j6UNXPyz_-wsyT9xor4SH3SIO2KPIc9YAKXb92aUy4BsdS_Wwk8fxt8CLHfDxFc9B2THg34wCo9A3wjClPOnv-LUXnsridSexC8hpxLIhkQfoVrsZf2qg9ZkUgD-UEchyOBaRJmECZf_S5YfhHoehhzlKoZT8zz-caKC54zCypzc-vOhjfTQQ-5HPg4x8Ivz0f7X52dI3r4ke6H3NOTLaRnWYJiBvtt7Fp8")'
            }}
          >
            <div className="absolute inset-0 p-8 flex flex-col justify-end">
              <h4 className="text-white text-2xl font-display font-bold mb-2 drop-shadow-lg">Realce sua beleza natural</h4>
              <p className="text-white/90 text-sm mb-6 max-w-[85%] leading-relaxed font-black uppercase tracking-wider text-[9px]">Transforme seu olhar com nossas especialistas.</p>
              <button
                onClick={() => navigate('/services')}
                className="bg-primary hover:bg-primary-dark text-white font-black uppercase tracking-[0.2em] py-4 px-6 rounded-2xl text-[10px] transition-all flex items-center justify-center gap-3 w-full shadow-2xl active:scale-95 border border-white/10"
              >
                <span className="material-symbols-outlined !text-lg">calendar_month</span>
                Agende seu horário
              </button>
            </div>
          </div>
        </div>

        {/* Grid de Links Rápidos - 3 colunas */}
        <div className="grid grid-cols-3 gap-3">
          <div onClick={() => navigate('/profile/refer')} className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm flex flex-col items-center gap-3 cursor-pointer active:scale-95 transition-all">
            <div className="size-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
              <span className="material-symbols-outlined !text-xl">diversity_3</span>
            </div>
            <div className="text-center">
              <h4 className="font-bold text-[11px] text-primary leading-tight">Indique Amigas</h4>
              <p className="text-[8px] text-accent-gold font-black uppercase tracking-wide mt-0.5">Ganhe 💖</p>
            </div>
          </div>

          <div onClick={() => navigate('/testimonials')} className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm flex flex-col items-center gap-3 cursor-pointer active:scale-95 transition-all">
            <div className="size-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
              <span className="material-symbols-outlined !text-xl">reviews</span>
            </div>
            <div className="text-center">
              <h4 className="font-bold text-[11px] text-primary leading-tight">Depoimentos</h4>
              <p className="text-[8px] text-gray-400 font-medium uppercase tracking-wide mt-0.5">Inspire-se</p>
            </div>
          </div>

          <div onClick={() => navigate('/faq')} className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm flex flex-col items-center gap-3 cursor-pointer active:scale-95 transition-all">
            <div className="size-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
              <span className="material-symbols-outlined !text-xl">help_center</span>
            </div>
            <div className="text-center">
              <h4 className="font-bold text-[11px] text-primary leading-tight">Dúvidas</h4>
              <p className="text-[8px] text-gray-400 font-medium uppercase tracking-wide mt-0.5">Suporte</p>
            </div>
          </div>
        </div>

        <div className="py-6 text-center space-y-2 opacity-30 select-none">
          <p className="font-display italic text-base text-primary tracking-widest">Seu espaço de cuidado sempre te espera</p>
          <div className="h-px w-8 bg-primary mx-auto"></div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 glass-nav px-8 pt-4 pb-10 flex justify-between items-center shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-50 bg-[#fdfcf9]/80 backdrop-blur-xl border-t border-[#d4af37]/10">
        <button className="flex flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined !text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="text-[9px] uppercase tracking-tighter font-bold">Início</span>
        </button>
        <button onClick={() => navigate('/feed')} className="flex flex-col items-center gap-1 text-primary/40 hover:text-primary transition-colors">
          <span className="material-symbols-outlined !text-2xl">grid_view</span>
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

export default Home;
