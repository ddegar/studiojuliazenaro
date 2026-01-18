
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Professional, UserRole } from '../types';

type ProfTab = 'PERFORMANCE' | 'PERMISSIONS' | 'AGENDA';

const ProfessionalDetailsAdmin: React.FC = () => {
   const navigate = useNavigate();
   const { id } = useParams();
   const [searchParams] = useSearchParams();
   const [activeTab, setActiveTab] = useState<ProfTab>((searchParams.get('tab') as ProfTab) || 'PERFORMANCE');
   const [loading, setLoading] = useState(true);
   const [profile, setProfile] = useState<any>(null);
   const [stats, setStats] = useState({ appointments: 0, revenue: 0, rating: 5.0, tips: 0 });
   const [recentAppointments, setRecentAppointments] = useState<any[]>([]);

   useEffect(() => {
      if (id) {
         const fetchData = async () => {
            setLoading(true);
            try {
               const [profileRes, apptsRes] = await Promise.all([
                  supabase.from('profiles').select('*').eq('id', id).single(),
                  supabase.from('appointments').select('*').eq('professional_id', id).neq('status', 'CANCELLED')
               ]);

               if (profileRes.data) {
                  setProfile(profileRes.data);
               }

               if (apptsRes.data) {
                  const rev = apptsRes.data.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
                  setStats({
                     appointments: apptsRes.data.length,
                     revenue: rev,
                     rating: 5.0, // Hardcoded for now until rating table exists
                     tips: 0
                  });
                  setRecentAppointments(apptsRes.data.slice(0, 5));
               }
            } catch (err) {
               console.error('Error fetching pro details:', err);
            } finally {
               setLoading(false);
            }
         };
         fetchData();
      }
   }, [id]);

   const togglePermission = async (key: string) => {
      const newPermissions = { ...profile.permissions, [key]: !profile.permissions[key] };
      const { error } = await supabase.from('profiles').update({ permissions: newPermissions }).eq('id', id);
      if (!error) {
         setProfile({ ...profile, permissions: newPermissions });
      }
   };

   const handleDeactivate = async () => {
      if (window.confirm('Deseja realmente desativar este perfil profissional? Eles não aparecerão mais no catálogo.')) {
         const { error } = await supabase.from('profiles').update({ active: false }).eq('id', id);
         const { error: error2 } = await supabase.from('professionals').update({ active: false }).eq('id', id);
         if (!error && !error2) {
            alert('Perfil desativado com sucesso.');
            navigate('/admin/professionals');
         }
      }
   };

   if (loading) {
      return (
         <div className="flex h-screen items-center justify-center bg-background-dark">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
         </div>
      );
   }

   if (!profile) {
      return (
         <div className="flex flex-col h-screen items-center justify-center bg-background-dark text-white p-6 text-center">
            <span className="material-symbols-outlined !text-6xl text-gray-600 mb-4">person_off</span>
            <h2 className="text-xl font-bold">Profissional não encontrado</h2>
            <button onClick={() => navigate('/admin/professionals')} className="mt-6 text-accent-gold underline">Voltar para lista</button>
         </div>
      );
   }

   return (
      <div className="flex flex-col h-full bg-background-dark text-white">
         <header className="sticky top-0 z-50 glass-nav !bg-background-dark/90 p-4 border-b border-white/5 flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <button onClick={() => navigate('/admin/professionals')} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
               <div className="text-center">
                  <h2 className="font-bold text-base leading-tight">{profile.name}</h2>
                  <p className="text-[10px] text-accent-gold font-black uppercase tracking-widest">{profile.role === 'MASTER_ADMIN' ? 'Sênior & Founder' : 'Lash Artist Specialist'}</p>
               </div>
               <button className="material-symbols-outlined text-accent-gold">more_vert</button>
            </div>

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
                     <div className="size-24 rounded-2xl border-2 border-accent-gold p-1 shadow-2xl overflow-hidden">
                        <img src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.name}&background=random`} className="w-full h-full rounded-xl object-cover" alt="Profile" />
                     </div>
                     <div className="text-center">
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{profile.active ? 'Especialista Ativa' : 'Perfil Inativo'}</p>
                        <p className="text-xs text-accent-gold font-bold mt-1">{profile.email}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-2">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Bruto Gerado</p>
                        <h3 className="text-xl font-black text-emerald-500">R$ {stats.revenue.toLocaleString()}</h3>
                     </div>
                     <div className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-2">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Atendimentos</p>
                        <h3 className="text-xl font-black">{stats.appointments}</h3>
                     </div>
                     <div className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-2">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Avaliação Média</p>
                        <div className="flex items-center gap-2">
                           <h3 className="text-xl font-black">{stats.rating}</h3>
                           <span className="material-symbols-outlined text-accent-gold !text-sm fill-1">star</span>
                        </div>
                     </div>
                     <div className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-2">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Fidelidade</p>
                        <h3 className="text-xl font-black text-accent-gold">Nível 5</h3>
                     </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 p-8 rounded-[40px] flex items-center gap-6">
                     <div className="size-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined !text-4xl">trending_up</span>
                     </div>
                     <div>
                        <p className="text-xs font-bold">Métricas Ativas</p>
                        <p className="text-[10px] text-gray-500 italic mt-1 leading-relaxed">Dados sincronizados em tempo real com a agenda oficial.</p>
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
                                 onClick={() => togglePermission(perm.key)}
                                 className={`size-10 rounded-xl flex items-center justify-center transition-all ${profile.permissions?.[perm.key] ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-gray-700'}`}
                              >
                                 <span className="material-symbols-outlined">{profile.permissions?.[perm.key] ? 'toggle_on' : 'toggle_off'}</span>
                              </button>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'AGENDA' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="bg-card-dark p-8 rounded-[40px] border border-white/5 space-y-4">
                     <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold">Últimos Atendimentos</h3>
                        <button onClick={() => navigate(`/admin/agenda`)} className="text-[10px] font-black text-accent-gold uppercase tracking-widest underline">Ver Agenda</button>
                     </div>
                     <div className="space-y-3">
                        {recentAppointments.length > 0 ? recentAppointments.map((apt, i) => (
                           <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                              <span className="text-[10px] font-bold text-gray-500">{new Date(apt.date).toLocaleDateString('pt-BR')} {apt.time}</span>
                              <span className="text-xs font-bold">{apt.service_name}</span>
                              <span className={`text-[8px] font-black uppercase ${apt.status === 'COMPLETED' ? 'text-emerald-500' : 'text-accent-gold'}`}>{apt.status || 'Pendente'}</span>
                           </div>
                        )) : (
                           <p className="text-center text-gray-500 italic text-xs py-10">Nenhum atendimento recente.</p>
                        )}
                     </div>
                  </div>
               </div>
            )}
         </main>

         <div className="fixed bottom-0 inset-x-0 p-6 glass-nav !bg-background-dark/95 border-t border-white/5 flex gap-3">
            <button onClick={handleDeactivate} className="flex-1 h-15 bg-white/5 border border-white/10 text-rose-500 rounded-2xl font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all">
               {profile.active ? 'Desativar Perfil' : 'Reativar Perfil'}
            </button>
            <button onClick={() => navigate(`/admin/agenda`)} className="flex-1 h-15 bg-primary text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all">Ver Painel Dela</button>
         </div>
      </div>
   );
};

export default ProfessionalDetailsAdmin;
