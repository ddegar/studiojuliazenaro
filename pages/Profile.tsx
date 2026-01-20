
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', profile_pic: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setProfile(data);
          setEditForm({
            name: data.name || '',
            phone: data.phone || '',
            profile_pic: data.profile_pic || ''
          });
        }
      } else {
        navigate('/login');
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      alert('As senhas não coincidem.');
      return;
    }
    if (passwordForm.new.length < 6) {
      alert('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    try {
      setIsSubmittingPassword(true);
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new
      });

      if (error) throw error;
      alert('Senha alterada com sucesso! ✨');
      setIsChangingPassword(false);
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      alert('Erro ao alterar senha: ' + err.message);
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          phone: editForm.phone,
          profile_pic: editForm.profile_pic
        })
        .eq('id', profile.id);

      if (error) throw error;
      await fetchProfile();
      setIsEditing(false);
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isPro = profile?.role === 'MASTER_ADMIN' || profile?.role === 'PROFESSIONAL_ADMIN';

  const menuItems = [
    { icon: 'person', label: 'Meus Dados', desc: 'Informações pessoais e contato', path: '#', action: () => setIsEditing(true) },
    { icon: 'auto_awesome', label: 'Perfil do Olhar', desc: 'Lash design e curvaturas favoritas', path: '/profile/aesthetic', hide: isPro },
    { icon: 'dashboard', label: 'Painel Admin', desc: 'Gerenciamento do estúdio', path: '/admin', show: isPro },
    { icon: 'card_membership', label: 'Lash Points', desc: `Meu saldo: ${profile?.lash_points || 0} pts`, path: '/profile/points', hide: isPro },
    { icon: 'diversity_3', label: 'Indique Amigas', desc: 'Ganhe pontos indicando', path: '/profile/refer', hide: isPro },
    { icon: 'lock', label: 'Segurança', desc: 'Alterar minha senha de acesso', path: '#', action: () => setIsChangingPassword(true) },
    { icon: 'help_center', label: 'Dúvidas e FAQ', desc: 'Tire suas dúvidas agora', path: '/faq' },
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
              <img src={profile?.profile_pic || `https://ui-avatars.com/api/?name=${profile?.name}&background=random`} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <button onClick={() => setIsEditing(true)} className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-2xl border-4 border-white flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined !text-xl">edit</span>
            </button>
          </div>
          <h1 className="font-display text-3xl font-bold text-primary mb-1 tracking-tight">{profile?.name || 'Visitante'}</h1>
          <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-6 opacity-60">
            {isPro ? 'Equipe Studio' : 'Cliente VIP'} • Desde {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '...'}
          </p>
        </div>

        <div className="px-6 py-10 space-y-10">
          {isEditing ? (
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl space-y-6 animate-slide-up">
              <h3 className="text-xl font-display font-bold text-primary">Editar Perfil</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Nome Completo</label>
                  <input className="w-full h-14 bg-gray-50 border-transparent rounded-2xl px-6 text-sm focus:bg-white focus:ring-2 ring-primary/10 transition-all" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Celular</label>
                  <input className="w-full h-14 bg-gray-50 border-transparent rounded-2xl px-6 text-sm" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">URL da Foto</label>
                  <input className="w-full h-14 bg-gray-50 border-transparent rounded-2xl px-6 text-sm" value={editForm.profile_pic} onChange={e => setEditForm({ ...editForm, profile_pic: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsEditing(false)} className="flex-1 h-14 bg-gray-100 text-gray-500 rounded-2xl font-bold text-[10px] uppercase tracking-widest">Cancelar</button>
                <button onClick={handleSave} className="flex-[2] h-14 bg-primary text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">Salvar Mudanças</button>
              </div>
            </div>
          ) : (
            <section className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary/30 px-4">Gerenciamento</p>
              <div className="space-y-3 pb-4">
                {menuItems.filter(item => !item.hide && (item.show !== false)).map((item, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (item.action) item.action();
                      else if (item.path !== '#') navigate(item.path);
                    }}
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
          )}

          {isChangingPassword && (
            <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 backdrop-blur-xl animate-fade-in">
              <div className="absolute inset-0" onClick={() => setIsChangingPassword(false)}></div>
              <form onSubmit={handlePasswordChange} className="bg-white w-full max-w-sm rounded-[40px] p-8 border border-gray-100 shadow-2xl relative z-10 animate-slide-up space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-display font-bold text-primary">Alterar Senha</h3>
                  <button type="button" onClick={() => setIsChangingPassword(false)} className="size-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400">
                    <span className="material-symbols-outlined !text-lg">close</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Nova Senha</label>
                    <input type="password" required className="w-full h-14 bg-gray-50 border-transparent rounded-2xl px-6 text-sm" value={passwordForm.new} onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Confirmar Nova Senha</label>
                    <input type="password" required className="w-full h-14 bg-gray-50 border-transparent rounded-2xl px-6 text-sm" value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
                  </div>
                </div>

                <button disabled={isSubmittingPassword} type="submit" className="w-full h-14 bg-primary text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50">
                  {isSubmittingPassword ? 'Processando...' : 'ATUALIZAR SENHA ✨'}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

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
