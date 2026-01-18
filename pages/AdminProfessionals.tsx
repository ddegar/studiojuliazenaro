
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Professional, UserRole } from '../types';
import { supabase } from '../services/supabase';
import AdminBottomNav from '../components/AdminBottomNav';

const AdminProfessionals: React.FC = () => {
   const navigate = useNavigate();
   const [pros, setPros] = useState<Professional[]>([]);
   const [showAdd, setShowAdd] = useState(false);
   const [loading, setLoading] = useState(true);
   const [isCreating, setIsCreating] = useState(false);

   const [newPro, setNewPro] = useState({
      name: '',
      role: '',
      email: '',
      phone: '',
      image_url: '',
      permissions: {
         canManageAgenda: true,
         canEditServices: false,
         canViewGlobalFinances: false,
         canCreateContent: false
      }
   });

   const fetchPros = async () => {
      setLoading(true);
      try {
         const { data } = await supabase.from('professionals').select('*').order('name');
         if (data) setPros(data);
      } catch (err) {
         console.error('Fetch pros error:', err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      const checkAuth = async () => {
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) return navigate('/login');

         const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
         if (profile?.role !== 'MASTER_ADMIN') {
            alert('Acesso negado. Apenas Master Admin pode gerenciar equipe.');
            navigate('/admin');
            return;
         }
         fetchPros();
      };
      checkAuth();
   }, []);

   const handleAddProfessional = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsCreating(true);

      try {
         const finalImageUrl = newPro.image_url || `https://ui-avatars.com/api/?name=${newPro.name}&background=random&color=fff`;

         const { data: proData, error: proError } = await supabase.from('professionals').insert({
            name: newPro.name,
            role: newPro.role,
            email: newPro.email,
            phone: newPro.phone,
            image_url: finalImageUrl,
            active: true,
            rating: 5.0,
            permissions: newPro.permissions // Store permissions in professionals table for sync
         }).select().single();

         if (proError) throw proError;

         alert('Profissional cadastrada! ✨\n\nAgora ela deve se cadastrar no aplicativo usando o e-mail: ' + newPro.email);
         setShowAdd(false);
         setNewPro({
            name: '', role: '', email: '', phone: '', image_url: '',
            permissions: { canManageAgenda: true, canEditServices: false, canViewGlobalFinances: false, canCreateContent: false }
         });
         fetchPros();
      } catch (err: any) {
         alert('Erro ao criar: ' + err.message);
      } finally {
         setIsCreating(false);
      }
   };

   const toggleProStatus = async (pro: Professional) => {
      const action = pro.active ? 'desativar' : 'ativar';
      if (!window.confirm(`Deseja ${action} esta profissional? O histórico de atendimentos e financeiro será preservado.`)) return;

      try {
         const { error } = await supabase
            .from('professionals')
            .update({ active: !pro.active })
            .eq('id', pro.id);

         if (error) throw error;
         fetchPros();
      } catch (err: any) {
         alert('Erro ao atualizar status: ' + err.message);
      }
   };

   return (
      <div className="flex flex-col h-full bg-background-dark text-white pb-32">
         <header className="p-6 border-b border-white/5 flex items-center justify-between glass-nav !bg-background-dark/80 sticky top-0 z-40">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate('/admin')} className="size-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors">
                  <span className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</span>
               </button>
               <div>
                  <h1 className="text-xl font-display font-bold">Gestão de Equipe</h1>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{pros.length} Profissionais</p>
               </div>
            </div>
            <button onClick={() => setShowAdd(true)} className="size-11 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/20 ring-4 ring-primary/5 active:scale-95 transition-transform">
               <span className="material-symbols-outlined">person_add</span>
            </button>
         </header>

         <main className="flex-1 p-6 space-y-4 overflow-y-auto no-scrollbar">
            {loading ? (
               <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                  <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold uppercase tracking-widest">Sincronizando equipe...</p>
               </div>
            ) : pros.length === 0 ? (
               <div className="text-center py-20 space-y-4 opacity-30">
                  <span className="material-symbols-outlined !text-6xl">group_off</span>
                  <p className="font-display italic text-lg">Nenhum talento cadastrado.</p>
               </div>
            ) : pros.map(pro => (
               <div
                  key={pro.id}
                  className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-5 transition-all hover:border-white/10 group relative"
               >
                  <div className="flex items-center gap-5" onClick={() => navigate(`/admin/professional/${pro.id}`)}>
                     <div className="size-16 rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg shadow-black/40">
                        <img src={pro.image_url || `https://ui-avatars.com/api/?name=${pro.name}&background=random`} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={pro.name} />
                     </div>
                     <div className="flex-1">
                        <h4 className="font-bold text-base text-white group-hover:text-accent-gold transition-colors">{pro.name}</h4>
                        <p className="text-[10px] text-accent-gold font-black uppercase tracking-[0.2em] mt-0.5">{pro.role}</p>
                     </div>
                     <div className={`px-3 py-1.5 rounded-full border-2 ${pro.active ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-gray-500/10 border-gray-500/20'}`}>
                        <span className={`text-[8px] font-black uppercase tracking-widest ${pro.active ? 'text-emerald-500' : 'text-gray-500'}`}>{pro.active ? 'ON' : 'OFF'}</span>
                     </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                     <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 opacity-40">
                           <span className="material-symbols-outlined !text-xs text-gray-400">mail</span>
                           <span className="text-[9px] font-medium lowercase tracking-tight">{pro.email || 'sem email'}</span>
                        </div>
                        <div className="flex gap-1 ml-4 border-l border-white/10 pl-4">
                           {(pro.permissions as any)?.canManageAgenda && <span title="Agenda" className="material-symbols-outlined !text-[12px] text-accent-gold">calendar_month</span>}
                           {(pro.permissions as any)?.canViewGlobalFinances && <span title="Master Finance" className="material-symbols-outlined !text-[12px] text-primary">payments</span>}
                           {(pro.permissions as any)?.canCreateContent && <span title="Conteúdo" className="material-symbols-outlined !text-[12px] text-blue-400">history_toggle_off</span>}
                        </div>
                     </div>
                     <button
                        onClick={(e) => { e.stopPropagation(); toggleProStatus(pro); }}
                        className={`transition-all p-2 rounded-full ${pro.active ? 'text-gray-500 hover:text-rose-500 hover:bg-rose-500/10' : 'text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                        title={pro.active ? 'Desativar Profissional' : 'Ativar Profissional'}
                     >
                        <span className="material-symbols-outlined !text-lg">{pro.active ? 'person_off' : 'person_check'}</span>
                     </button>
                  </div>
               </div>
            ))}
         </main>

         {showAdd && (
            <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 backdrop-blur-xl animate-fade-in overflow-y-auto">
               <div className="absolute inset-0" onClick={() => setShowAdd(false)}></div>
               <form onSubmit={handleAddProfessional} className="bg-card-dark w-full max-w-md rounded-[48px] p-8 border border-white/10 space-y-8 animate-slide-up relative z-10 shadow-2xl my-10 max-h-[90vh] overflow-y-auto no-scrollbar">
                  <div className="flex justify-between items-center">
                     <div>
                        <h2 className="text-2xl font-display font-bold">Novo Talento</h2>
                        <p className="text-[10px] text-accent-gold uppercase font-black tracking-widest mt-1">Sincronização de Conta Oficial</p>
                     </div>
                     <button type="button" onClick={() => setShowAdd(false)} className="size-10 flex items-center justify-center rounded-full bg-white/5 text-gray-500">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest pl-1">Nome Completo</label>
                        <input required placeholder="Ex: Julia Zenaro" className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold focus:ring-primary outline-none" value={newPro.name} onChange={e => setNewPro({ ...newPro, name: e.target.value })} />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest pl-1">E-mail</label>
                           <input type="email" required placeholder="julia@studio.com" className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm focus:ring-primary outline-none" value={newPro.email} onChange={e => setNewPro({ ...newPro, email: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest pl-1">Telefone</label>
                           <input required placeholder="(11) 99999-9999" className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm focus:ring-primary outline-none" value={newPro.phone} onChange={e => setNewPro({ ...newPro, phone: e.target.value })} />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest pl-1">Especialidade / Cargo</label>
                        <input required placeholder="Ex: Specialist Lash Artist" className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm focus:ring-primary outline-none italic text-accent-gold" value={newPro.role} onChange={e => setNewPro({ ...newPro, role: e.target.value })} />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest pl-1">URL da Foto (Opcional)</label>
                        <input placeholder="https://..." className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-xs focus:ring-primary outline-none opacity-60" value={newPro.image_url} onChange={e => setNewPro({ ...newPro, image_url: e.target.value })} />
                     </div>

                     <div className="space-y-4 pt-4">
                        <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Permissões Iniciais</h3>
                        <div className="grid grid-cols-1 gap-3">
                           {[
                              { key: 'canManageAgenda', label: 'Gerenciar Agenda', desc: 'Confirmar/Reagendar atendimentos' },
                              { key: 'canEditServices', label: 'Editar Catálogo', desc: 'Alterar preços e serviços' },
                              { key: 'canViewGlobalFinances', label: 'Financeiro Global', desc: 'Ver faturamento total (SENSÍVEL)' },
                              { key: 'canCreateContent', label: 'Publicar Conteúdo', desc: 'Posts e Stories no app' }
                           ].map(perm => (
                              <button
                                 key={perm.key}
                                 type="button"
                                 onClick={() => setNewPro({
                                    ...newPro,
                                    permissions: { ...newPro.permissions, [perm.key]: !newPro.permissions[perm.key as keyof typeof newPro.permissions] }
                                 })}
                                 className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${newPro.permissions[perm.key as keyof typeof newPro.permissions] ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}
                              >
                                 <div className="text-left">
                                    <p className="text-xs font-bold">{perm.label}</p>
                                    <p className="text-[8px] uppercase font-bold opacity-60">{perm.desc}</p>
                                 </div>
                                 <span className="material-symbols-outlined !text-lg">{newPro.permissions[perm.key as keyof typeof newPro.permissions] ? 'check_box' : 'check_box_outline_blank'}</span>
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>

                  <button disabled={isCreating} type="submit" className="w-full h-18 bg-primary text-white rounded-[24px] font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl shadow-primary/30 active:scale-95 transition-all disabled:opacity-50">
                     {isCreating ? <div className="size-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'FINALIZAR CADASTRO ✨'}
                  </button>
               </form>
            </div>
         )}
         <AdminBottomNav />
      </div>
   );
};

export default AdminProfessionals;
