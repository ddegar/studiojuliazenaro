
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../services/supabase';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (data) setProfile(data);
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const menuItems = [
    { icon: 'person', label: 'Meus Dados', desc: 'Informações pessoais e contato', path: '#' },
    { icon: 'auto_awesome', label: 'Perfil do Olhar', desc: 'Lash design e curvaturas favoritas', path: '/profile/aesthetic' },
    { icon: 'card_membership', label: 'Lash Points', desc: `Meu saldo de fidelidade: ${profile?.loyalty_points || 0} pts`, path: '/profile/points' },
    { icon: 'confirmation_number', label: 'Meus Cupons', desc: 'Descontos disponíveis para você', path: '/profile/coupons' },
    { icon: 'diversity_3', label: 'Indique Amigas', desc: 'Compartilhe esse cuidado 💖', path: '/profile/refer' },
    { icon: 'help_center', label: 'Dúvidas e FAQ', desc: 'Tire suas dúvidas agora', path: '/faq' },
    { icon: 'settings', label: 'Configurações', desc: 'Notificações e privacidade', path: '#' },
  ];

  return (
    <div className="flex flex-col h-full pb-24 bg-background-light overflow-y-auto no-scrollbar">
      <header className="sticky top-0 z-50 glass-nav p-6 flex items-center justify-between border-b">
        <button onClick={() => navigate('/home')} className="material-symbols-outlined text-primary">arrow_back_ios</button>
        <h2 className="font-display font-bold text-primary">Seu Perfil</h2>
        <span className="size-6"></span>
      </header>

      <main className="flex-1">
        <div className="flex flex-col items-center py-12 px-6 text-center bg-white/50 border-b border-gray-50">
          <div className="relative mb-6">
            <div className="w-32 h-32 rounded-[40px] border-4 border-white shadow-xl overflow-hidden bg-gray-100 ring-1 ring-primary/5">
              <img src="https://picsum.photos/200/200?sig=profile" alt="avatar" />
            </div>
            <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-2xl border-4 border-white flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined !text-xl">edit</span>
            </button>
          </div>
          <h1 className="font-display text-3xl font-bold text-primary mb-1 tracking-tight">{profile?.name || 'Visitante'}</h1>
          <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-6 opacity-60">Cliente VIP • Desde {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '...'}</p>

          <div className="flex flex-col gap-4 items-center">
            <button
              onClick={() => navigate('/profile/levels')}
              className="bg-accent-gold/10 text-accent-gold px-6 py-2 rounded-full border border-accent-gold/20 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined !text-base fill-1">stars</span>
              Nível Diamante
            </button>
          </div>
        </div>

        <div className="px-6 py-10 space-y-10">
          <section className="space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/30 px-4">Gerenciamento</p>
            <div className="space-y-3 pb-4">
              {menuItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => item.path !== '#' && navigate(item.path)}
                  className="w-full bg-white p-6 rounded-[32px] flex items-center justify-between border border-gray-50 shadow-sm active:scale-[0.98] transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-5">
                    <div className="size-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined !text-2xl">{item.icon}</span>
                    </div>
                    <div className="text-left space-y-0.5">
                      <p className="text base font-bold text-primary">{item.label}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{item.desc}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-gray-200">chevron_right</span>
                </button>
              ))}
            </div>

            <div className="space-y-3 pt-6 border-t border-gray-100">
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate('/login');
                }}
                className="w-full h-16 border border-rose-500/10 text-rose-500 rounded-[24px] font-black flex items-center justify-center gap-4 text-[10px] uppercase tracking-[0.3em] active:bg-rose-50 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                Encerrar Sessão
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Nav de 5 itens */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] glass-nav border-t border-gray-100 flex justify-around items-center py-6 px-4 z-50 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button onClick={() => navigate('/home')} className="flex flex-col items-center gap-1.5 text-gray-400">
          <span className="material-symbols-outlined !text-3xl">home</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Início</span>
        </button>
        <button onClick={() => navigate('/feed')} className="flex flex-col items-center gap-1.5 text-gray-400">
          <span className="material-symbols-outlined !text-3xl">grid_view</span>
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
        <button className="flex flex-col items-center gap-1.5 text-primary">
          <span className="material-symbols-outlined !text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Perfil</span>
        </button>
      </nav>
    </div>
  );
};

export default Profile;
