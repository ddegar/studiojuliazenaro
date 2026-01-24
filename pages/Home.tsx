
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
  const [recentCompletedAppt, setRecentCompletedAppt] = useState<any>(null);
  const [isApptToday, setIsApptToday] = useState(false);
  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

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
          const formatted = (storiesRes.data as any[]).map(s => {
            const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
            return {
              id: s.id,
              name: s.type === 'PROFESSIONAL' ? (profile?.name?.split(' ')[0] || 'Studio') : (profile?.name?.split(' ')[0] || 'Cliente'),
              img: s.image_url,
              isLive: s.type === 'PROFESSIONAL',
              avatar: profile?.profile_pic
            };
          });
          setStories(formatted);
        }

        if (user && profileRes.data) {
          setUserName(profileRes.data.name?.split(' ')[0] || 'Visitante');
          setProfileImg(profileRes.data.profile_pic || `https://ui-avatars.com/api/?name=${profileRes.data.name}&background=random`);

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
            .gte('start_time', nowISO)
            .in('status', ['CONFIRMED', 'PENDING', 'scheduled'])
            .order('start_time', { ascending: true })
            .limit(1);

          if (appts && appts.length > 0) {
            setNextAppt(appts[0]);
            setIsApptToday(appts[0].date === today);
          }

          // Fetch most recent completed appointment (within last 72 hours)
          const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
          const { data: recentCompleted } = await supabase.from('appointments')
            .select('id, service_name, date, time')
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .gte('updated_at', seventyTwoHoursAgo)
            .order('updated_at', { ascending: false })
            .limit(1);

          if (recentCompleted && recentCompleted.length > 0) {
            setRecentCompletedAppt(recentCompleted[0]);
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
        <div className="flex flex-col items-center gap-6">
          <div className="relative size-20 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-primary/10 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="font-display italic text-primary text-xl">JZ</span>
          </div>
          <p className="text-primary font-outfit font-light tracking-[0.3em] uppercase text-[10px] animate-pulse">Sua essência em foco</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full pb-32 bg-background-light overflow-y-auto no-scrollbar selection:bg-accent-gold/30 selection:text-primary">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none opacity-20 dark:opacity-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/40 blur-[100px] animate-float"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/20 blur-[80px] animate-float" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-[100] premium-blur px-6 py-4 flex justify-between items-center border-b border-primary/5">
        <div className="flex items-center gap-3">
          <div className="relative size-10 flex items-center justify-center">
            <div className="absolute inset-0 bg-primary organic-shape-1 opacity-10"></div>
            <img src={profileImg} alt="profile" className="size-8 object-cover organic-shape-1 shadow-inner" />
          </div>
          <div>
            <p className="text-[9px] font-outfit font-black uppercase tracking-[0.2em] text-primary/40 leading-none mb-1">Bem-vinda de volta</p>
            <h2 className="text-lg font-outfit font-medium text-primary tracking-tight">{userName}</h2>
          </div>
        </div>

        <div className="flex gap-2.5">
          {permission === 'default' && (
            <button onClick={subscribeToPush} className="size-10 flex items-center justify-center rounded-full bg-white border border-primary/5 text-primary shadow-sm hover:scale-110 active:scale-90 transition-all">
              <span className="material-symbols-outlined !text-xl opacity-60">notifications_active</span>
            </button>
          )}
          <button onClick={() => navigate('/notifications')} className="relative size-10 flex items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20 hover:scale-110 active:scale-90 transition-all">
            <span className="material-symbols-outlined !text-xl">notifications</span>
            <span className="absolute top-2.5 right-2.5 size-2 bg-accent-gold rounded-full border border-primary"></span>
          </button>
        </div>
      </header>

      <main className="relative z-10 space-y-10 pt-6">
        {/* Stories Section - Reimagined as "Moments" */}
        <section className="px-6 animate-reveal">
          <div className="flex gap-5 overflow-x-auto no-scrollbar py-2">
            {stories.length > 0 ? stories.map((story, i) => (
              <div key={story.id} onClick={() => navigate('/stories')} className="flex flex-col items-center gap-2.5 cursor-pointer shrink-0">
                <div className={`p-[2px] rounded-full bg-gradient-to-tr ${story.isLive ? 'from-primary via-accent-gold to-primary/40' : 'from-gray-200 to-gray-200'}`}>
                  <div className="w-16 h-16 rounded-full overflow-hidden p-[2px] bg-background-light">
                    <img src={story.img} className="w-full h-full object-cover rounded-full shadow-inner grayscale-[30%] hover:grayscale-0 transition-all duration-700" alt={story.name} />
                  </div>
                </div>
                <span className="text-[9px] font-outfit font-bold text-primary/60 uppercase tracking-[0.15em]">{story.name}</span>
              </div>
            )) : (
              <div onClick={() => navigate('/stories')} className="flex flex-col items-center gap-2.5 cursor-pointer shrink-0 group">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/20 flex items-center justify-center text-primary/40 group-hover:border-primary/40 group-hover:text-primary transition-all">
                  <span className="material-symbols-outlined !text-xl">add_a_photo</span>
                </div>
                <span className="text-[9px] font-outfit font-bold text-primary/30 uppercase tracking-[0.15em]">Sua Vez</span>
              </div>
            )}
          </div>
        </section>

        {/* Hero Narrative Section */}
        <section className="px-6 space-y-4 animate-reveal stagger-1">
          <div className="relative">
            <h1 className="text-4xl md:text-5xl font-display text-primary leading-[1.1] tracking-tight text-balance">
              Revele sua <span className="italic">melhor</span> versão hoje.
            </h1>
            <div className="absolute top-0 right-0 w-16 h-16 bg-accent-gold/10 rounded-full blur-2xl"></div>
          </div>
          <p className="text-sm font-outfit text-primary/60 leading-relaxed font-light max-w-[85%]">
            Transformando beleza em arte através de técnicas exclusivas e cuidado personalizado em cada detalhe.
          </p>
        </section>

        {/* Action Priority Cards */}
        <section className="px-6 space-y-6">
          {/* Priority Status Card */}
          {(isApptToday && nextAppt) ? (
            <div onClick={() => navigate('/checkin')} className="animate-reveal stagger-2 group cursor-pointer relative overflow-hidden rounded-[40px] bg-primary p-6 text-white shadow-2xl shadow-primary/30">
              <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-accent-gold/10 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex flex-col gap-5">
                <div className="flex justify-between items-start">
                  <div className="size-11 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-accent-gold !text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                  </div>
                  <span className="text-[8px] font-outfit font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-accent-gold/20 text-accent-gold border border-accent-gold/20">Check-in disponível</span>
                </div>
                <div>
                  <h3 className="text-xl font-display mb-1">Pronta para brilhar?</h3>
                  <p className="text-white/60 text-[10px] font-outfit font-light uppercase tracking-widest leading-normal">Inicie sua jornada VIP no Studio</p>
                </div>
                <div className="flex items-center gap-2 text-accent-gold font-outfit font-bold text-[9px] uppercase tracking-widest">
                  <span>Confirmar Presença</span>
                  <span className="material-symbols-outlined !text-sm group-hover:translate-x-2 transition-transform">east</span>
                </div>
              </div>
            </div>
          ) : nextAppt ? (
            <div className="animate-reveal stagger-2 relative overflow-hidden rounded-[40px] bg-white p-6 premium-shadow border border-primary/5">
              <div onClick={() => navigate('/history')} className="cursor-pointer group">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <p className="text-[8px] font-outfit font-black uppercase tracking-[0.2em] text-accent-gold">Seu próximo encontro</p>
                    <h3 className="text-xl font-display text-primary">{nextAppt.service_name}</h3>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-2xl text-primary transform group-hover:rotate-12 transition-transform">
                    <span className="material-symbols-outlined !text-2xl">calendar_today</span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-primary/5 pt-5 pb-5">
                  <div className="flex gap-3">
                    <div className="text-center bg-background-light px-4 py-2 rounded-2xl border border-primary/5">
                      <p className="text-[8px] font-outfit font-bold text-primary/40 uppercase tracking-widest">Data</p>
                      <p className="text-xs font-outfit font-bold text-primary">{nextAppt.date.split('-').reverse().slice(0, 2).join('/')}</p>
                    </div>
                    <div className="text-center bg-background-light px-4 py-2 rounded-2xl border border-primary/5">
                      <p className="text-[8px] font-outfit font-bold text-primary/40 uppercase tracking-widest">Hora</p>
                      <p className="text-xs font-outfit font-bold text-primary">{nextAppt.time}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-primary/20 !text-xl group-hover:text-primary/60 transition-colors">chevron_right</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/care/pre')}
                className="w-full h-11 bg-primary text-white rounded-2xl flex items-center justify-center gap-2 text-[9px] font-outfit font-black uppercase tracking-widest hover:bg-accent-gold hover:text-primary transition-all shadow-lg active:scale-95"
              >
                <span className="material-symbols-outlined !text-lg">lightbulb</span>
                Dicas Pré-Procedimento
              </button>
            </div>
          ) : null}

          {/* Post-Care Priority Card */}
          {recentCompletedAppt && !nextAppt && (
            <div onClick={() => navigate('/care/post')} className="animate-reveal animate-float stagger-2 group cursor-pointer relative overflow-hidden rounded-[40px] bg-[#fdfaf3] p-6 border border-accent-gold/20 shadow-xl">
              <div className="absolute top-[-10%] right-[-5%] w-32 h-32 bg-accent-gold/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-[2s]"></div>

              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="size-11 rounded-2xl bg-accent-gold/10 flex items-center justify-center text-accent-gold border border-accent-gold/10 group-hover:rotate-12 transition-transform">
                    <span className="material-symbols-outlined !text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>skincare</span>
                  </div>
                  <span className="text-[8px] font-outfit font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-accent-gold text-white border border-accent-gold shadow-sm">Ativo no momento</span>
                </div>

                <div>
                  <h3 className="text-lg font-display text-primary italic">Seu Pós-Procedimento</h3>
                  <p className="text-primary/40 text-[10px] font-outfit font-black uppercase tracking-widest leading-none mt-1">Dossiê {recentCompletedAppt.service_name}</p>
                </div>

                <div className="flex items-center gap-2 text-primary font-outfit font-bold text-[9px] uppercase tracking-widest bg-white/40 py-3 px-4 rounded-xl border border-primary/5">
                  <span className="material-symbols-outlined !text-base">clinical_notes</span>
                  <span>Acessar Diretrizes de Cuidado</span>
                  <span className="material-symbols-outlined !text-sm ml-auto opacity-40 group-hover:translate-x-1 transition-transform">east</span>
                </div>
              </div>
            </div>
          )}

          {/* JZ Privé Experience Card */}
          <div className="animate-reveal stagger-3">
            <JZPriveCard variant="compact" />
          </div>

          {/* New Appointment Narrative Card */}
          <div onClick={() => navigate('/services')} className="animate-reveal stagger-4 group cursor-pointer relative overflow-hidden rounded-[40px] aspect-[4/5] bg-primary shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1560750588-73207b1ef5b8?q=80&w=2070&auto=format&fit=crop"
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[3s]"
              alt="Beauty treatment"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/20 to-transparent"></div>
            <div className="absolute inset-0 p-8 flex flex-col justify-end gap-4 overflow-hidden">
              <div className="h-px w-12 bg-accent-gold group-hover:w-full transition-all duration-700"></div>
              <h4 className="text-3xl font-display text-white drop-shadow-lg">Sua beleza é única.</h4>
              <p className="text-white/70 text-xs font-outfit font-light leading-relaxed max-w-[80%]">Curadoria de serviços exclusivos para realçar o que você tem de melhor.</p>
              <div className="mt-4 py-4 px-6 rounded-2xl bg-white text-primary text-[10px] font-outfit font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all group-hover:bg-accent-gold group-hover:text-primary">
                Agendar Agora
                <span className="material-symbols-outlined !text-lg">arrow_outward</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Utility Grid */}
        <section className="px-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: 'diversity_3', label: 'Indique', sub: 'Ganhe Bonus', path: '/profile/refer', color: 'bg-[#faf3e8] text-[#c9a961]' },
              { icon: 'reviews', label: 'Feedbacks', sub: 'Comunidade', path: '/testimonials', color: 'bg-primary/5 text-primary' },
            ].map((btn, i) => (
              <div key={i} onClick={() => navigate(btn.path)} className={`p-6 rounded-[32px] ${btn.color} space-y-4 cursor-pointer active:scale-95 transition-all animate-reveal`} style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                <div className="size-10 rounded-xl bg-white/50 backdrop-blur-sm flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined !text-xl">{btn.icon}</span>
                </div>
                <div>
                  <h4 className="font-outfit font-bold text-sm tracking-tight">{btn.label}</h4>
                  <p className="text-[9px] font-outfit font-black uppercase tracking-widest opacity-60">{btn.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Brand Signoff */}
        <footer className="px-6 py-12 text-center space-y-4 opacity-30 select-none animate-reveal" style={{ animationDelay: '0.8s' }}>
          <p className="font-display italic text-lg text-primary tracking-widest text-balance">Excelência é a nossa única medida.</p>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-8 bg-primary"></div>
            <span className="font-outfit text-[8px] font-black uppercase tracking-[0.4em]">Julia Zenaro</span>
            <div className="h-px w-8 bg-primary"></div>
          </div>
        </footer>
      </main>

      {/* Persistent Premium Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-[120]">
        <nav className="animate-reveal" style={{ animationDelay: '0.8s' }}>
          <div className="premium-blur rounded-[28px] border border-primary/10 shadow-2xl px-6 py-3 flex justify-between items-center bg-white/80">
            <button className="relative p-2 text-primary group transition-all">
              <span className="material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
              <span className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-1 h-1 bg-accent-gold rounded-full"></span>
            </button>
            <button onClick={() => navigate('/feed')} className="p-2 text-primary/30 hover:text-primary transition-colors group">
              <span className="material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform">grid_view</span>
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

export default Home;
