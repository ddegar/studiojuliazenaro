
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Service, Professional, UserRole } from '../types';
import { supabase } from '../services/supabase';

const ServiceManagement: React.FC = () => {
   const navigate = useNavigate();
   const [currentUser] = useState({ role: 'MASTER_ADMIN' as UserRole, professionalId: 'p1' });
   const isMaster = currentUser.role === 'MASTER_ADMIN';

   const [services, setServices] = useState<Service[]>([]);
   const [professionals, setProfessionals] = useState<Professional[]>([]);
   const [showModal, setShowModal] = useState(false);
   const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
   const [loading, setLoading] = useState(true);

   // Fetch initial data
   useEffect(() => {
      fetchData();
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
               ...s,
               imageUrl: s.image_url,
               professionalIds: s.professional_ids || [],
               pointsReward: s.points_reward
            })));
         }
      } catch (e) {
         console.error('Erro ao buscar dados', e);
      } finally {
         setLoading(false);
      }
   };

   const filteredServices = useMemo(() => {
      if (isMaster) return services;
      return services.filter(s => s.professionalIds.includes(currentUser.professionalId!));
   }, [services, isMaster, currentUser.professionalId]);

   const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingService?.name || !editingService?.price || (editingService.professionalIds?.length === 0)) {
         alert('Preencha os campos obrigatórios e selecione as profissionais.');
         return;
      }

      try {
         const payload = {
            name: editingService.name,
            description: editingService.description,
            price: editingService.price,
            duration: editingService.duration,
            category: editingService.category || 'Cílios',
            image_url: editingService.imageUrl || 'https://picsum.photos/400/300?sig=default',
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

   return (
      <div className="flex flex-col h-full bg-background-dark text-white pb-32">
         <header className="sticky top-0 z-50 glass-nav !bg-background-dark/80 p-6 border-b border-white/5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <button onClick={() => navigate('/admin')} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
                  <div>
                     <h1 className="text-xl font-display font-bold">Catálogo de Serviços</h1>
                     <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{filteredServices.length} Procedimentos Ativos</p>
                  </div>
               </div>
               {isMaster && (
                  <button onClick={() => { setEditingService({ professionalIds: [], category: 'Cílios', pointsReward: 50 }); setShowModal(true); }} className="size-11 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/20 ring-4 ring-primary/5">
                     <span className="material-symbols-outlined">add</span>
                  </button>
               )}
            </div>
         </header>

         <main className="flex-1 p-6 space-y-4 overflow-y-auto no-scrollbar">
            {loading ? <p className="text-center text-gray-500 py-10">Carregando...</p> : filteredServices.map(service => (
               <div key={service.id} className="bg-card-dark p-6 rounded-[32px] border border-white/10 space-y-6 group">
                  <div className="flex justify-between items-start">
                     <div className="flex items-center gap-5">
                        <div className="size-20 rounded-2xl overflow-hidden border border-white/5">
                           <img src={service.imageUrl} className="w-full h-full object-cover" alt={service.name} />
                        </div>
                        <div className="space-y-1">
                           <h3 className="text-base font-bold text-white group-hover:text-accent-gold transition-colors">{service.name}</h3>
                           <p className="text-[10px] text-gray-500 line-clamp-1 italic">{service.description}</p>
                           <div className="flex gap-2 pt-1">
                              <span className="bg-primary/10 text-primary text-[8px] font-black px-2 py-0.5 rounded uppercase">{service.category}</span>
                              <span className="bg-accent-gold/10 text-accent-gold text-[8px] font-black px-2 py-0.5 rounded uppercase">{service.pointsReward} Lash Points</span>
                           </div>
                        </div>
                     </div>
                     <button
                        onClick={() => { setEditingService(service); setShowModal(true); }}
                        className="size-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all"
                     >
                        <span className="material-symbols-outlined !text-xl">edit</span>
                     </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                     <div className="text-center">
                        <p className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter">Investimento</p>
                        <p className="text-sm font-black text-emerald-500">R$ {service.price}</p>
                     </div>
                     <div className="text-center">
                        <p className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter">Tempo</p>
                        <p className="text-sm font-black text-gray-300">{service.duration} min</p>
                     </div>
                     <div className="text-center">
                        <p className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter">Profissionais</p>
                        <p className="text-sm font-black text-accent-gold">{service.professionalIds.length}</p>
                     </div>
                  </div>
               </div>
            ))}
         </main>

         {showModal && (
            <div className="fixed inset-0 z-[100] bg-black/95 flex items-end justify-center backdrop-blur-md">
               <form onSubmit={handleSave} className="bg-card-dark w-full max-w-[430px] rounded-t-[48px] p-10 space-y-8 animate-slide-up border-t border-white/10 max-h-[90vh] overflow-y-auto no-scrollbar">
                  <div className="flex justify-between items-center">
                     <h2 className="text-2xl font-display font-bold">Configurar Procedimento</h2>
                     <button type="button" onClick={() => setShowModal(false)} className="material-symbols-outlined text-gray-500">close</button>
                  </div>

                  <div className="space-y-6">
                     {/* Upload de Imagem Simulado - Futuramente integrar Storage */}
                     <div className="space-y-3">
                        <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-1">Miniatura do Serviço</label>
                        <div className="h-40 rounded-3xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-3 relative overflow-hidden group">
                           {editingService?.imageUrl ? (
                              <img src={editingService.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="preview" />
                           ) : null}
                           <span className="material-symbols-outlined !text-3xl text-gray-500 relative z-10">add_a_photo</span>
                           <p className="text-[10px] font-bold text-gray-600 relative z-10 uppercase">Trocar Imagem</p>
                        </div>
                        <p className="text-[9px] text-center text-gray-600">Por enquanto, link direto ou placeholder.</p>
                     </div>

                     <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-1">Nome do Serviço</label>
                        <input type="text" placeholder="Ex: Lash Lifting Power" value={editingService?.name || ''} onChange={e => setEditingService({ ...editingService, name: e.target.value })} className="w-full h-14 bg-white/5 border-white/10 rounded-2xl px-6 text-sm focus:ring-accent-gold" />
                     </div>

                     <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-1">Descrição Explicativa (Para Clientes)</label>
                        <textarea placeholder="O que esse serviço oferece?" value={editingService?.description || ''} onChange={e => setEditingService({ ...editingService, description: e.target.value })} className="w-full h-32 bg-white/5 border-white/10 rounded-3xl p-6 text-sm focus:ring-accent-gold" />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-1">Valor (R$)</label>
                           <input type="number" placeholder="0.00" value={editingService?.price || ''} onChange={e => setEditingService({ ...editingService, price: parseFloat(e.target.value) })} className="w-full h-14 bg-white/5 border-white/10 rounded-2xl px-6 text-sm font-black text-emerald-500 focus:ring-accent-gold" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-1">Duração (Min)</label>
                           <input type="number" placeholder="60" value={editingService?.duration || ''} onChange={e => setEditingService({ ...editingService, duration: parseInt(e.target.value) })} className="w-full h-14 bg-white/5 border-white/10 rounded-2xl px-6 text-sm font-bold focus:ring-accent-gold" />
                        </div>
                     </div>

                     <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black text-accent-gold tracking-[0.2em] pl-1">Recompensa: Lash Points ✨</label>
                        <input type="number" placeholder="50" value={editingService?.pointsReward || ''} onChange={e => setEditingService({ ...editingService, pointsReward: parseInt(e.target.value) })} className="w-full h-14 bg-accent-gold/5 border-accent-gold/20 rounded-2xl px-6 text-sm font-black text-accent-gold focus:ring-accent-gold" />
                        <p className="text-[8px] text-gray-600 px-2 italic mt-1">Pontos creditados automaticamente após conclusão do atendimento.</p>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-1">Habilitar para Profissionais</label>
                        <div className="flex flex-wrap gap-2">
                           {professionals.map(pro => (
                              <button
                                 key={pro.id}
                                 type="button"
                                 onClick={() => toggleProSelection(pro.id)}
                                 className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${editingService?.professionalIds?.includes(pro.id) ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}
                              >
                                 {pro.name}
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                     <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-16 bg-white/5 border border-white/10 text-gray-400 rounded-3xl font-black uppercase tracking-widest text-[10px]">Cancelar</button>
                     <button type="submit" className="flex-[2] h-16 bg-primary text-white rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-primary/30">SALVAR NO CATÁLOGO</button>
                  </div>
               </form>
            </div>
         )}
      </div>
   );
};

export default ServiceManagement;
