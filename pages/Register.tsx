
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
  const [loading, setLoading] = useState(false);

  // Mask CPF: 000.000.000-00
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
        // Sync with Professionals table
        const { data: pro } = await supabase
          .from('professionals')
          .select('*')
          .eq('email', email)
          .single();

        if (pro) {
          // 1. Update Profile Role and Permissions
          // Note: the trigger to create profile might take a ms, so we retry or update auth metadata
          await supabase
            .from('profiles')
            .update({
              role: 'PROFESSIONAL',
              permissions: (pro as any)?.permissions || { canManageAgenda: true }
            })
            .eq('id', data.user.id);

          // 2. Link professional record
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
    <div className="flex flex-col min-h-full bg-background-light">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-primary hover:bg-gray-50 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>

        <Logo size="md" className="mt-2" />

        <div className="w-10"></div>
      </header>

      {/* Content */}
      <main className="flex-1 px-8 pb-8 overflow-y-auto no-scrollbar">
        {/* Title Section */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl text-primary leading-tight mb-1">
            Sua jornada
          </h1>
          <h2 className="font-display text-4xl text-accent-gold italic">
            começa aqui
          </h2>
          <p className="text-gray-500 text-sm mt-4 leading-relaxed max-w-[280px] mx-auto">
            A porta de entrada para experiências exclusivas e atendimento personalizado.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-5">
          {/* Nome Completo */}
          <div className="bg-white rounded-[24px] border border-gray-100 px-6 py-4 shadow-sm focus-within:border-primary/30 transition-colors">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary/60 block mb-1">
              Nome Completo
            </label>
            <input
              required
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Digite seu nome completo"
              className="w-full text-primary text-base bg-transparent border-none outline-none placeholder:text-gray-300"
            />
          </div>

          {/* E-mail Pessoal */}
          <div className="bg-white rounded-[24px] border border-gray-100 px-6 py-4 shadow-sm focus-within:border-primary/30 transition-colors">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary/60 block mb-1">
              E-mail Pessoal
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="exemplo@dominio.com"
              className="w-full text-primary text-base bg-transparent border-none outline-none placeholder:text-gray-300"
            />
          </div>

          {/* CPF */}
          <div className="bg-white rounded-[24px] border border-gray-100 px-6 py-4 shadow-sm focus-within:border-primary/30 transition-colors">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary/60 block mb-1">
              CPF
            </label>
            <input
              required
              type="text"
              value={cpf}
              onChange={e => setCpf(formatCpf(e.target.value))}
              placeholder="000.000.000-00"
              className="w-full text-primary text-base bg-transparent border-none outline-none placeholder:text-gray-300"
            />
          </div>

          {/* Data de Nascimento */}
          <div className="bg-white rounded-[24px] border border-gray-100 px-6 py-4 shadow-sm focus-within:border-primary/30 transition-colors">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary/60 block mb-1">
              Data de Nascimento
            </label>
            <input
              required
              type="date"
              value={birthdate}
              onChange={e => setBirthdate(e.target.value)}
              className="w-full text-primary text-base bg-transparent border-none outline-none"
            />
          </div>

          {/* Telefone (mantido mas com novo design) */}
          <div className="bg-white rounded-[24px] border border-gray-100 px-6 py-4 shadow-sm focus-within:border-primary/30 transition-colors">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary/60 block mb-1">
              Telefone / WhatsApp
            </label>
            <input
              required
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full text-primary text-base bg-transparent border-none outline-none placeholder:text-gray-300"
            />
          </div>

          {/* Senha (mantido mas com novo design) */}
          <div className="bg-white rounded-[24px] border border-gray-100 px-6 py-4 shadow-sm focus-within:border-primary/30 transition-colors">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary/60 block mb-1">
              Senha
            </label>
            <input
              required
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Crie uma senha segura"
              className="w-full text-primary text-base bg-transparent border-none outline-none placeholder:text-gray-300"
            />
          </div>

          {/* Código de Indicação (opcional, colapsável) */}
          <div className="bg-accent-gold/5 rounded-[24px] border border-accent-gold/20 px-6 py-4 focus-within:border-accent-gold/40 transition-colors">
            <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-accent-gold block mb-1">
              Código de Indicação (Opcional)
            </label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder="Ex: JULIA-123"
              className="w-full text-accent-gold text-base bg-transparent border-none outline-none placeholder:text-accent-gold/40 font-semibold tracking-wider"
            />
          </div>
        </form>
      </main>

      {/* Bottom CTA */}
      <div className="px-8 pb-8 pt-4 bg-background-light">
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full h-14 bg-primary text-white rounded-full font-medium text-[15px] shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              Entrar para o Clube
              <span className="text-accent-gold">+</span>
              <span className="text-accent-gold">✧</span>
            </>
          )}
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Já sou membro. <button onClick={() => navigate('/login')} className="font-bold text-primary">Fazer login</button>
        </p>
      </div>

      {/* Modal de Boas-vindas e Perfil do Olhar */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[48px] p-10 text-center space-y-8 animate-slide-up shadow-2xl">
            <div className="size-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto ring-8 ring-primary/5">
              <span className="material-symbols-outlined text-primary !text-4xl">auto_awesome</span>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-display font-bold text-primary">Bem-vinda ao Clube! ✨</h2>
              <p className="text-sm text-gray-500 leading-relaxed italic px-2">
                Seu cadastro foi realizado. Quer preencher agora seu <b>Perfil do Olhar</b> para um atendimento ainda mais personalizado?
              </p>
            </div>
            <div className="flex flex-col gap-4 pt-4">
              <button
                onClick={() => navigate('/profile/aesthetic')}
                className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 active:scale-95 transition-all"
              >
                SIM, PERSONALIZAR MEU OLHAR ✨
              </button>
              <button
                onClick={() => navigate('/home')}
                className="text-[10px] font-black text-gray-400 uppercase tracking-widest underline underline-offset-8"
              >
                Preencher depois
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
