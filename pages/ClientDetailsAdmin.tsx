
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
      <div className="flex flex-col h-full bg-background-dark text-white">
         <header className="sticky top-0 z-50 glass-nav !bg-background-dark/90 p-4 border-b border-white/5 flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <button onClick={() => navigate(-1)} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
               <div className="text-center">
                  <h2 className="font-bold text-base leading-tight">{clientData.name}</h2>
                  <p className="text-[10px] text-accent-gold font-black uppercase tracking-widest">{loyaltyLevel}</p>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => setShowDeleteConfirm(true)} className="material-symbols-outlined text-rose-500/50 hover:text-rose-500 transition-colors">delete</button>
                  <button onClick={() => setIsEditing(!isEditing)} className={`material-symbols-outlined ${isEditing ? 'text-primary' : 'text-accent-gold'}`}>
                     {isEditing ? 'close' : 'edit_note'}
                  </button>
               </div>
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
                  {isEditing ? (
                     <div className="bg-card-dark p-8 rounded-[40px] border border-white/10 space-y-6 animate-slide-up">
                        <h3 className="text-xl font-display font-bold text-white">Editar Informações</h3>
                        <div className="space-y-4">
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Nome Completo</label>
                              <input className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 text-sm text-white focus:border-primary outline-none" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">E-mail</label>
                                 <input className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 text-sm text-white focus:border-primary outline-none" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Celular</label>
                                 <input className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 text-sm text-white focus:border-primary outline-none" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                              </div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">CPF</label>
                                 <input className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 text-sm text-white focus:border-primary outline-none" value={editForm.cpf} onChange={e => setEditForm({ ...editForm, cpf: e.target.value })} />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Data de Nascimento</label>
                                 <input type="date" className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 text-sm text-white focus:border-primary outline-none" value={editForm.birthdate} onChange={e => setEditForm({ ...editForm, birthdate: e.target.value })} />
                              </div>
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Indicação</label>
                              <input className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 text-sm text-white focus:border-primary outline-none" value={editForm.referred_by} onChange={e => setEditForm({ ...editForm, referred_by: e.target.value })} />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">URL da Foto</label>
                              <input className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 text-sm text-white focus:border-primary outline-none" value={editForm.profile_pic} onChange={e => setEditForm({ ...editForm, profile_pic: e.target.value })} />
                           </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                           <button disabled={isSaving} onClick={() => setIsEditing(false)} className="flex-1 h-14 bg-white/5 text-gray-500 rounded-2xl font-bold text-[10px] uppercase tracking-widest">Cancelar</button>
                           <button disabled={isSaving} onClick={handleSave} className="flex-[2] h-14 bg-primary text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
                              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                           </button>
                        </div>
                     </div>
                  ) : (
                     <>
                        <div className="flex flex-col items-center py-6 bg-white/5 rounded-[40px] border border-white/5 space-y-4">
                           <div className="size-24 rounded-full border-2 border-accent-gold p-1 shadow-2xl overflow-hidden">
                              <img src={clientData.profile_pic || `https://ui-avatars.com/api/?name=${clientData.name}&background=random`} className="w-full h-full rounded-full object-cover" alt="Client" />
                           </div>
                           <div className="text-center space-y-1">
                              <h1 className="text-2xl font-bold tracking-tight">{clientData.name}</h1>
                              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Membro desde {(!isNaN(new Date(clientData.created_at).getTime())) ? new Date(clientData.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '-'}</p>
                           </div>
                        </div>
                        <div className="bg-card-dark p-8 rounded-[40px] border border-white/5 space-y-8">
                           <div className="space-y-1">
                              <p className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Contato Direto</p>
                              <p className="text-sm font-bold text-accent-gold">{clientData.phone || '(Não informado)'}</p>
                              <p className="text-sm font-bold text-gray-300">{clientData.email}</p>
                              {clientData.cpf && <p className="text-xs text-gray-500 mt-2 font-mono">CPF: {clientData.cpf}</p>}
                           </div>
                           <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5">
                              <div className="space-y-1">
                                 <p className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Nascimento</p>
                                 <p className="text-sm font-bold">{(clientData.birthdate && !isNaN(new Date(clientData.birthdate).getTime())) ? new Date(clientData.birthdate + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</p>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[10px] uppercase font-black text-gray-600 tracking-widest">Indicação</p>
                                 <p className="text-sm font-bold text-primary">{clientData.referred_by || 'Direto'}</p>
                              </div>
                           </div>
                        </div>
                     </>
                  )}
               </div>
            )}

            {activeTab === 'AESTHETIC' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="bg-primary/20 border border-primary/20 p-6 rounded-[32px] flex items-center justify-between">
                     <div>
                        <p className="text-[9px] font-black uppercase text-primary tracking-[0.2em]">Perfil Técnico do Olhar</p>
                        <p className="text-sm font-bold">Baseado em preferências reais</p>
                     </div>
                     <span className="material-symbols-outlined text-primary !text-4xl">auto_awesome</span>
                  </div>

                  <div className="bg-card-dark p-8 rounded-[40px] border border-white/5 space-y-6">
                     <h3 className="text-xs font-black uppercase tracking-widest text-accent-gold border-b border-white/5 pb-4">Parâmetros de Aplicação</h3>
                     <div className="grid grid-cols-1 gap-6">
                        {[
                           { label: 'Olhos', val: preferences.eyeShape || '-', icon: 'visibility' },
                           { label: 'Estilo', val: preferences.lashStyle || '-', icon: 'magic_button' },
                           { label: 'Curvatura', val: preferences.curvature || '-', icon: 'gesture' },
                           { label: 'Comprimento', val: preferences.length || '-', icon: 'straighten' },
                           { label: 'Espessura', val: preferences.thickness || '-', icon: 'line_weight' },
                           { label: 'Pigmentação', val: preferences.pigment || '-', icon: 'palette' }
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
                              <p className="text-sm font-bold text-white">{preferences.drink || '-'}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                           <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                              <span className="material-symbols-outlined">music_note</span>
                           </div>
                           <div>
                              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Gênero Musical</p>
                              <p className="text-sm font-bold text-white">{preferences.music || '-'}</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-card-dark p-8 rounded-[40px] border border-white/5 space-y-6">
                     <h3 className="text-xs font-black uppercase tracking-widest text-rose-500 border-b border-white/5 pb-4">Saúde e Ciclo</h3>
                     <div className="space-y-5">
                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Manutenção Ideal</p>
                           <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                              <p className="text-sm font-bold">{preferences.maintenance || 'Não definida'}</p>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                              <span className="material-symbols-outlined !text-sm">warning</span> Alergias / Observações
                           </p>
                           <div className="bg-rose-500/5 p-5 rounded-2xl border border-rose-500/10">
                              <p className="text-xs text-gray-400 italic leading-relaxed">
                                 {preferences.allergies || 'Nenhuma observação informada pela cliente.'}
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
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Saldo de Zenaro Credits</p>
                        <h3 className="text-5xl font-display font-bold">{clientData.lash_points || 0}</h3>
                        <p className="text-[9px] font-black uppercase mt-1">Pontos Ativos ✨</p>
                     </div>
                     <span className="material-symbols-outlined !text-7xl opacity-30 absolute -right-2 -bottom-2">stars</span>
                  </div>

                  <div className="bg-card-dark rounded-[40px] border border-white/5 overflow-hidden">
                     <p className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 border-b border-white/5">Histórico de Transações</p>
                     <div className="divide-y divide-white/5">
                        {pointsHistory.length > 0 ? pointsHistory.map((p) => (
                           <div key={p.id} className="p-6 flex justify-between items-center group">
                              <div className="flex items-center gap-4">
                                 <div className={`size-11 rounded-2xl flex items-center justify-center transition-colors ${p.amount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                    <span className="material-symbols-outlined !text-xl">
                                       {p.amount > 0 ? 'add_circle' : 'remove_circle'}
                                    </span>
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold text-white group-hover:text-accent-gold transition-colors">{p.description}</p>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{!isNaN(new Date(p.created_at).getTime()) ? new Date(p.created_at).toLocaleDateString('pt-BR') : '-'} • {p.source || 'Sistema'}</p>
                                 </div>
                              </div>
                              <p className={`text-base font-black ${p.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{p.amount > 0 ? `+${p.amount}` : p.amount}</p>
                           </div>
                        )) : (
                           <p className="p-10 text-center text-gray-500 italic text-xs">Nenhuma transação encontrada.</p>
                        )}
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'HISTORY' && (
               <div className="space-y-4 animate-fade-in">
                  {appointments.length > 0 ? appointments.map((h, i) => (
                     <div key={i} className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-4 relative overflow-hidden group">
                        <div className="flex justify-between items-start">
                           <div className="space-y-1">
                              <p className="text-[9px] font-black uppercase text-primary tracking-widest">
                                 {!isNaN(new Date(h.date).getTime()) ? new Date(h.date + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                              </p>
                              <h4 className="font-bold text-base">{h.service_name || 'Procedimento'}</h4>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">com {h.professional_name || 'Especialista'}</p>
                           </div>
                           <span className={`text-[8px] font-black px-2 py-1 rounded uppercase ${h.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : (h.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary')}`}>
                              {h.status || 'Pendente'}
                           </span>
                        </div>
                        {h.notes && (
                           <div className="bg-white/5 p-4 rounded-2xl">
                              <p className="text-xs text-gray-400 italic">"{h.notes}"</p>
                           </div>
                        )}
                     </div>
                  )) : (
                     <div className="py-20 text-center opacity-30 border-2 border-dashed border-white/5 rounded-[40px]">
                        <span className="material-symbols-outlined !text-6xl">calendar_today</span>
                        <p className="mt-4 font-bold text-sm">Nenhum atendimento realizado.</p>
                     </div>
                  )}
               </div>
            )}
         </main>

         {/* Delete Confirmation Modal */}
         {showDeleteConfirm && (
            <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
               <div className="bg-card-dark w-full max-w-sm rounded-[48px] p-10 border border-white/10 text-center space-y-8 animate-scale-in">
                  <div className="size-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mx-auto shadow-2xl shadow-rose-500/20">
                     <span className="material-symbols-outlined !text-4xl">delete_forever</span>
                  </div>
                  <div className="space-y-3">
                     <h3 className="text-2xl font-display font-bold">Excluir definitamente?</h3>
                     <p className="text-xs text-gray-500 leading-relaxed font-medium">Esta ação não pode ser desfeita. O cadastro, histórico e pontos serão apagados do banco de dados.</p>
                  </div>
                  <div className="flex flex-col gap-3">
                     <button disabled={isDeleting} onClick={handleDeleteClient} className="w-full h-15 bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-500/30">
                        {isDeleting ? 'Excluindo...' : 'SIM, EXCLUIR DEFINITIVAMENTE'}
                     </button>
                     <button disabled={isDeleting} onClick={() => setShowDeleteConfirm(false)} className="w-full h-15 bg-white/5 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">CANCELAR</button>
                  </div>
               </div>
            </div>
         )}


      </div>
   );
};

export default ClientDetailsAdmin;
