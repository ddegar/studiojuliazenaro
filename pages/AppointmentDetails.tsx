
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppointmentStatus, PointTransaction } from '../types';

const AppointmentDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Mock do serviço vinculado para extrair pontos
  const serviceInfo = {
    id: 's1',
    name: 'Lash Lifting Premium',
    pointsReward: 100
  };

  const [currentStatus, setCurrentStatus] = useState<AppointmentStatus>(id === 'completed' ? 'COMPLETED' : 'CONFIRMED');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleComplete = () => {
    setIsProcessing(true);
    
    // SIMULAÇÃO DE REAÇÃO EM CADEIA (EVENTO AUTOMÁTICO)
    setTimeout(() => {
       const newTransaction: PointTransaction = {
         id: 'pt' + Math.random().toString(36).substr(2, 5),
         clientId: 'u1',
         serviceId: serviceInfo.id,
         appointmentId: id || '1',
         pointsEarned: serviceInfo.pointsReward,
         date: new Date().toISOString(),
         source: 'SERVICE',
         description: `Crédito automático: ${serviceInfo.name}`
       };

       setCurrentStatus('COMPLETED');
       setIsProcessing(false);
       setShowConfetti(true);

       // LOGS DE AUTOMAÇÃO NO CONSOLE (TECNICO)
       console.group("🎯 EVENTO AUTOMÁTICO: ATENDIMENTO CONCLUÍDO");
       console.log("1. Status do Agendamento atualizado para COMPLETED");
       console.log(`2. Pontos identificados para o serviço: ${serviceInfo.pointsReward}`);
       console.log("3. Transação de fidelidade gerada:", newTransaction);
       console.log("4. Entrada financeira lançada automaticamente no caixa da profissional.");
       console.log("5. Verificando progressão de nível... Nível Diamante mantido ✨");
       console.groupEnd();
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-background-light overflow-hidden">
      <header className="glass-nav p-4 flex items-center justify-between border-b sticky top-0 z-50">
         <button onClick={() => navigate(-1)} className="material-symbols-outlined text-primary">arrow_back_ios_new</button>
         <h2 className="font-display font-bold text-lg">Resumo do Cuidado</h2>
         <button className="material-symbols-outlined text-primary">share</button>
      </header>

      <main className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar pb-32">
         {/* Feedback Visual Premium de Conclusão */}
         <div className={`bg-white p-8 rounded-[48px] border transition-all duration-700 flex flex-col items-center text-center space-y-6 ${currentStatus === 'COMPLETED' ? 'border-emerald-100 premium-shadow scale-[1.02]' : 'border-gray-100 premium-shadow'}`}>
            <div className={`size-24 rounded-[32px] flex items-center justify-center relative transition-all duration-700 ${currentStatus === 'COMPLETED' ? 'bg-emerald-500 text-white rotate-[360deg] shadow-xl' : 'bg-primary/5 text-primary'}`}>
               <span className="material-symbols-outlined !text-5xl">{currentStatus === 'COMPLETED' ? 'check' : 'event_available'}</span>
               {showConfetti && (
                 <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-ping size-10 bg-emerald-400/20 rounded-full"></div>
                 </div>
               )}
            </div>
            
            <div className="space-y-2">
               <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${currentStatus === 'COMPLETED' ? 'text-emerald-500' : 'text-accent-gold'}`}>
                  {currentStatus === 'COMPLETED' ? 'Experiência Finalizada' : 'Aguardando Atendimento'}
               </p>
               <h1 className="text-3xl font-display font-bold text-primary leading-tight">{serviceInfo.name}</h1>
               <p className="text-sm text-gray-400 font-medium italic">Sua beleza, nossa dedicação ✨</p>
            </div>
         </div>

         {/* AUTOMAÇÃO: Benefícios de Fidelidade Gerados */}
         {currentStatus === 'COMPLETED' && (
           <section className="animate-slide-up space-y-4">
              <div className="bg-primary p-8 rounded-[40px] text-white flex items-center justify-between shadow-2xl shadow-primary/20 relative overflow-hidden">
                 <div className="relative z-10 space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Fidelidade Automática</p>
                    <h3 className="text-2xl font-display font-bold">+{serviceInfo.pointsReward} Lash Points</h3>
                    <p className="text-[10px] text-accent-gold font-bold uppercase tracking-widest mt-1">Saldo Atualizado ✨</p>
                 </div>
                 <span className="material-symbols-outlined !text-6xl text-accent-gold/20 absolute -right-4 -bottom-4">stars</span>
              </div>

              <div className="bg-accent-gold/10 border border-accent-gold/20 p-8 rounded-[40px] space-y-5">
                 <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-white flex items-center justify-center text-accent-gold shadow-sm">
                       <span className="material-symbols-outlined">auto_awesome</span>
                    </div>
                    <div>
                       <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Cuidados Pós-Procedimento</h3>
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Garanta a durabilidade máxima</p>
                    </div>
                 </div>
                 <p className="text-xs text-gray-600 leading-relaxed italic">
                    Para manter sua curvatura perfeita, não molhe os cílios nas próximas 24 horas. Evite rímel à prova d'água por 48 horas.
                 </p>
                 <button onClick={() => navigate('/care/post')} className="w-full h-12 bg-white rounded-2xl text-[10px] font-black text-primary uppercase tracking-widest border border-accent-gold/20 shadow-sm active:scale-95 transition-all">Ver Guia Completo Pós</button>
              </div>
           </section>
         )}

         <div className="bg-white p-8 rounded-[40px] border border-gray-100 premium-shadow space-y-6">
            <h4 className="text-[10px] font-black uppercase text-gray-300 tracking-[0.3em] px-1">Dados da Reserva</h4>
            <div className="space-y-4">
               <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                  <span className="text-[11px] font-bold text-gray-400">Data</span>
                  <span className="text-sm font-black text-primary">25 Out, 2023</span>
               </div>
               <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                  <span className="text-[11px] font-bold text-gray-400">Horário</span>
                  <span className="text-sm font-black text-primary">14:30 • 1h 00min</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-gray-400">Especialista</span>
                  <span className="text-sm font-black text-primary">Julia Zenaro</span>
               </div>
            </div>
         </div>
      </main>

      <div className="fixed bottom-0 inset-x-0 p-8 glass-nav border-t border-gray-100 rounded-t-[40px] flex gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
         {currentStatus === 'CONFIRMED' ? (
           <>
            <button className="flex-1 h-16 border border-rose-500/10 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">CANCELAR</button>
            <button 
              onClick={handleComplete}
              disabled={isProcessing}
              className="flex-[2] h-16 bg-primary text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.25em] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
               {isProcessing ? <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (
                  <>
                    <span className="material-symbols-outlined !text-base">verified</span>
                    FINALIZAR ATENDIMENTO
                  </>
               )}
            </button>
           </>
         ) : (
           <button onClick={() => navigate('/home')} className="w-full h-16 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all">VOLTAR AO INÍCIO 💖</button>
         )}
      </div>
    </div>
  );
};

export default AppointmentDetails;
