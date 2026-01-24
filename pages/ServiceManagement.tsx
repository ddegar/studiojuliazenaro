
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Service, Professional, UserRole } from '../types';
import { supabase } from '../services/supabase';
import { uploadImage } from '../services/storage';
import AdminBottomNav from '../components/AdminBottomNav';

const ServiceManagement: React.FC = () => {
   const navigate = useNavigate();
   const [currentUser, setCurrentUser] = useState<{ role: UserRole, id: string } | null>(null);
   const [services, setServices] = useState<Service[]>([]);
   const [professionals, setProfessionals] = useState<Professional[]>([]);
   const [showModal, setShowModal] = useState(false);
   const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
   const [loading, setLoading] = useState(true);

   const isMaster = currentUser?.role === 'MASTER_ADMIN';

   useEffect(() => {
      const init = async () => {
         const { data: { user } } = await supabase.auth.getUser();
         if (user) {
            const { data: profile } = await supabase.from('profiles').select('id, role, permissions').eq('id', user.id).single();
            if (profile) {
               setCurrentUser({
                  role: profile.role as UserRole,
                  id: profile.id,
                  permissions: profile.permissions
               } as any);
            }
         }
         fetchData();
      };
      init();
   }, []);

   const fetchData = async () => {
      try {
         setLoading(true);
         const [prosRes, servsRes] = await Promise.all([
            supabase.from('professionals').select('*').eq('active', true),
            supabase.from('services').select('*').order('name')
         ]);

         if (prosRes.data) setProfessionals(prosRes.data);

         if (servsRes.data) {
            setServices(servsRes.data.map((s: any) => ({
               id: s.id,
               name: s.name,
               description: s.description,
               price: s.price,
               duration: s.duration,
               category: s.category,
               imageUrl: s.image_url,
               professionalIds: s.professional_ids || [],
               pointsReward: s.points_reward,
               active: s.active,
               isPopular: s.is_popular,
               carePremium: s.care_premium,
               biosafety: s.biosafety,
               features: s.features || []
            })));
         }
      } catch (e) {
         console.error('Data fetch error:', e);
      } finally {
         setLoading(false);
      }
   };

   const filteredServices = useMemo(() => {
      if (!currentUser) return [];
      if (isMaster) return services;

      // Professional visibility isolation
      return services.filter(s => Array.isArray(s.professionalIds) && s.professionalIds.includes(currentUser.id));
   }, [services, isMaster, currentUser]);

   const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingService?.name || !editingService?.price || !editingService?.professionalIds?.length) {
         alert('Preencha os campos obrigatórios e selecione as profissionais.');
         return;
      }

      try {
         const payload = {
            name: editingService.name,
            description: editingService.description,
            price: editingService.price,
            duration: editingService.duration,
            category: editingService.category || 'Procedimento',
            image_url: editingService.imageUrl || 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800',
            points_reward: editingService.pointsReward || 50,
            active: true,
            professional_ids: editingService.professionalIds,
            is_popular: editingService.isPopular || false,
            care_premium: editingService.carePremium,
            biosafety: editingService.biosafety,
            features: editingService.features || []
         };

         let error;
         if (editingService.id) {
            const { error: updateError } = await supabase.from('services').update(payload).eq('id', editingService.id);
            error = updateError;
         } else {
            const { error: insertError } = await supabase.from('services').insert(payload);
            error = insertError;
         }

         if (error) throw error;

         alert('Serviço salvo com sucesso! ✨');
         fetchData();
         setShowModal(false);
         setEditingService(null);

      } catch (e: any) {
         alert('Erro ao salvar: ' + e.message);
      }
   };

   const toggleProSelection = (proId: string) => {
      const current = editingService?.professionalIds || [];
      const updated = current.includes(proId) ? current.filter(id => id !== proId) : [...current, proId];
      setEditingService({ ...editingService, professionalIds: updated });
   };

   const handleDelete = async (serviceId: string) => {
      if (!window.confirm('Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.')) return;
      try {
         const { error } = await supabase.from('services').delete().eq('id', serviceId);
         if (error) throw error;
         alert('Serviço excluído com sucesso!');
         fetchData();
      } catch (e: any) {
         alert('Erro ao excluir: ' + e.message);
      }
   };

   if (!currentUser && loading) {
      return (
         <div className="flex h-screen items-center justify-center bg-background-dark">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
                     <p className="text-[8px] font-black uppercase tracking-[0.5em] text-accent-gold/40 leading-none">Inventário do Catálogo</p>
                     <h1 className="font-display italic text-2xl text-white">Curadoria de Serviços</h1>
                  </div>
               </div>

               {(isMaster || (currentUser as any)?.permissions?.canManageOwnServices) && (
                  <button
                     onClick={() => { setEditingService({ professionalIds: isMaster ? [] : [currentUser!.id], category: 'Procedimento', pointsReward: 50, features: [] }); setShowModal(true); }}
                     className="size-12 rounded-2xl bg-accent-gold flex items-center justify-center text-primary shadow-huge active:scale-90 transition-all font-black text-xs tracking-widest"
                  >
                     <span className="material-symbols-outlined">add</span>
                  </button>
               )}
            </div>
         </header>

         <main className="relative z-10 p-8 lg:p-12 space-y-10 pb-48 w-full max-w-screen-xl mx-auto overflow-x-hidden">
            <div className="flex items-center justify-between group">
               <div className="space-y-1">
                  <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white/40">Acervo Disponível</h2>
                  <p className="text-[10px] text-accent-gold/40 font-black uppercase tracking-[0.2em]">{filteredServices.length} Procedimentos Ativos</p>
               </div>
               <div className="size-12 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center text-white/20 group-hover:text-accent-gold transition-colors">
                  <span className="material-symbols-outlined">diamond</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 animate-reveal">
               {filteredServices.map(service => (
                  <div key={service.id} className="relative group bg-surface-dark/40 border border-white/5 rounded-[40px] p-8 space-y-8 hover:border-accent-gold/20 hover:bg-surface-dark transition-all duration-700 overflow-hidden">
                     <div className="flex justify-between items-start relative z-10">
                        <div className="flex items-center gap-6">
                           <div className="size-24 rounded-[32px] overflow-hidden border border-white/10 shadow-hugest group-hover:scale-105 transition-transform duration-700">
                              <img src={service.imageUrl || 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400'} className="w-full h-full object-cover" alt="" />
                           </div>
                           <div className="space-y-2">
                              <h3 className="text-lg font-display italic text-white group-hover:text-accent-gold transition-colors">{service.name}</h3>
                              <div className="flex gap-2">
                                 <span className="bg-white/5 text-white/40 text-[7px] font-black px-3 py-1 rounded-full uppercase border border-white/5 tracking-widest">{service.category}</span>
                              </div>
                           </div>
                        </div>

                        <div className="flex flex-col gap-2">
                           <button
                              onClick={() => { setEditingService(service); setShowModal(true); }}
                              className="size-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:bg-white hover:text-primary transition-all active:scale-95"
                           >
                              <span className="material-symbols-outlined !text-lg">edit</span>
                           </button>
                           {isMaster && (
                              <button
                                 onClick={() => handleDelete(service.id)}
                                 className="size-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                              >
                                 <span className="material-symbols-outlined !text-lg">delete</span>
                              </button>
                           )}
                        </div>
                     </div>

                     <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5 relative z-10">
                        <div className="text-center group/metric">
                           <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1 group-hover/metric:text-accent-gold transition-colors">Elite Value</p>
                           <p className="text-sm font-black text-emerald-400 tabular-nums">R$ {service.price}</p>
                        </div>
                        <div className="text-center group/metric border-x border-white/5 px-2">
                           <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1 group-hover/metric:text-accent-gold transition-colors">Session</p>
                           <p className="text-sm font-black text-white/60 tabular-nums">{service.duration}m</p>
                        </div>
                        <div className="text-center group/metric">
                           <p className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1 group-hover/metric:text-accent-gold transition-colors">Staff</p>
                           <p className="text-sm font-black text-accent-gold tabular-nums">{service.professionalIds.length}</p>
                        </div>
                     </div>

                     <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/5 blur-[80px] -z-0 rounded-full group-hover:bg-accent-gold/10 transition-all duration-700"></div>
                  </div>
               ))}
            </div>
         </main>

         {showModal && (
            <div className="fixed inset-0 z-[100] bg-background-dark/95 flex items-end justify-center backdrop-blur-2xl animate-fade-in overflow-hidden">
               <div className="fixed inset-0" onClick={() => setShowModal(false)}></div>
               <form onSubmit={handleSave} className="bg-surface-dark w-full max-w-screen-md rounded-t-[64px] p-12 space-y-10 animate-slide-up border-t border-white/10 max-h-[92vh] overflow-y-auto no-scrollbar relative z-10 shadow-hugest selection:bg-accent-gold/20">
                  <div className="flex justify-between items-center px-4">
                     <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none">Configuration</p>
                        <h2 className="text-3xl font-display italic text-white italic">Assinatura do Serviço</h2>
                     </div>
                     <button type="button" onClick={() => setShowModal(false)} className="size-14 flex items-center justify-center rounded-3xl bg-white/5 border border-white/10 text-white/20 hover:text-white transition-all">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <div className="space-y-12">
                     <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <span className="w-6 h-px bg-accent-gold/40"></span>
                           <label className="text-[10px] uppercase font-black text-white/30 tracking-[0.3em]">Material Visual</label>
                        </div>
                        <div className="flex flex-col md:flex-row gap-6">
                           <div className="relative size-32 lg:size-48 rounded-[40px] overflow-hidden border border-white/10 shrink-0 group/img">
                              <img src={editingService?.imageUrl || 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800'} className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                              <label className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all cursor-pointer">
                                 <span className="material-symbols-outlined text-white mb-2">add_a_photo</span>
                                 <span className="text-[8px] font-black uppercase tracking-widest text-white">Update Elite Cover</span>
                                 <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                       const url = await uploadImage(file, 'services');
                                       if (url) setEditingService({ ...editingService, imageUrl: url });
                                    }
                                 }} />
                              </label>
                           </div>
                           <div className="flex-1 space-y-4">
                              <input type="text" placeholder="URL da Coleção Exclusiva..." value={editingService?.imageUrl || ''} onChange={e => setEditingService({ ...editingService, imageUrl: e.target.value })} className="w-full h-15 bg-white/5 border border-white/5 rounded-[24px] px-8 text-xs focus:border-accent-gold/40 outline-none italic text-white/40 transition-all shadow-huge" />
                              <p className="text-[9px] font-medium text-white/10 px-4 leading-relaxed">Recomendamos imagens de alta curadoria no formato 1:1 para melhor estética no catálogo.</p>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="flex items-center gap-3">
                           <span className="w-6 h-px bg-accent-gold/40"></span>
                           <label className="text-[10px] uppercase font-black text-white/30 tracking-[0.3em]">Identidade e Valor</label>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <input type="text" required placeholder="Título da Experiência..." value={editingService?.name || ''} onChange={e => setEditingService({ ...editingService, name: e.target.value })} className="w-full h-18 bg-white/5 border border-white/5 rounded-[28px] px-8 text-base font-medium focus:border-accent-gold/60 outline-none transition-all shadow-huge" />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <input type="text" placeholder="Categoria" value={editingService?.category || ''} onChange={e => setEditingService({ ...editingService, category: e.target.value })} className="h-18 bg-white/5 border border-white/5 rounded-[28px] px-6 text-xs font-black uppercase tracking-widest focus:border-accent-gold/60 outline-none text-white/40 text-center" />
                              <div className="relative">
                                 <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-400/40 text-sm font-black">R$</span>
                                 <input type="number" required placeholder="Value" value={editingService?.price || ''} onChange={e => setEditingService({ ...editingService, price: parseFloat(e.target.value) })} className="w-full h-18 bg-white/5 border border-white/5 rounded-[28px] pl-14 pr-6 text-lg font-black text-emerald-400 focus:border-accent-gold/60 outline-none shadow-huge text-center tabular-nums" />
                              </div>
                           </div>
                        </div>
                        <textarea placeholder="Narrativa de transformação e benefícios..." value={editingService?.description || ''} onChange={e => setEditingService({ ...editingService, description: e.target.value })} className="w-full h-40 bg-white/5 border border-white/5 rounded-[40px] p-8 text-sm focus:border-accent-gold/60 outline-none italic text-white/60 resize-none shadow-huge" />
                     </div>

                     <div className="space-y-6">
                        <div className="flex justify-between items-center px-2">
                           <div className="flex items-center gap-3">
                              <span className="w-6 h-px bg-accent-gold/40"></span>
                              <label className="text-[10px] uppercase font-black text-white/30 tracking-[0.3em]">Diferenciais de Autoridade</label>
                           </div>
                           <button
                              type="button"
                              onClick={() => {
                                 const current = editingService?.features || [];
                                 setEditingService({ ...editingService, features: [...current, { title: '', description: '', icon: 'stars' }] });
                              }}
                              className="size-10 rounded-2xl bg-accent-gold/10 text-accent-gold hover:bg-accent-gold hover:text-primary transition-all flex items-center justify-center shadow-lg"
                           >
                              <span className="material-symbols-outlined !text-xl">add</span>
                           </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {editingService?.features?.map((feat, idx) => (
                              <div key={idx} className="bg-white/5 border border-white/5 rounded-[32px] p-6 space-y-4 relative group/feat hover:bg-white/[0.08] transition-all duration-500">
                                 <button
                                    type="button"
                                    onClick={() => {
                                       const current = editingService?.features || [];
                                       setEditingService({ ...editingService, features: current.filter((_, i) => i !== idx) });
                                    }}
                                    className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 opacity-0 group-hover/feat:opacity-100 hover:bg-rose-500 hover:text-white transition-all"
                                 >
                                    <span className="material-symbols-outlined !text-sm">close</span>
                                 </button>
                                 <div className="flex gap-4">
                                    <div className="size-10 rounded-2xl bg-accent-gold/10 flex items-center justify-center text-accent-gold shrink-0">
                                       <span className="material-symbols-outlined !text-xl">{feat.icon || 'star'}</span>
                                    </div>
                                    <input
                                       placeholder="Diferencial Elite..."
                                       value={feat.title}
                                       onChange={e => {
                                          const val = e.target.value;
                                          let icon = 'stars';
                                          const t = val.toLowerCase();
                                          if (t.includes('bio') || t.includes('seguran')) icon = 'verified_user';
                                          else if (t.includes('prem') || t.includes('cuid')) icon = 'spa';
                                          else if (t.includes('comfort') || t.includes('relax')) icon = 'chair';
                                          else if (t.includes('resid')) icon = 'timelapse';
                                          const current = [...(editingService?.features || [])];
                                          current[idx] = { ...current[idx], title: val, icon };
                                          setEditingService({ ...editingService, features: current });
                                       }}
                                       className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-black uppercase tracking-widest text-white/80"
                                    />
                                 </div>
                                 <textarea
                                    placeholder="Valor agregado..."
                                    value={feat.description}
                                    onChange={e => {
                                       const current = [...(editingService?.features || [])];
                                       current[idx] = { ...current[idx], description: e.target.value };
                                       setEditingService({ ...editingService, features: current });
                                    }}
                                    className="w-full bg-transparent border-none focus:ring-0 text-[10px] text-white/30 italic resize-none h-12 leading-relaxed"
                                 />
                              </div>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="flex items-center gap-3">
                           <span className="w-6 h-px bg-accent-gold/40"></span>
                           <label className="text-[10px] uppercase font-black text-white/30 tracking-[0.3em]">Rede de Especialistas</label>
                        </div>
                        <div className="flex flex-wrap gap-3">
                           {professionals.map(pro => (
                              <button
                                 key={pro.id}
                                 type="button"
                                 onClick={() => toggleProSelection(pro.id)}
                                 className={`flex items-center gap-3 pr-8 h-15 rounded-[24px] transition-all duration-700 border ${editingService?.professionalIds?.includes(pro.id) ? 'bg-white text-primary border-white shadow-huge scale-[1.02]' : 'bg-white/5 border-white/5 text-white/20 hover:bg-white/10'}`}
                              >
                                 <div className={`size-15 rounded-[22px] overflow-hidden border p-1 border-white/10 transition-all ${editingService?.professionalIds?.includes(pro.id) ? 'opacity-100' : 'opacity-40'}`}>
                                    <img src={pro.image_url || `https://ui-avatars.com/api/?name=${pro.name}`} className="w-full h-full object-cover rounded-[18px]" />
                                 </div>
                                 <div className="text-left">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{pro.name.split(' ')[0]}</span>
                                    {editingService?.professionalIds?.includes(pro.id) && <p className="text-[7px] font-black uppercase tracking-widest text-emerald-500 opacity-60">Linked</p>}
                                 </div>
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-8 pt-6">
                        <div className="space-y-4">
                           <div className="flex items-center gap-3">
                              <span className="w-6 h-px bg-white/10"></span>
                              <label className="text-[10px] uppercase font-black text-white/20 tracking-[0.3em]">Sincronia (Minutos)</label>
                           </div>
                           <input type="number" required placeholder="90" value={editingService?.duration || ''} onChange={e => setEditingService({ ...editingService, duration: parseInt(e.target.value) })} className="w-full h-18 bg-surface-dark border border-white/5 rounded-[32px] px-8 text-xl font-black text-center tabular-nums focus:border-accent-gold/40 transition-all focus:ring-0 outline-none text-white/60" />
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center gap-3">
                              <span className="w-6 h-px bg-accent-gold/40"></span>
                              <label className="text-[10px] uppercase font-black text-accent-gold/40 tracking-[0.3em]">Reward Elite Credits</label>
                           </div>
                           <div className="relative">
                              <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-accent-gold !text-lg">stars</span>
                              <input type="number" placeholder="50" value={editingService?.pointsReward || ''} onChange={e => setEditingService({ ...editingService, pointsReward: parseInt(e.target.value) })} className="w-full h-18 bg-accent-gold/5 border border-accent-gold/20 rounded-[32px] pl-16 pr-8 text-xl font-black text-center tabular-nums focus:border-accent-gold outline-none text-accent-gold shadow-[0_0_30px_rgba(201,169,97,0.05)]" />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-4 pt-12">
                     <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-20 bg-white/5 border border-white/10 text-white/20 rounded-[32px] font-black uppercase tracking-[0.4em] text-[10px] active:scale-95 transition-all">Discard</button>
                     <button type="submit" className="flex-[2] h-20 bg-accent-gold text-primary rounded-[32px] font-black uppercase tracking-[0.5em] text-[11px] shadow-hugest active:scale-95 transition-all">Consolidate Catalogue</button>
                  </div>
               </form>

               <div className="fixed top-0 left-0 w-[50vw] h-[50vh] bg-accent-gold/10 blur-[120px] pointer-events-none -z-0"></div>
               <div className="fixed bottom-0 right-0 w-[40vw] h-[40vh] bg-primary/20 blur-[120px] pointer-events-none -z-0 opacity-40"></div>
            </div >
         )}

         <div className="lg:hidden">
            <AdminBottomNav />
         </div>

         <div className="fixed top-0 right-0 w-[40vw] h-[40vh] bg-accent-gold/5 blur-[120px] pointer-events-none z-0"></div>
         <div className="fixed bottom-0 left-0 w-[40vw] h-[40vh] bg-primary/20 blur-[120px] pointer-events-none z-0 opacity-40"></div>
      </div>
   );
};

export default ServiceManagement;
