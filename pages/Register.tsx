
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import Logo from '../components/Logo';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [referralCode, setReferralCode] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      alert('As senhas não coincidem. Por favor, verifique.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            cpf: cpf.replace(/\D/g, ''),
            birthdate,
            referred_by: referralCode,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        const { data: pro } = await supabase
          .from('professionals')
          .select('*')
          .eq('email', email)
          .single();

        if (pro) {
          await supabase
            .from('profiles')
            .update({
              role: 'PROFESSIONAL',
              permissions: (pro as any)?.permissions || { canManageAgenda: true }
            })
            .eq('id', data.user.id);

          await supabase
            .from('professionals')
            .update({ profile_id: data.user.id })
            .eq('id', pro.id);
        }

        setShowWelcomeModal(true);
      }
    } catch (error: any) {
      alert('Erro ao cadastrar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light font-outfit overflow-y-auto no-scrollbar selection:bg-accent-gold/30 selection:text-primary">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-[-5%] right-[-10%] w-[70%] aspect-square organic-shape-1 bg-accent-gold/30 blur-[100px] animate-float"></div>
        <div className="absolute bottom-[-5%] left-[-10%] w-[60%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <main className="relative z-10 w-full max-w-[420px] mx-auto px-8 flex-1 flex flex-col pt-10 pb-20">
        {/* Header Navigation */}
        <header className="flex items-center justify-between mb-12 animate-reveal">
          <button
            onClick={() => navigate(-1)}
            className="size-12 rounded-2xl bg-white shadow-sm border border-primary/5 flex items-center justify-center text-primary group active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined !text-xl group-hover:-translate-x-1 transition-transform">west</span>
          </button>
          <div className="transform scale-90">
            <Logo size="lg" />
          </div>
          <div className="size-12"></div>
        </header>

        {/* Narrative Title */}
        <div className="text-center mb-16 space-y-4 animate-reveal">
          <h1 className="font-display text-4xl text-primary leading-tight tracking-tight">
            Sua jornada <br />
            <span className="italic text-accent-gold font-serif">começa agora.</span>
          </h1>
          <p className="text-primary/40 text-[10px] font-black uppercase tracking-[0.3em] max-w-[280px] mx-auto leading-relaxed">
            A porta de entrada para experiências sensoriais exclusivas.
          </p>
        </div>

        {/* Dynamic Form */}
        <form onSubmit={handleRegister} className="space-y-12 animate-reveal stagger-1">
          <div className="space-y-10">
            {/* Field: Name */}
            <div className="group relative">
              <label className="absolute -top-3 left-1 text-[9px] font-black uppercase tracking-[0.2em] text-primary/40 transition-all group-focus-within:text-accent-gold">
                Nome Completo
              </label>
              <input
                required
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Sua identidade"
                className="w-full bg-transparent border-b border-primary/10 py-4 text-lg font-light text-primary placeholder:text-primary/10 focus:border-accent-gold transition-all outline-none"
              />
            </div>

            {/* Field: Email */}
            <div className="group relative">
              <label className="absolute -top-3 left-1 text-[9px] font-black uppercase tracking-[0.2em] text-primary/40 transition-all group-focus-within:text-accent-gold">
                E-mail Pessoal
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@destino.com"
                className="w-full bg-transparent border-b border-primary/10 py-4 text-lg font-light text-primary placeholder:text-primary/10 focus:border-accent-gold transition-all outline-none"
              />
            </div>

            {/* Twin Row: CPF & Birth */}
            <div className="grid grid-cols-2 gap-8">
              <div className="group relative">
                <label className="absolute -top-3 left-1 text-[9px] font-black uppercase tracking-[0.2em] text-primary/40 transition-all group-focus-within:text-accent-gold">
                  CPF
                </label>
                <input
                  required
                  type="text"
                  value={cpf}
                  onChange={e => setCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full bg-transparent border-b border-primary/10 py-4 text-sm font-light text-primary placeholder:text-primary/10 focus:border-accent-gold transition-all outline-none"
                />
              </div>
              <div className="group relative text-primary/10 focus-within:text-primary transition-colors">
                <label className="absolute -top-3 left-1 text-[9px] font-black uppercase tracking-[0.2em] text-primary/40 transition-all group-focus-within:text-accent-gold">
                  Nascimento
                </label>
                <input
                  required
                  type="date"
                  value={birthdate}
                  onChange={e => setBirthdate(e.target.value)}
                  className="w-full bg-transparent border-b border-primary/10 py-4 text-sm font-light text-primary focus:border-accent-gold transition-all outline-none"
                />
              </div>
            </div>

            {/* Field: Phone */}
            <div className="group relative">
              <label className="absolute -top-3 left-1 text-[9px] font-black uppercase tracking-[0.2em] text-primary/40 transition-all group-focus-within:text-accent-gold">
                WhatsApp / Contato
              </label>
              <input
                required
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full bg-transparent border-b border-primary/10 py-4 text-lg font-light text-primary placeholder:text-primary/10 focus:border-accent-gold transition-all outline-none"
              />
            </div>

            {/* Field: Password */}
            <div className="group relative">
              <label className="absolute -top-3 left-1 text-[9px] font-black uppercase tracking-[0.2em] text-primary/40 transition-all group-focus-within:text-accent-gold">
                Senha de Acesso
              </label>
              <input
                required
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Sua chave secreta"
                className="w-full bg-transparent border-b border-primary/10 py-4 text-lg font-light text-primary placeholder:text-primary/10 focus:border-accent-gold transition-all outline-none"
              />
            </div>

            {/* Field: Confirm Password */}
            <div className="group relative">
              <label className="absolute -top-3 left-1 text-[9px] font-black uppercase tracking-[0.2em] text-primary/40 transition-all group-focus-within:text-accent-gold">
                Confirmar Senha
              </label>
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Digite novamente"
                className="w-full bg-transparent border-b border-primary/10 py-4 text-lg font-light text-primary placeholder:text-primary/10 focus:border-accent-gold transition-all outline-none"
              />
            </div>

            {/* Referral Experience */}
            <div className="group relative bg-accent-gold/5 rounded-3xl p-6 border border-accent-gold/10 focus-within:border-accent-gold/40 transition-all backdrop-blur-sm">
              <label className="text-[8px] font-black uppercase tracking-[0.3em] text-accent-gold block mb-2 opacity-60 transition-all group-focus-within:opacity-100">
                Código de Indicação (Opcional)
              </label>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-accent-gold/40 !text-lg">loyalty</span>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="EX: JULIA-123"
                  className="flex-1 bg-transparent border-none text-base font-bold text-accent-gold placeholder:text-accent-gold/20 outline-none tracking-[0.1em]"
                />
              </div>
            </div>
          </div>

          {/* Action Area */}
          <div className="space-y-8 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full py-6 bg-primary text-white rounded-[32px] overflow-hidden shadow-2xl shadow-primary/40 hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <div className="relative z-10 flex items-center justify-center gap-4">
                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-accent-gold group-hover:text-white transition-colors">
                  {loading ? 'Aguarde...' : 'Criar minha conta'}
                </span>
                <span className="material-symbols-outlined !text-xl text-accent-gold group-hover:translate-x-2 transition-transform">auto_fix_high</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s]"></div>
            </button>

            <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-primary/40">
              Já é uma de nós?
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="ml-3 text-primary font-black border-b border-accent-gold/30 hover:border-accent-gold transition-all"
              >
                Fazer Login
              </button>
            </p>
          </div>
        </form>
      </main>

      {/* Immersive Onboarding Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-[1000] p-6 flex items-center justify-center animate-reveal">
          <div className="absolute inset-0 bg-primary/95 backdrop-blur-xl"></div>

          <div className="relative w-full max-w-sm bg-background-light rounded-[48px] p-10 text-center space-y-10 shadow-huge overflow-hidden">
            {/* Visual Flare */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-2 bg-gradient-to-r from-transparent via-accent-gold to-transparent"></div>

            <div className="relative mx-auto size-24 flex items-center justify-center">
              <div className="absolute inset-0 organic-shape-1 bg-primary/5 animate-spin-slow"></div>
              <div className="size-20 bg-background-light border border-primary/5 rounded-full flex items-center justify-center shadow-xl">
                <span className="material-symbols-outlined !text-4xl text-accent-gold" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-display text-primary italic">Seja <br /> Bem-vinda.</h2>
              <div className="h-px w-8 bg-accent-gold mx-auto"></div>
              <p className="text-xs font-outfit font-light text-primary/60 leading-relaxed px-4">
                Seu portal de beleza está ativo. Vamos personalizar sua experiência através do seu <span className="font-bold text-primary">Perfil do Olhar</span>?
              </p>
            </div>

            <div className="space-y-5 pt-4">
              <button
                onClick={() => navigate('/profile/aesthetic')}
                className="w-full py-5 bg-primary text-accent-gold rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                Acessar Perfil
                <span className="material-symbols-outlined !text-sm">visibility</span>
              </button>
              <button
                onClick={() => navigate('/home')}
                className="text-[9px] font-black text-primary/30 uppercase tracking-[0.4em] hover:text-primary transition-colors"
              >
                Talvez mais tarde
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
