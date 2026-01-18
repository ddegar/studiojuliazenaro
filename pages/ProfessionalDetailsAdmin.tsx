
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

type ProfTab = 'PERFORMANCE' | 'PERMISSIONS' | 'AGENDA';

const ProfessionalDetailsAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<ProfTab>((searchParams.get('tab') as ProfTab) || 'PERFORMANCE');

  // MOCK DE DADOS DA PROFISSIONAL
  const proData = {
    id: id || 'p1',
    name: id === 'p2' ? 'Ana Paula' : 'Julia Zenaro',
    role: id === 'p2' ? 'Lash Artist Specialist' : 'Sênior & Founder',
    avatar: id === 'p2' ? 'https://picsum.photos/200/200?sig=10' : 'https://picsum.photos/200/200?sig=1',
    email: id === 'p2' ? 'ana@studio.com' : 'julia@studio.com',
    stats: {
      appointments: 145,
      revenue: 12540,
      rating: 4.9,
      tips: 450
    },
    permissions: {
      canManageAgenda: true,
      canEditServices: id !== 'p2',
      canViewGlobalFinances: id !== 'p2',
      canCreateContent: true
    }
  };

  const [permissions, setPermissions] = useState(proData.permissions);

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col h-full bg-background-dark text-white">
      <header className="sticky top-0 z-50 glass-nav !bg-background-dark/90 p-4 border-b border-white/5 flex flex-col gap-6">
         <div className="flex items-center justify-between">
            <button onClick={() => navigate('/admin/professionals')} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
            <div className="text-center">
               <h2 className="font-bold text-base leading-tight">{proData.name}</h2>
               <p className="text-[10px] text-accent-gold font-black uppercase tracking-widest">{proData.role}</p>
            </div>
            <button className="material-symbols-outlined text-accent-gold">more_vert</button>
         </div>

         {/* Tabs Administrativas Exclusivas */}
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'PERFORMANCE', label: 'Performance', icon: 'analytics' },
              { id: 'PERMISSIONS', label: 'Permissões', icon: 'settings_pro' },
              { id: 'AGENDA', label: 'Agenda', icon: 'calendar_month' }
            ].map(tab => (
               <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ProfTab)}
                className={`px-6 h-10 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${activeTab === tab.id ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-500'}`}
               >
                  <span className="material-symbols-outlined !text-base">{tab.icon}</span>
                  {tab.label}
               </button>
            ))}
         </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto no-scrollbar pb-32">
         {activeTab === 'PERFORMANCE' && (
            <div className="space-y-6 animate-fade-in">
               <div className="bg-card-dark p-8 rounded-[40px] border border-white/5 flex flex-col items-center gap-4">
                  <div className="size-20 rounded-2xl border-2 border-accent-gold p-1 shadow-2xl">
                     <img src={proData.avatar} className="w-full h-full rounded-xl object-cover" alt="Profile" />
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Especialista Ativa</p>
                     <p className="text-xs text-accent-gold font-bold mt-1">{proData.email}</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-2">
                     <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Bruto Gerado</p>
                     <h3 className="text-xl font-black text-emerald-500">R$ {proData.stats.revenue.toLocaleString()}</h3>
                  </div>
                  <div className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-2">
                     <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Atendimentos</p>
                     <h3 className="text-xl font-black">{proData.stats.appointments}</h3>
                  </div>
                  <div className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-2">
                     <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Avaliação Média</p>
                     <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black">{proData.stats.rating}</h3>
                        <span className="material-symbols-outlined text-accent-gold !text-sm fill-1">star</span>
                     </div>
                  </div>
                  <div className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-2">
                     <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Gorjetas / Bônus</p>
                     <h3 className="text-xl font-black text-accent-gold">R$ {proData.stats.tips}</h3>
                  </div>
               </div>

               <div className="bg-primary/5 border border-primary/20 p-8 rounded-[40px] flex items-center gap-6">
                  <div className="size-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                     <span className="material-symbols-outlined !text-4xl">trending_up</span>
                  </div>
                  <div>
                     <p className="text-xs font-bold">Crescimento de 15%</p>
                     <p className="text-[10px] text-gray-500 italic mt-1 leading-relaxed">Julia teve um aumento na retenção de clientes este mês.</p>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'PERMISSIONS' && (
            <div className="space-y-6 animate-fade-in">
               <div className="bg-card-dark p-8 rounded-[40px] border border-white/5 space-y-10">
                  <div className="space-y-2">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-accent-gold">Controle de Acesso</h3>
                     <p className="text-[10px] text-gray-500 italic">Defina o que a profissional pode gerenciar em seu próprio painel.</p>
                  </div>

                  <div className="space-y-6">
                     {[
                       { key: 'canManageAgenda', label: 'Gerenciar Própria Agenda', desc: 'Permite criar, editar e cancelar seus horários.' },
                       { key: 'canEditServices', label: 'Gerenciar Catálogo', desc: 'Permite editar preços e durações de seus serviços.' },
                       { key: 'canViewGlobalFinances', label: 'Ver Financeiro Global', desc: 'ACESSO SENSÍVEL: Ver faturamento total do estúdio.' },
                       { key: 'canCreateContent', label: 'Publicar Conteúdo', desc: 'Permite criar Posts e Stories no app.' }
                     ].map((perm) => (
                        <div key={perm.key} className="flex items-center justify-between gap-6 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                           <div className="space-y-1">
                              <p className="text-sm font-bold">{perm.label}</p>
                              <p className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter leading-tight">{perm.desc}</p>
                           </div>
                           <button 
                             onClick={() => togglePermission(perm.key as keyof typeof permissions)}
                             className={`size-10 rounded-xl flex items-center justify-center transition-all ${permissions[perm.key as keyof typeof permissions] ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-gray-700'}`}
                           >
                              <span className="material-symbols-outlined">{permissions[perm.key as keyof typeof permissions] ? 'toggle_on' : 'toggle_off'}</span>
                           </button>
                        </div>
                     ))}
                  </div>
               </div>

               <button className="w-full h-16 bg-primary text-white rounded-3xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20">Salvar Alterações de Acesso</button>
            </div>
         )}

         {activeTab === 'AGENDA' && (
            <div className="space-y-6 animate-fade-in">
               <div className="bg-card-dark p-8 rounded-[40px] border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                     <h3 className="text-sm font-bold">Resumo Diário</h3>
                     <button onClick={() => navigate(`/admin/agenda/day/2023-11-06`)} className="text-[10px] font-black text-accent-gold uppercase tracking-widest underline">Ver Timeline</button>
                  </div>
                  <div className="space-y-3">
                     {[
                       { time: '09:00', client: 'Mariana Silva', status: 'Confirmado' },
                       { time: '10:30', client: 'Beatriz Costa', status: 'Pendente' },
                       { time: '14:00', client: 'Carla Santos', status: 'Confirmado' }
                     ].map((apt, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                           <span className="text-[10px] font-bold text-gray-500">{apt.time}</span>
                           <span className="text-xs font-bold">{apt.client}</span>
                           <span className="text-[8px] font-black uppercase text-accent-gold">{apt.status}</span>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="bg-white/5 border-2 border-dashed border-white/10 p-10 rounded-[40px] text-center flex flex-col items-center gap-4">
                  <span className="material-symbols-outlined text-gray-600 !text-5xl">event_available</span>
                  <p className="text-xs text-gray-500 font-medium">Bloquear horários na agenda desta profissional?</p>
                  <button className="px-6 h-12 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold uppercase tracking-widest">Acessar Bloqueios</button>
               </div>
            </div>
         )}
      </main>

      {/* Footer Fixo Administrativo */}
      <div className="fixed bottom-0 inset-x-0 p-6 glass-nav !bg-background-dark/95 border-t border-white/5 flex gap-3">
         <button className="flex-1 h-15 bg-white/5 border border-white/10 text-rose-500 rounded-2xl font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all">Desativar Perfil</button>
         <button className="flex-1 h-15 bg-primary text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all">Ver Painel Dela</button>
      </div>
    </div>
  );
};

export default ProfessionalDetailsAdmin;
