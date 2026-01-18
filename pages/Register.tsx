
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [referralCode, setReferralCode] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
            birthdate,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        setShowWelcomeModal(true);
      }
    } catch (error: any) {
      alert('Erro ao cadastrar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-light p-8">
      <header className="flex items-center justify-between mb-10 pt-4">
        <button onClick={() => navigate(-1)} className="material-symbols-outlined text-primary">arrow_back_ios_new</button>
        <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Studio Julia Zenaro</span>
        <div className="w-6"></div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <h1 className="font-display text-3xl font-bold text-primary mb-2">Seja Bem-vinda</h1>
        <p className="text-gray-500 mb-8">Crie sua conta para agendar seus serviços em nosso espaço exclusivo.</p>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-primary/70 pl-1">Nome Completo</label>
            <input
              required
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Como gostaria de ser chamada?"
              className="w-full h-14 px-4 rounded-xl border border-gray-200 focus:ring-primary focus:border-primary transition-all bg-white text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-primary/70 pl-1">Telefone</label>
              <input
                required
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full h-14 px-4 rounded-xl border border-gray-200 focus:ring-primary focus:border-primary transition-all bg-white text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-primary/70 pl-1">Nascimento</label>
              <input
                required
                type="date"
                value={birthdate}
                onChange={e => setBirthdate(e.target.value)}
                className="w-full h-14 px-4 rounded-xl border border-gray-200 focus:ring-primary focus:border-primary transition-all bg-white text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-primary/70 pl-1">E-mail</label>
            <input
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full h-14 px-4 rounded-xl border border-gray-200 focus:ring-primary focus:border-primary transition-all bg-white text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-accent-gold pl-1">Código de indicação? (Opcional)</label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder="Ex: JULIA-123"
              className="w-full h-14 px-4 rounded-xl border border-accent-gold/20 focus:ring-accent-gold focus:border-accent-gold transition-all bg-accent-gold/5 font-bold tracking-widest placeholder:font-normal placeholder:tracking-normal text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-primary/70 pl-1">Senha</label>
            <input
              required
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Crie uma senha segura"
              className="w-full h-14 px-4 rounded-xl border border-gray-200 focus:ring-primary focus:border-primary transition-all bg-white text-sm"
            />
          </div>

          <button type="submit" disabled={loading} className="w-full h-16 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform uppercase tracking-widest text-xs mt-4 disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? 'CADASTRANDO...' : 'CADASTRAR AGORA ✨'}
          </button>
        </form>
      </main>

      {/* Modal de Boas-vindas e Perfil do Olhar */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[48px] p-10 text-center space-y-8 animate-slide-up shadow-2xl">
            <div className="size-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto ring-8 ring-primary/5">
              <span className="material-symbols-outlined text-primary !text-4xl">auto_awesome</span>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-display font-bold text-primary">Bem-vinda, Maravilhosa! ✨</h2>
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

      <div className="py-6 text-center">
        <p className="text-sm text-gray-600">Já possui uma conta? <button onClick={() => navigate('/login')} className="text-primary font-bold">Faça Login</button></p>
      </div>
    </div>
  );
};

export default Register;
