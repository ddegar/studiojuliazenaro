
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { UserRole } from '../types';

type ProfTab = 'PERFORMANCE' | 'PERMISSIONS' | 'AGENDA' | 'FINANCE' | 'SERVICES' | 'CONTENT' | 'SCHEDULE';

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
   const [editData, setEditData] = useState<any>({ name: '', role: '', avatar_url: '', email: '', phone: '', start_hour: '08:00', end_hour: '22:00', closed_days: '[0]', working_hours: {} });

   const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
         // 1. First fetch the professional record
         const { data: proBase, error: proBaseErr } = await supabase.from('professionals').select('*').eq('id', id).single();
         if (proBaseErr || !proBase) throw new Error('Profissional não encontrado');

         // 2. Try to fetch profile by id OR email
         let profileId = proBase.profile_id;
         let { data: profileData } = profileId
            ? await supabase.from('profiles').select('*').eq('id', profileId).single()
            : await supabase.from('profiles').select('*').eq('email', proBase.email).single();

         // 3. Auto-link if we found it by email but it wasn't linked
         if (profileData && !proBase.profile_id) {
            await supabase.from('professionals').update({ profile_id: profileData.id }).eq('id', id);
            profileId = profileData.id;
         }

         // Use proBase as fallback for profile data
         const displayProfile = {
            id: profileId || id, // Fallback to pro ID if no profile yet
            hasProfile: !!profileData,
            name: profileData?.name || proBase.name,
            email: profileData?.email || proBase.email,
            phone: (profileData as any)?.phone || proBase.phone,
            avatar_url: profileData?.avatar_url || proBase.image_url,
            role: profileData?.role || 'PROFESSIONAL',
            permissions: profileData?.permissions || proBase.permissions || {},
            role_title: profileData?.role_title || proBase.role
         };

         setProfile(displayProfile);
         setEditData({
            name: displayProfile.name || '',
            role: displayProfile.role_title || '',
            avatar_url: displayProfile.avatar_url || '',
            email: displayProfile.email || '',
            phone: (displayProfile as any).phone || '',
            start_hour: proBase.start_hour || '08:00',
            end_hour: proBase.end_hour || '22:00',
            closed_days: proBase.closed_days || '[0]',
            working_hours: proBase.working_hours || {}
         });

         // 3. Fetch sub-data in parallel
         const [apptsRes, transRes, servsRes, storiesRes, postsRes] = await Promise.all([
            supabase.from('appointments').select('*').eq('professional_id', id).is('deleted_at', null),
            supabase.from('transactions').select('*').eq('user_id', profileId || id),
            supabase.from('services').select('*'), // Filter manually to avoid schema error
            supabase.from('stories').select('*').eq('user_id', profileId || id),
            supabase.from('posts').select('*').eq('user_id', profileId || id)
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
            console.log('Current Pro ID:', id);
            console.log('All Services fetched:', servsRes.data);
            const linkedServices = servsRes.data.filter(s => {
               const ids = s.professional_ids;
               // Robust check (Handle string array, JSON array, or plain text)
               try {
                  if (Array.isArray(ids)) return ids.includes(id);
                  if (typeof ids === 'string') {
                     if (ids.includes(id)) return true; // Simple substring check
                     if (ids.startsWith('[')) {
                        const parsed = JSON.parse(ids);
                        return Array.isArray(parsed) && parsed.includes(id);
                     }
                  }
                  return false;
               } catch (e) {
                  // Fallback for messy data
                  return typeof ids === 'string' && ids.includes(id);
               }
            });
            console.log('Linked Services:', linkedServices);
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

      if (!profile.hasProfile) {
         alert('⚠️ Esta profissional ainda não se cadastrou no aplicativo. Você só poderá gerenciar as permissões dela após o primeiro acesso.');
         return;
      }

      // Update the correct profile record
      const { data, error } = await supabase.from('profiles')
         .update({ permissions: newPermissions })
         .eq('id', profile.id)
         .select();

      if (error) {
         alert('Erro ao salvar permissão: ' + error.message);
      } else if (!data || data.length === 0) {
         alert('⚠️ Erro ao salvar: Perfil não encontrado no banco de dados.');
      } else {
         setProfile({ ...profile, permissions: newPermissions });
      }
   };

   const handleSaveEdit = async () => {
      try {
         const updateData: any = {
            name: editData.name,
            phone: editData.phone,
            email: editData.email
         };
         // Only include avatar_url if we are sure it exists (or just exclude it for now to fix the blockage)
         // updateData.avatar_url = editData.avatar_url; 

         const { error } = await supabase.from('profiles').update(updateData).eq('id', profile.id);

         const { error: proError } = await supabase.from('professionals').update({
            name: editData.name,
            role: editData.role,
            email: editData.email,
            phone: editData.phone,
            image_url: editData.avatar_url,
            start_hour: editData.start_hour,
            end_hour: editData.end_hour,
            closed_days: editData.closed_days,
            working_hours: editData.working_hours
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
      <div className="flex flex-col h-full bg-background-dark text-white overflow-hidden selection:bg-accent-gold/20 relative">
         {/* Dynamic Background Elements */}
         <div className="fixed inset-0 pointer-events-none opacity-10 overflow-hidden">
            <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/20 blur-[120px] animate-float"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
         </div>

         <header className="sticky top-0 z-[100] premium-nav-dark p-6 border-b border-white/5 flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <button onClick={() => navigate('/admin/professionals')} className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-accent-gold hover:bg-white/10 active:scale-90 transition-all">
                  <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
               </button>
               <div className="text-center">
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mb-1">Elite Specialist Profile</p>
                  <h2 className="font-display italic text-xl leading-tight text-white tracking-tight">{profile.name}</h2>
               </div>
               <button onClick={() => setIsEditing(!isEditing)} className={`size-10 flex items-center justify-center rounded-full border transition-all ${isEditing ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-accent-gold'}`}>
                  <span className="material-symbols-outlined !text-xl">{isEditing ? 'close' : 'edit'}</span>
               </button>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
               {[
                  { id: 'PERFORMANCE', label: 'Desempenho', icon: 'analytics' },
                  { id: 'PERMISSIONS', label: 'Controles', icon: 'rule' },
                  { id: 'SCHEDULE', label: 'Horários', icon: 'schedule' },
                  { id: 'AGENDA', label: 'Agenda', icon: 'calendar_month' },
                  { id: 'FINANCE', label: 'Financeiro', icon: 'payments' },
                  { id: 'SERVICES', label: 'Serviços', icon: 'category' },
                  { id: 'CONTENT', label: 'Conteúdo', icon: 'history_toggle_off' }
               ].map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as ProfTab)}
                     className={`px-5 h-11 rounded-2xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all shrink-0 border duration-500 ${activeTab === tab.id ? 'bg-primary border-primary text-white shadow-huge' : 'bg-white/5 border-white/10 text-white/20'}`}
                  >
                     <span className="material-symbols-outlined !text-lg">{tab.icon}</span>
                     {tab.label}
                  </button>
               ))}
            </div>
         </header>

         <main className="relative z-10 flex-1 p-8 overflow-y-auto no-scrollbar pb-44">
            {isEditing ? (
               <div className="space-y-10 animate-reveal bg-surface-dark/40 backdrop-blur-xl p-10 rounded-[48px] border border-white/5 shadow-hugest">
                  <div className="flex items-center gap-4">
                     <div className="h-px w-8 bg-accent-gold/40"></div>
                     <h3 className="text-[10px] font-black uppercase text-accent-gold tracking-[0.4em] font-outfit">Edição de Cadastro</h3>
                  </div>

                  <div className="space-y-8">
                     <div className="space-y-3">
                        <label className="text-[10px] uppercase font-black text-white/20 tracking-[0.4em] font-outfit pl-2">Nome Completo</label>
                        <input className="w-full h-16 bg-surface-dark border border-white/5 rounded-2xl px-8 text-sm font-medium focus:border-accent-gold/40 outline-none transition-all" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] uppercase font-black text-white/20 tracking-[0.4em] font-outfit pl-2">Cargo / Especialidade</label>
                        <input className="w-full h-16 bg-surface-dark border border-white/5 rounded-2xl px-8 text-sm focus:border-accent-gold/40 outline-none italic text-accent-gold font-display" value={editData.role} onChange={e => setEditData({ ...editData, role: e.target.value })} />
                     </div>
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                           <label className="text-[10px] uppercase font-black text-white/20 tracking-[0.4em] font-outfit pl-2">E-mail Corporativo</label>
                           <input className="w-full h-16 bg-surface-dark border border-white/5 rounded-2xl px-8 text-sm focus:border-accent-gold/40 outline-none" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] uppercase font-black text-white/20 tracking-[0.4em] font-outfit pl-2">Telefone Direto</label>
                           <input className="w-full h-16 bg-surface-dark border border-white/5 rounded-2xl px-8 text-sm focus:border-accent-gold/40 outline-none" value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} />
                        </div>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] uppercase font-black text-white/20 tracking-[0.4em] font-outfit pl-2">Retrato Profissional (URL)</label>
                        <input className="w-full h-16 bg-surface-dark border border-white/5 rounded-2xl px-8 text-[10px] focus:border-accent-gold/40 outline-none opacity-40 font-mono" value={editData.avatar_url} onChange={e => setEditData({ ...editData, avatar_url: e.target.value })} />
                     </div>
                  </div>

                  <button onClick={handleSaveEdit} className="group relative w-full h-20 bg-primary text-white rounded-[32px] font-outfit font-black text-[10px] uppercase tracking-[0.4em] shadow-hugest overflow-hidden active:scale-95 transition-all">
                     <div className="absolute inset-0 bg-accent-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
                     <span className="relative z-10 flex items-center justify-center gap-4">
                        Consolidar Atualizações
                        <span className="material-symbols-outlined !text-xl text-accent-gold">verified</span>
                     </span>
                  </button>
               </div>
            ) : activeTab === 'PERFORMANCE' && (
               <div className="space-y-10 animate-reveal">
                  <div className="bg-surface-dark/40 backdrop-blur-xl p-12 rounded-[56px] border border-white/5 flex flex-col items-center gap-8 shadow-hugest relative overflow-hidden group">
                     {/* Background Glow */}
                     <div className="absolute inset-0 bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                     <div className="relative size-40">
                        <div className="absolute inset-0 bg-accent-gold/20 rounded-[48px] blur-3xl animate-pulse"></div>
                        <div className="relative size-40 rounded-[48px] border-2 border-accent-gold/40 p-2 shadow-2xl overflow-hidden ring-8 ring-white/5 rotate-3 group-hover:rotate-0 transition-transform duration-1000 bg-surface-dark">
                           <img src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.name}&background=122b22&color=c9a961`} className="w-full h-full rounded-[40px] object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000" alt="Profile" />
                        </div>
                     </div>

                     <div className="text-center space-y-4 relative z-10">
                        <div className="flex items-center justify-center gap-3">
                           <div className="h-px w-4 bg-accent-gold/40"></div>
                           <p className="text-[10px] font-black uppercase text-accent-gold tracking-[0.4em] font-outfit italic">{profile.active ? 'Talento de Elite ✨' : 'Indisponível'}</p>
                           <div className="h-px w-4 bg-accent-gold/40"></div>
                        </div>
                        <h3 className="text-4xl font-display italic text-white tracking-tight">{profile.name}</h3>
                        <div className="px-6 py-2 rounded-full border border-white/5 bg-white/5 backdrop-blur inline-block">
                           <p className="text-[10px] text-white/30 font-light uppercase tracking-widest">{profile.email}</p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="bg-surface-dark/40 border border-white/5 p-8 rounded-[40px] space-y-3 shadow-huge hover:border-emerald-500/20 transition-all duration-500 group">
                        <div className="flex justify-between items-center">
                           <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] group-hover:text-emerald-500/40 transition-colors">Receita Atribuída</p>
                           <span className="material-symbols-outlined text-emerald-500 !text-sm">payments</span>
                        </div>
                        <h3 className="text-2xl font-display italic text-emerald-500">R$ {stats.revenue.toLocaleString('pt-BR')}</h3>
                     </div>
                     <div className="bg-surface-dark/40 border border-white/5 p-8 rounded-[40px] space-y-3 shadow-huge hover:border-primary/20 transition-all duration-500 group">
                        <div className="flex justify-between items-center">
                           <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] group-hover:text-primary/40 transition-colors">Sessões Elite</p>
                           <span className="material-symbols-outlined text-primary !text-sm">calendar_month</span>
                        </div>
                        <h3 className="text-2xl font-display italic text-white">{stats.appointments}</h3>
                     </div>
                     <div className="bg-surface-dark/40 border border-white/5 p-8 rounded-[40px] space-y-3 shadow-huge hover:border-accent-gold/20 transition-all duration-500 group">
                        <div className="flex justify-between items-center">
                           <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] group-hover:text-accent-gold/40 transition-colors">Performance</p>
                           <span className="material-symbols-outlined text-accent-gold !text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        </div>
                        <h3 className="text-2xl font-display italic text-white">{stats.rating.toFixed(1)}</h3>
                     </div>
                     <div className="bg-surface-dark/40 border border-white/5 p-8 rounded-[40px] space-y-3 shadow-huge relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                           <span className="material-symbols-outlined !text-4xl text-accent-gold">diamond</span>
                        </div>
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">JZ Privé Level</p>
                        <h3 className="text-2xl font-display italic text-accent-gold">Signature Specialist</h3>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'PERMISSIONS' && (
               <div className="space-y-10 animate-reveal">
                  <div className="bg-surface-dark/40 backdrop-blur-xl p-10 rounded-[48px] border border-white/5 shadow-hugest space-y-12">
                     <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <div className="size-10 rounded-2xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center text-accent-gold shadow-lg">
                              <span className="material-symbols-outlined !text-xl">security</span>
                           </div>
                           <div>
                              <h3 className="text-base font-outfit font-bold uppercase tracking-widest text-white">Privilégios de Acesso</h3>
                              <p className="text-[10px] text-white/20 uppercase tracking-widest font-medium">Arquitetura de Segurança JZ Privé</p>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-2">
                        {[
                           { key: 'canManageOwnAgenda', label: 'Dashboard Pessoal de Agenda', desc: 'Sincronização exclusiva dos próprios horários.' },
                           { key: 'canViewOwnFinance', label: 'Financial Journal Profissional', desc: 'Transparência em faturamento individual.' },
                           { key: 'canPostStories', label: 'Curadoria de Conteúdo (Feed)', desc: 'Autoridade para publicar na Inspiration Wall.' },
                           { key: 'canManageOwnServices', label: 'Gestão de Especialidades', desc: 'Controle sobre as técnicas oferecidas.' },
                           { key: 'canFinalizeAppointments', label: 'Ritual de Finalização', desc: 'Concluir atendimentos e validar pontos.' },
                           { key: 'canViewGlobalFinances', label: 'ACESSO MASTER FINANCEIRO', desc: 'VISÃO HOLÍSTICA: Faturamento total da marca.' }
                        ].map((perm, idx) => (
                           <div
                              key={perm.key}
                              className="group flex items-center justify-between gap-8 p-6 rounded-[32px] hover:bg-white/5 transition-all duration-500 border border-transparent hover:border-white/5"
                           >
                              <div className="space-y-1 flex-1">
                                 <p className="text-sm font-outfit font-bold text-white group-hover:text-accent-gold transition-colors">{perm.label}</p>
                                 <p className="text-[9px] text-white/30 uppercase font-black tracking-tight leading-tight">{perm.desc}</p>
                              </div>
                              <button
                                 onClick={() => togglePermission(perm.key)}
                                 className={`relative size-14 rounded-[22px] flex items-center justify-center transition-all duration-700 ${profile.permissions?.[perm.key] ? 'bg-primary text-white shadow-huge rotate-0' : 'bg-white/5 text-white/5 rotate-12 group-hover:rotate-0'}`}
                              >
                                 <span className="material-symbols-outlined !text-2xl">{profile.permissions?.[perm.key] ? 'check_circle' : 'radio_button_unchecked'}</span>
                                 {profile.permissions?.[perm.key] && (
                                    <div className="absolute inset-0 bg-accent-gold/10 animate-ping rounded-[22px] opacity-20"></div>
                                 )}
                              </button>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'AGENDA' && (
               <div className="space-y-8 animate-reveal">
                  <div className="bg-surface-dark/40 backdrop-blur-xl p-10 rounded-[48px] border border-white/5 shadow-hugest space-y-10">
                     <div className="flex justify-between items-center px-2">
                        <div>
                           <h3 className="text-base font-outfit font-bold text-white">Journal de Atendimentos</h3>
                           <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mt-1">Timeline de Especialista</p>
                        </div>
                        <button onClick={() => navigate(`/admin/agenda?proId=${id}`)} className="h-10 px-5 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[9px] font-black uppercase tracking-widest hover:bg-accent-gold hover:text-primary transition-all shadow-lg active:scale-95">Ver Mapa</button>
                     </div>
                     <div className="space-y-4">
                        {recentAppointments.length > 0 ? recentAppointments.map((apt, i) => (
                           <div key={i} className="group flex items-center justify-between p-6 bg-surface-dark border border-white/5 rounded-[32px] hover:border-accent-gold/20 transition-all duration-500">
                              <div className="space-y-2">
                                 <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{new Date(apt.date).toLocaleDateString('pt-BR')}</span>
                                    <span className="h-px w-3 bg-white/10"></span>
                                    <span className="text-[9px] font-black text-accent-gold uppercase tracking-[0.2em]">{apt.time}</span>
                                 </div>
                                 <p className="text-base font-display italic text-white group-hover:text-accent-gold transition-colors">{apt.service_name}</p>
                              </div>
                              <div className="text-right space-y-2">
                                 <p className="text-sm font-outfit font-bold text-white">R$ {apt.price}</p>
                                 <div className={`px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${apt.status === 'completed' || apt.status === 'COMPLETED' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 'text-accent-gold border-accent-gold/20 bg-accent-gold/5'}`}>
                                    {apt.status === 'completed' || apt.status === 'COMPLETED' ? 'Efetivado' : 'Inscrito'}
                                 </div>
                              </div>
                           </div>
                        )) : (
                           <div className="text-center py-24 opacity-10 space-y-6">
                              <span className="material-symbols-outlined !text-6xl">event_busy</span>
                              <p className="font-display italic text-xl">Silêncio na Agenda.</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'FINANCE' && (
               <div className="space-y-8 animate-reveal">
                  <div className="bg-surface-dark/40 backdrop-blur-xl p-10 rounded-[48px] border border-white/5 shadow-hugest space-y-10">
                     <div className="space-y-1 px-2">
                        <h3 className="text-base font-outfit font-bold text-white">Extrato de Produção</h3>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Fluxo Individual de Membro</p>
                     </div>
                     <div className="space-y-4">
                        {transactions.length > 0 ? transactions.map((t, i) => (
                           <div key={i} className="bg-surface-dark p-6 rounded-[32px] border border-white/5 flex justify-between items-center group hover:border-white/10 transition-all duration-500">
                              <div className="flex items-center gap-5">
                                 <div className={`size-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12 ${t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10' : 'bg-rose-500/10 text-rose-500 border border-rose-500/10'}`}>
                                    <span className="material-symbols-outlined !text-xl">{t.type === 'INCOME' ? 'arrow_upward' : 'arrow_downward'}</span>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="font-outfit font-bold text-sm text-white">{t.category}</p>
                                    <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">{new Date(t.date).toLocaleDateString()}</p>
                                 </div>
                              </div>
                              <span className={`font-display italic text-lg ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                 {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount}
                              </span>
                           </div>
                        )) : (
                           <div className="text-center py-24 opacity-10 space-y-6">
                              <span className="material-symbols-outlined !text-6xl">payments</span>
                              <p className="font-display italic text-xl">Sem movimentações ativas.</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'SERVICES' && (
               <div className="space-y-8 animate-reveal">
                  <div className="bg-surface-dark/40 backdrop-blur-xl p-10 rounded-[48px] border border-white/5 shadow-hugest space-y-10">
                     <div className="space-y-1 px-2">
                        <h3 className="text-base font-outfit font-bold text-white">Catálogo Especializado</h3>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Menu de Autoridade</p>
                     </div>
                     <div className="grid grid-cols-1 gap-5">
                        {services.length > 0 ? services.map((s, i) => (
                           <div key={i} className="p-6 bg-surface-dark rounded-[32px] border border-white/5 flex items-center gap-6 hover:border-accent-gold/20 transition-all duration-500 group">
                              <div className="size-20 rounded-2xl overflow-hidden border border-white/5 shadow-lg group-hover:scale-105 transition-transform duration-500">
                                 <img src={s.image_url} className="w-full h-full object-cover" alt="" />
                              </div>
                              <div className="space-y-2 flex-1">
                                 <p className="font-display text-xl italic text-white group-hover:text-accent-gold transition-colors">{s.name}</p>
                                 <div className="flex items-center gap-4">
                                    <span className="text-[10px] text-accent-gold font-black uppercase tracking-widest">R$ {s.price}</span>
                                    <span className="size-1 rounded-full bg-white/10"></span>
                                    <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">{s.duration} min</span>
                                 </div>
                              </div>
                           </div>
                        )) : (
                           <div className="text-center py-24 opacity-10 space-y-6">
                              <span className="material-symbols-outlined !text-6xl">category</span>
                              <p className="font-display italic text-xl">Nenhum serviço vinculado.</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'SCHEDULE' && (
               <div className="space-y-10 animate-reveal">
                  <div className="bg-surface-dark/40 backdrop-blur-xl p-10 rounded-[48px] border border-white/5 shadow-hugest space-y-12">
                     <div className="flex items-center gap-5 mb-2 px-2">
                        <div className="relative size-16">
                           <div className="absolute inset-0 bg-emerald-500/20 blur-xl animate-pulse rounded-full"></div>
                           <div className="relative size-16 rounded-2xl bg-surface-dark border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-huge">
                              <span className="material-symbols-outlined !text-3xl">schedule</span>
                           </div>
                        </div>
                        <div>
                           <h3 className="text-xl font-display italic text-white">Calendário de Atividade</h3>
                           <p className="text-[9px] text-white/20 uppercase font-black tracking-[0.3em] font-outfit mt-1 italic">Exclusive Professional Timeline</p>
                        </div>
                     </div>

                     <div className="space-y-5">
                        {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dayName, idx) => {
                           const wHours = editData.working_hours || {};
                           const dayData = wHours[idx] || {
                              start: editData.start_hour || '08:00',
                              end: editData.end_hour || '20:00',
                              closed: (typeof editData.closed_days === 'string' ? JSON.parse(editData.closed_days) : (editData.closed_days || [])).includes(idx)
                           };

                           return (
                              <div key={idx} className={`group p-6 rounded-[32px] border transition-all duration-700 ${dayData.closed ? 'bg-white/2 border-white/5 opacity-40 grayscale' : 'bg-surface-dark border-white/5 hover:border-accent-gold/20 shadow-lg'}`}>
                                 <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                       <div className={`size-2 rounded-full ${dayData.closed ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`}></div>
                                       <span className="text-[11px] font-black uppercase tracking-widest text-white/60 font-outfit">{dayName}</span>
                                    </div>
                                    <button
                                       onClick={() => {
                                          const newWHours = { ...wHours, [idx]: { ...dayData, closed: !dayData.closed } };
                                          setEditData({ ...editData, working_hours: newWHours });
                                       }}
                                       className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border transition-all duration-500 ${dayData.closed ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white'}`}
                                    >
                                       {dayData.closed ? 'Hibernação' : 'Ativa'}
                                    </button>
                                 </div>

                                 {!dayData.closed && (
                                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                                       <div className="space-y-2">
                                          <label className="text-[8px] uppercase font-black text-white/10 tracking-[0.4em] pl-1">Primeira Sessão</label>
                                          <div className="relative group/input">
                                             <input
                                                type="time"
                                                className="w-full h-12 bg-black/20 border border-white/5 rounded-2xl px-5 text-xs font-outfit font-black text-accent-gold outline-none focus:border-accent-gold/40 transition-all"
                                                value={dayData.start}
                                                onChange={e => {
                                                   const newWHours = { ...wHours, [idx]: { ...dayData, start: e.target.value } };
                                                   setEditData({ ...editData, working_hours: newWHours });
                                                }}
                                             />
                                          </div>
                                       </div>
                                       <div className="space-y-2">
                                          <label className="text-[8px] uppercase font-black text-white/10 tracking-[0.4em] pl-1">Ciclo Final</label>
                                          <div className="relative group/input">
                                             <input
                                                type="time"
                                                className="w-full h-12 bg-black/20 border border-white/5 rounded-2xl px-5 text-xs font-outfit font-black text-accent-gold outline-none focus:border-accent-gold/40 transition-all"
                                                value={dayData.end}
                                                onChange={e => {
                                                   const newWHours = { ...wHours, [idx]: { ...dayData, end: e.target.value } };
                                                   setEditData({ ...editData, working_hours: newWHours });
                                                }}
                                             />
                                          </div>
                                       </div>
                                    </div>
                                 )}
                              </div>
                           );
                        })}
                     </div>

                     <div className="bg-primary/5 p-8 rounded-[40px] border border-primary/10 flex gap-6 items-start">
                        <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0 shadow-lg">
                           <span className="material-symbols-outlined !text-2xl">auto_awesome</span>
                        </div>
                        <p className="text-[11px] text-white/30 leading-relaxed italic font-light pt-1">
                           <span className="text-accent-gold font-bold">Ritual de Disponibilidade:</span> Estas definições são refletidas na orquestração de agenda voltada às clientes JZ Privé.
                        </p>
                     </div>

                     <button onClick={handleSaveEdit} className="group relative w-full h-20 bg-primary text-white rounded-[32px] font-outfit font-black text-[10px] uppercase tracking-[0.4em] shadow-hugest overflow-hidden active:scale-95 transition-all">
                        <div className="absolute inset-0 bg-accent-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
                        <span className="relative z-10 flex items-center justify-center gap-4">
                           Validar Cronograma
                           <span className="material-symbols-outlined !text-xl text-accent-gold">event_available</span>
                        </span>
                     </button>
                  </div>
               </div>
            )}
         </main>

         <div className="fixed bottom-0 inset-x-0 p-8 glass-nav !bg-background-dark/95 border-t border-white/5 flex gap-6 backdrop-blur-3xl z-[120]">
            <button
               onClick={handleDeleteProfessional}
               className="h-20 px-8 bg-rose-500/5 border border-rose-500/10 text-rose-500/40 rounded-[32px] font-outfit font-black text-[9px] uppercase tracking-[0.4em] active:scale-95 transition-all flex items-center gap-3 hover:bg-rose-500 hover:text-white hover:border-rose-500"
            >
               <span className="material-symbols-outlined !text-2xl">person_remove</span>
               Banir
            </button>
            <button
               onClick={() => navigate(`/admin/agenda?proId=${id}`)}
               className="group relative flex-1 h-20 bg-primary text-white rounded-[32px] font-outfit font-black text-[10px] uppercase tracking-[0.4em] shadow-hugest active:scale-95 transition-all flex items-center justify-center gap-4 overflow-hidden"
            >
               <div className="absolute inset-0 bg-accent-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
               <span className="relative z-10 flex items-center gap-3">
                  <span className="material-symbols-outlined !text-2xl text-accent-gold">calendar_month</span>
                  Explorar Agenda
               </span>
            </button>
         </div>

         {/* Visual Safe Area Inset */}
         <div className="fixed bottom-0 left-0 w-full h-8 bg-black pointer-events-none z-[130]"></div>
      </div>
   );
};

export default ProfessionalDetailsAdmin;
