
import React from 'react';
import { useNavigate } from 'react-router-dom';

const COUPONS = [
  { id: 1, title: '15% OFF Aniversário', code: 'BDAYJULIA15', desc: 'Válido para qualquer procedimento.', expires: '30 Nov', used: false },
  { id: 2, title: 'Check-in Social', code: 'SOCIAL10', desc: 'Desconto por postar foto e marcar o estúdio.', expires: '15 Dez', used: false },
  { id: 3, title: 'Boas Vindas', code: 'STUDIOZEN', desc: 'Utilizado em seu primeiro atendimento.', expires: 'Expirado', used: true },
];

const Coupons: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-background-light">
      <header className="glass-nav p-4 flex items-center justify-between border-b sticky top-0 z-50">
         <button onClick={() => navigate(-1)} className="material-symbols-outlined text-primary">arrow_back_ios_new</button>
         <h2 className="font-display font-bold text-lg">Meus Cupons</h2>
         <span className="size-6"></span>
      </header>

      <main className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar">
         <div className="bg-accent-gold/5 border border-accent-gold/20 p-6 rounded-3xl flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-white flex items-center justify-center text-accent-gold premium-shadow">
               <span className="material-symbols-outlined !text-3xl">confirmation_number</span>
            </div>
            <div>
               <p className="text-sm font-bold text-primary">Você possui 2 cupons ativos</p>
               <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-0.5">Aproveite seus descontos</p>
            </div>
         </div>

         <div className="space-y-4">
            {COUPONS.map(coupon => (
               <div key={coupon.id} className={`bg-white rounded-3xl border border-gray-100 premium-shadow overflow-hidden relative ${coupon.used ? 'opacity-50 grayscale' : ''}`}>
                  <div className="p-6 flex justify-between items-start">
                     <div className="space-y-1">
                        <h4 className="font-bold text-primary">{coupon.title}</h4>
                        <p className="text-xs text-gray-500">{coupon.desc}</p>
                     </div>
                     {!coupon.used && (
                        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">Ativo</div>
                     )}
                  </div>
                  <div className="px-6 pb-6 pt-4 border-t border-dashed border-gray-100 flex justify-between items-center">
                     <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Código</p>
                        <p className="text-sm font-black text-primary tracking-widest">{coupon.code}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Validade</p>
                        <p className="text-sm font-bold text-gray-700">{coupon.expires}</p>
                     </div>
                  </div>
                  {/* Notch decorativo de cupom */}
                  <div className="absolute left-[-12px] top-[112px] size-6 rounded-full bg-background-light"></div>
                  <div className="absolute right-[-12px] top-[112px] size-6 rounded-full bg-background-light"></div>
               </div>
            ))}
         </div>
      </main>

      <div className="p-6">
         <button onClick={() => navigate('/booking')} className="w-full h-16 bg-primary text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20">USAR CUPOM NO AGENDAMENTO</button>
      </div>
    </div>
  );
};

export default Coupons;
