
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
      <div className="flex flex-col h-full bg-background-dark text-white overflow-y-auto no-scrollbar selection:bg-accent-gold/20 pb-24 relative">
         {/* Dynamic Background Elements */}
         <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
            <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/30 blur-[100px] animate-float"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
         </div>

         <header className="sticky top-0 z-[100] premium-nav-dark px-6 py-5 flex items-center justify-between border-b border-white/5">
            <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-accent-gold hover:bg-white/10 active:scale-90 transition-all">
               <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
            </button>
            <div className="text-center">
               <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mb-1">Privé Benefits</p>
               <h2 className="text-xl font-display italic text-white tracking-tight">Meus Vouchers</h2>
            </div>
            <span className="size-10"></span>
         </header>

         <main className="relative z-10 flex-1 p-8 space-y-10">
            <div className="bg-surface-dark/40 backdrop-blur-xl border border-white/5 p-8 rounded-[40px] flex items-center gap-6 animate-reveal">
               <div className="size-16 rounded-3xl bg-accent-gold/10 flex items-center justify-center text-accent-gold border border-accent-gold/20 shadow-huge">
                  <span className="material-symbols-outlined !text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
               </div>
               <div>
                  <p className="text-sm font-outfit font-bold text-white leading-tight">Você possui <span className="text-accent-gold">2 cupons</span> ativos</p>
                  <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mt-1.5">Aproveite seus descontos exclusivos</p>
               </div>
            </div>

            <div className="space-y-6">
               {COUPONS.map((coupon, idx) => (
                  <div
                     key={coupon.id}
                     className={`group relative bg-surface-dark border border-white/5 rounded-[48px] overflow-hidden transition-all duration-500 animate-reveal ${coupon.used ? 'opacity-40 grayscale blur-[1px]' : 'hover:border-accent-gold/30 hover:translate-y-[-4px] shadow-hugest shadow-black/40'}`}
                     style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                     <div className="p-8 pb-4 flex justify-between items-start">
                        <div className="space-y-2">
                           <div className="flex items-center gap-2">
                              <div className="h-px w-4 bg-accent-gold/40"></div>
                              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-accent-gold/40">Voucher Especial</p>
                           </div>
                           <h4 className="text-2xl font-display italic text-white leading-tight">{coupon.title}</h4>
                           <p className="text-xs text-white/40 font-light leading-relaxed max-w-[80%]">{coupon.desc}</p>
                        </div>
                        {!coupon.used && (
                           <div className="bg-accent-gold text-primary px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-2xl">Ativo</div>
                        )}
                     </div>

                     <div className="px-8 pb-8 pt-6 border-t border-dashed border-white/10 flex justify-between items-center bg-white/5">
                        <div className="space-y-1">
                           <p className="text-[9px] text-white/10 font-black uppercase tracking-widest">Código Privé</p>
                           <div className="flex items-center gap-2">
                              <p className="text-lg font-outfit font-black text-accent-gold tracking-[0.3em]">{coupon.code}</p>
                              <button className="material-symbols-outlined !text-sm text-white/20 hover:text-white transition-colors active:scale-90">content_copy</button>
                           </div>
                        </div>
                        <div className="text-right space-y-1">
                           <p className="text-[9px] text-white/10 font-black uppercase tracking-widest">Validade</p>
                           <p className="text-sm font-bold text-white/60">{coupon.expires}</p>
                        </div>
                     </div>

                     {/* Decorative Coupon Notches */}
                     <div className="absolute left-[-12px] bottom-20 size-6 rounded-full bg-background-dark border-r border-white/5"></div>
                     <div className="absolute right-[-12px] bottom-20 size-6 rounded-full bg-background-dark border-l border-white/5"></div>
                  </div>
               ))}
            </div>
         </main>

         <div className="p-8 fixed bottom-0 inset-x-0 glass-nav !bg-background-dark/90 border-t border-white/5 z-[60]">
            <button
               onClick={() => navigate('/booking')}
               className="group relative w-full h-16 bg-accent-gold text-primary rounded-2xl font-outfit font-black text-[10px] uppercase tracking-[0.3em] overflow-hidden shadow-2xl shadow-accent-gold/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
               <div className="absolute inset-x-0 bottom-0 h-1 bg-primary translate-y-full group-hover:translate-y-0 transition-transform"></div>
               <span className="material-symbols-outlined !text-xl group-hover:rotate-12 transition-transform">auto_fix_high</span>
               <span>Usar no Agendamento</span>
            </button>
         </div>

         {/* Visual Safe Area Inset */}
         <div className="fixed bottom-0 left-0 w-full h-8 bg-background-dark pointer-events-none z-[90]"></div>
      </div>
   );
};

export default Coupons;
