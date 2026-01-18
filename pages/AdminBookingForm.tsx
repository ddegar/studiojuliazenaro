
import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Professional, Service } from '../types';

const PROFESSIONALS: Professional[] = [
  { id: 'p1', name: 'Julia Zenaro', role: 'Sênior', avatar: 'https://picsum.photos/100/100?sig=1', active: true, specialties: ['s1', 's2'], rating: 5 },
  { id: 'p2', name: 'Ana Paula', role: 'Artist', avatar: 'https://picsum.photos/100/100?sig=2', active: true, specialties: ['s1', 's3'], rating: 5 },
];

const SERVICES: Service[] = [
  { id: 's1', name: 'Lash Lifting Premium', description: '', price: 150, duration: 60, category: 'Cílios', imageUrl: '', active: true, professionalIds: ['p1', 'p2'], pointsReward: 80 },
  { id: 's2', name: 'Classic Lash', description: '', price: 180, duration: 90, category: 'Cílios', imageUrl: '', active: true, professionalIds: ['p1'], pointsReward: 100 },
  { id: 's3', name: 'Design com Henna', description: '', price: 80, duration: 45, category: 'Sobrancelhas', imageUrl: '', active: true, professionalIds: ['p2'], pointsReward: 40 },
];

const CLIENTS = [
  { id: 'u1', name: 'Mariana Silva', phone: '(11) 99999-9999' },
  { id: 'u2', name: 'Ana Beatriz', phone: '(11) 98888-8888' },
];

const AdminBookingForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { hour?: string, date?: string, proId?: string, type?: 'BLOCK' | 'APPOINTMENT' } | null;

  const [form, setForm] = useState({
    clientId: '',
    clientName: '',
    professionalId: state?.proId || PROFESSIONALS[0].id,
    serviceId: '',
    date: state?.date || new Date().toISOString().split('T')[0],
    time: state?.hour || '09:00',
    type: state?.type || 'APPOINTMENT'
  });

  const [searchClient, setSearchClient] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredClients = useMemo(() => {
    if (!searchClient || form.clientId) return [];
    return CLIENTS.filter(c => c.name.toLowerCase().includes(searchClient.toLowerCase()));
  }, [searchClient, form.clientId]);

  const filteredServices = useMemo(() => {
    return SERVICES.filter(s => s.professionalIds.includes(form.professionalId));
  }, [form.professionalId]);

  const handleSave = () => {
    if (form.type === 'APPOINTMENT' && !form.clientName && !form.clientId) {
      alert('Selecione ou identifique uma cliente.');
      return;
    }
    if (form.type === 'APPOINTMENT' && !form.serviceId) {
      alert('Selecione um procedimento.');
      return;
    }

    setIsSubmitting(true);
    // Simulação de Eventos Automáticos
    setTimeout(() => {
      console.log(`[EVENT] ${form.type === 'BLOCK' ? 'Agenda Bloqueada' : 'Agendamento Criado'}`);
      console.log(`[NOTIF] Cliente notificada via Push/WhatsApp.`);
      alert(form.type === 'BLOCK' ? 'Bloqueio realizado!' : 'Agendamento confirmado!');
      navigate('/admin/agenda');
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-background-dark text-white">
      <header className="p-6 border-b border-white/5 flex items-center justify-between glass-nav !bg-background-dark/90">
         <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
            <div>
               <h1 className="text-lg font-bold">Entrada Operacional</h1>
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Painel de Lançamento</p>
            </div>
         </div>
      </header>

      <main className="flex-1 p-6 space-y-10 overflow-y-auto no-scrollbar pb-32">
         {/* Toggle Tipo de Evento */}
         <div className="flex bg-white/5 p-1.5 rounded-3xl border border-white/10">
            <button 
              onClick={() => setForm({...form, type: 'APPOINTMENT'})}
              className={`flex-1 h-12 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${form.type === 'APPOINTMENT' ? 'bg-primary text-white shadow-lg' : 'text-gray-500'}`}
            >Atendimento</button>
            <button 
              onClick={() => setForm({...form, type: 'BLOCK'})}
              className={`flex-1 h-12 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${form.type === 'BLOCK' ? 'bg-rose-500 text-white shadow-lg' : 'text-gray-500'}`}
            >Bloqueio</button>
         </div>

         <div className="space-y-8 animate-fade-in">
            {form.type === 'APPOINTMENT' ? (
              <section className="space-y-6">
                 {/* 1. SELECIONAR CLIENTE */}
                 <div className="space-y-3">
                    <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">1. Identificar Cliente</label>
                    <div className="relative">
                       <input 
                         type="text" 
                         placeholder="Buscar por nome ou celular..." 
                         className="w-full h-15 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm focus:ring-accent-gold"
                         value={searchClient}
                         onChange={e => { setSearchClient(e.target.value); setForm({...form, clientId: '', clientName: e.target.value}); }}
                       />
                       {filteredClients.length > 0 && (
                          <div className="absolute top-full left-0 w-full mt-2 bg-card-dark border border-white/10 rounded-2xl overflow-hidden z-[60] shadow-2xl">
                             {filteredClients.map(c => (
                                <button 
                                   key={c.id} 
                                   onClick={() => { setForm({...form, clientId: c.id, clientName: c.name}); setSearchClient(c.name); }}
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
                    {form.clientId && <p className="text-[9px] text-emerald-500 font-bold px-2 flex items-center gap-1"><span className="material-symbols-outlined !text-[12px]">verified</span> Cliente Vinculada</p>}
                 </div>

                 {/* 2. SELECIONAR PROFISSIONAL */}
                 <div className="space-y-3">
                    <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">2. Especialista</label>
                    <div className="grid grid-cols-2 gap-3">
                       {PROFESSIONALS.map(p => (
                          <button 
                             key={p.id}
                             onClick={() => setForm({...form, professionalId: p.id, serviceId: ''})}
                             className={`h-14 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all ${form.professionalId === p.id ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}
                          >{p.name.split(' ')[0]}</button>
                       ))}
                    </div>
                 </div>

                 {/* 3. SELECIONAR SERVIÇO */}
                 <div className="space-y-3">
                    <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">3. Procedimento</label>
                    <select 
                       value={form.serviceId}
                       onChange={e => setForm({...form, serviceId: e.target.value})}
                       className="w-full h-15 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm appearance-none focus:ring-accent-gold"
                    >
                       <option value="" className="bg-background-dark">Selecione o serviço...</option>
                       {filteredServices.map(s => <option key={s.id} value={s.id} className="bg-background-dark">{s.name} - R$ {s.price}</option>)}
                    </select>
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
                       onChange={e => setForm({...form, clientName: e.target.value})}
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">Especialistas Afetadas</label>
                    <div className="flex gap-2">
                       <button onClick={() => setForm({...form, professionalId: 'all'})} className={`flex-1 h-14 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all ${form.professionalId === 'all' ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}>Todas</button>
                       {PROFESSIONALS.map(p => (
                          <button key={p.id} onClick={() => setForm({...form, professionalId: p.id})} className={`flex-1 h-14 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all ${form.professionalId === p.id ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}>{p.name.split(' ')[0]}</button>
                       ))}
                    </div>
                 </div>
              </section>
            )}

            {/* DATA E HORA COMUM */}
            <section className="grid grid-cols-2 gap-4">
               <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">Data</label>
                  <input 
                     type="date" 
                     value={form.date}
                     onChange={e => setForm({...form, date: e.target.value})}
                     className="w-full h-15 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm" 
                  />
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black text-gray-600 tracking-[0.2em] pl-2">Horário</label>
                  <input 
                     type="time" 
                     value={form.time}
                     onChange={e => setForm({...form, time: e.target.value})}
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
