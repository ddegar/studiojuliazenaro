
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

type AdminTab = 'INFO' | 'AESTHETIC' | 'HISTORY' | 'POINTS';

const ClientDetailsAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<AdminTab>('INFO');

  const client = {
    name: 'Mariana Silva',
    phone: '(11) 99999-9999',
    email: 'mariana.silva@email.com',
    birth: '12/05/1995',
    loyalty: { points: 1540, level: 'DIAMANTE ✨' },
    referral: 'JULIA-ZEN-123',
    aestheticProfile: {
      eyeShape: 'Amendoado',
      lashStyle: 'Natural Look',
      curvature: 'D-CURL (Marcado)',
      length: '11-13mm (Médio)',
      thickness: 'NATURAL (Realce sutil)',
      pigment: 'Equilibrado',
      maintenance: 'A cada 3 semanas',
      allergies: 'Leve sensibilidade a adesivos no olho direito.',
      lastUpdate: '25 Out, 2023',
      hospitality: { 
        drink: 'Café Expresso', 
        music: 'Lofi & Relax', 
        snack: 'Chocolate 70%' 
      }
    },
    history: [
      { date: '12 Out, 2023', service: 'Lash Lifting Premium', pro: 'Julia Zenaro', note: 'Curvatura impecável, cliente amou.' },
      { date: '28 Set, 2023', service: 'Design de Sobrancelhas', pro: 'Ana Paula', note: 'Henna tom médio.' }
    ],
    pointsHistory: [
      { id: 'p1', date: '25 Out', type: 'SERVICE', val: '+100', desc: 'Lash Lifting Premium' },
      { id: 'p2', date: '12 Out', type: 'SERVICE', val: '+100', desc: 'Lash Lifting Premium' },
      { id: 'p3', date: '12 Out', type: 'CHECKIN', val: '+20', desc: 'Presença no Studio' },
      { id: 'p4', date: '05 Out', type: 'REFERRAL', val: '+50', desc: 'Indicou: Ana Beatriz' }
    ]
  };

  return (
    <div className="flex flex-col h-full bg-background-dark text-white">
      <header className="sticky top-0 z-50 glass-nav !bg-background-dark/90 p-4 border-b border-white/5 flex flex-col gap-6">
         <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
            <div className="text-center">
               <h2 className="font-bold text-base leading-tight">{client.name}</h2>
               <p className="text-[10px] text-accent-gold font-black uppercase tracking-widest">{client.loyalty.level}</p>
            </div>
            <button className="material-symbols-outlined text-accent-gold">edit_note</button>
         </div>

         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'INFO', label: 'Dados', icon: 'person' },
              { id: 'AESTHETIC', label: 'Olhar', icon: 'visibility' },
              { id: 'HISTORY', label: 'Histórico', icon: 'history' },
              { id: 'POINTS', label: 'Fidelidade', icon: 'stars' }
            ].map(tab => (
               <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`px-5 h-10 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${activeTab === tab.id ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-500'}`}
               >
                  <span className="material-symbols-outlined !text-base">{tab.icon}</span>
                  {tab.label}
               </button>
            ))}
         </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto no-scrollbar pb-32">
         {activeTab === 'INFO' && (
            <div className="space-y-6 animate-fade-in">
               <div className="flex flex-col items-center py-6 bg-white/5 rounded-[40px] border border-white/5 space-y-4">
                  <div className="size-24 rounded-full border-2 border-accent-gold p-1 shadow-2xl">
                     <img src="https://picsum.photos/200/200?sig=1" className="w-full h-full rounded-full object-cover" alt="Client" />
                  </div>
                  <div className="text-center space-y-1">
                     <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
                     <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Membro desde Jan 2023</p>
                  </div>
               </div>
               <div className="bg-card-dark p-8 rounded-[40px] border border-white/5 space-y-8">
                  <div className="space-y-1">
                     <p className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Contato Direto</p>
                     <p className="text-sm font-bold text-accent-gold">{client.phone}</p>
                     <p className="text-sm font-bold text-gray-300">{client.email}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5">
                     <div className="space-y-1">
                        <p className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Nascimento</p>
                        <p className="text-sm font-bold">{client.birth}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Indicação</p>
                        <p className="text-sm font-bold text-primary">{client.referral}</p>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'AESTHETIC' && (
            <div className="space-y-6 animate-fade-in">
               <div className="bg-primary/20 border border-primary/20 p-6 rounded-[32px] flex items-center justify-between">
                  <div>
                     <p className="text-[9px] font-black uppercase text-primary tracking-[0.2em]">Perfil Técnico do Olhar</p>
                     <p className="text-sm font-bold">Última Ref. {client.aestheticProfile.lastUpdate}</p>
                  </div>
                  <span className="material-symbols-outlined text-primary !text-4xl">auto_awesome</span>
               </div>

               {/* Seção 1: Parâmetros Técnicos */}
               <div className="bg-card-dark p-8 rounded-[40px] border border-white/5 space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-accent-gold border-b border-white/5 pb-4">Parâmetros de Aplicação</h3>
                  <div className="grid grid-cols-1 gap-6">
                     {[
                       { label: 'Olhos', val: client.aestheticProfile.eyeShape, icon: 'visibility' },
                       { label: 'Estilo', val: client.aestheticProfile.lashStyle, icon: 'magic_button' },
                       { label: 'Curvatura', val: client.aestheticProfile.curvature, icon: 'gesture' },
                       { label: 'Comprimento', val: client.aestheticProfile.length, icon: 'straighten' },
                       { label: 'Espessura', val: client.aestheticProfile.thickness, icon: 'line_weight' },
                       { label: 'Pigmentação', val: client.aestheticProfile.pigment, icon: 'palette' }
                     ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0">
                           <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-gray-600 !text-sm">{item.icon}</span>
                              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{item.label}</span>
                           </div>
                           <span className="text-xs font-black text-white">{item.val}</span>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Seção 2: Hospitalidade (ESPELHADO DA ETAPA 5) */}
               <div className="bg-card-dark p-8 rounded-[40px] border border-white/5 space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-white/5 pb-4 flex items-center gap-2">
                     <span className="material-symbols-outlined !text-sm">hotel_class</span>
                     Experiência & Hospitalidade
                  </h3>
                  <div className="grid grid-cols-1 gap-5">
                     <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                           <span className="material-symbols-outlined">coffee</span>
                        </div>
                        <div>
                           <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Bebida Preferida</p>
                           <p className="text-sm font-bold text-white">{client.aestheticProfile.hospitality.drink}</p>
                        </div>
                     </div>

                     <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                           <span className="material-symbols-outlined">music_note</span>
                        </div>
                        <div>
                           <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Gênero Musical</p>
                           <p className="text-sm font-bold text-white">{client.aestheticProfile.hospitality.music}</p>
                        </div>
                     </div>

                     <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                           <span className="material-symbols-outlined">cookie</span>
                        </div>
                        <div>
                           <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Acompanhamento</p>
                           <p className="text-sm font-bold text-white">{client.aestheticProfile.hospitality.snack}</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Seção 3: Saúde e Observações */}
               <div className="bg-card-dark p-8 rounded-[40px] border border-white/5 space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-rose-500 border-b border-white/5 pb-4">Saúde e Ciclo</h3>
                  <div className="space-y-5">
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Manutenção Ideal</p>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                           <p className="text-sm font-bold">{client.aestheticProfile.maintenance}</p>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                           <span className="material-symbols-outlined !text-sm">warning</span> Alergias / Observações
                        </p>
                        <div className="bg-rose-500/5 p-5 rounded-2xl border border-rose-500/10">
                           <p className="text-xs text-gray-400 italic leading-relaxed">
                              {client.aestheticProfile.allergies || 'Nenhuma observação informada pela cliente.'}
                           </p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'POINTS' && (
            <div className="space-y-6 animate-fade-in">
               <div className="bg-accent-gold p-8 rounded-[40px] text-primary flex items-baseline justify-between shadow-2xl shadow-accent-gold/20 relative overflow-hidden">
                  <div className="space-y-1 relative z-10">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Saldo de Recompensas</p>
                     <h3 className="text-5xl font-display font-bold">{client.loyalty.points}</h3>
                     <p className="text-[9px] font-black uppercase mt-1">Pontos Disponíveis ✨</p>
                  </div>
                  <span className="material-symbols-outlined !text-7xl opacity-30 absolute -right-2 -bottom-2">stars</span>
               </div>

               <div className="bg-card-dark rounded-[40px] border border-white/5 overflow-hidden">
                  <p className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 border-b border-white/5">Extrato Inteligente</p>
                  <div className="divide-y divide-white/5">
                     {client.pointsHistory.map((p) => (
                        <div key={p.id} className="p-6 flex justify-between items-center group">
                           <div className="flex items-center gap-4">
                              <div className={`size-11 rounded-2xl flex items-center justify-center transition-colors ${p.type === 'SERVICE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-accent-gold/10 text-accent-gold'}`}>
                                 <span className="material-symbols-outlined !text-xl">
                                    {p.type === 'SERVICE' ? 'spa' : p.type === 'CHECKIN' ? 'location_on' : 'group_add'}
                                 </span>
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-white group-hover:text-accent-gold transition-colors">{p.desc}</p>
                                 <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{p.date} • Automático</p>
                              </div>
                           </div>
                           <p className="text-base font-black text-emerald-500">{p.val}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'HISTORY' && (
            <div className="space-y-4 animate-fade-in">
               {client.history.map((h, i) => (
                  <div key={i} className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-4 relative overflow-hidden group">
                     <div className="flex justify-between items-start">
                        <div className="space-y-1">
                           <p className="text-[9px] font-black uppercase text-primary tracking-widest">{h.date}</p>
                           <h4 className="font-bold text-base">{h.service}</h4>
                           <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">com {h.pro}</p>
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-2 py-1 rounded uppercase">Realizado</span>
                     </div>
                     <div className="bg-white/5 p-4 rounded-2xl">
                        <p className="text-xs text-gray-400 italic">"{h.note}"</p>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </main>

      <div className="fixed bottom-0 inset-x-0 p-6 glass-nav !bg-background-dark/95 border-t border-white/5 flex gap-3">
         <button className="flex-1 h-15 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all">Ajuste Manual</button>
         <button onClick={() => navigate('/admin/agenda/new')} className="flex-[1.5] h-15 bg-primary text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all">Novo Agendamento</button>
      </div>
    </div>
  );
};

export default ClientDetailsAdmin;
