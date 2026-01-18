
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);

  return (
    <div className="flex flex-col h-full bg-background-light p-8">
      <header className="pt-4 mb-10">
        <button onClick={() => navigate(-1)} className="material-symbols-outlined text-primary">arrow_back_ios_new</button>
      </header>

      {!sent ? (
        <main className="flex-1">
          <h1 className="font-display text-3xl font-bold text-primary mb-4">Recuperar acesso</h1>
          <p className="text-gray-500 mb-10">Insira seu e-mail cadastrado e enviaremos instruções para criar uma nova senha.</p>
          
          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-primary/70 pl-1">E-mail</label>
              <input type="email" placeholder="seu@email.com" className="w-full h-14 px-4 rounded-xl border border-gray-200 focus:ring-primary focus:border-primary bg-white" />
            </div>
            
            <button onClick={() => setSent(true)} className="w-full h-14 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20">
              ENVIAR LINK
            </button>
          </div>
        </main>
      ) : (
        <main className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
             <span className="material-symbols-outlined text-primary !text-4xl">mark_email_read</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-primary mb-4">E-mail enviado!</h2>
          <p className="text-gray-500 mb-10">Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.</p>
          <button onClick={() => navigate('/login')} className="text-primary font-bold uppercase tracking-widest text-sm underline underline-offset-8">Voltar para o Login</button>
        </main>
      )}
    </div>
  );
};

export default ForgotPassword;
