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

      // Check if it's a CPF (contains only digits, or is in CPF format)
      const cleanInput = loginEmail.replace(/\D/g, '');
      if (cleanInput.length === 11 && !loginEmail.includes('@')) {
        // Find email by CPF
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
        .single();

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
    <div className="flex flex-col min-h-screen bg-background-light font-sans overflow-y-auto no-scrollbar">
      {/* Header Area */}
      <header className="w-full flex flex-col items-center pt-10 pb-0 px-4">
        <div className="w-full max-w-[400px] transform scale-125 origin-bottom">
          <Logo size="xl" className="w-full" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-[420px] mx-auto px-8 flex-1 flex flex-col -mt-4">
        <div className="mb-10 text-center">
          <h2 className="font-display text-[#0f3e29] text-[42px] font-normal leading-tight italic">
            Seu momento começa aqui
          </h2>
          <p className="text-[#0f3e29]/40 text-[10px] font-black tracking-[0.25em] uppercase mt-2">
            Identifique-se para continuar sua experiência
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-10">
          {/* Email / CPF Field */}
          <div className="flex flex-col w-full group">
            <label className="text-[#0f3e29]/50 text-[10px] font-bold uppercase tracking-[0.15em] pb-2 ml-1">
              E-mail ou CPF
            </label>
            <input
              className="w-full bg-transparent border-b border-[#0f3e29]/10 focus:border-[#C9A961] py-3 text-base font-medium text-[#0f3e29] transition-all outline-none placeholder:text-[#0f3e29]/20"
              placeholder="Insira seus dados"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Field */}
          <div className="flex flex-col w-full group">
            <label className="text-[#0f3e29]/50 text-[10px] font-bold uppercase tracking-[0.15em] pb-2 ml-1">
              Senha
            </label>
            <div className="relative flex items-center">
              <input
                className="w-full bg-transparent border-b border-[#0f3e29]/10 focus:border-[#C9A961] py-3 pr-12 text-base font-medium text-[#0f3e29] transition-all outline-none placeholder:text-[#0f3e29]/20"
                placeholder="Sua senha pessoal"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-transparent p-2 text-[#C9A961]/40 hover:text-[#C9A961] transition-colors focus:outline-none"
              >
                <span className="material-symbols-outlined !text-xl">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-[#0f3e29]/30 hover:text-[#C9A961] text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0f3e29] h-16 rounded-[32px] flex items-center justify-between px-8 hover:bg-[#0a2b1d] transition-all active:scale-[0.98] shadow-xl shadow-[#0f3e29]/20 disabled:opacity-50 group"
            >
              <span className="text-[#C9A961] font-bold uppercase tracking-[0.3em] text-[11px]">
                {loading ? 'Entrando...' : 'Iniciar sessão'}
              </span>
              <span className="material-symbols-outlined text-[#C9A961] !text-xl group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
            </button>
          </div>
        </form>

        {/* Social Dividers */}
        <div className="mt-12 flex flex-col items-center gap-6">
          <div className="flex items-center gap-4 w-full px-10">
            <div className="h-[1px] flex-1 bg-[#0f3e29]/5"></div>
            <span className="text-[8px] font-black text-[#0f3e29]/20 uppercase tracking-widest">Ou acesse com</span>
            <div className="h-[1px] flex-1 bg-[#0f3e29]/5"></div>
          </div>

          <div className="flex gap-6">
            <button
              onClick={() => handleOAuthLogin('google')}
              className="size-14 rounded-full border border-[#0f3e29]/5 flex items-center justify-center hover:bg-white transition-all shadow-sm active:scale-90"
            >
              <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/google.svg" className="size-6 opacity-70" alt="Google" />
            </button>
            <button
              onClick={() => handleOAuthLogin('apple')}
              className="size-14 rounded-full border border-[#0f3e29]/5 flex items-center justify-center hover:bg-white transition-all shadow-sm active:scale-90"
            >
              <img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/apple.svg" className="size-6 opacity-70" alt="Apple" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer Area */}
      <footer className="w-full max-w-[420px] mx-auto px-8 py-14 text-center mt-auto">
        <p className="text-[#0f3e29]/40 text-[11px] font-bold uppercase tracking-wider">
          Ainda não é membro?
          <button
            onClick={() => navigate('/register')}
            className="text-[#0f3e29] font-black ml-2 hover:underline underline-offset-8 decoration-[#C9A961]/40 transition-all border-b border-[#0f3e29]/10 pb-0.5"
          >
            Criar Cadastro
          </button>
        </p>

        {/* Aesthetic Detail Divider */}
        <div className="mt-12 flex items-center justify-center gap-4 opacity-10">
          <div className="w-16 h-[1px] bg-[#0f3e29]"></div>
          <span className="material-symbols-outlined !text-[12px] filled">star</span>
          <div className="w-16 h-[1px] bg-[#0f3e29]"></div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
