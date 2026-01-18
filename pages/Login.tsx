
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const Login: React.FC<{ onAuth: () => void }> = ({ onAuth }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <div className="flex flex-col h-full bg-background-light p-8">
      <header className="flex flex-col items-center pt-10 mb-12">
        <h1 className="font-display text-2xl font-bold text-primary tracking-tight">Studio Julia Zenaro</h1>
        <div className="h-px w-12 bg-accent-gold/40 mt-2"></div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mt-4">Lash Design & Lifting</p>
      </header>

      <main className="flex-1 flex flex-col justify-center">
        <h2 className="font-display text-3xl font-bold text-gray-900 mb-2">Bem-vinda de volta</h2>
        <p className="text-gray-500 mb-10">Acesse sua conta para continuar sua jornada.</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-primary/70 pl-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full h-14 px-4 rounded-xl border border-gray-200 focus:ring-primary focus:border-primary transition-all bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-primary/70 pl-1">Senha</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-14 px-4 rounded-xl border border-gray-200 focus:ring-primary focus:border-primary transition-all bg-white"
              />
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">visibility</span>
            </div>
          </div>

          <button disabled={loading} className="w-full h-14 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="flex items-center gap-4 my-8">
          <div className="h-px flex-1 bg-gray-100"></div>
          <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest">ou</span>
          <div className="h-px flex-1 bg-gray-100"></div>
        </div>

        <button className="w-full h-14 bg-white border border-gray-100 rounded-xl flex items-center justify-center gap-3 text-gray-700 font-semibold shadow-sm active:scale-[0.98] transition-transform">
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-6 h-6" alt="Google" />
          Entrar com Google
        </button>

        <p className="text-center mt-8 text-sm text-gray-500">
          Ainda não tem conta? <button onClick={() => navigate('/register')} className="text-primary font-bold underline underline-offset-4 ml-1">Criar conta</button>
        </p>
      </main>

      <footer className="mt-auto py-6">
        <button onClick={() => navigate('/admin')} className="text-[10px] uppercase tracking-[0.2em] text-gray-300 font-bold w-full text-center border-t pt-8">
          Acesso Administrativo
        </button>
      </footer>
    </div>
  );
};

export default Login;
