
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Service, Professional, Appointment } from '../types';
import { supabase } from '../services/supabase';

type BookingStep = 'PROFESSIONAL' | 'SERVICE' | 'DATE' | 'TIME' | 'CONFIRM';

const Booking: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preSelected = location.state as { professional: Professional, service?: Service } | null;

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookedIntervals, setBookedIntervals] = useState<{ start: number, end: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<{ [key: string]: any }>({
    business_hours_start: '08:00',
    business_hours_end: '22:00',
    closed_days: '[0]'
  });
  const [step, setStep] = useState<BookingStep>(
    preSelected?.service ? 'DATE' : (preSelected?.professional ? 'SERVICE' : 'PROFESSIONAL')
  );

  const [selection, setSelection] = useState<{
    professional?: Professional;
    service?: Service;
    date?: string;
    time?: string;
  }>({
    professional: preSelected?.professional,
    service: preSelected?.service,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prosRes, servsRes] = await Promise.all([
          supabase.from('professionals').select('*').eq('active', true),
          supabase.from('services').select('*').eq('active', true)
        ]);

        if (prosRes.data) {
          setProfessionals(prosRes.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            role: p.role || 'Especialista',
            avatar: p.image_url || `https://ui-avatars.com/api/?name=${p.name}&background=random`,
            start_hour: p.start_hour || '08:00',
            end_hour: p.end_hour || '22:00',
            closed_days: p.closed_days || '[0]'
          })));
        }
        if (servsRes.data) {
          setServices(servsRes.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            price: s.price,
            duration: s.duration,
            imageUrl: s.image_url,
            professionalIds: s.professional_ids || [],
            pointsReward: s.points_reward
          })));
        }

        const { data: configData } = await supabase.from('studio_config').select('*');
        if (configData) {
          const configMap = (configData || []).reduce((acc: any, item: any) => {
            acc[item.key] = item.value;
            return acc;
          }, {});
          setConfigs(prev => ({ ...prev, ...configMap }));
        }
      } catch (e) {
        console.error('Booking fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch appointments for availability (using start_time and end_time)
  useEffect(() => {
    if (selection.date && selection.professional) {
      const fetchAppts = async () => {
        // Fetch ALL appointments/blocks for the day for this professional
        const { data } = await supabase.from('appointments')
          .select('start_time, end_time')
          .eq('date', selection.date)
          .eq('professional_id', selection.professional!.id)
          .in('status', ['scheduled', 'blocked', 'rescheduled', 'confirmed', 'BLOCKED']); // Only these occupy time

        if (data) {
          // Convert times to minutes from midnight for easy comparison
          const intervals = data.map((a: any) => {
            const start = new Date(a.start_time);
            const end = new Date(a.end_time);
            return {
              start: start.getHours() * 60 + start.getMinutes(),
              end: end.getHours() * 60 + end.getMinutes()
            };
          });
          setBookedIntervals(intervals);
        } else {
          setBookedIntervals([]);
        }
      };
      fetchAppts();
    }
  }, [selection.date, selection.professional]);

  const availableHours = useMemo(() => {
    if (!selection.date || !selection.professional || !selection.service) return [];

    const serviceDuration = selection.service.duration || 30;
    const allSlots: string[] = [];

    // Use professional hours if available, else fallback to global
    const p = selection.professional as any;
    const dayOfWeek = new Date(selection.date + 'T00:00:00').getDay();
    const dayConfig = p.working_hours?.[dayOfWeek];

    const startRange = dayConfig?.start || p.start_hour || configs.business_hours_start || '08:00';
    const endRange = dayConfig?.end || p.end_hour || configs.business_hours_end || '22:00';

    const [startH, startM = 0] = startRange.split(':').map(Number);
    const [endH, endM = 0] = endRange.split(':').map(Number);

    // The "End Time" is now the "Last possible start time"
    const businessEndMinutes = endH * 60 + endM;
    const startMinutesBound = startH * 60 + startM;

    // Generate slots every 30 minutes from startBound to endBound
    for (let m = startMinutesBound; m <= businessEndMinutes; m += 30) {
      const hStr = Math.floor(m / 60).toString().padStart(2, '0');
      const mStr = (m % 60).toString().padStart(2, '0');
      allSlots.push(`${hStr}:${mStr}`);
    }

    return allSlots.filter(startTime => {
      const [hStr, mStr] = startTime.split(':');
      const startMinutes = parseInt(hStr) * 60 + parseInt(mStr);
      const endMinutes = startMinutes + serviceDuration;

      // Overlap Check: Does this specific requested interval overlap with ANY booked interval?
      const hasOverlap = bookedIntervals.some(booked => {
        return startMinutes < booked.end && endMinutes > booked.start;
      });

      return !hasOverlap;
    });
  }, [selection.date, selection.professional, bookedIntervals, selection.service, configs]);

  // Generate real dates (Next 14 days)
  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const year = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const dateString = `${year}-${monthStr}-${dayStr}`;

      const p = selection.professional as any;
      const dayOfWeek = d.getDay();
      const workingHours = p?.working_hours;

      let isClosed = false;
      if (workingHours && workingHours[dayOfWeek]) {
        isClosed = workingHours[dayOfWeek].closed;
      } else {
        const closedDaysStr = p?.closed_days || configs.closed_days || '[0]';
        const closedDays = JSON.parse(typeof closedDaysStr === 'string' ? closedDaysStr : JSON.stringify(closedDaysStr));
        isClosed = closedDays.includes(dayOfWeek);
      }

      if (!isClosed) {
        dates.push({
          full: dateString,
          day: dayStr,
          month: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
          weekday: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
        });
      }
    }
    return dates;
  }, [configs.closed_days, selection.professional]);

  const handleStepBack = () => {
    if (step === 'CONFIRM') setStep('TIME');
    else if (step === 'TIME') setStep('DATE');
    else if (step === 'DATE') setStep('SERVICE');
    else if (step === 'SERVICE') setStep('PROFESSIONAL');
    else navigate(-1);
  };

  if (loading && professionals.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background-light">
      <header className="glass-nav p-6 flex items-center justify-between border-b sticky top-0 z-50">
        <button onClick={handleStepBack} className="material-symbols-outlined text-primary">arrow_back_ios_new</button>
        <h2 className="font-display font-bold text-primary">Sua Experiência</h2>
        <span className="size-6"></span>
      </header>

      {/* Progress Elite */}
      <div className="px-8 py-5 bg-white border-b sticky top-[68px] z-40">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
            {step === 'PROFESSIONAL' && 'Quem vai cuidar de você?'}
            {step === 'SERVICE' && 'Seu cuidado sob medida'}
            {step === 'DATE' && 'O melhor momento para você'}
            {step === 'TIME' && 'Seu horário, do seu jeito'}
            {step === 'CONFIRM' && 'Tudo certo 💖'}
          </span>
          <span className="text-[10px] font-black text-accent-gold">{['PROFESSIONAL', 'SERVICE', 'DATE', 'TIME', 'CONFIRM'].indexOf(step) + 1} / 5</span>
        </div>
        <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-700 ease-in-out"
            style={{ width: `${((['PROFESSIONAL', 'SERVICE', 'DATE', 'TIME', 'CONFIRM'].indexOf(step) + 1) / 5) * 100}%` }}
          ></div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        {step === 'PROFESSIONAL' && (
          <div className="p-8 space-y-10 animate-fade-in">
            <div className="space-y-3">
              <h3 className="text-3xl font-display font-bold text-primary leading-tight">Escolha quem vai <br />cuidar de você 💖</h3>
              <p className="text-sm text-gray-500 italic">Cada profissional tem um estilo único e especial</p>
            </div>
            <div className="space-y-5">
              {professionals.length > 0 ? professionals.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelection({ professional: p }); setStep('SERVICE'); }}
                  className="w-full bg-white p-6 rounded-[32px] border border-gray-100 flex items-center gap-6 active:scale-[0.98] transition-all shadow-sm text-left group"
                >
                  <img src={p.avatar} className="size-20 rounded-2xl object-cover ring-4 ring-primary/5 group-hover:ring-accent-gold/20 transition-all" alt={p.name} />
                  <div className="flex-1 space-y-1">
                    <p className="font-bold text-xl text-primary">{p.name}</p>
                    <p className="text-[10px] text-accent-gold font-black uppercase tracking-widest">{p.role}</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-200">chevron_right</span>
                </button>
              )) : (
                <p className="text-center text-gray-400 py-10 italic">Nenhuma profissional disponível no momento.</p>
              )}
            </div>
          </div>
        )}

        {step === 'SERVICE' && (
          <div className="p-8 space-y-10 animate-fade-in">
            <div className="space-y-3">
              <h3 className="text-3xl font-display font-bold text-primary leading-tight">Um cuidado feito <br />sob medida ✨</h3>
              <p className="text-sm text-gray-500 italic">Escolha o serviço que combina com você hoje</p>
            </div>
            <div className="space-y-4">
              {services.filter(s => s.professionalIds.includes(selection.professional?.id!)).length > 0 ?
                services.filter(s => s.professionalIds.includes(selection.professional?.id!)).map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelection(prev => ({ ...prev, service: s })); setStep('DATE'); }}
                    className="w-full bg-white p-6 rounded-[32px] border border-gray-100 flex items-center gap-5 active:scale-[0.98] transition-all shadow-sm text-left group"
                  >
                    <img src={s.imageUrl || 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=100'} className="size-16 rounded-2xl object-cover" alt={s.name} />
                    <div className="flex-1 space-y-0.5">
                      <p className="font-bold text-lg text-primary">{s.name}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{s.duration} min • R$ {s.price}</p>
                    </div>
                    <span className="material-symbols-outlined text-gray-200">chevron_right</span>
                  </button>
                )) : (
                  <p className="text-center text-gray-400 py-10 italic">Esta profissional não possui serviços cadastrados.</p>
                )}
            </div>
          </div>
        )}

        {step === 'DATE' && (
          <div className="p-8 space-y-10 animate-fade-in">
            <div className="space-y-3 text-center">
              <h3 className="text-3xl font-display font-bold text-primary leading-tight">Encontre o melhor <br />momento para você</h3>
              <p className="text-sm text-gray-500 italic">Escolha com calma. Estamos aqui para te receber.</p>
            </div>

            <div className="bg-white p-6 rounded-[48px] border border-gray-50 premium-shadow space-y-8">
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
                {availableDates.map(d => (
                  <button
                    key={d.full}
                    onClick={() => { setSelection({ ...selection, date: d.full, time: undefined }); setStep('TIME'); }}
                    className={`shrink-0 w-20 h-24 rounded-3xl flex flex-col items-center justify-center transition-all border ${selection.date === d.full ? 'bg-primary text-white border-primary shadow-xl scale-105' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                  >
                    <span className="text-[8px] font-black uppercase tracking-widest mb-1">{d.weekday}</span>
                    <span className="text-2xl font-black">{d.day}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest mt-1">{d.month}</span>
                  </button>
                ))}
              </div>

              <div className="bg-accent-gold/5 p-5 rounded-2xl flex items-center gap-4 border border-accent-gold/10">
                <span className="material-symbols-outlined text-accent-gold">event_available</span>
                <p className="text-[10px] text-primary/70 font-medium leading-relaxed">Selecionamos apenas dias com agenda aberta para sua comodidade.</p>
              </div>
            </div>
          </div>
        )}

        {step === 'TIME' && (
          <div className="p-8 space-y-10 animate-fade-in">
            <div className="space-y-3 text-center">
              <h3 className="text-3xl font-display font-bold text-primary leading-tight">Seu horário, <br />do seu jeito 💖</h3>
              <p className="text-sm text-gray-500 italic">Selecionamos apenas horários disponíveis para você</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {availableHours.map(t => (
                <button
                  key={t}
                  onClick={() => { setSelection(prev => ({ ...prev, time: t })); setStep('CONFIRM'); }}
                  className="h-16 rounded-2xl text-xs font-black bg-white border border-gray-100 text-primary shadow-sm hover:bg-primary hover:text-white transition-all active:scale-95"
                >
                  {t}
                </button>
              ))}
              {availableHours.length === 0 && (
                <div className="col-span-3 py-16 text-center opacity-30">
                  <span className="material-symbols-outlined !text-6xl">event_busy</span>
                  <p className="text-sm font-bold mt-4">Nenhum horário livre para este dia.😔</p>
                </div>
              )}
            </div>

            <button onClick={() => setStep('DATE')} className="w-full text-[10px] font-black text-accent-gold uppercase tracking-[0.3em] text-center mt-6">Alterar Data</button>
          </div>
        )}

        {step === 'CONFIRM' && (
          <div className="p-8 space-y-12 animate-fade-in">
            <div className="bg-white rounded-[48px] p-8 border border-gray-100 premium-shadow space-y-10">
              <div className="text-center space-y-3">
                <h3 className="text-4xl font-display font-bold text-primary">Tudo certo 💖</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.25em]">Sua reserva está quase concluída</p>
              </div>

              <div className="space-y-6 pt-6 border-t border-gray-50">
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Especialista</p>
                  <p className="text-sm font-bold text-primary">{selection.professional?.name}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Procedimento</p>
                  <p className="text-sm font-bold text-primary">{selection.service?.name}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Data & Hora</p>
                  <p className="text-sm font-bold text-primary">{selection.date?.split('-').reverse().join('/')} • {selection.time}</p>
                </div>
                <div className="flex justify-between pt-6 border-t border-dashed border-gray-100">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Investimento</p>
                  <p className="text-3xl font-black text-primary">R$ {selection.service?.price}</p>
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) {
                    alert('Sessão expirada. Por favor, faça login novamente.');
                    navigate('/login');
                    return;
                  }

                  if (!selection.professional?.id || !selection.service?.id || !selection.date || !selection.time) {
                    alert('Por favor, preencha todos os campos obrigatórios.');
                    return;
                  }

                  const startDate = new Date(`${selection.date}T${selection.time}:00`);
                  if (isNaN(startDate.getTime())) {
                    alert("Erro na data selecionada.");
                    return;
                  }

                  const duration = selection.service.duration || 30;
                  const endDate = new Date(startDate.getTime() + duration * 60000);

                  const payload = {
                    user_id: user.id,
                    service_id: selection.service.id,
                    professional_id: selection.professional.id,
                    date: selection.date,
                    time: selection.time,
                    duration: duration,
                    start_time: startDate.toISOString(),
                    end_time: endDate.toISOString(),
                    price: selection.service.price,
                    status: 'scheduled',
                    service_name: selection.service.name,
                    professional_name: selection.professional.name
                  };

                  const { error } = await supabase.from('appointments').insert(payload);

                  if (error) {
                    if (error.message.includes('overlap')) {
                      alert("Desculpe, este horário acabou de ser reservado por outra pessoa. Por favor, atualize e tente outro.");
                    } else {
                      throw error;
                    }
                    return;
                  }

                  // Notify
                  try {
                    await supabase.from('notifications').insert([
                      {
                        user_id: selection.professional.id,
                        title: 'Novo Agendamento',
                        message: `Nova cliente confirmada: ${selection.service.name} as ${selection.time}`,
                        type: 'scheduled'
                      }
                    ]);
                  } catch (e) {
                    console.log('Notification error silent catch');
                  }

                  navigate('/booking/confirmed', { state: { selection } });
                } catch (e: any) {
                  alert('Erro ao confirmar: ' + e.message);
                }
              }}
              className="w-full h-18 bg-primary text-white rounded-[24px] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl active:scale-95 transition-transform"
            >
              Confirmar Agendamento ✨
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Booking;
