
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
                  avatar: p.image_url || `https://ui-avatars.com/api/?name=${p.name}`,
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
      if (!searchClient || form.clientId) return [];
      return clients.filter(c => c.name.toLowerCase().includes(searchClient.toLowerCase()));
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

         const { error } = await supabase.from('appointments').insert({
            user_id: form.clientId || null,
            professional_id: form.professionalId,
            service_id: form.type === 'BLOCK' ? null : form.serviceId,
            date: form.date,
            time: form.time,
            status: form.type === 'BLOCK' ? 'BLOCKED' : 'pending',
            created_by: 'ADMIN',
            professional_name: selectedPro?.name || 'Profissional',
            service_name: form.type === 'BLOCK' ? 'Bloqueio' : selectedService?.name,
            price: form.type === 'BLOCK' ? 0 : selectedService?.price,
            notes: form.notes
         });

         if (error) throw error;

         alert(form.type === 'BLOCK' ? 'Agenda bloqueada com sucesso!' : 'Agendamento cadastrado com sucesso!');
         navigate('/admin/agenda');
      } catch (err: any) {
         alert('Erro ao salvar: ' + err.message);
      } finally {
         setIsSubmitting(false);
      }
   };

   if (loading) {
      return (
         <div className="flex h-screen items-center justify-center bg-background-dark">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
         </div>
      );
   }

   return (
      <div className="flex flex-col h-full bg-background-dark text-white">
         <header className="p-6 border-b border-white/5 flex items-center justify-between glass-nav !bg-background-dark/90">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate(-1)} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
               <div>
                  <h1 className="text-lg font-bold">Novo Lançamento</h1>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Painel Administrativo</p>
               </div>
            </div>
         </header>

         <main className="flex-1 p-6 space-y-10 overflow-y-auto no-scrollbar pb-32">
            <div className="flex bg-white/5 p-1.5 rounded-3xl border border-white/10">
               <button
                  onClick={() => setForm({ ...form, type: 'APPOINTMENT' })}
                  className={`flex-1 h-12 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${form.type === 'APPOINTMENT' ? 'bg-primary text-white shadow-lg' : 'text-gray-500'}`}
               >Atendimento</button>
               <button
                  onClick={() => setForm({ ...form, type: 'BLOCK' })}
                  className={`flex-1 h-12 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${form.type === 'BLOCK' ? 'bg-rose-500 text-white shadow-lg' : 'text-gray-500'}`}
               >Bloqueio</button>
            </div>

            <div className="space-y-8 animate-fade-in">
               {form.type === 'APPOINTMENT' ? (
                  <section className="space-y-6">
                     <div className="space-y-3">
                        <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">1. Identificar Cliente</label>
                        <div className="relative">
                           <input
                              type="text"
                              placeholder="Buscar por nome ou celular..."
                              className="w-full h-15 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm focus:ring-accent-gold"
                              value={searchClient}
                              onChange={e => { setSearchClient(e.target.value); setForm({ ...form, clientId: '', clientName: e.target.value }); }}
                           />
                           {filteredClients.length > 0 && (
                              <div className="absolute top-full left-0 w-full mt-2 bg-card-dark border border-white/10 rounded-2xl overflow-hidden z-[60] shadow-2xl">
                                 {filteredClients.map(c => (
                                    <button
                                       key={c.id}
                                       onClick={() => { setForm({ ...form, clientId: c.id, clientName: c.name }); setSearchClient(c.name); }}
                                       className="w-full p-4 text-left border-b border-white/5 hover:bg-white/5 transition-colors flex items-center justify-between"
                                    >
                                       <div>
                                          <p className="font-bold text-sm">{c.name}</p>
                                          <p className="text-[10px] text-gray-500">{c.phone}</p>
                                       </div>
                                       <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                                    </button>
                                 ))}
                              </div>
                           )}
                        </div>
                        {form.clientId && <p className="text-[9px] text-emerald-500 font-bold px-2 flex items-center gap-1"><span className="material-symbols-outlined !text-[12px]">verified</span> Cliente Vinculada ({form.clientName})</p>}
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">2. Especialista</label>
                        <div className="grid grid-cols-2 gap-3">
                           {professionals.map(p => (
                              <button
                                 key={p.id}
                                 onClick={() => setForm({ ...form, professionalId: p.id, serviceId: '' })}
                                 className={`h-14 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all ${form.professionalId === p.id ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}
                              >{p.name.split(' ')[0]}</button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-3">
                        <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">3. Procedimento</label>
                        <select
                           value={form.serviceId}
                           onChange={e => setForm({ ...form, serviceId: e.target.value })}
                           className="w-full h-15 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm appearance-none focus:ring-accent-gold"
                        >
                           <option value="" className="bg-background-dark font-bold">Selecione o serviço...</option>
                           {filteredServices.map(s => <option key={s.id} value={s.id} className="bg-background-dark">
                              {s.name} - R$ {s.price}
                           </option>)}
                        </select>
                        <p className="text-[9px] text-gray-500 px-2 italic font-medium">Mostrando apenas serviços vinculados à profissional selecionada.</p>
                     </div>
                  </section>
               ) : (
                  <section className="space-y-6">
                     <div className="space-y-3">
                        <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">Motivo do Bloqueio</label>
                        <input
                           type="text"
                           placeholder="Ex: Almoço, Manutenção, Particular..."
                           className="w-full h-15 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm focus:ring-rose-500"
                           value={form.notes}
                           onChange={e => setForm({ ...form, notes: e.target.value })}
                        />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">Especialista Afetada</label>
                        <div className="grid grid-cols-2 gap-3">
                           {professionals.map(p => (
                              <button
                                 key={p.id}
                                 onClick={() => setForm({ ...form, professionalId: p.id })}
                                 className={`h-14 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all ${form.professionalId === p.id ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}
                              >{p.name.split(' ')[0]}</button>
                           ))}
                        </div>
                     </div>
                  </section>
               )}

               <section className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                     <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">Data</label>
                     <input
                        type="date"
                        value={form.date}
                        onChange={e => setForm({ ...form, date: e.target.value })}
                        className="w-full h-15 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm"
                     />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">Horário</label>
                     <input
                        type="time"
                        value={form.time}
                        onChange={e => setForm({ ...form, time: e.target.value })}
                        className="w-full h-15 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-black text-primary"
                     />
                  </div>
               </section>
            </div>
         </main>

         <div className="p-6 glass-nav !bg-background-dark/95 border-t border-white/10">
            <button
               onClick={handleSave}
               disabled={isSubmitting}
               className={`w-full h-16 rounded-3xl font-bold uppercase tracking-[0.3em] text-[11px] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all ${form.type === 'BLOCK' ? 'bg-rose-600 shadow-rose-600/20' : 'bg-primary shadow-primary/30'}`}
            >
               {isSubmitting ? <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (
                  <>
                     <span className="material-symbols-outlined">{form.type === 'BLOCK' ? 'lock' : 'calendar_add_on'}</span>
                     {form.type === 'BLOCK' ? 'BLOQUEAR AGENDA' : 'EFETUAR LANÇAMENTO'}
                  </>
               )}
            </button>
         </div>
      </div>
   );
};

export default AdminBookingForm;
