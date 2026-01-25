
import React from 'react';
import { useNavigate } from 'react-router-dom';

const LEVELS = [
   { name: 'Silver', minPoints: 0, perks: ['5% Cashback', 'Dicas exclusivas'], color: 'bg-slate-300', icon: 'shield' },
   { name: 'Gold', minPoints: 500, perks: ['10% Cashback', 'Mimo no aniversário', 'Prioridade em desistências'], color: 'bg-accent-gold', icon: 'workspace_premium' },
   { name: 'Diamond', minPoints: 1000, perks: ['15% Cashback', 'Manutenção cortesia anual', 'Brindes exclusivos', 'Atendimento VIP'], color: 'bg-primary', icon: 'diamond' },
];

const FidelityLevels: React.FC = () => {
   const navigate = useNavigate();

   return (
      <div className="flex flex-col h-full bg-background-light">
         <header className="glass-nav p-4 flex items-center justify-between border-b sticky top-0 z-50">
            <button onClick={() => navigate(-1)} className="material-symbols-outlined text-primary">arrow_back_ios_new</button>
            <h2 className="font-display font-bold text-lg">Níveis de Fidelidade</h2>
            <span className="size-6"></span>
         </header>

         <main className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar">
            <div className="space-y-2 text-center">
               <h1 className="text-2xl font-display font-bold text-primary">Sua jornada VIP</h1>
               <p className="text-sm text-gray-500">Quanto mais você cuida de si, mais nós cuidamos de você.</p>
            </div>

            <div className="space-y-6">
               {LEVELS.map((level, i) => (
                  <div key={i} className="bg-white rounded-[32px] border border-gray-100 premium-shadow overflow-hidden">
                     <div className={`${level.color} p-6 flex items-center justify-between text-white`}>
                        <div className="flex items-center gap-4">
                           <span className="material-symbols-outlined !text-4xl">{level.icon}</span>
                           <div>
                              <h3 className="text-xl font-bold font-display">{level.name}</h3>
                              <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">A partir de {level.minPoints} JZ Balance</p>
                           </div>
                        </div>
                        {i === 2 && (
                           <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase">Nível Atual</span>
                        )}
                     </div>
                     <div className="p-6 space-y-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Benefícios Exclusivos</p>
                        <ul className="space-y-3">
                           {level.perks.map((perk, j) => (
                              <li key={j} className="flex items-center gap-3 text-xs font-medium text-gray-600">
                                 <span className="material-symbols-outlined !text-sm text-accent-gold">check_circle</span>
                                 {perk}
                              </li>
                           ))}
                        </ul>
                     </div>
                  </div>
               ))}
            </div>
         </main>
      </div>
   );
};

export default FidelityLevels;
