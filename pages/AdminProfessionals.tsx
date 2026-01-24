
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
            alert('Acesso restrito ao Master Admin.');
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
         const DEFAULT_PASSWORD = 'Julia@Studio2026';
         const finalImageUrl = newPro.image_url || `https://ui-avatars.com/api/?name=${newPro.name}&background=0f3e29&color=C9A961`;

         const { data: proRecord, error: proError } = await supabase.from('professionals').insert({
            name: newPro.name,
            role: newPro.role,
            email: newPro.email,
            phone: newPro.phone,
            image_url: finalImageUrl,
            active: true,
            rating: 5.0,
            permissions: newPro.permissions
         }).select().single();

         if (proError) throw proError;

         const { error: functionError } = await supabase.functions.invoke('create-professional', {
            body: {
               email: newPro.email,
               password: DEFAULT_PASSWORD,
               name: newPro.name,
               role: 'PROFESSIONAL_ADMIN',
               professionalId: proRecord.id
            }
         });

         if (functionError) throw functionError;

         fetchPros();
         setShowAdd(false);
         setNewPro({
            name: '', role: '', email: '', phone: '', image_url: '',
            permissions: { canManageAgenda: true, canEditServices: false, canViewGlobalFinances: false, canCreateContent: false }
         });
      } catch (err: any) {
         alert('Erro ao criar: ' + err.message);
      } finally {
         setIsCreating(false);
      }
   };

   const toggleProStatus = async (pro: Professional) => {
      if (!window.confirm(`Alterar status de disponibilidade de ${pro.name}?`)) return;
      try {
         const { error } = await supabase.from('professionals').update({ active: !pro.active }).eq('id', pro.id);
         if (error) throw error;
         fetchPros();
      } catch (err: any) {
         alert('Erro: ' + err.message);
      }
   };

   if (loading && pros.length === 0) {
      return (
         <div className="flex h-screen items-center justify-center bg-background-dark font-outfit">
            <div className="relative size-16 flex items-center justify-center">
               <div className="absolute inset-0 border-2 border-primary/5 rounded-full"></div>
               <div className="absolute inset-0 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
               <span className="material-symbols-outlined text-accent-gold scale-75">groups</span>
            </div>
         </div>
      );
   }

   return (
      <div className="flex flex-col min-h-screen bg-background-dark text-white font-outfit antialiased selection:bg-accent-gold/20 selection:text-white">
         <header className="relative z-[60] premium-blur-dark sticky top-0 px-8 py-10 flex flex-col gap-6 border-b border-white/5 bg-background-dark/80 backdrop-blur-xl">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <button
                     onClick={() => navigate('/admin')}
                     className="size-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-accent-gold group active:scale-95 transition-all"
                  >
                     <span className="material-symbols-outlined !text-xl group-hover:-translate-x-1 transition-transform">west</span>
                  </button>
                  <div className="space-y-1">
                     <p className="text-[8px] font-black uppercase tracking-[0.5em] text-accent-gold/40 leading-none">Equipe Studio</p>
                     <h1 className="font-display italic text-2xl text-white">Curadoria de Talentos</h1>
                  </div>
               </div>

               <button
                  onClick={() => setShowAdd(true)}
                  className="size-12 rounded-2xl bg-accent-gold flex items-center justify-center text-primary shadow-huge active:scale-90 transition-all"
               >
                  <span className="material-symbols-outlined">person_add</span>
               </button>
            </div>
         </header>

         <main className="relative z-10 p-8 lg:p-12 space-y-10 pb-48 w-full max-w-screen-xl mx-auto overflow-x-hidden">
            <div className="flex items-center justify-between group">
               <div className="space-y-1">
                  <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/40">Especialistas Ativas</h2>
                  <p className="text-[10px] text-accent-gold/40 font-black uppercase tracking-[0.2em]">{pros.length} Talentos no Ecossistema</p>
               </div>
               <div className="size-12 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center text-white/20 group-hover:text-accent-gold transition-colors">
                  <span className="material-symbols-outlined">stars</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 animate-reveal">
               {pros.map(pro => (
                  <div
                     key={pro.id}
                     className="relative group bg-surface-dark/40 border border-white/5 rounded-[40px] p-8 flex flex-col gap-8 hover:border-accent-gold/20 hover:bg-surface-dark transition-all duration-700 overflow-hidden shadow-huge"
                  >
                     <div className="flex justify-between items-start relative z-10">
                        <div className="flex items-center gap-6" onClick={() => navigate(`/admin/professional/${pro.id}`)}>
                           <div className="size-20 rounded-[28px] overflow-hidden border border-white/10 shadow-hugest group-hover:scale-105 transition-transform duration-700">
                              <img src={pro.image_url || `https://ui-avatars.com/api/?name=${pro.name}&background=0f3e29&color=C9A961`} className="w-full h-full object-cover" alt="" />
                           </div>
                           <div className="space-y-1">
                              <h4 className="font-bold text-base text-white group-hover:text-accent-gold transition-colors">{pro.name}</h4>
                              <p className="text-[9px] text-accent-gold font-black uppercase tracking-[0.2em]">{pro.role}</p>
                           </div>
                        </div>
                        <button
                           onClick={() => toggleProStatus(pro)}
                           className={`size-10 rounded-2xl flex items-center justify-center transition-all ${pro.active ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white' : 'bg-white/5 text-white/20 hover:bg-white hover:text-primary'}`}
                        >
                           <span className="material-symbols-outlined !text-lg">{pro.active ? 'person_check' : 'person_off'}</span>
                        </button>
                     </div>

                     <div className="pt-6 border-t border-white/5 flex justify-between items-center relative z-10">
                        <div className="flex gap-2">
                           {(pro.permissions as any)?.canManageAgenda && <div className="size-8 rounded-xl bg-white/5 flex items-center justify-center text-accent-gold/40" title="Agenda Accessible"><span className="material-symbols-outlined !text-sm">calendar_month</span></div>}
                           {(pro.permissions as any)?.canViewGlobalFinances && <div className="size-8 rounded-xl bg-white/5 flex items-center justify-center text-primary/40" title="Finance Privileges"><span className="material-symbols-outlined !text-sm">payments</span></div>}
                           {(pro.permissions as any)?.canCreateContent && <div className="size-8 rounded-xl bg-white/5 flex items-center justify-center text-blue-400/40" title="Content Creator"><span className="material-symbols-outlined !text-sm">draw</span></div>}
                        </div>
                        <button onClick={() => navigate(`/admin/professional/${pro.id}`)} className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white transition-colors flex items-center gap-2 group/btn">
                           Profile Detail
                           <span className="material-symbols-outlined !text-sm group-hover/btn:translate-x-1 transition-transform">east</span>
                        </button>
                     </div>

                     {/* Background Ornament */}
                     <div className="absolute -top-12 -right-12 size-32 bg-accent-gold/5 blur-3xl rounded-full group-hover:bg-accent-gold/10 transition-all duration-700"></div>
                  </div>
               ))}
            </div>
         </main>

         {showAdd && (
            <div className="fixed inset-0 z-[100] bg-background-dark/95 flex items-end justify-center backdrop-blur-2xl animate-fade-in overflow-hidden">
               <div className="fixed inset-0" onClick={() => setShowAdd(false)}></div>
               <form onSubmit={handleAddProfessional} className="bg-surface-dark w-full max-w-screen-md rounded-t-[64px] p-12 space-y-10 animate-slide-up border-t border-white/10 max-h-[92vh] overflow-y-auto no-scrollbar relative z-10 shadow-hugest">
                  <div className="flex justify-between items-center px-4">
                     <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none">Enrollment</p>
                        <h2 className="text-3xl font-display italic text-white italic">Consignar Novo Talento</h2>
                     </div>
                     <button type="button" onClick={() => setShowAdd(false)} className="size-14 flex items-center justify-center rounded-3xl bg-white/5 border border-white/10 text-white/20 hover:text-white transition-all">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <div className="space-y-12">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] uppercase font-black text-white/30 tracking-[0.3em] pl-2">Identidade Profissional</label>
                           <input required placeholder="Nome Completo..." className="w-full h-18 bg-white/5 border border-white/5 rounded-[28px] px-8 text-base font-medium focus:border-accent-gold/60 outline-none transition-all shadow-huge" value={newPro.name} onChange={e => setNewPro({ ...newPro, name: e.target.value })} />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] uppercase font-black text-white/30 tracking-[0.3em] pl-2">Posição / Cargo</label>
                           <input required placeholder="Ex: Master Lash Artist" className="w-full h-18 bg-white/5 border border-white/5 rounded-[28px] px-8 text-sm font-black uppercase tracking-widest focus:border-accent-gold/60 outline-none transition-all text-accent-gold shadow-huge" value={newPro.role} onChange={e => setNewPro({ ...newPro, role: e.target.value })} />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] uppercase font-black text-white/30 tracking-[0.3em] pl-2">Sync de Comunicação (E-mail)</label>
                           <input type="email" required placeholder="talento@juliazenaro.com" className="w-full h-18 bg-white/5 border border-white/5 rounded-[28px] px-8 text-sm focus:border-accent-gold/60 outline-none transition-all shadow-huge italic text-white/40" value={newPro.email} onChange={e => setNewPro({ ...newPro, email: e.target.value })} />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] uppercase font-black text-white/30 tracking-[0.3em] pl-2">Conexão Mobile</label>
                           <input required placeholder="Telefone Corporativo..." className="w-full h-18 bg-white/5 border border-white/5 rounded-[28px] px-8 text-sm focus:border-accent-gold/60 outline-none transition-all shadow-huge" value={newPro.phone} onChange={e => setNewPro({ ...newPro, phone: e.target.value })} />
                        </div>
                     </div>

                     <div className="space-y-6 pt-4">
                        <div className="flex items-center gap-3">
                           <span className="w-6 h-px bg-accent-gold/40"></span>
                           <label className="text-[10px] uppercase font-black text-white/30 tracking-[0.3em]">Privilégios de Acesso</label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {[
                              { key: 'canManageAgenda', label: 'Maestria de Agenda', desc: 'Gestão de horários e reservas' },
                              { key: 'canEditServices', label: 'Curadoria de Portfólio', desc: 'Edição de catálogo e valores' },
                              { key: 'canViewGlobalFinances', label: 'Ecosssistema Financeiro', desc: 'Visão de faturamento global' },
                              { key: 'canCreateContent', label: 'Criação Criativa', desc: 'Publicação de Stories e Conteúdo' }
                           ].map(perm => (
                              <button
                                 key={perm.key}
                                 type="button"
                                 onClick={() => setNewPro({
                                    ...newPro,
                                    permissions: { ...newPro.permissions, [perm.key]: !newPro.permissions[perm.key as keyof typeof newPro.permissions] }
                                 })}
                                 className={`group/perm flex items-center justify-between p-6 rounded-[32px] border transition-all duration-500 ${newPro.permissions[perm.key as keyof typeof newPro.permissions] ? 'bg-accent-gold text-primary border-accent-gold shadow-huge scale-[1.02]' : 'bg-white/5 border-white/5 text-white/20 hover:bg-white/10'}`}
                              >
                                 <div className="text-left">
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em]">{perm.label}</p>
                                    <p className={`text-[8px] font-medium mt-1 leading-relaxed ${newPro.permissions[perm.key as keyof typeof newPro.permissions] ? 'text-primary/60' : 'text-white/10'}`}>{perm.desc}</p>
                                 </div>
                                 <div className={`size-8 rounded-xl flex items-center justify-center transition-all ${newPro.permissions[perm.key as keyof typeof newPro.permissions] ? 'bg-primary/10 text-primary' : 'bg-white/5 text-white/20 group-hover/perm:text-accent-gold'}`}>
                                    <span className="material-symbols-outlined !text-lg">{newPro.permissions[perm.key as keyof typeof newPro.permissions] ? 'verified' : 'radio_button_unchecked'}</span>
                                 </div>
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-4 pt-12">
                     <button type="button" onClick={() => setShowAdd(false)} className="flex-1 h-20 bg-white/5 border border-white/10 text-white/20 rounded-[32px] font-black uppercase tracking-[0.4em] text-[10px] active:scale-95 transition-all">Cancel</button>
                     <button
                        disabled={isCreating}
                        type="submit"
                        className="flex-[2] h-20 bg-accent-gold text-primary rounded-[32px] font-black uppercase tracking-[0.5em] text-[11px] shadow-hugest active:scale-95 transition-all disabled:opacity-50"
                     >
                        {isCreating ? <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : 'Confirmar Squad ✨'}
                     </button>
                  </div>
               </form>

               {/* Design Ornaments */}
               <div className="fixed top-0 left-0 w-[50vw] h-[50vh] bg-accent-gold/10 blur-[120px] pointer-events-none -z-0"></div>
               <div className="fixed bottom-0 right-0 w-[40vw] h-[40vh] bg-primary/20 blur-[120px] pointer-events-none -z-0 opacity-40"></div>
            </div>
         )}

         <div className="lg:hidden">
            <AdminBottomNav />
         </div>

         {/* Background Ornaments */}
         <div className="fixed top-0 right-0 w-[40vw] h-[40vh] bg-accent-gold/5 blur-[120px] pointer-events-none z-0"></div>
         <div className="fixed bottom-0 left-0 w-[40vw] h-[40vh] bg-primary/20 blur-[120px] pointer-events-none z-0 opacity-40"></div>
      </div>
   );
};

export default AdminProfessionals;
