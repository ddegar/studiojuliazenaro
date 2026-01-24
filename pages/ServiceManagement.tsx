
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
      <div className="flex flex-col h-full bg-background-dark text-white pb-32 lg:pb-8">
         <header className="sticky top-0 z-40 glass-nav !bg-background-dark/80 p-6 lg:p-8 border-b border-white/5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <button onClick={() => navigate('/admin')} className="size-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors">
                     <span className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</span>
                  </button>
                  <div>
                     <h1 className="text-xl lg:text-2xl font-display font-bold">Catálogo de Serviços</h1>
                     <p className="text-[10px] lg:text-xs text-gray-500 uppercase font-black tracking-widest">{filteredServices.length} Procedimentos Ativos</p>
                  </div>
               </div>
               {(isMaster || (currentUser as any)?.permissions?.canManageOwnServices) && (
                  <button onClick={() => { setEditingService({ professionalIds: isMaster ? [] : [currentUser!.id], category: 'Procedimento', pointsReward: 50, features: [] }); setShowModal(true); }} className="size-11 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/20 ring-4 ring-primary/5 active:scale-95 transition-transform">
                     <span className="material-symbols-outlined">add</span>
                  </button>
               )}
            </div>
         </header>

         <main className="flex-1 p-6 lg:p-6 w-full max-w-7xl mx-auto overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
               {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                     <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                     <p className="text-xs font-bold uppercase tracking-widest">Sincronizando catálogo...</p>
                  </div>
               ) : filteredServices.length === 0 ? (
                  <div className="text-center py-20 space-y-4 opacity-30">
                     <span className="material-symbols-outlined !text-6xl">category</span>
                     <p className="font-display italic text-lg">Nenhum serviço encontrado.</p>
                  </div>
               ) : filteredServices.map(service => (
                  <div key={service.id} className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-6 group hover:border-white/10 transition-all">
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-5">
                           <div className="size-20 rounded-2xl overflow-hidden border border-white/10 shadow-lg shadow-black/20">
                              <img src={service.imageUrl || 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400'} className="w-full h-full object-cover" alt={service.name} />
                           </div>
                           <div className="space-y-1.5">
                              <h3 className="text-base font-bold text-white group-hover:text-accent-gold transition-colors">{service.name}</h3>
                              <div className="flex flex-wrap gap-2">
                                 <span className="bg-primary/10 text-primary text-[8px] font-black px-2.5 py-1 rounded-full uppercase border border-primary/20">{service.category}</span>
                                 <span className="bg-accent-gold/10 text-accent-gold text-[8px] font-black px-2.5 py-1 rounded-full uppercase border border-accent-gold/20">{service.pointsReward} Lash Points</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button
                              onClick={() => { setEditingService(service); setShowModal(true); }}
                              className="size-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all active:scale-90"
                           >
                              <span className="material-symbols-outlined !text-xl">edit</span>
                           </button>
                           {isMaster && (
                              <button
                                 onClick={() => handleDelete(service.id)}
                                 className="size-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                              >
                                 <span className="material-symbols-outlined !text-xl">delete</span>
                              </button>
                           )}
                        </div>
                     </div>

                     <div className="grid grid-cols-3 gap-4 pt-5 border-t border-white/5">
                        <div className="text-center bg-white/5 py-4 rounded-2xl border border-white/5">
                           <p className="text-[8px] font-black text-gray-500 uppercase tracking-tighter mb-1">Preço</p>
                           <p className="text-sm font-black text-emerald-500">R$ {service.price}</p>
                        </div>
                        <div className="text-center bg-white/5 py-4 rounded-2xl border border-white/5">
                           <p className="text-[8px] font-black text-gray-500 uppercase tracking-tighter mb-1">Tempo</p>
                           <p className="text-sm font-black text-gray-300">{service.duration} min</p>
                        </div>
                        <div className="text-center bg-white/5 py-4 rounded-2xl border border-white/5">
                           <p className="text-[8px] font-black text-gray-500 uppercase tracking-tighter mb-1">Equipe</p>
                           <p className="text-sm font-black text-accent-gold">{service.professionalIds.length}</p>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </main>

         {showModal && (
            <div className="fixed inset-0 z-[100] bg-black/95 flex items-end justify-center backdrop-blur-xl animate-fade-in">
               <div className="fixed inset-0" onClick={() => setShowModal(false)}></div>
               <form onSubmit={handleSave} className="bg-card-dark w-full max-w-[430px] rounded-t-[48px] p-10 space-y-8 animate-slide-up border-t border-white/10 max-h-[90vh] overflow-y-auto no-scrollbar relative z-10 shadow-2xl">
                  <div className="flex justify-between items-center">
                     <div>
                        <h2 className="text-2xl font-display font-bold text-white">Configurar Serviço</h2>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">Gestão de Portfólio</p>
                     </div>
                     <button type="button" onClick={() => setShowModal(false)} className="size-10 flex items-center justify-center rounded-full bg-white/5 text-gray-500 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <div className="space-y-8">
                     <div className="space-y-3">
                        <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">Imagem do Procedimento</label>
                        <div className="flex flex-col gap-4">
                           {editingService?.imageUrl && (
                              <div className="w-full h-40 rounded-2xl overflow-hidden border border-white/10">
                                 <img src={editingService.imageUrl} className="w-full h-full object-cover" />
                              </div>
                           )}
                           <div className="relative">
                              <label className="flex items-center justify-center gap-3 w-full h-14 bg-white/5 border border-dashed border-white/20 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors">
                                 <span className="material-symbols-outlined text-gray-400">upload</span>
                                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fazer Upload de Foto</span>
                                 <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={async (e) => {
                                       const file = e.target.files?.[0];
                                       if (file) {
                                          const url = await uploadImage(file, 'services');
                                          if (url) setEditingService({ ...editingService, imageUrl: url });
                                       }
                                    }}
                                 />
                              </label>
                           </div>
                           <input type="text" placeholder="Ou cole a URL da imagem aqui..." value={editingService?.imageUrl || ''} onChange={e => setEditingService({ ...editingService, imageUrl: e.target.value })} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-[10px] focus:ring-primary outline-none italic" />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">Título do Procedimento</label>
                        <input type="text" required placeholder="Ex: Extensão Volume Russo" value={editingService?.name || ''} onChange={e => setEditingService({ ...editingService, name: e.target.value })} className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold focus:ring-primary outline-none" />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">Tipo de Serviço (Ex: Cílios)</label>
                           <input type="text" placeholder="Cílios, Unhas, etc" value={editingService?.category || ''} onChange={e => setEditingService({ ...editingService, category: e.target.value })} className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold focus:ring-primary outline-none" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">Valor (R$)</label>
                           <input type="number" required placeholder="250.00" value={editingService?.price || ''} onChange={e => setEditingService({ ...editingService, price: parseFloat(e.target.value) })} className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-black text-emerald-500 focus:ring-primary outline-none" />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">Descrição para a Cliente</label>
                        <textarea placeholder="Explique os benefícios e o resultado final..." value={editingService?.description || ''} onChange={e => setEditingService({ ...editingService, description: e.target.value })} className="w-full h-32 bg-white/5 border border-white/10 rounded-3xl p-6 text-sm focus:ring-primary outline-none italic" />
                     </div>

                     <div className="space-y-4">
                        <div className="flex justify-between items-center px-2">
                           <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em]">Diferenciais do Serviço</label>
                           <button
                              type="button"
                              onClick={() => {
                                 const current = editingService?.features || [];
                                 setEditingService({ ...editingService, features: [...current, { title: '', description: '', icon: 'stars' }] });
                              }}
                              className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest flex items-center gap-1"
                           >
                              <span className="material-symbols-outlined !text-sm">add_circle</span>
                              Adicionar
                           </button>
                        </div>
                        <div className="space-y-3">
                           {editingService?.features?.map((feat, idx) => (
                              <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 relative group">
                                 <button
                                    type="button"
                                    onClick={() => {
                                       const current = editingService?.features || [];
                                       setEditingService({ ...editingService, features: current.filter((_, i) => i !== idx) });
                                    }}
                                    className="absolute top-2 right-2 text-rose-500 opacity-50 hover:opacity-100 p-1"
                                 >
                                    <span className="material-symbols-outlined !text-lg">delete</span>
                                 </button>
                                 <div className="flex gap-3">
                                    <div className="space-y-1 flex-1">
                                       <label className="text-[9px] text-gray-500 font-bold uppercase">Título (Gera ícone auto)</label>
                                       <input
                                          placeholder="Ex: Biossegurança"
                                          value={feat.title}
                                          onChange={e => {
                                             const val = e.target.value;
                                             let icon = 'stars';
                                             const t = val.toLowerCase();
                                             if (t.includes('bio') || t.includes('seguran') || t.includes('material')) icon = 'verified_user';
                                             else if (t.includes('premium') || t.includes('cuidado') || t.includes('alta')) icon = 'spa';
                                             else if (t.includes('conforto') || t.includes('relax')) icon = 'chair';
                                             else if (t.includes('tempo') || t.includes('dura') || t.includes('resist')) icon = 'timelapse';
                                             else if (t.includes('volume') || t.includes('olhar')) icon = 'visibility';

                                             const current = [...(editingService?.features || [])];
                                             current[idx] = { ...current[idx], title: val, icon };
                                             setEditingService({ ...editingService, features: current });
                                          }}
                                          className="w-full h-10 bg-black/20 rounded-xl px-3 text-xs text-white border border-white/10"
                                       />
                                    </div>
                                    <div className="w-10 flex flex-col items-center justify-end pb-1">
                                       <span className="material-symbols-outlined text-accent-gold">{feat.icon || 'stars'}</span>
                                    </div>
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[9px] text-gray-500 font-bold uppercase">Descrição</label>
                                    <textarea
                                       placeholder="Descreva o diferencial..."
                                       value={feat.description}
                                       onChange={e => {
                                          const current = [...(editingService?.features || [])];
                                          current[idx] = { ...current[idx], description: e.target.value };
                                          setEditingService({ ...editingService, features: current });
                                       }}
                                       className="w-full h-16 bg-black/20 rounded-xl p-3 text-xs text-white border border-white/10 italic resize-none"
                                    />
                                 </div>
                              </div>
                           ))}
                           {(!editingService?.features || editingService.features.length === 0) && (
                              <p className="text-center text-xs text-gray-600 italic py-4">Nenhum diferencial adicionado.</p>
                           )}
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">Duração (Min)</label>
                           <input type="number" required placeholder="90" value={editingService?.duration || ''} onChange={e => setEditingService({ ...editingService, duration: parseInt(e.target.value) })} className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold focus:ring-primary outline-none" />
                        </div>
                        <div className="space-y-2 bg-accent-gold/5 p-4 rounded-2xl border border-accent-gold/10">
                           <label className="text-[10px] uppercase font-black text-accent-gold tracking-[0.2em] pl-1">Zenaro Credits ✨</label>
                           <input type="number" placeholder="50" value={editingService?.pointsReward || ''} onChange={e => setEditingService({ ...editingService, pointsReward: parseInt(e.target.value) })} className="w-full h-10 bg-white/20 border border-accent-gold/20 rounded-xl px-4 text-sm font-black text-accent-gold focus:ring-accent-gold outline-none mt-1" />
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">Vincular Profissionais</label>
                        <div className="flex flex-wrap gap-2">
                           {professionals.map(pro => (
                              <button
                                 key={pro.id}
                                 type="button"
                                 onClick={() => toggleProSelection(pro.id)}
                                 className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${editingService?.professionalIds?.includes(pro.id) ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-white/5 text-gray-500'}`}
                              >
                                 {pro.name}
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                     <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-18 bg-white/5 border border-white/10 text-gray-500 rounded-3xl font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all">Sair</button>
                     <button type="submit" className="flex-[2] h-18 bg-primary text-white rounded-3xl font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl shadow-primary/30 active:scale-95 transition-all">SALVAR SERVIÇO</button>
                  </div>
               </form>
            </div >
         )}
         <div className="lg:hidden">
            <AdminBottomNav />
         </div>
      </div >
   );
};

export default ServiceManagement;
