
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { UserRole } from '../types';

type ProfTab = 'PERFORMANCE' | 'PERMISSIONS' | 'AGENDA' | 'FINANCE' | 'SERVICES' | 'CONTENT';

const ProfessionalDetailsAdmin: React.FC = () => {
   const navigate = useNavigate();
   const { id } = useParams();
   const [searchParams] = useSearchParams();
   const [activeTab, setActiveTab] = useState<ProfTab>((searchParams.get('tab') as ProfTab) || 'PERFORMANCE');
   const [loading, setLoading] = useState(true);
   const [profile, setProfile] = useState<any>(null);
   const [stats, setStats] = useState({ appointments: 0, revenue: 0, rating: 5.0, tips: 0 });
   const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
   const [transactions, setTransactions] = useState<any[]>([]);
   const [services, setServices] = useState<any[]>([]);
   const [content, setContent] = useState<any[]>([]);
   const [isEditing, setIsEditing] = useState(false);
   const [editData, setEditData] = useState({ name: '', role: '', avatar_url: '' });

   const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
         // 1. First fetch the professional record
         const { data: proBase, error: proBaseErr } = await supabase.from('professionals').select('*').eq('id', id).single();
         if (proBaseErr || !proBase) throw new Error('Profissional não encontrado');

         // 2. Try to fetch profile, but don't fail if it doesn't exist yet
         const profileId = proBase.profile_id || id;
         const { data: profileData } = await supabase.from('profiles').select('*').eq('id', profileId).single();

         // Use proBase as fallback for profile data
         const displayProfile = {
            id: profileId,
            name: profileData?.name || proBase.name,
            email: profileData?.email || proBase.email,
            avatar_url: profileData?.avatar_url || proBase.image_url,
            role: profileData?.role || 'PROFESSIONAL',
            permissions: profileData?.permissions || proBase.permissions || {},
            role_title: profileData?.role_title || proBase.role
         };

         setProfile(displayProfile);
         setEditData({
            name: displayProfile.name || '',
            role: displayProfile.role_title || '',
            avatar_url: displayProfile.avatar_url || ''
         });

         // 3. Fetch sub-data in parallel
         const [apptsRes, transRes, servsRes, storiesRes, postsRes] = await Promise.all([
            supabase.from('appointments').select('*').eq('professional_id', id).is('deleted_at', null),
            supabase.from('transactions').select('*').eq('user_id', profileId),
            supabase.from('services').select('*'), // Filter manually to avoid schema error with .contains if no professional_ids column exists in simple setups
            supabase.from('stories').select('*').eq('user_id', profileId),
            supabase.from('posts').select('*').eq('user_id', profileId)
         ]);

         if (apptsRes.data) {
            const finished = apptsRes.data.filter(a => a.status === 'completed' || a.status === 'COMPLETED');
            const rev = finished.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
            setStats({
               appointments: finished.length,
               revenue: rev,
               rating: 5.0,
               tips: 0
            });
            setRecentAppointments(apptsRes.data.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10));
         }

         if (transRes.data) setTransactions(transRes.data);

         // Manual filter for services if needed
         if (servsRes.data) {
            const linkedServices = servsRes.data.filter(s =>
               Array.isArray(s.professional_ids) && s.professional_ids.includes(id)
            );
            setServices(linkedServices);
         }

         setContent([...(storiesRes.data || []), ...(postsRes.data || [])]);

      } catch (err) {
         console.error('Error fetching pro details:', err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchData();
   }, [id]);

   const togglePermission = async (key: string) => {
      const currentPerms = profile.permissions || {};
      const newPermissions = { ...currentPerms, [key]: !currentPerms[key] };

      // Update the correct profile record
      const { error } = await supabase.from('profiles').update({ permissions: newPermissions }).eq('id', profile.id);

      // Also update the professional record for sync redundancy
      await supabase.from('professionals').update({ permissions: newPermissions }).eq('id', id);

      if (!error) {
         setProfile({ ...profile, permissions: newPermissions });
      } else {
         alert('Erro ao atualizar permissão: ' + error.message);
      }
   };

   const handleSaveEdit = async () => {
      try {
         const { error } = await supabase.from('profiles').update({
            name: editData.name,
            avatar_url: editData.avatar_url
         }).eq('id', id);

         const { error: proError } = await supabase.from('professionals').update({
            name: editData.name,
            role: editData.role,
            image_url: editData.avatar_url
         }).eq('id', id);

         if (error || proError) throw error || proError;

         setIsEditing(false);
         fetchData();
         alert('Dados atualizados com sucesso! ✨');
      } catch (e: any) {
         alert('Erro ao salvar: ' + e.message);
      }
   };

   const handleDeleteProfessional = async () => {
      const confirm = window.confirm('⚠️ AVISO CRÍTICO: Deseja realmente excluir esta profissional?\n\n- O perfil será removido do catálogo público.\n- TODOS os agendamentos futuros serão cancelados.\n- O histórico financeiro será preservado.\n\nEsta ação não pode ser desfeita.');
      if (!confirm) return;

      try {
         const today = new Date().toISOString().split('T')[0];

         // 1. Cancel future appointments
         const { error: cancelError } = await supabase
            .from('appointments')
            .update({ status: 'cancelled' })
            .eq('professional_id', id)
            .gte('date', today)
            .neq('status', 'completed')
            .neq('status', 'COMPLETED');

         if (cancelError) throw cancelError;

         // 2. Mark professional as inactive in both tables (Soft delete)
         await supabase.from('professionals').update({ active: false }).eq('id', id);
         await supabase.from('profiles').update({ active: false }).eq('id', id);

         alert('Profissional removida com sucesso. Agendamentos futuros cancelados.');
         navigate('/admin/professionals');
      } catch (e: any) {
         alert('Erro ao excluir: ' + e.message);
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
         <header className="sticky top-0 z-50 glass-nav !bg-background-dark/90 p-6 border-b border-white/5 flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <button onClick={() => navigate('/admin/professionals')} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
               <div className="text-center">
                  <h2 className="font-display font-bold text-lg leading-tight">{profile.name}</h2>
                  <p className="text-[10px] text-accent-gold font-black uppercase tracking-widest">{profile.role === 'MASTER_ADMIN' ? 'Sênior & Founder' : 'Lash Artist Specialist'}</p>
               </div>
               <button onClick={() => setIsEditing(!isEditing)} className={`material-symbols-outlined ${isEditing ? 'text-primary' : 'text-accent-gold'}`}>
                  {isEditing ? 'close' : 'edit'}
               </button>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
               {[
                  { id: 'PERFORMANCE', label: 'Desempenho', icon: 'analytics' },
                  { id: 'PERMISSIONS', label: 'Controles', icon: 'rule' },
                  { id: 'AGENDA', label: 'Agenda', icon: 'calendar_month' },
                  { id: 'FINANCE', label: 'Financeiro', icon: 'payments' },
                  { id: 'SERVICES', label: 'Serviços', icon: 'category' },
                  { id: 'CONTENT', label: 'Conteúdo', icon: 'history_toggle_off' }
               ].map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as ProfTab)}
                     className={`px-6 h-11 rounded-3xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${activeTab === tab.id ? 'bg-primary border-primary text-white shadow-xl' : 'bg-white/5 border-white/10 text-gray-500'}`}
                  >
                     <span className="material-symbols-outlined !text-lg">{tab.icon}</span>
                     {tab.label}
                  </button>
               ))}
            </div>
         </header>

         <main className="flex-1 p-6 overflow-y-auto no-scrollbar pb-40">
            {isEditing ? (
               <div className="space-y-8 animate-fade-in bg-card-dark p-8 rounded-[40px] border border-white/10 shadow-2xl">
                  <h3 className="text-lg font-display font-bold text-accent-gold">Editar Perfil</h3>
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest pl-1">Nome Completo</label>
                        <input className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold focus:ring-primary outline-none" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest pl-1">Cargo / Especialidade</label>
                        <input className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm focus:ring-primary outline-none italic text-accent-gold" value={editData.role} onChange={e => setEditData({ ...editData, role: e.target.value })} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest pl-1">Foto (URL)</label>
                        <input className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm focus:ring-primary outline-none opacity-60" value={editData.avatar_url} onChange={e => setEditData({ ...editData, avatar_url: e.target.value })} />
                     </div>
                  </div>
                  <button onClick={handleSaveEdit} className="w-full h-16 bg-primary text-white rounded-3xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-primary/20">SALVAR ALTERAÇÕES</button>
               </div>
            ) : activeTab === 'PERFORMANCE' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="bg-card-dark p-10 rounded-[48px] border border-white/5 flex flex-col items-center gap-6 shadow-2xl">
                     <div className="size-32 rounded-[40px] border-4 border-accent-gold p-1.5 shadow-2xl overflow-hidden ring-8 ring-white/5">
                        <img src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.name}&background=random`} className="w-full h-full rounded-[32px] object-cover" alt="Profile" />
                     </div>
                     <div className="text-center space-y-2">
                        <p className="text-[10px] font-black uppercase text-accent-gold tracking-[0.4em]">{profile.active ? 'Talento Ativo ✨' : 'Indisponível'}</p>
                        <h3 className="text-2xl font-display font-bold text-white">{profile.name}</h3>
                        <p className="text-xs text-gray-500 italic">{profile.email}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-2 group hover:border-emerald-500/30 transition-all">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Receita Total</p>
                        <h3 className="text-2xl font-black text-emerald-500">R$ {stats.revenue.toLocaleString('pt-BR')}</h3>
                     </div>
                     <div className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-2 group hover:border-primary/30 transition-all">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest group-hover:text-primary transition-colors">Sessões</p>
                        <h3 className="text-2xl font-black text-white">{stats.appointments}</h3>
                     </div>
                     <div className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-2 group hover:border-accent-gold/30 transition-all">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest group-hover:text-accent-gold transition-colors">Avaliação</p>
                        <div className="flex items-center gap-2">
                           <h3 className="text-2xl font-black text-white">{stats.rating.toFixed(1)}</h3>
                           <span className="material-symbols-outlined text-accent-gold !text-sm fill-1">star</span>
                        </div>
                     </div>
                     <div className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-2">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Fidelidade</p>
                        <h3 className="text-2xl font-black text-accent-gold uppercase tabular-nums">Nível 5</h3>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'PERMISSIONS' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="bg-card-dark p-8 rounded-[40px] border border-white/5 space-y-10 shadow-2xl">
                     <div className="space-y-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-accent-gold flex items-center gap-2">
                           <span className="material-symbols-outlined !text-base">security</span>
                           Controle de Acesso
                        </h3>
                        <p className="text-[10px] text-gray-500 italic">Configure as permissões de gestão deste perfil profissional.</p>
                     </div>

                     <div className="space-y-6">
                        {[
                           { key: 'canManageOwnAgenda', label: 'Ver própria agenda', desc: 'Acesso restrito aos seus agendamentos.' },
                           { key: 'canViewOwnFinance', label: 'Ver próprio financeiro', desc: 'Acesso aos seus dados de faturamento pessoal.' },
                           { key: 'canPostStories', label: 'Postar stories', desc: 'Permite criar stories e posts no Feed.' },
                           { key: 'canManageOwnServices', label: 'Gerenciar serviços próprios', desc: 'Permitir editar catálogo pessoal.' },
                           { key: 'canFinalizeAppointments', label: 'Finalizar atendimentos', desc: 'Concluir sessões e processar pagamentos.' },
                           { key: 'canViewGlobalFinances', label: 'VER FINANCEIRO GERAL', desc: 'ACESSO MASTER: Ver faturamento total do estúdio.' }
                        ].map((perm) => (
                           <div key={perm.key} className="flex items-center justify-between gap-6 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                              <div className="space-y-1 flex-1">
                                 <p className="text-sm font-bold text-white">{perm.label}</p>
                                 <p className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter leading-tight">{perm.desc}</p>
                              </div>
                              <button
                                 onClick={() => togglePermission(perm.key)}
                                 className={`size-12 rounded-2xl flex items-center justify-center transition-all ${profile.permissions?.[perm.key] ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-gray-700'}`}
                              >
                                 <span className="material-symbols-outlined !text-2xl">{profile.permissions?.[perm.key] ? 'check_circle' : 'circle'}</span>
                              </button>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'AGENDA' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="bg-card-dark p-8 rounded-[40px] border border-white/5 space-y-6 shadow-2xl">
                     <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold">Histórico de Atendimentos</h3>
                        <button onClick={() => navigate(`/admin/agenda?proId=${id}`)} className="text-[10px] font-black text-accent-gold uppercase tracking-widest underline">Ver Timeline</button>
                     </div>
                     <div className="space-y-4">
                        {recentAppointments.length > 0 ? recentAppointments.map((apt, i) => (
                           <div key={i} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/10 group hover:border-white/20 transition-all">
                              <div className="space-y-1">
                                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{new Date(apt.date).toLocaleDateString('pt-BR')} • {apt.time}</span>
                                 <p className="text-sm font-bold text-white">{apt.service_name}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-xs font-black text-emerald-500 mb-1">R$ {apt.price}</p>
                                 <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full border ${apt.status === 'completed' || apt.status === 'COMPLETED' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 'text-accent-gold border-accent-gold/20 bg-accent-gold/5'}`}>
                                    {apt.status === 'completed' || apt.status === 'COMPLETED' ? 'Concluído' : 'Pendente'}
                                 </span>
                              </div>
                           </div>
                        )) : (
                           <div className="text-center py-20 opacity-20">
                              <span className="material-symbols-outlined !text-6xl">event_busy</span>
                              <p className="text-xs font-bold uppercase tracking-widest mt-4">Nenhum atendimento registrado.</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'FINANCE' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="bg-card-dark p-8 rounded-[40px] border border-white/5 space-y-6 shadow-2xl">
                     <h3 className="text-sm font-bold">Lançamentos Financeiros</h3>
                     <div className="space-y-4">
                        {transactions.length > 0 ? transactions.map((t, i) => (
                           <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                 <div className={`size-8 rounded-full flex items-center justify-center ${t.type === 'INCOME' ? 'bg-green-500/10 text-green-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                    <span className="material-symbols-outlined !text-sm">{t.type === 'INCOME' ? 'arrow_upward' : 'arrow_downward'}</span>
                                 </div>
                                 <div>
                                    <p className="font-bold text-xs">{t.category}</p>
                                    <p className="text-[10px] text-gray-500">{new Date(t.date).toLocaleDateString()}</p>
                                 </div>
                              </div>
                              <span className={`font-bold text-xs ${t.type === 'INCOME' ? 'text-green-400' : 'text-rose-400'}`}>
                                 {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount}
                              </span>
                           </div>
                        )) : (
                           <div className="text-center py-20 opacity-20">
                              <span className="material-symbols-outlined !text-6xl">payments</span>
                              <p className="text-xs font-bold uppercase tracking-widest mt-4">Nenhum lançamento.</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'SERVICES' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="bg-card-dark p-8 rounded-[40px] border border-white/5 space-y-6 shadow-2xl">
                     <h3 className="text-sm font-bold">Serviços Vinculados</h3>
                     <div className="grid grid-cols-1 gap-4">
                        {services.length > 0 ? services.map((s, i) => (
                           <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                              <img src={s.image_url} className="size-12 rounded-xl object-cover" alt="" />
                              <div>
                                 <p className="text-sm font-bold text-white">{s.name}</p>
                                 <p className="text-[10px] text-accent-gold font-bold uppercase">R$ {s.price} • {s.duration} min</p>
                              </div>
                           </div>
                        )) : (
                           <div className="text-center py-20 opacity-20">
                              <span className="material-symbols-outlined !text-6xl">category</span>
                              <p className="text-xs font-bold uppercase tracking-widest mt-4">Sem serviços.</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'CONTENT' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="bg-card-dark p-8 rounded-[40px] border border-white/5 space-y-6 shadow-2xl">
                     <h3 className="text-sm font-bold">Publicações & Stories</h3>
                     <div className="grid grid-cols-3 gap-2">
                        {content.length > 0 ? content.map((c, i) => (
                           <div key={i} className="aspect-square bg-white/5 rounded-xl overflow-hidden border border-white/5">
                              <img src={c.image_url || c.media_url} className="w-full h-full object-cover" alt="" />
                           </div>
                        )) : (
                           <div className="col-span-3 text-center py-20 opacity-20">
                              <span className="material-symbols-outlined !text-6xl">history_toggle_off</span>
                              <p className="text-xs font-bold uppercase tracking-widest mt-4">Nenhum conteúdo.</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            )}
         </main>

         <div className="fixed bottom-0 inset-x-0 p-8 glass-nav !bg-background-dark/95 border-t border-white/5 flex gap-4 backdrop-blur-2xl">
            <button
               onClick={handleDeleteProfessional}
               className="h-16 px-8 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-3xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2"
            >
               <span className="material-symbols-outlined !text-xl">person_remove</span>
               Excluir
            </button>
            <button
               onClick={() => navigate(`/admin/agenda?proId=${id}`)}
               className="flex-1 h-16 bg-primary text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
               <span className="material-symbols-outlined !text-xl">calendar_month</span>
               Abrir Agenda
            </button>
         </div>
      </div>
   );
};

export default ProfessionalDetailsAdmin;
