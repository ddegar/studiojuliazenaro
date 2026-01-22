
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const Login: React.FC<{ onAuth: () => void }> = ({ onAuth }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !user) throw error;

      // Initial check for profile
      let { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Sync with Professionals table (Profile Sync)
      const { data: pro } = await supabase
        .from('professionals')
        .select('*')
        .eq('email', email)
        .single();

      if (pro && (!profile || profile.role === 'CLIENT')) {
        // Link and upgrade role if they were previously a client or had no profile
        await Promise.all([
          supabase.from('profiles').update({
            role: 'PROFESSIONAL',
            permissions: pro.permissions || { canManageAgenda: true }
          }).eq('id', user.id),
          supabase.from('professionals').update({ profile_id: user.id }).eq('id', pro.id)
        ]);

        // Refresh local profile data for redirection logic
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (updatedProfile) profile = updatedProfile;
      }

      onAuth();

      if (profile && ['MASTER_ADMIN', 'PROFESSIONAL_ADMIN', 'ADMIN', 'PROFESSIONAL'].includes(profile.role)) {
        navigate('/admin');
      } else {
        navigate('/home');
      }
    } catch (error: any) {
      alert('Erro ao entrar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      alert('Erro ao entrar com Google: ' + error.message);
    }
  };

  const handleAppleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/home`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      alert('Erro ao entrar com Apple: ' + error.message);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#081c13] text-[#C9A961] relative overflow-hidden">
      {/* Background overlay */}
      <div
        className="fixed inset-0 opacity-50 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(15, 62, 41, 0.3) 0%, transparent 100%)'
        }}
      />

      {/* Header - Logo */}
      <header className="w-full flex flex-col items-center pt-16 pb-8 z-10">
        {/* Star icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-14 h-14 rounded-full border border-[#C9A961]/40 flex items-center justify-center">
            <span className="text-[#C9A961] text-2xl">★</span>
          </div>
        </div>

        {/* Logo text */}
        <h1 className="font-display text-[#C9A961] text-xl font-bold tracking-[0.25em] uppercase text-center leading-tight">
          STUDIO JULIA<br />ZENARO
        </h1>
        <p className="text-[#C9A961]/50 text-[10px] tracking-[0.5em] font-medium mt-4 uppercase">
          JZ PRIVÉ
        </p>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-[420px] mx-auto px-8 flex-1 flex flex-col justify-center z-10">
        {/* Welcome text */}
        <div className="mb-10">
          <h2 className="font-display text-[#C9A961] text-2xl font-medium leading-tight text-center italic">
            Bem-vinda ao Clube
          </h2>
          <div className="w-8 h-[1px] bg-[#C9A961]/30 mx-auto mt-4"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          {/* Email/CPF Field */}
          <div className="flex flex-col w-full">
            <label className="text-[#C9A961] text-[10px] font-semibold uppercase tracking-[0.2em] pb-2 ml-1">
              E-MAIL OU CPF
            </label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Acesso exclusivo"
              className="w-full bg-[#0f3e29]/50 text-[#C9A961] border border-[#C9A961]/30 focus:border-[#C9A961] focus:ring-0 h-14 px-4 text-sm transition-all placeholder:text-[#C9A961]/20 outline-none"
            />
          </div>

          {/* Password Field */}
          <div className="flex flex-col w-full">
            <label className="text-[#C9A961] text-[10px] font-semibold uppercase tracking-[0.2em] pb-2 ml-1">
              SENHA
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Sua credencial"
                className="w-full bg-[#0f3e29]/50 text-[#C9A961] border border-[#C9A961]/30 focus:border-[#C9A961] focus:ring-0 h-14 px-4 pr-12 text-sm transition-all placeholder:text-[#C9A961]/20 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-[#C9A961]/40 hover:text-[#C9A961] transition-colors"
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-[#8E7949] hover:text-[#C9A961] text-[11px] font-medium tracking-wide transition-colors uppercase"
              >
                ESQUECI MINHA SENHA
              </button>
            </div>
          </div>

          {/* Login Button */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9A961] py-5 flex items-center justify-center gap-3 hover:bg-[#C9A961]/90 transition-all active:scale-[0.99] shadow-lg shadow-black/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span className="text-[#081c13] font-bold uppercase tracking-[0.2em] text-xs">
                {loading ? 'ENTRANDO...' : 'ENTRAR'}
              </span>
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8">
          <div className="h-px flex-1 bg-[#C9A961]/20"></div>
          <span className="text-[10px] uppercase text-[#C9A961]/40 font-medium tracking-widest">ou continue com</span>
          <div className="h-px flex-1 bg-[#C9A961]/20"></div>
        </div>

        {/* Social Login Buttons */}
        <div className="flex gap-4">
          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex-1 h-14 bg-[#0f3e29]/50 border border-[#C9A961]/30 flex items-center justify-center gap-3 hover:bg-[#0f3e29] hover:border-[#C9A961]/50 transition-all active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#C9A961" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#C9A961" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#C9A961" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#C9A961" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-[#C9A961] text-[11px] font-semibold uppercase tracking-wide">Google</span>
          </button>

          {/* Apple Button */}
          <button
            type="button"
            onClick={handleAppleLogin}
            className="flex-1 h-14 bg-[#0f3e29]/50 border border-[#C9A961]/30 flex items-center justify-center gap-3 hover:bg-[#0f3e29] hover:border-[#C9A961]/50 transition-all active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#C9A961">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            <span className="text-[#C9A961] text-[11px] font-semibold uppercase tracking-wide">Apple</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-[420px] mx-auto px-8 pb-16 text-center z-10">
        <p className="text-[#C9A961]/50 text-[11px] tracking-wide">
          Não possui um convite?
          <button
            onClick={() => navigate('/register')}
            className="text-[#8E7949] font-bold ml-2 hover:text-[#C9A961] transition-colors uppercase"
          >
            CRIAR CONTA
          </button>
        </p>

        {/* Decorative line */}
        <div className="mt-12 flex justify-center opacity-30">
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#C9A961] to-transparent"></div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
