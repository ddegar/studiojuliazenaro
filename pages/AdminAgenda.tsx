
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Professional, UserRole } from '../types';

const PROFESSIONALS: Professional[] = [
  { id: 'p1', name: 'Julia Zenaro', role: 'Sênior', avatar: 'https://picsum.photos/100/100?sig=1', active: true, specialties: ['s1'], rating: 5 },
  { id: 'p2', name: 'Ana Paula', role: 'Artist', avatar: 'https://picsum.photos/100/100?sig=2', active: true, specialties: ['s1'], rating: 5 },
];

const AdminAgenda: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser] = useState({
    role: 'MASTER_ADMIN' as UserRole,
    professionalId: 'p1'
  });

  const isMaster = currentUser.role === 'MASTER_ADMIN';
  const [selectedProId, setSelectedProId] = useState<string>(isMaster ? 'p1' : currentUser.professionalId!);
  
  const daysInMonth = 30;
  const currentMonth = "Novembro";

  const visibleProfessionals = useMemo(() => {
    if (isMaster) return PROFESSIONALS;
    return PROFESSIONALS.filter(p => p.id === currentUser.professionalId);
  }, [isMaster, currentUser.professionalId]);

  const handleDayClick = (day: number) => {
    const dateStr = `2023-11-${day.toString().padStart(2, '0')}`;
    // Passa o proId como parâmetro de busca para a Timeline
    navigate(`/admin/agenda/day/${dateStr}?proId=${selectedProId}`);
  };

  return (
    <div className="flex flex-col h-full bg-background-dark text-white pb-32">
      <header className="sticky top-0 z-50 glass-nav !bg-background-dark/80 p-6 border-b border-white/5 flex flex-col gap-6">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate('/admin')} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
               <div>
                  <h1 className="text-xl font-display font-bold">Agenda Mestra</h1>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em]">Controle Operacional</p>
               </div>
            </div>
            <button onClick={() => navigate('/admin/agenda/new')} className="size-12 rounded-full bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20 ring-4 ring-primary/10">
               <span className="material-symbols-outlined">add</span>
            </button>
         </div>

         {/* Filtro de Profissionais Estratégico */}
         <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {visibleProfessionals.map(p => (
               <button 
                  key={p.id}
                  onClick={() => setSelectedProId(p.id)}
                  className={`px-6 h-10 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 border ${selectedProId === p.id ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-500'}`}
               >{p.name}</button>
            ))}
         </div>
      </header>

      <main className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar">
         <div className="flex justify-between items-center px-4">
            <h2 className="text-2xl font-display font-bold">{currentMonth} <span className="text-gray-600">2023</span></h2>
            <div className="flex gap-4">
               <button className="material-symbols-outlined text-gray-500 hover:text-white transition-colors">chevron_left</button>
               <button className="material-symbols-outlined text-gray-500 hover:text-white transition-colors">chevron_right</button>
            </div>
         </div>

         {/* Grid de Calendário com Status Operacional */}
         <div className="grid grid-cols-7 gap-3">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
               <div key={d} className="text-center text-[9px] font-black uppercase text-gray-700 pb-2">{d}</div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
               const day = i + 1;
               const isToday = day === 6;
               
               // Mock de status para visualização operacional
               const hasAppointments = day % 2 === 0;
               const isFull = day % 7 === 0;
               const hasBlocks = day % 5 === 0;

               return (
                  <button 
                    key={i} 
                    onClick={() => handleDayClick(day)}
                    className={`aspect-square rounded-3xl border flex flex-col items-center justify-center gap-1.5 transition-all relative ${isToday ? 'bg-primary border-primary shadow-xl shadow-primary/30 scale-105' : 'bg-white/5 border-white/5 hover:border-accent-gold/30'}`}
                  >
                     <span className={`text-xs font-black ${isToday ? 'text-white' : 'text-gray-400'}`}>{day}</span>
                     
                     <div className="flex gap-1">
                        {hasAppointments && <div className={`size-1.5 rounded-full ${isFull ? 'bg-rose-500' : 'bg-accent-gold'}`}></div>}
                        {hasBlocks && <div className="size-1.5 rounded-full bg-gray-600"></div>}
                     </div>
                  </button>
               );
            })}
         </div>

         {/* Legenda Operacional */}
         <div className="bg-card-dark p-8 rounded-[40px] border border-white/5 space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Resumo de Disponibilidade</h3>
            <div className="grid grid-cols-2 gap-6">
               <div className="flex items-center gap-3">
                  <div className="size-3 rounded-full bg-accent-gold shadow-[0_0_10px_rgba(228,199,143,0.4)]"></div>
                  <span className="text-[11px] font-bold text-gray-400">Com Horários</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="size-3 rounded-full bg-rose-500"></div>
                  <span className="text-[11px] font-bold text-gray-400">Agenda Cheia</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="size-3 rounded-full bg-gray-600"></div>
                  <span className="text-[11px] font-bold text-gray-400">Bloqueios Admin</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="size-3 rounded-full border border-dashed border-gray-600"></div>
                  <span className="text-[11px] font-bold text-gray-400">Livre</span>
               </div>
            </div>
         </div>
      </main>
    </div>
  );
};

export default AdminAgenda;
