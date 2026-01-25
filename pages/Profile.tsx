
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import JZReferralCard from '../components/JZReferralCard';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', profile_pic: '', email: '', cpf: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    try {
      setUploadingImage(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      setEditForm({ ...editForm, profile_pic: publicUrl });
      alert('Foto atualizada com sucesso! ✨');
    } catch (err: any) {
      console.error('Upload error:', err);
      alert('Erro ao fazer upload: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('name, phone, profile_pic, email, cpf, role, lash_points').eq('id', user.id).maybeSingle();
        if (data) {
          setProfile(data);
          setEditForm({
            name: data.name || '',
            phone: data.phone || '',
            profile_pic: data.profile_pic || '',
            email: data.email || '',
            cpf: data.cpf || ''
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

      // 1. Update Email in Auth if changed
      const { data: { user } } = await supabase.auth.getUser();
      if (user && editForm.email !== profile.email) {
        const { error: authError } = await supabase.auth.updateUser({ email: editForm.email });
        if (authError) throw authError;
      }

      // 2. Update Public Profile
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          phone: editForm.phone,
          profile_pic: editForm.profile_pic,
          email: editForm.email,
          cpf: editForm.cpf.replace(/\D/g, '') // Save clean CPF
        })
        .eq('id', profile.id);

      if (error) throw error;

      alert('Perfil atualizado com sucesso! ✨' + (editForm.email !== profile.email ? ' Verifique seu novo e-mail para confirmar a alteração.' : ''));
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
      <div className="flex h-screen items-center justify-center bg-background-light font-outfit">
        <div className="relative size-16 flex items-center justify-center">
          <div className="absolute inset-0 border-2 border-primary/5 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
          <span className="material-symbols-outlined text-primary scale-75">spa</span>
        </div>
      </div>
    );
  }

  const isPro = profile?.role === 'MASTER_ADMIN' || profile?.role === 'PROFESSIONAL_ADMIN';

  const menuItems = [
    { icon: 'person', label: 'Identidade e Dados', desc: 'Sua essência cadastrada no clube', path: '#', action: () => setIsEditing(true) },
    { icon: 'auto_awesome', label: 'Seu Perfil do Olhar', desc: 'Design, curvaturas e preferências VIP', path: '/profile/aesthetic', hide: isPro },
    { icon: 'dashboard', label: 'Gestão Estratégica', desc: 'Acesso ao painel administrativo', path: '/admin', show: isPro },
    { icon: 'workspace_premium', label: 'JZ Privé Club', desc: `Status: ${profile?.lash_points >= 3000 ? 'Privé' : profile?.lash_points >= 1500 ? 'Signature' : profile?.lash_points >= 500 ? 'Prime' : 'Select'} • ${profile?.lash_points || 0} JZ Balance`, path: '/prive', hide: isPro },
    { icon: 'verified_user', label: 'Segurança de Acesso', desc: 'Gerenciar senhas e chaves', path: '#', action: () => setIsChangingPassword(true) },
    { icon: 'help_center', label: 'Concierge e FAQ', desc: 'Suporte especializado para você', path: '/faq' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background-light font-outfit antialiased selection:bg-accent-gold/20 selection:text-primary overflow-x-hidden">
      {/* Immersive Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[70%] aspect-square organic-shape-1 bg-accent-gold/20 blur-[100px] animate-float"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <header className="relative z-50 premium-blur sticky top-0 px-6 py-8 flex items-center justify-between border-b border-primary/5">
        <button
          onClick={() => navigate('/home')}
          className="size-12 rounded-2xl bg-white shadow-sm border border-primary/5 flex items-center justify-center text-primary group active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined !text-xl group-hover:-translate-x-1 transition-transform">west</span>
        </button>
        <div className="text-center">
          <p className="text-[8px] font-black uppercase tracking-[0.5em] text-primary/30 leading-none mb-1">Seu Universo</p>
          <h2 className="font-display italic text-xl text-primary">Perfil VIP</h2>
        </div>
        <div className="size-12"></div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar pb-32">
        {/* Profile Narrative Section */}
        <div className="flex flex-col items-center pt-10 pb-12 px-8 text-center animate-reveal">
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-accent-gold/10 rounded-[48px] rotate-6 group-hover:rotate-12 transition-transform duration-700 blur-xl scale-110"></div>
            <div className="relative size-32 rounded-[40px] bg-white p-1 border border-primary/10 shadow-huge overflow-hidden">
              <img
                src={profile?.profile_pic || `https://ui-avatars.com/api/?name=${profile?.name}&background=0f3e29&color=C9A961`}
                alt="avatar"
                className="w-full h-full object-cover rounded-[36px]"
              />
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="absolute -bottom-2 -right-2 size-11 bg-primary text-accent-gold rounded-2xl border-4 border-background-light flex items-center justify-center shadow-2xl active:scale-90 transition-all"
            >
              <span className="material-symbols-outlined !text-xl">edit_note</span>
            </button>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-4xl text-primary italic tracking-tight">{profile?.name || 'Membro do Clube'}</h1>
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-4 bg-accent-gold/40"></span>
              <p className="text-[10px] font-black text-primary/40 uppercase tracking-[0.3em]">
                {isPro ? 'Curadoria Professional' : 'Membro Prestige'} • Desce {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '...'}
              </p>
              <span className="h-px w-4 bg-accent-gold/40"></span>
            </div>
          </div>
        </div>

        <div className="px-8 space-y-12">
          {isEditing ? (
            <div className="bg-white p-10 rounded-[56px] shadow-huge border border-primary/5 space-y-10 animate-reveal">
              <div className="space-y-4 text-center">
                <h3 className="text-3xl font-display text-primary leading-tight">Aperfeiçoar <br /> <span className="italic text-accent-gold">Seus Dados.</span></h3>
              </div>

              <div className="space-y-10">
                <div className="group relative">
                  <label className="absolute -top-3 left-1 text-[9px] font-black uppercase tracking-[0.2em] text-primary/40 transition-all group-focus-within:text-accent-gold">Identidade Social</label>
                  <input className="w-full bg-transparent border-b border-primary/10 py-4 text-lg font-light text-primary placeholder:text-primary/10 focus:border-accent-gold transition-all outline-none" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                </div>

                <div className="group relative">
                  <label className="absolute -top-3 left-1 text-[9px] font-black uppercase tracking-[0.2em] text-primary/40">Contato WhatsApp</label>
                  <input className="w-full bg-transparent border-b border-primary/10 py-4 text-lg font-light text-primary placeholder:text-primary/10 focus:border-accent-gold transition-all outline-none" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>

                <div className="group relative opacity-40">
                  <label className="absolute -top-3 left-1 text-[9px] font-black uppercase tracking-[0.2em] text-primary/40">E-mail Cadastrado</label>
                  <input className="w-full bg-transparent border-b border-primary/10 py-4 text-lg font-light text-primary outline-none" readOnly value={editForm.email} />
                </div>

                <div className="group relative">
                  <label className="absolute -top-3 left-1 text-[9px] font-black uppercase tracking-[0.2em] text-primary/40">CPF</label>
                  <input
                    className="w-full bg-transparent border-b border-primary/10 py-4 text-lg font-light text-primary placeholder:text-primary/10 focus:border-accent-gold transition-all outline-none"
                    value={editForm.cpf}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setEditForm({ ...editForm, cpf: val });
                    }}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] px-1">Retrato de Perfil</label>
                  <div className="flex items-center gap-6">
                    <div className="size-20 rounded-[28px] overflow-hidden bg-primary/5 border border-primary/5 shadow-inner">
                      <img
                        src={editForm.profile_pic || `https://ui-avatars.com/api/?name=${editForm.name}&background=0f3e29&color=C9A961`}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <label className="flex-1 h-14 bg-background-light border border-primary/10 rounded-2xl flex items-center justify-center gap-3 cursor-pointer hover:bg-white hover:border-accent-gold/30 transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                      {uploadingImage ? (
                        <div className="w-5 h-5 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-accent-gold !text-xl">photo_camera</span>
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest">Alterar Imagem</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-4">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full h-18 bg-primary text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.4em] shadow-huge flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  {loading ? 'Salvando...' : 'Confirmar Alterações'}
                  {!loading && <span className="text-accent-gold">✧</span>}
                </button>
                <button onClick={() => setIsEditing(false)} className="w-full py-4 text-[9px] font-black text-primary/30 uppercase tracking-[0.4em] text-center hover:text-primary transition-colors">Voltar sem salvar</button>
              </div>
            </div>
          ) : (
            <section className="space-y-12 pb-12 animate-reveal stagger-1">
              {/* Menu Categories */}
              <div className="space-y-8">
                <div className="flex items-center gap-4 animate-reveal">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30">Navegação e Gestão</p>
                  <div className="flex-1 h-px bg-gradient-to-r from-primary/5 to-transparent"></div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {menuItems.filter(item => !item.hide && (item.show !== false)).map((item, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (item.action) item.action();
                        else if (item.path !== '#') navigate(item.path);
                      }}
                      className="group w-full bg-white p-8 rounded-[40px] flex items-center justify-between border border-primary/5 shadow-xl shadow-primary/5 hover:shadow-huge active:scale-[0.99] transition-all duration-500 overflow-hidden relative"
                    >
                      <div className="absolute inset-y-0 left-0 w-1 bg-accent-gold opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-center gap-6">
                        <div className="size-14 bg-primary/5 rounded-[24px] flex items-center justify-center text-primary/40 group-hover:bg-primary group-hover:text-accent-gold transition-all duration-500">
                          <span className="material-symbols-outlined !text-[28px]">{item.icon}</span>
                        </div>
                        <div className="text-left space-y-1">
                          <p className="text-lg font-display text-primary">{item.label}</p>
                          <p className="text-[9px] text-primary/30 font-black uppercase tracking-widest leading-none">{item.desc}</p>
                        </div>
                      </div>
                      <div className="size-10 rounded-full border border-primary/5 flex items-center justify-center text-primary/10 group-hover:text-accent-gold transition-colors">
                        <span className="material-symbols-outlined !text-xl group-hover:translate-x-1 transition-transform">east</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card de Indicação High-End */}
              {!isPro && (
                <div className="animate-reveal stagger-2">
                  <div className="flex items-center gap-4 mb-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30">Convites Exclusivos</p>
                    <div className="flex-1 h-px bg-gradient-to-r from-primary/5 to-transparent"></div>
                  </div>
                  <JZReferralCard variant="light" />
                </div>
              )}

              {/* Botão Logout Immersive */}
              <div className="pt-10 animate-reveal stagger-3">
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate('/login');
                  }}
                  className="w-full bg-white/40 backdrop-blur-sm p-6 rounded-[32px] border border-primary/5 flex items-center justify-between group active:scale-[0.98] transition-all hover:bg-rose-50/20 hover:border-rose-100"
                >
                  <div className="flex items-center gap-5">
                    <div className="size-12 bg-rose-50 text-rose-400 rounded-2xl flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all duration-500">
                      <span className="material-symbols-outlined !text-xl">power_settings_new</span>
                    </div>
                    <div className="text-left">
                      <p className="font-display text-lg text-primary leading-none group-hover:text-rose-600 transition-colors">Encerrar Sessão</p>
                      <p className="text-[9px] text-primary/20 font-black uppercase tracking-[0.3em] mt-1">Até breve, {profile?.name?.split(' ')[0]}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-primary/10 group-hover:text-rose-300 transition-colors">logout</span>
                </button>

                <div className="mt-14 text-center space-y-2 opacity-20">
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-px w-8 bg-primary"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.5em]">Studio Julia Zenaro</span>
                    <div className="h-px w-8 bg-primary"></div>
                  </div>
                  <p className="text-[8px] font-black tracking-widest">Digital Experience v2.5 • Developed for Privé Members</p>
                </div>
              </div>
            </section>
          )}
        </div>

        {isChangingPassword && (
          <div className="fixed inset-0 z-[1000] p-6 flex items-center justify-center animate-reveal">
            <div className="absolute inset-0 bg-primary/95 backdrop-blur-xl" onClick={() => setIsChangingPassword(false)}></div>
            <form onSubmit={handlePasswordChange} className="relative w-full max-w-sm bg-background-light rounded-[56px] p-10 border border-primary/5 shadow-huge space-y-10 overflow-hidden">
              {/* Aesthetic Accent */}
              <div className="absolute top-0 right-0 w-32 h-1 bg-gradient-to-l from-accent-gold/40 to-transparent"></div>

              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/20 leading-none">Segurança</p>
                  <h3 className="text-3xl font-display text-primary italic">Alterar Senha</h3>
                </div>
                <button type="button" onClick={() => setIsChangingPassword(false)} className="size-12 flex items-center justify-center rounded-2xl bg-primary/5 text-primary active:scale-90 transition-all">
                  <span className="material-symbols-outlined !text-xl">close</span>
                </button>
              </div>

              <div className="space-y-10">
                <div className="group relative">
                  <label className="absolute -top-3 left-1 text-[9px] font-black uppercase tracking-[0.2em] text-primary/40 group-focus-within:text-accent-gold transition-colors">Nova Chave Secreta</label>
                  <input type="password" required className="w-full bg-transparent border-b border-primary/10 py-4 text-lg font-light text-primary placeholder:text-primary/10 focus:border-accent-gold transition-all outline-none" value={passwordForm.new} onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })} />
                </div>
                <div className="group relative">
                  <label className="absolute -top-3 left-1 text-[9px] font-black uppercase tracking-[0.2em] text-primary/40 group-focus-within:text-accent-gold transition-colors">Confirmar Chave</label>
                  <input type="password" required className="w-full bg-transparent border-b border-primary/10 py-4 text-lg font-light text-primary placeholder:text-primary/10 focus:border-accent-gold transition-all outline-none" value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
                </div>
              </div>

              <button disabled={isSubmittingPassword} type="submit" className="w-full h-18 bg-primary text-accent-gold rounded-[24px] font-black text-[11px] uppercase tracking-[0.4em] shadow-huge shadow-primary/40 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                {isSubmittingPassword ? 'Processando...' : 'Sincronizar Nova Senha'}
                <span className="material-symbols-outlined !text-sm">sync_lock</span>
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Persistent Premium Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-[120]">
        <nav className="animate-reveal" style={{ animationDelay: '0.4s' }}>
          <div className="premium-blur rounded-[28px] border border-primary/10 shadow-2xl px-6 py-3 flex justify-between items-center bg-white/80">
            <button onClick={() => navigate('/home')} className="p-2 text-primary/30 hover:text-primary transition-colors group">
              <span className="material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform">home</span>
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
            <button className="relative p-2 text-primary group transition-all">
              <span className="material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              <span className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 w-1 h-1 bg-accent-gold rounded-full"></span>
            </button>
          </div>
        </nav>
      </div>

      <div className="fixed bottom-0 left-0 w-full h-8 bg-background-light pointer-events-none z-[110]"></div>
    </div>
  );
};

export default Profile;
