
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Service, Professional, UserRole } from '../types';
import { supabase } from '../services/supabase';
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
               isPopular: s.is_popular
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
      // Professionals see services ellos are linked to
      return services.filter(s => s.professionalIds.includes(currentUser.id));
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
            is_popular: editingService.isPopular || false
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

   if (!currentUser && loading) {
      return (
         <div className="flex h-screen items-center justify-center bg-background-dark">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
         </div>
      );
   }

   return (
      <div className="flex flex-col h-full bg-background-dark text-white pb-32">
         <header className="sticky top-0 z-40 glass-nav !bg-background-dark/80 p-6 border-b border-white/5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <button onClick={() => navigate('/admin')} className="size-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors">
                     <span className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</span>
                  </button>
                  <div>
                     <h1 className="text-xl font-display font-bold">Catálogo de Serviços</h1>
                     <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{filteredServices.length} Procedimentos Ativos</p>
                  </div>
               </div>
               {(isMaster || (currentUser as any)?.permissions?.canManageOwnServices) && (
                  <button onClick={() => { setEditingService({ professionalIds: isMaster ? [] : [currentUser!.id], category: 'Procedimento', pointsReward: 50 }); setShowModal(true); }} className="size-11 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/20 ring-4 ring-primary/5 active:scale-95 transition-transform">
                     <span className="material-symbols-outlined">add</span>
                  </button>
               )}
            </div>
         </header>

         <main className="flex-1 p-6 space-y-4 overflow-y-auto no-scrollbar">
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
                     <button
                        onClick={() => { setEditingService(service); setShowModal(true); }}
                        className="size-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all active:scale-90"
                     >
                        <span className="material-symbols-outlined !text-xl">edit</span>
                     </button>
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
                        <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">Imagem de Capa (URL)</label>
                        <input type="text" placeholder="https://..." value={editingService?.imageUrl || ''} onChange={e => setEditingService({ ...editingService, imageUrl: e.target.value })} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm focus:ring-primary outline-none italic" />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">Título do Procedimento</label>
                        <input type="text" required placeholder="Ex: Extensão Volume Russo" value={editingService?.name || ''} onChange={e => setEditingService({ ...editingService, name: e.target.value })} className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold focus:ring-primary outline-none" />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">Descrição para a Cliente</label>
                        <textarea placeholder="Explique os benefícios e o resultado final..." value={editingService?.description || ''} onChange={e => setEditingService({ ...editingService, description: e.target.value })} className="w-full h-32 bg-white/5 border border-white/10 rounded-3xl p-6 text-sm focus:ring-primary outline-none italic" />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">Valor (R$)</label>
                           <input type="number" required placeholder="250.00" value={editingService?.price || ''} onChange={e => setEditingService({ ...editingService, price: parseFloat(e.target.value) })} className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-black text-emerald-500 focus:ring-primary outline-none" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">Duração (Min)</label>
                           <input type="number" required placeholder="90" value={editingService?.duration || ''} onChange={e => setEditingService({ ...editingService, duration: parseInt(e.target.value) })} className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold focus:ring-primary outline-none" />
                        </div>
                     </div>

                     <div className="space-y-2 bg-accent-gold/5 p-6 rounded-3xl border border-accent-gold/10">
                        <label className="text-[10px] uppercase font-black text-accent-gold tracking-[0.2em] pl-1">Recompensa VIP: Lash Points ✨</label>
                        <input type="number" placeholder="50" value={editingService?.pointsReward || ''} onChange={e => setEditingService({ ...editingService, pointsReward: parseInt(e.target.value) })} className="w-full h-16 bg-white/20 border border-accent-gold/20 rounded-2xl px-6 text-sm font-black text-accent-gold focus:ring-accent-gold outline-none mt-2" />
                        <p className="text-[9px] text-accent-gold/60 font-medium italic mt-2">Estes pontos serão creditados no perfil da cliente após o pagamento.</p>
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
            </div>
         )}
         <AdminBottomNav />
      </div>
   );
};

export default ServiceManagement;
