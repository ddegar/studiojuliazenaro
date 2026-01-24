
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Professional, Service } from '../types';
import { supabase } from '../services/supabase';

const AdminBookingForm: React.FC = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const state = location.state as { hour?: string, date?: string, proId?: string, type?: 'BLOCK' | 'APPOINTMENT' } | null;

   const [professionals, setProfessionals] = useState<Professional[]>([]);
   const [services, setServices] = useState<Service[]>([]);
   const [clients, setClients] = useState<any[]>([]);

   const [form, setForm] = useState({
      clientId: '',
      clientName: '',
      professionalId: state?.proId || '',
      serviceId: '',
      date: state?.date || new Date().toISOString().split('T')[0],
      time: state?.hour || '09:00',
      type: state?.type || 'APPOINTMENT',
      notes: ''
   });

   const [searchClient, setSearchClient] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetchData = async () => {
         setLoading(true);
         try {
            const [prosRes, servsRes, clientsRes] = await Promise.all([
               supabase.from('professionals').select('*').eq('active', true),
               supabase.from('services').select('*').eq('active', true),
               supabase.from('profiles').select('id, name, phone').eq('role', 'CLIENT').limit(20)
            ]);

            if (prosRes.data) {
               setProfessionals(prosRes.data.map(p => ({
                  id: p.id,
                  name: p.name,
                  role: p.role,
                  avatar: p.image_url || `https://ui-avatars.com/api/?name=${p.name}&background=0f3e29&color=C9A961`,
                  active: p.active,
                  specialties: p.specialties || [],
                  rating: p.rating || 5
               })));
               if (!form.professionalId && prosRes.data.length > 0) {
                  setForm(prev => ({ ...prev, professionalId: prosRes.data[0].id }));
               }
            }

            if (servsRes.data) {
               setServices(servsRes.data.map(s => ({
                  id: s.id,
                  name: s.name,
                  description: s.description || '',
                  price: s.price,
                  duration: s.duration,
                  category: s.category || '',
                  imageUrl: s.image_url || '',
                  active: s.active,
                  professionalIds: s.professional_ids || [],
                  pointsReward: s.points_reward || 0
               })));
            }

            if (clientsRes.data) {
               setClients(clientsRes.data);
            }
         } catch (err) {
            console.error('Error fetching booking data:', err);
         } finally {
            setLoading(false);
         }
      };
      fetchData();
   }, []);

   const filteredClients = useMemo(() => {
      if (form.clientId) return [];
      if (!searchClient || searchClient.length < 1) return [];
      return clients.filter(c =>
         c.name.toLowerCase().includes(searchClient.toLowerCase()) ||
         (c.phone?.includes(searchClient) ?? false)
      );
   }, [searchClient, form.clientId, clients]);

   const filteredServices = useMemo(() => {
      return services.filter(s => s.professionalIds.includes(form.professionalId));
   }, [form.professionalId, services]);

   const handleSave = async () => {
      if (form.type === 'APPOINTMENT' && !form.clientName && !form.clientId) {
         alert('Selecione ou identifique uma cliente.');
         return;
      }
      if (form.type === 'APPOINTMENT' && !form.serviceId) {
         alert('Selecione um procedimento.');
         return;
      }

      setIsSubmitting(true);
      try {
         const selectedService = services.find(s => s.id === form.serviceId);
         const selectedPro = professionals.find(p => p.id === form.professionalId);

         const startDate = new Date(`${form.date}T${form.time}:00`);
         let duration = form.type === 'BLOCK' ? parseInt(form.notes.split('|')[1] || '60') : (selectedService?.duration || 30);

         if (form.type === 'BLOCK' && form.notes.startsWith('ALDAY')) {
            duration = 24 * 60;
         }

         const endDate = new Date(startDate.getTime() + duration * 60000);

         const { error } = await supabase.from('appointments').insert({
            user_id: form.clientId || null,
            professional_id: form.professionalId,
            service_id: form.type === 'BLOCK' ? null : form.serviceId,
            date: form.date,
            time: form.time,
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString(),
            duration: duration,
            status: form.type === 'BLOCK' ? 'blocked' : 'scheduled',
            created_by: 'ADMIN',
            professional_name: selectedPro?.name || 'Profissional',
            service_name: form.type === 'BLOCK' ? (form.notes.split('|')[0] || 'Bloqueio') : selectedService?.name,
            price: form.type === 'BLOCK' ? 0 : selectedService?.price,
            notes: form.type === 'BLOCK' ? (form.notes.split('|')[0]) : form.notes
         });

         if (error) {
            if (error.message.includes('overlap')) {
               alert("CONFLITO: Este horário já possui uma reserva ativa.");
               setIsSubmitting(false);
               return;
            }
            throw error;
         }

         navigate('/admin/agenda');
      } catch (err: any) {
         alert('Erro ao salvar: ' + err.message);
      } finally {
         setIsSubmitting(false);
      }
   };

   if (loading) {
      return (
         <div className="flex h-screen items-center justify-center bg-background-dark font-outfit">
            <div className="relative size-16 flex items-center justify-center">
               <div className="absolute inset-0 border-2 border-primary/5 rounded-full"></div>
               <div className="absolute inset-0 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
               <span className="material-symbols-outlined text-accent-gold scale-75">box_edit</span>
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
                     onClick={() => navigate(-1)}
                     className="size-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-accent-gold group active:scale-95 transition-all"
                  >
                     <span className="material-symbols-outlined !text-xl group-hover:-translate-x-1 transition-transform">west</span>
                  </button>
                  <div className="space-y-1">
                     <p className="text-[8px] font-black uppercase tracking-[0.5em] text-accent-gold/40 leading-none">Curadoria Interna</p>
                     <h1 className="font-display italic text-2xl text-white">Novo Lançamento</h1>
                  </div>
               </div>
            </div>
         </header>

         <main className="relative z-10 p-8 lg:p-12 space-y-12 pb-48 w-full max-w-screen-md mx-auto overflow-x-hidden">
            <div className="flex bg-white/5 p-2 rounded-3xl border border-white/10 shadow-huge animate-reveal">
               <button
                  onClick={() => setForm({ ...form, type: 'APPOINTMENT' })}
                  className={`flex-1 h-16 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-700 flex items-center justify-center gap-3 ${form.type === 'APPOINTMENT' ? 'bg-white text-primary shadow-huge' : 'text-white/20 hover:text-white/40'}`}
               >
                  <span className="material-symbols-outlined !text-sm">content_cut</span>
                  <span>Atendimento</span>
               </button>
               <button
                  onClick={() => setForm({ ...form, type: 'BLOCK' })}
                  className={`flex-1 h-16 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-700 flex items-center justify-center gap-3 ${form.type === 'BLOCK' ? 'bg-rose-500 text-white shadow-huge' : 'text-white/20 hover:text-white/40'}`}
               >
                  <span className="material-symbols-outlined !text-sm">block_flipped</span>
                  <span>Bloqueio</span>
               </button>
            </div>

            <div className="space-y-12 animate-reveal stagger-1">
               {form.type === 'APPOINTMENT' ? (
                  <section className="space-y-10 group">
                     {/* Client Identification */}
                     <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <span className="w-6 h-px bg-accent-gold/40"></span>
                           <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">01. Identificar Membro</label>
                        </div>
                        <div className="relative">
                           <div className={`absolute inset-0 bg-accent-gold/5 blur-2xl transition-opacity duration-300 ${searchClient ? 'opacity-100' : 'opacity-0'}`}></div>
                           <input
                              type="text"
                              placeholder="Filtro por nome ou identidade..."
                              className="relative w-full h-18 bg-surface-dark border border-white/10 rounded-[28px] px-8 text-sm focus:ring-0 focus:border-accent-gold/40 transition-all placeholder:text-white/10 shadow-huge"
                              value={searchClient}
                              onChange={e => { setSearchClient(e.target.value); setForm({ ...form, clientId: '', clientName: e.target.value }); }}
                           />
                           {filteredClients.length > 0 && (
                              <div className="absolute top-[calc(100%+12px)] left-0 w-full bg-surface-dark/95 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden z-[100] shadow-hugest animate-reveal">
                                 {filteredClients.map(c => (
                                    <button
                                       key={c.id}
                                       onClick={() => { setForm({ ...form, clientId: c.id, clientName: c.name }); setSearchClient(c.name); }}
                                       className="w-full p-6 text-left border-b border-white/5 hover:bg-white/5 transition-colors flex items-center justify-between group/item"
                                    >
                                       <div>
                                          <p className="font-bold text-sm group-hover/item:text-accent-gold transition-colors">{c.name}</p>
                                          <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-1">{c.phone}</p>
                                       </div>
                                       <span className="material-symbols-outlined text-accent-gold/20 group-hover/item:text-accent-gold transition-colors">verified</span>
                                    </button>
                                 ))}
                              </div>
                           )}
                        </div>
                        {form.clientId && (
                           <div className="flex items-center gap-3 px-4 animate-reveal">
                              <span className="material-symbols-outlined text-emerald-400 !text-sm">verified_user</span>
                              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{form.clientName} (MEMBRO VIP)</p>
                           </div>
                        )}
                     </div>

                     {/* Specialist Selection */}
                     <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <span className="w-6 h-px bg-accent-gold/40"></span>
                           <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">02. Curador Responsável</label>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                           {professionals.map(p => (
                              <button
                                 key={p.id}
                                 onClick={() => setForm({ ...form, professionalId: p.id, serviceId: '' })}
                                 className={`group relative flex flex-col items-center gap-3 p-4 rounded-[32px] border transition-all duration-700 ${form.professionalId === p.id ? 'bg-white border-white scale-[1.05] shadow-huge' : 'bg-white/5 border-white/5 hover:bg-white/10 active:scale-95'}`}
                              >
                                 <div className={`size-12 rounded-2xl overflow-hidden border transition-all duration-700 ${form.professionalId === p.id ? 'border-primary/20' : 'border-white/10 opacity-40'}`}>
                                    <img src={p.avatar} className="w-full h-full object-cover" alt="" />
                                 </div>
                                 <span className={`text-[10px] font-black uppercase tracking-widest ${form.professionalId === p.id ? 'text-primary' : 'text-white/30'}`}>{p.name.split(' ')[0]}</span>
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* Signature Service Selection */}
                     <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <span className="w-6 h-px bg-accent-gold/40"></span>
                           <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">03. Experiência de Luxo</label>
                        </div>
                        <div className="relative group/select">
                           <div className="absolute left-6 top-1/2 -translate-y-1/2 text-accent-gold/40">
                              <span className="material-symbols-outlined !text-xl">auto_awesome</span>
                           </div>
                           <select
                              value={form.serviceId}
                              onChange={e => setForm({ ...form, serviceId: e.target.value })}
                              className="w-full h-18 bg-surface-dark border border-white/10 rounded-[28px] pl-16 pr-8 text-sm appearance-none focus:ring-0 focus:border-accent-gold/60 transition-all font-medium italic text-white/80 shadow-huge"
                           >
                              <option value="" className="bg-background-dark text-white/20">Selecionar Assinatura...</option>
                              {filteredServices.map(s => (
                                 <option key={s.id} value={s.id} className="bg-background-dark py-4">
                                    {s.name} — R$ {s.price}
                                 </option>
                              ))}
                           </select>
                           <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/10 group-hover/select:text-accent-gold transition-colors">
                              <span className="material-symbols-outlined">expand_more</span>
                           </div>
                        </div>
                     </div>
                  </section>
               ) : (
                  <section className="space-y-12">
                     <div className="space-y-6">
                        <div className="flex items-center gap-3">
                           <span className="w-6 h-px bg-rose-400/40"></span>
                           <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Motivo da Interrupção</label>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                           {[
                              { label: 'Almoço (1h)', val: 'Intervalo de Luxo|60', icon: 'restaurant_menu' },
                              { label: 'Privado (1h)', val: 'Compromisso Elite|60', icon: 'shield_person' },
                              { label: 'Off Site', val: 'Atendimento Externo|120', icon: 'airport_shuttle' },
                              { label: 'Dia Inteiro', val: 'ALDAY|OFF|1440', icon: 'event_busy' },
                           ].map(p => (
                              <button
                                 key={p.val}
                                 onClick={() => setForm({
                                    ...form,
                                    notes: p.val,
                                    time: p.val.startsWith('ALDAY') ? '00:00' : (p.val.includes('Luxo') ? '12:00' : form.time)
                                 })}
                                 className={`group h-20 rounded-[32px] border flex flex-col items-center justify-center gap-2 transition-all duration-700 ${form.notes === p.val ? 'bg-rose-500 border-rose-500 shadow-huge scale-[1.02]' : 'bg-white/5 border-white/5 hover:bg-white/10 active:scale-95'}`}
                              >
                                 <span className="material-symbols-outlined !text-[20px]">{p.icon}</span>
                                 <span className="text-[8px] font-black tracking-widest uppercase">{p.label}</span>
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="flex items-center gap-3">
                           <span className="w-6 h-px bg-rose-400/40"></span>
                           <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Curador Impactado</label>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                           {professionals.map(p => (
                              <button
                                 key={p.id}
                                 onClick={() => setForm({ ...form, professionalId: p.id })}
                                 className={`group relative flex flex-col items-center gap-3 p-4 rounded-[32px] border transition-all duration-700 ${form.professionalId === p.id ? 'bg-rose-500 border-rose-500 scale-[1.05] shadow-huge' : 'bg-white/5 border-white/5 hover:bg-white/10 active:scale-95'}`}
                              >
                                 <div className={`size-10 rounded-2xl overflow-hidden border border-white/10 transition-all duration-700 ${form.professionalId === p.id ? 'opacity-100' : 'opacity-40'}`}>
                                    <img src={p.avatar} className="w-full h-full object-cover" alt="" />
                                 </div>
                                 <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{p.name.split(' ')[0]}</span>
                              </button>
                           ))}
                        </div>
                     </div>
                  </section>
               )}

               {/* Time and Date Orchestration */}
               <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                  <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <span className="w-6 h-px bg-white/20"></span>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Data da Reserva</label>
                     </div>
                     <input
                        type="date"
                        value={form.date}
                        onChange={e => setForm({ ...form, date: e.target.value })}
                        className="w-full h-18 bg-surface-dark border border-white/10 rounded-[28px] px-8 text-sm focus:border-accent-gold/40 transition-all shadow-huge text-white/60 font-medium"
                     />
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <span className="w-6 h-px bg-white/20"></span>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Instante VIP</label>
                     </div>
                     <input
                        type="time"
                        value={form.time}
                        onChange={e => setForm({ ...form, time: e.target.value })}
                        className="w-full h-18 bg-surface-dark border border-white/10 rounded-[28px] px-8 text-sm focus:border-accent-gold/60 transition-all shadow-huge text-accent-gold font-bold text-center text-xl tracking-tighter tabular-nums"
                     />
                  </div>
               </section>
            </div>
         </main>

         {/* EXECUTION BAR */}
         <div className="fixed bottom-0 inset-x-0 p-8 z-[120]">
            <div className="max-w-screen-md mx-auto">
               <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className={`group relative w-full h-20 rounded-[32px] overflow-hidden transition-all active:scale-[0.98] ${form.type === 'BLOCK' ? 'bg-rose-600' : 'bg-accent-gold'} shadow-hugest`}
               >
                  <div className="relative h-full flex items-center justify-center gap-6 px-10">
                     {isSubmitting ? (
                        <div className="size-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                     ) : (
                        <>
                           <span className={`material-symbols-outlined !text-2xl ${form.type === 'BLOCK' ? 'text-white' : 'text-primary'}`}>{form.type === 'BLOCK' ? 'lock_person' : 'stylus_laser_pointer'}</span>
                           <span className={`text-[11px] font-black uppercase tracking-[0.5em] ${form.type === 'BLOCK' ? 'text-white' : 'text-primary'}`}>
                              {form.type === 'BLOCK' ? 'Confirmar Bloqueio' : 'Publicar Agendamento'}
                           </span>
                           <span className={`material-symbols-outlined !text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-3 transition-all duration-500 ${form.type === 'BLOCK' ? 'text-white' : 'text-primary'}`}>east</span>
                        </>
                     )}
                  </div>
               </button>
            </div>
         </div>

         {/* Decorative Gradients */}
         <div className="fixed top-0 left-0 w-[50vw] h-[50vh] bg-accent-gold/5 blur-[120px] pointer-events-none z-0"></div>
         <div className="fixed bottom-0 right-0 w-[40vw] h-[40vh] bg-primary/20 blur-[100px] pointer-events-none z-10 opacity-30"></div>
      </div>
   );
};

export default AdminBookingForm;
