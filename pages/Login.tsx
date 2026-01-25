import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import Logo from '../components/Logo';

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
      let loginEmail = email.trim();

      const cleanInput = loginEmail.replace(/\D/g, '');
      if (cleanInput.length === 11 && !loginEmail.includes('@')) {
        const { data: profileWithCpf, error: cpfError } = await supabase
          .from('profiles')
          .select('email')
          .eq('cpf', cleanInput)
          .single();

        if (cpfError || !profileWithCpf) {
          throw new Error('CPF não encontrado. Verifique os dados ou use seu e-mail.');
        }
        loginEmail = profileWithCpf.email;
      }

      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error || !user) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

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

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/home`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      alert(`Erro ao entrar com ${provider}: ` + error.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light font-outfit overflow-y-auto no-scrollbar selection:bg-accent-gold/30 selection:text-primary">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-[-5%] right-[-10%] w-[70%] aspect-square organic-shape-1 bg-accent-gold/30 blur-[100px] animate-float"></div>
        <div className="absolute bottom-[-5%] left-[-10%] w-[60%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <main className="relative z-10 w-full max-w-[420px] mx-auto px-8 flex-1 flex flex-col pt-16">
        {/* Brand Header */}
        <header className="flex flex-col items-center mb-16 animate-reveal">
          <div className="mb-8">
            <Logo size="lg" className="mx-auto" />
          </div>
          <div className="text-center space-y-3">
            <h2 className="text-4xl font-display text-primary leading-tight italic">
              Bem-vinda de <br /> <span className="text-accent-gold">volta.</span>
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30">Identifique sua essência</p>
          </div>
        </header>

        {/* Auth Form */}
        <form onSubmit={handleLogin} className="space-y-12 animate-reveal stagger-1">
          <div className="space-y-8">
            {/* Identity Field */}
            <div className="group relative">
              <label className="absolute -top-3 left-1 text-[9px] font-black uppercase tracking-[0.2em] text-primary/40 transition-all group-focus-within:text-accent-gold">
                E-mail ou CPF
              </label>
              <input
                className="w-full bg-transparent border-b border-primary/10 py-5 text-lg font-light text-primary placeholder:text-primary/10 focus:border-accent-gold transition-all outline-none"
                placeholder="Seu identificador"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Secure Field */}
            <div className="group relative">
              <label className="absolute -top-3 left-1 text-[9px] font-black uppercase tracking-[0.2em] text-primary/40 transition-all group-focus-within:text-accent-gold">
                Sua Senha
              </label>
              <div className="relative">
                <input
                  className="w-full bg-transparent border-b border-primary/10 py-5 pr-14 text-lg font-light text-primary placeholder:text-primary/10 focus:border-accent-gold transition-all outline-none"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 bottom-4 size-10 flex items-center justify-center text-primary/20 hover:text-accent-gold transition-colors"
                >
                  <span className="material-symbols-outlined !text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-[9px] font-black uppercase tracking-widest text-primary/30 hover:text-accent-gold transition-colors"
                >
                  Esqueceu o acesso?
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full h-18 py-6 bg-primary text-white rounded-3xl overflow-hidden shadow-2xl shadow-primary/30 hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <div className="relative z-10 flex items-center justify-center gap-4">
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-accent-gold group-hover:text-white transition-colors">
                {loading ? 'Aguarde...' : 'Iniciar Jornada'}
              </span>
              <span className="material-symbols-outlined !text-xl text-accent-gold group-hover:translate-x-2 transition-transform">east</span>
            </div>
            {/* Subtle Shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s]"></div>
          </button>
        </form>

        {/* Social Integration */}
        <div className="mt-16 space-y-10 animate-reveal stagger-2">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-primary/5"></div>
            <span className="text-[8px] font-black text-primary/20 uppercase tracking-[0.4em]">Integração Digital</span>
            <div className="h-px flex-1 bg-primary/5"></div>
          </div>

          <div className="flex justify-center gap-8">
            {[
              { provider: 'google', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/google.svg' },
              { provider: 'apple', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/apple.svg' }
            ].map((item, i) => (
              <button
                key={item.provider}
                onClick={() => handleOAuthLogin(item.provider as any)}
                className="size-16 rounded-[24px] bg-white border border-primary/5 flex items-center justify-center shadow-lg shadow-primary/5 hover:border-accent-gold/20 hover:-translate-y-1 transition-all active:scale-90"
              >
                <img src={item.icon} className="size-6 opacity-60" alt={item.provider} />
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="relative z-10 px-8 py-16 text-center mt-auto animate-reveal" style={{ animationDelay: '0.6s' }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/40">
          É nova por aqui?
          <button
            onClick={() => navigate('/register')}
            className="ml-3 text-primary font-black border-b-2 border-accent-gold/30 hover:border-accent-gold transition-all pb-0.5"
          >
            Criar Cadastro
          </button>
        </p>

        <div className="mt-12 flex items-center justify-center gap-6 opacity-20">
          <div className="h-px w-10 bg-primary"></div>
          <span className="font-display italic text-xs tracking-widest">Excelência Studio</span>
          <div className="h-px w-10 bg-primary"></div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
