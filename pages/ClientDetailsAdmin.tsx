
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';

type AdminTab = 'INFO' | 'AESTHETIC' | 'HISTORY' | 'POINTS';

const ClientDetailsAdmin: React.FC = () => {
   const navigate = useNavigate();
   const { id } = useParams();
   const [activeTab, setActiveTab] = useState<AdminTab>('INFO');
   const [loading, setLoading] = useState(true);
   const [clientData, setClientData] = useState<any>(null);
   const [appointments, setAppointments] = useState<any[]>([]);
   const [pointsHistory, setPointsHistory] = useState<any[]>([]);

   // Edit state
   const [isEditing, setIsEditing] = useState(false);
   const [editForm, setEditForm] = useState<any>({});
   const [isSaving, setIsSaving] = useState(false);
   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);

   const fetchClientAll = async () => {
      if (!id) return;
      setLoading(true);
      try {
         const [profileRes, apptsRes, pointsRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', id).single(),
            supabase.from('appointments').select('*').eq('user_id', id).order('date', { ascending: false }),
            supabase.from('point_transactions').select('*').eq('user_id', id).order('created_at', { ascending: false })
         ]);

         if (profileRes.data) {
            setClientData(profileRes.data);
            setEditForm({
               name: profileRes.data.name || '',
               email: profileRes.data.email || '',
               phone: profileRes.data.phone || '',
               cpf: profileRes.data.cpf || '',
               birthdate: profileRes.data.birthdate || '',
               referred_by: profileRes.data.referred_by || '',
               profile_pic: profileRes.data.profile_pic || ''
            });
         }
         if (apptsRes.data) {
            setAppointments(apptsRes.data);
         }
         if (pointsRes.data) {
            setPointsHistory(pointsRes.data);
         }
      } catch (err) {
         console.error('Error fetching client details:', err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchClientAll();
   }, [id]);

   const handleSave = async () => {
      if (!id) return;
      setIsSaving(true);
      try {
         // Update Auth email if changed
         if (editForm.email !== clientData.email) {
            // Note: In some setups this might require admin privileges or triggers
            // But let's try to update the profile first and see if they want auth sync
            const { error: authError } = await supabase.auth.admin.updateUserById(id, {
               email: editForm.email
            });
            // If admin client is not available on frontend (it shouldn't be), we rely on profile update
         }

         const { error } = await supabase
            .from('profiles')
            .update({
               name: editForm.name,
               email: editForm.email,
               phone: editForm.phone,
               cpf: editForm.cpf.replace(/\D/g, ''),
               birthdate: editForm.birthdate || null,
               referred_by: editForm.referred_by,
               profile_pic: editForm.profile_pic
            })
            .eq('id', id);

         if (error) throw error;
         alert('Dados atualizados com sucesso! ✨');
         setIsEditing(false);
         await fetchClientAll();
      } catch (err: any) {
         alert('Erro ao salvar: ' + err.message);
      } finally {
         setIsSaving(false);
      }
   };

   const handleDeleteClient = async () => {
      if (!id) return;
      setIsDeleting(true);
      try {
         const { error } = await supabase.rpc('delete_user_completely', { target_user_id: id });
         if (error) throw error;

         alert('Cliente excluído permanentemente! 👋');
         navigate('/admin/clients');
      } catch (err: any) {
         alert('Erro ao excluir: ' + err.message);
      } finally {
         setIsDeleting(false);
         setShowDeleteConfirm(false);
      }
   };

   if (loading) {
      return (
         <div className="flex h-screen items-center justify-center bg-background-dark">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
         </div>
      );
   }

   if (!clientData) {
      return (
         <div className="flex flex-col h-screen items-center justify-center bg-background-dark text-white p-6 text-center">
            <span className="material-symbols-outlined !text-6xl text-gray-600 mb-4">person_off</span>
            <h2 className="text-xl font-bold">Cliente não encontrado</h2>
            <button onClick={() => navigate(-1)} className="mt-6 text-accent-gold underline">Voltar para lista</button>
         </div>
      );
   }

   const preferences = clientData.preferences || {};
   const points = clientData.lash_points || 0;
   const loyaltyLevel = points >= 2000 ? 'PRIVÉ 💎' : (points >= 1000 ? 'SIGNATURE ⭐' : (points >= 500 ? 'PRIME 🌟' : 'SELECT'));

   return (
      <div className="flex flex-col h-full bg-background-dark text-white overflow-hidden selection:bg-accent-gold/20 relative">
         {/* Dynamic Background Elements */}
         <div className="fixed inset-0 pointer-events-none opacity-10 overflow-hidden">
            <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/20 blur-[120px] animate-float"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
         </div>

         <header className="sticky top-0 z-[100] premium-nav-dark p-6 border-b border-white/5 flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-accent-gold hover:bg-white/10 active:scale-90 transition-all">
                  <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
               </button>
               <div className="text-center">
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mb-1">Elite Member Dossier</p>
                  <h2 className="font-display italic text-xl leading-tight text-white tracking-tight">{clientData.name}</h2>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => setShowDeleteConfirm(true)} className="size-10 flex items-center justify-center rounded-full bg-rose-500/5 border border-rose-500/10 text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                     <span className="material-symbols-outlined !text-xl">delete</span>
                  </button>
                  <button onClick={() => setIsEditing(!isEditing)} className={`size-10 flex items-center justify-center rounded-full border transition-all ${isEditing ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-accent-gold'}`}>
                     <span className="material-symbols-outlined !text-xl">{isEditing ? 'close' : 'edit_note'}</span>
                  </button>
               </div>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
               {[
                  { id: 'INFO', label: 'Dados', icon: 'person' },
                  { id: 'AESTHETIC', label: 'Olhar', icon: 'visibility' },
                  { id: 'HISTORY', label: 'Histórico', icon: 'history' },
                  { id: 'POINTS', label: 'Fidelidade', icon: 'stars' }
               ].map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as AdminTab)}
                     className={`px-5 h-11 rounded-2xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all shrink-0 border duration-500 ${activeTab === tab.id ? 'bg-primary border-primary text-white shadow-huge' : 'bg-white/5 border-white/10 text-white/20'}`}
                  >
                     <span className="material-symbols-outlined !text-lg">{tab.icon}</span>
                     {tab.label}
                  </button>
               ))}
            </div>
         </header>

         <main className="relative z-10 flex-1 p-8 overflow-y-auto no-scrollbar pb-32">
            {activeTab === 'INFO' && (
               <div className="space-y-10 animate-reveal">
                  {isEditing ? (
                     <div className="bg-surface-dark/40 backdrop-blur-xl p-10 rounded-[48px] border border-white/5 shadow-hugest space-y-10">
                        <div className="flex items-center gap-4">
                           <div className="h-px w-8 bg-accent-gold/40"></div>
                           <h3 className="text-[10px] font-black uppercase text-accent-gold tracking-[0.4em] font-outfit">Atualização de Dossier</h3>
                        </div>
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] px-2 font-outfit">Identidade Nominal</label>
                              <input className="w-full h-16 bg-surface-dark border border-white/5 rounded-2xl px-8 text-sm text-white focus:border-accent-gold/40 outline-none transition-all" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] px-2 font-outfit">Canal Digital</label>
                                 <input className="w-full h-16 bg-surface-dark border border-white/5 rounded-2xl px-8 text-sm text-white focus:border-accent-gold/40 outline-none transition-all" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] px-2 font-outfit">Contato Direto</label>
                                 <input className="w-full h-16 bg-surface-dark border border-white/5 rounded-2xl px-8 text-sm text-white focus:border-accent-gold/40 outline-none transition-all" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                              </div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] px-2 font-outfit">Registro Fiscal (CPF)</label>
                                 <input className="w-full h-16 bg-surface-dark border border-white/5 rounded-2xl px-8 text-sm text-white focus:border-accent-gold/40 outline-none transition-all" value={editForm.cpf} onChange={e => setEditForm({ ...editForm, cpf: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] px-2 font-outfit">Ciclo de Vida (Nasc.)</label>
                                 <input type="date" className="w-full h-16 bg-surface-dark border border-white/5 rounded-2xl px-8 text-sm text-white focus:border-accent-gold/40 outline-none transition-all" value={editForm.birthdate} onChange={e => setEditForm({ ...editForm, birthdate: e.target.value })} />
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-4 pt-4">
                           <button disabled={isSaving} onClick={() => setIsEditing(false)} className="flex-1 h-18 bg-white/5 text-white/20 rounded-3xl font-black text-[9px] uppercase tracking-widest hover:bg-white/10 transition-all">Cancelar</button>
                           <button
                              disabled={isSaving}
                              onClick={handleSave}
                              className="group relative flex-[2] h-18 bg-primary text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.4em] shadow-hugest overflow-hidden transition-all active:scale-95"
                           >
                              <div className="absolute inset-0 bg-accent-gold/10 translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
                              <span className="relative z-10">{isSaving ? 'Processando...' : 'Efetivar Dossier'}</span>
                           </button>
                        </div>
                     </div>
                  ) : (
                     <>
                        <div className="flex flex-col items-center py-12 bg-surface-dark/40 border border-white/5 rounded-[56px] space-y-8 shadow-hugest relative overflow-hidden group">
                           <div className="absolute inset-0 bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                           <div className="relative size-32">
                              <div className="absolute inset-0 bg-accent-gold/20 rounded-full blur-3xl animate-pulse"></div>
                              <div className="relative size-32 rounded-[40px] border-2 border-accent-gold/40 p-1.5 shadow-2xl overflow-hidden ring-8 ring-white/5 bg-surface-dark">
                                 <img src={clientData.profile_pic || `https://ui-avatars.com/api/?name=${clientData.name}&background=122b22&color=c9a961`} className="w-full h-full rounded-[32px] object-cover" alt="Client" />
                              </div>
                           </div>

                           <div className="text-center space-y-3 relative z-10">
                              <div className="flex items-center justify-center gap-3">
                                 <div className="h-px w-4 bg-accent-gold/40"></div>
                                 <p className="text-[10px] font-black uppercase text-accent-gold tracking-[0.4em] font-outfit italic">{loyaltyLevel}</p>
                                 <div className="h-px w-4 bg-accent-gold/40"></div>
                              </div>
                              <h1 className="text-4xl font-display italic text-white tracking-tight leading-tight">{clientData.name}</h1>
                              <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">Membro desde {(!isNaN(new Date(clientData.created_at).getTime())) ? new Date(clientData.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '-'}</p>
                           </div>
                        </div>

                        <div className="bg-surface-dark/40 border border-white/5 p-10 rounded-[48px] space-y-10 shadow-hugest">
                           <div className="space-y-6">
                              <div className="flex items-center gap-3">
                                 <div className="h-px w-6 bg-accent-gold/20"></div>
                                 <p className="text-[9px] font-black uppercase text-white/20 tracking-[0.4em] font-outfit">Canais de Interatividade</p>
                              </div>
                              <div className="space-y-4">
                                 <div className="flex items-center gap-5 p-5 bg-white/2 rounded-3xl border border-white/5">
                                    <div className="size-10 rounded-2xl bg-accent-gold/10 text-accent-gold flex items-center justify-center">
                                       <span className="material-symbols-outlined !text-xl">phone_iphone</span>
                                    </div>
                                    <p className="text-sm font-outfit font-bold text-white tracking-tight">{clientData.phone || '(Não informado)'}</p>
                                 </div>
                                 <div className="flex items-center gap-5 p-5 bg-white/2 rounded-3xl border border-white/5">
                                    <div className="size-10 rounded-2xl bg-white/5 text-white/20 flex items-center justify-center">
                                       <span className="material-symbols-outlined !text-xl">alternate_email</span>
                                    </div>
                                    <p className="text-sm font-outfit font-light text-white/60 tracking-tight">{clientData.email}</p>
                                 </div>
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-8 pt-10 border-t border-white/5">
                              <div className="space-y-2">
                                 <p className="text-[9px] font-black uppercase text-white/10 tracking-[0.3em] font-outfit">Manifestação (Nasc.)</p>
                                 <p className="text-sm font-outfit font-bold text-white">{(clientData.birthdate && !isNaN(new Date(clientData.birthdate).getTime())) ? new Date(clientData.birthdate + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</p>
                              </div>
                              <div className="space-y-2">
                                 <p className="text-[9px] font-black uppercase text-white/10 tracking-[0.3em] font-outfit">Origem (Indicação)</p>
                                 <p className="text-sm font-outfit font-bold text-accent-gold">{clientData.referred_by || 'Diretório Direto'}</p>
                              </div>
                           </div>
                        </div>
                     </>
                  )}
               </div>
            )}

            {activeTab === 'AESTHETIC' && (
               <div className="space-y-8 animate-reveal">
                  <div className="bg-primary/5 border border-primary/10 p-10 rounded-[48px] flex items-center justify-between shadow-huge relative overflow-hidden group">
                     {/* Floating Glow */}
                     <div className="absolute -top-10 -right-10 size-32 bg-primary/20 blur-[60px] rounded-full animate-float"></div>
                     <div className="relative z-10 space-y-2">
                        <p className="text-[10px] font-black uppercase text-primary tracking-[0.4em] font-outfit">Anatomia do Olhar</p>
                        <p className="text-xl font-display italic text-white">Dossiê de Estética Personalizada</p>
                     </div>
                     <span className="material-symbols-outlined text-primary !text-5xl opacity-40 group-hover:scale-110 transition-transform duration-700">auto_awesome</span>
                  </div>

                  <div className="bg-surface-dark/40 border border-white/5 p-10 rounded-[48px] space-y-10 shadow-hugest relative overflow-hidden">
                     <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                        <div className="h-px w-8 bg-accent-gold/40"></div>
                        <h3 className="text-[10px] font-black uppercase text-accent-gold tracking-[0.4em] font-outfit">Configurações de Signature</h3>
                     </div>
                     <div className="grid grid-cols-1 gap-8">
                        {[
                           { label: 'Map de Olhos', val: preferences.eyeShape || '-', icon: 'visibility' },
                           { label: 'Signature Style', val: preferences.lashStyle || '-', icon: 'magic_button' },
                           { label: 'Ritual de Curvatura', val: preferences.curvature || '-', icon: 'gesture' },
                           { label: 'Extensão de Fio', val: preferences.length || '-', icon: 'straighten' },
                           { label: 'Densidade (Espessura)', val: preferences.thickness || '-', icon: 'line_weight' },
                           { label: 'Cromia (Pigmento)', val: preferences.pigment || '-', icon: 'palette' }
                        ].map((item, i) => (
                           <div key={i} className="flex justify-between items-center group/item hover:translate-x-1 transition-transform duration-500">
                              <div className="flex items-center gap-5">
                                 <div className="size-10 rounded-2xl bg-white/2 border border-white/5 flex items-center justify-center text-white/20 group-hover/item:text-accent-gold group-hover/item:bg-accent-gold/5 transition-all">
                                    <span className="material-symbols-outlined !text-xl">{item.icon}</span>
                                 </div>
                                 <span className="text-[10px] uppercase font-black text-white/20 tracking-[0.3em] font-outfit group-hover/item:text-white/40 transition-colors">{item.label}</span>
                              </div>
                              <span className="text-sm font-display italic text-white group-hover/item:text-accent-gold transition-colors">{item.val}</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="bg-surface-dark/40 border border-white/5 p-10 rounded-[48px] space-y-10 shadow-hugest">
                     <div className="flex items-center gap-4 border-b border-white/5 pb-6 text-primary">
                        <span className="material-symbols-outlined !text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>hotel_class</span>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] font-outfit">Capa de Hospitalidade</h3>
                     </div>
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="flex items-center gap-5 bg-white/2 p-6 rounded-[32px] border border-white/5 group hover:border-primary/20 transition-all">
                           <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <span className="material-symbols-outlined !text-2xl">coffee</span>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.22em] font-outfit">Bebida Signature</p>
                              <p className="text-base font-display italic text-white">{preferences.drink || 'Não solicitada'}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-5 bg-white/2 p-6 rounded-[32px] border border-white/5 group hover:border-primary/20 transition-all">
                           <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <span className="material-symbols-outlined !text-2xl">music_note</span>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.22em] font-outfit">Sinfonia Preferida</p>
                              <p className="text-base font-display italic text-white">{preferences.music || 'Ambiente'}</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-surface-dark/40 border border-white/5 p-10 rounded-[48px] space-y-8 shadow-hugest">
                     <div className="flex items-center gap-4 border-b border-white/5 pb-6 text-rose-500">
                        <span className="material-symbols-outlined !text-xl">medical_services</span>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] font-outfit">Protocolo de Segurança</h3>
                     </div>
                     <div className="space-y-8">
                        <div className="space-y-3">
                           <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em] font-outfit pl-2">Ritual de Manutenção</p>
                           <div className="bg-white/2 p-6 rounded-3xl border border-white/5">
                              <p className="text-sm font-outfit font-bold text-white">{preferences.maintenance || 'Padrão JZ Privé'}</p>
                           </div>
                        </div>
                        <div className="space-y-3">
                           <div className="flex items-center gap-3 pl-2">
                              <div className="size-1.5 rounded-full bg-rose-500 animate-pulse"></div>
                              <p className="text-[9px] font-black text-rose-500/60 uppercase tracking-[0.3em] font-outfit">Observações Clínicas / Alergias</p>
                           </div>
                           <div className="bg-rose-500/5 p-8 rounded-[36px] border border-rose-500/10 shadow-inner">
                              <p className="text-sm text-white/40 italic leading-relaxed font-light">
                                 {preferences.allergies || 'Nenhuma restrição clínica identificada no dossier.'}
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'POINTS' && (
               <div className="space-y-8 animate-reveal">
                  <div className="bg-accent-gold p-12 rounded-[56px] text-primary flex items-baseline justify-between shadow-hugest relative overflow-hidden group">
                     {/* Cinematic Reflections */}
                     <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
                     <div className="absolute top-[-20%] right-[-10%] size-64 bg-white/20 blur-[60px] rounded-full animate-float"></div>

                     <div className="space-y-4 relative z-10">
                        <div className="flex items-center gap-3">
                           <div className="h-px w-6 bg-primary/20"></div>
                           <p className="text-[10px] font-black uppercase tracking-[0.4em] font-outfit opacity-40">Saldo JZ Privé Club</p>
                        </div>
                        <div className="flex items-baseline gap-2">
                           <h3 className="text-7xl font-display font-medium leading-none tracking-tighter tabular-nums">{clientData.lash_points || 0}</h3>
                           <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Credits</span>
                        </div>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/5">
                           <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                           <p className="text-[8px] font-black uppercase tracking-[0.2em]">Excellence Status Ativo</p>
                        </div>
                     </div>
                     <span className="material-symbols-outlined !text-[120px] opacity-10 absolute -right-4 -bottom-4 rotate-12 group-hover:rotate-0 transition-transform duration-1000">stars</span>
                  </div>

                  <div className="bg-surface-dark/40 border border-white/5 rounded-[56px] overflow-hidden shadow-hugest">
                     <div className="p-10 border-b border-white/5 flex items-center justify-between">
                        <div className="space-y-1">
                           <h3 className="text-base font-outfit font-bold text-white">Journal de Transações</h3>
                           <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Fluxo de Fidelidade</p>
                        </div>
                        <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/20">
                           <span className="material-symbols-outlined">analytics</span>
                        </div>
                     </div>
                     <div className="divide-y divide-white/2">
                        {pointsHistory.length > 0 ? pointsHistory.map((p, idx) => (
                           <div key={p.id} className="p-8 flex justify-between items-center group/tx hover:bg-white/2 transition-all duration-500 animate-reveal" style={{ animationDelay: `${idx * 0.05}s` }}>
                              <div className="flex items-center gap-6">
                                 <div className={`size-14 rounded-[22px] flex items-center justify-center transition-all duration-700 shadow-lg ${p.amount > 0 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10' : 'bg-rose-500/10 text-rose-500 border border-rose-500/10'}`}>
                                    <span className="material-symbols-outlined !text-2xl group-hover/tx:scale-110 transition-transform">
                                       {p.amount > 0 ? 'add_circle' : 'remove_circle'}
                                    </span>
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-sm font-outfit font-bold text-white group-hover/tx:text-accent-gold transition-colors">{p.description}</p>
                                    <div className="flex items-center gap-3">
                                       <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">{!isNaN(new Date(p.created_at).getTime()) ? new Date(p.created_at).toLocaleDateString('pt-BR') : '-'} • {p.source || 'Sistema'}</p>
                                    </div>
                                 </div>
                              </div>
                              <p className={`text-xl font-display italic ${p.amount > 0 ? 'text-emerald-500' : 'text-rose-500'} group-hover/tx:scale-110 transition-transform`}>{p.amount > 0 ? `+${p.amount}` : p.amount}</p>
                           </div>
                        )) : (
                           <div className="py-24 text-center opacity-10 space-y-6">
                              <span className="material-symbols-outlined !text-6xl">receipt_long</span>
                              <p className="font-display italic text-xl">Nenhuma movimentação no journal.</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'HISTORY' && (
               <div className="space-y-6 animate-reveal">
                  {appointments.length > 0 ? appointments.map((h, i) => (
                     <div key={i} className="group bg-surface-dark/40 p-8 rounded-[48px] border border-white/5 space-y-6 relative overflow-hidden shadow-hugest animate-reveal hover:border-accent-gold/20 transition-all duration-700" style={{ animationDelay: `${i * 0.05}s` }}>
                        <div className="flex justify-between items-start relative z-10">
                           <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                 <div className="size-2 rounded-full bg-accent-gold animate-pulse"></div>
                                 <p className="text-[10px] font-black uppercase text-accent-gold tracking-[0.3em] font-outfit">
                                    {!isNaN(new Date(h.date).getTime()) ? new Date(h.date + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                                 </p>
                              </div>
                              <h4 className="font-display italic text-2xl text-white group-hover:text-accent-gold transition-colors">{h.service_name || 'Procedimento Signature'}</h4>
                              <div className="flex items-center gap-3">
                                 <div className="h-px w-4 bg-white/10"></div>
                                 <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em] italic">by {h.professional_name || 'Expert Artist'}</p>
                              </div>
                           </div>
                           <div className={`px-4 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-[0.3em] ${h.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : (h.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-primary/10 text-primary border-primary/20')}`}>
                              {h.status || 'Orquestrado'}
                           </div>
                        </div>
                        {h.notes && (
                           <div className="bg-white/2 p-6 rounded-[32px] border border-white/5 relative z-10 group-hover:bg-white/5 transition-colors">
                              <span className="material-symbols-outlined absolute top-4 right-4 text-white/5 !text-4xl select-none">format_quote</span>
                              <p className="text-sm text-white/40 italic font-light font-outfit leading-relaxed">"{h.notes}"</p>
                           </div>
                        )}
                        {/* Background Decoration */}
                        <div className="absolute -bottom-10 -right-10 size-32 bg-accent-gold/5 blur-[40px] rounded-full group-hover:bg-accent-gold/10 transition-all duration-1000"></div>
                     </div>
                  )) : (
                     <div className="py-24 text-center opacity-10 border-2 border-dashed border-white/5 rounded-[56px] space-y-8">
                        <span className="material-symbols-outlined !text-7xl">event_upcoming</span>
                        <p className="font-display italic text-xl">Membro sem jornadas realizadas.</p>
                     </div>
                  )}
               </div>
            )}
         </main>

         {/* Delete Confirmation Modal */}
         {showDeleteConfirm && (
            <div className="fixed inset-0 z-[1000] bg-background-dark/98 backdrop-blur-3xl flex items-center justify-center p-10 animate-fade-in shadow-hugest">
               <div className="bg-surface-dark w-full max-w-[360px] rounded-[56px] p-12 border border-white/10 text-center space-y-10 animate-reveal shadow-hugest relative overflow-hidden">
                  <div className="absolute inset-0 bg-rose-500/5 opacity-40"></div>

                  <div className="relative size-24 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mx-auto shadow-2xl shadow-rose-500/20 ring-4 ring-rose-500/5">
                     <span className="material-symbols-outlined !text-[44px]">delete_forever</span>
                  </div>

                  <div className="space-y-4 relative z-10">
                     <h3 className="text-3xl font-display italic text-white tracking-tight">Expurgar Dossier?</h3>
                     <p className="text-sm font-outfit font-light text-white/30 leading-relaxed italic">Esta ação é irreversível. O dossiê de membro, journal de transações e histórico serão obliterados do core JZ Privé.</p>
                  </div>

                  <div className="flex flex-col gap-4 relative z-10">
                     <button
                        disabled={isDeleting}
                        onClick={handleDeleteClient}
                        className="group relative w-full h-18 bg-rose-600 text-white rounded-[28px] font-outfit font-black text-[10px] uppercase tracking-[0.4em] shadow-huge active:scale-95 transition-all overflow-hidden"
                     >
                        <div className="absolute inset-0 bg-black/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        <span className="relative z-10">{isDeleting ? 'Eliminando...' : 'Confirmar Expugo'}</span>
                     </button>
                     <button
                        disabled={isDeleting}
                        onClick={() => setShowDeleteConfirm(false)}
                        className="w-full h-18 bg-white/5 text-white/20 rounded-[28px] font-outfit font-black text-[10px] uppercase tracking-[0.4em] hover:bg-white/10 transition-all active:scale-95"
                     >
                        Preservar
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Visual Safe Area Inset */}
         <div className="fixed bottom-0 left-0 w-full h-8 bg-black pointer-events-none z-[130]"></div>
      </div>
   );
};

export default ClientDetailsAdmin;
