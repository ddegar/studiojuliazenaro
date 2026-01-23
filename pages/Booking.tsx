
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
  const [viewDate, setViewDate] = useState(new Date());
  const [appointmentsOfMonth, setAppointmentsOfMonth] = useState<any[]>([]);
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
          const mappedPros = prosRes.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            role: p.role || 'Especialista',
            avatar: p.image_url || `https://ui-avatars.com/api/?name=${p.name}&background=random`,
            start_hour: p.start_hour || '08:00',
            end_hour: p.end_hour || '22:00',
            closed_days: p.closed_days || '[0]',
            working_hours: p.working_hours || null
          }));

          // Sort: Julia First
          mappedPros.sort((a: any, b: any) => {
            const isJuliaA = a.name.toLowerCase().includes('julia') || a.name.toLowerCase().includes('júlia');
            const isJuliaB = b.name.toLowerCase().includes('julia') || b.name.toLowerCase().includes('júlia');
            if (isJuliaA && !isJuliaB) return -1;
            if (!isJuliaA && isJuliaB) return 1;
            return a.name.localeCompare(b.name);
          });

          setProfessionals(mappedPros);

          // If professional was pre-selected (from Services or other), hydrate with full data
          if (selection.professional) {
            const fullPro = mappedPros.find((p: any) => p.id === selection.professional?.id);
            if (fullPro) {
              setSelection(prev => ({ ...prev, professional: fullPro }));
            }
          }
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

  // Fetch appointments for the current view month to check availability
  useEffect(() => {
    if (selection.professional) {
      const fetchMonthAppts = async () => {
        const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).toISOString();
        const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

        const { data } = await supabase.from('appointments')
          .select('date, start_time, end_time')
          .eq('professional_id', selection.professional!.id)
          .gte('date', startOfMonth.split('T')[0])
          .lte('date', endOfMonth.split('T')[0])
          .not('status', 'in', '("cancelled", "cancelled_by_user", "no_show")');

        setAppointmentsOfMonth(data || []);
      };
      fetchMonthAppts();
    }
  }, [viewDate, selection.professional]);

  // Sync daily intervals when date is selected
  useEffect(() => {
    if (selection.date && appointmentsOfMonth.length > 0) {
      const daily = appointmentsOfMonth.filter(a => a.date === selection.date);
      const intervals = daily.map((a: any) => {
        const start = new Date(a.start_time);
        const end = new Date(a.end_time);
        return {
          start: start.getHours() * 60 + start.getMinutes(),
          end: end.getHours() * 60 + end.getMinutes()
        };
      });
      setBookedIntervals(intervals);
    } else if (selection.date) {
      // Fallback if month data not yet loaded or empty
      setBookedIntervals([]);
    }
  }, [selection.date, appointmentsOfMonth]);

  const availableHours = useMemo(() => {
    if (!selection.date || !selection.professional || !selection.service) return [];

    const serviceDuration = selection.service.duration || 30;
    const allSlots: string[] = [];

    // Use professional hours if available, else fallback to global
    const p = selection.professional as any;
    const dayOfWeek = new Date(selection.date + 'T00:00:00').getDay();
    const dayConfig = p.working_hours?.[dayOfWeek];

    // IF THE DAY IS CLOSED, NO SLOTS AVAILABLE
    if (dayConfig?.closed === true) return [];

    const startRange = dayConfig?.start || p.start_hour || configs.business_hours_start || '08:00';
    const endRange = dayConfig?.end || p.end_hour || configs.business_hours_end || '22:00';

    const [startH, startM = 0] = startRange.split(':').map(Number);
    const [endH, endM = 0] = endRange.split(':').map(Number);

    // The user wants the LAST slot to start at the end time (e.g. 20:00)
    const businessEndMinutes = (endH * 60 + endM);
    const startMinutesBound = startH * 60 + startM;

    // Avoid invalid range
    if (businessEndMinutes < startMinutesBound) return [];

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
  // Generate calendar grid days
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];

    // Fill empty slots for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: null, full: null, isPast: true });
    }

    const p = selection.professional as any;
    const workingHours = p?.working_hours;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = date.getDay();
      const isPast = date < today;

      let isClosed = false;
      if (workingHours && workingHours[dayOfWeek]) {
        isClosed = workingHours[dayOfWeek].closed;
      } else {
        const closedDaysStr = p?.closed_days || configs.closed_days || '[0]';
        let closedDays: number[] = [];
        try {
          closedDays = JSON.parse(typeof closedDaysStr === 'string' ? closedDaysStr : JSON.stringify(closedDaysStr));
        } catch {
          closedDays = [0];
        }
        isClosed = closedDays.includes(dayOfWeek);
      }

      // Logic to check if "FULL"
      let isFull = false;
      if (!isClosed && !isPast && selection.service) {
        const dayAppts = appointmentsOfMonth.filter(a => a.date === dateString);
        const dayIntervals = dayAppts.map(a => {
          const s = new Date(a.start_time);
          const e = new Date(a.end_time);
          return { start: s.getHours() * 60 + s.getMinutes(), end: e.getHours() * 60 + e.getMinutes() };
        });

        // Calculate if ANY slot is available
        const serviceDuration = selection.service.duration || 30;
        const dayConfig = workingHours?.[dayOfWeek];
        const startRange = dayConfig?.start || p.start_hour || configs.business_hours_start || '08:00';
        const endRange = dayConfig?.end || p.end_hour || configs.business_hours_end || '22:00';
        const [sH, sM = 0] = startRange.split(':').map(Number);
        const [eH, eM = 0] = endRange.split(':').map(Number);
        const startBound = sH * 60 + sM;
        const endBound = eH * 60 + eM;

        let hasAnySlot = false;
        for (let m = startBound; m <= endBound; m += 30) {
          const eM = m + serviceDuration;
          const overlap = dayIntervals.some(b => m < b.end && eM > b.start);
          if (!overlap) {
            hasAnySlot = true;
            break;
          }
        }
        if (!hasAnySlot) isFull = true;
      }

      days.push({
        day,
        full: dateString,
        isPast,
        isClosed,
        isFull,
        weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
      });
    }

    return days;
  }, [viewDate, selection.professional, appointmentsOfMonth, selection.service, configs]);

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
          <div className="p-8 space-y-8 animate-fade-in">
            <div className="space-y-3 text-center">
              <h3 className="text-3xl font-display font-bold text-primary leading-tight">Escolha o melhor dia</h3>
              <p className="text-sm text-gray-500 italic">Visualize a disponibilidade do mês 💖</p>
            </div>

            <div className="bg-white p-8 rounded-[48px] border border-gray-50 premium-shadow space-y-8">
              {/* Calendar Header */}
              <div className="flex items-center justify-between px-2">
                <button
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                  className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-primary"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <h4 className="font-display font-bold text-lg text-primary capitalize">
                  {viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h4>
                <button
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                  className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-primary"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>

              {/* Grid Weekdays */}
              <div className="grid grid-cols-7 gap-2">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((wd, i) => (
                  <div key={i} className="text-center text-[10px] font-black text-gray-300 uppercase py-2">{wd}</div>
                ))}

                {calendarDays.map((d, i) => {
                  const isSelected = selection.date === d.full;
                  const isDisabled = !d.day || d.isPast || d.isClosed || (d.isFull && !isSelected);

                  return (
                    <button
                      key={i}
                      disabled={isDisabled}
                      onClick={() => { if (d.full) { setSelection({ ...selection, date: d.full, time: undefined }); setStep('TIME'); } }}
                      className={`
                                relative aspect-square rounded-2xl flex items-center justify-center text-sm font-bold transition-all
                                ${!d.day ? 'bg-transparent pointer-events-none' : ''}
                                ${isSelected ? 'bg-primary text-white shadow-lg scale-110 z-10' : 'bg-transparent text-primary'}
                                ${d.isPast ? 'opacity-10 grayscale pointer-events-none' : ''}
                                ${d.isClosed && !d.isPast ? 'text-gray-200 pointer-events-none italic' : ''}
                                ${d.isFull && !d.isPast && !isSelected ? 'text-gray-300 line-through' : ''}
                                ${!isSelected && !isDisabled ? 'hover:bg-gray-50 active:scale-95' : ''}
                            `}
                    >
                      {d.day}
                      {d.isFull && !d.isPast && !isSelected && d.day && (
                        <span className="absolute bottom-1.5 size-1 bg-rose-400 rounded-full"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-rose-400"></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sem Horários</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-gray-200"></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fechado</span>
                </div>
              </div>
            </div>

            <div className="bg-accent-gold/5 p-5 rounded-[32px] flex items-center gap-4 border border-accent-gold/10">
              <span className="material-symbols-outlined text-accent-gold">event_available</span>
              <p className="text-[10px] text-primary/70 font-medium leading-relaxed">Dias riscados ou com ponto vermelho estão sem horários disponíveis.</p>
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
          <div className="px-8 pt-4 pb-12 space-y-10 animate-fade-in flex flex-col items-center">

            <div className="w-full bg-white rounded-[48px] p-10 shadow-xl shadow-black/5 border border-gray-100/50 flex flex-col items-center">
              <div className="text-center space-y-2 mb-10">
                <h3 className="text-4xl font-display font-normal text-primary italic">Tudo certo 💛</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Sua reserva está quase concluída</p>
              </div>

              <div className="w-full space-y-8">
                <div className="flex justify-between items-center group">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Especialista</p>
                  <p className="text-base font-bold text-primary">{selection.professional?.name}</p>
                </div>

                <div className="flex justify-between items-center group">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Procedimento</p>
                  <p className="text-base font-bold text-primary">{selection.service?.name}</p>
                </div>

                <div className="flex justify-between items-center group">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Data & Hora</p>
                  <p className="text-base font-bold text-primary">{selection.date?.split('-').reverse().join('/')} • {selection.time}</p>
                </div>

                <div className="pt-8 border-t border-dashed border-gray-100 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Investimento</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-gray-400">R$</span>
                      <span className="text-5xl font-display font-medium text-primary leading-none tracking-tighter">
                        {selection.service?.price}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full space-y-6">
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
                      if (error.message.includes('overlap') || error.message.includes('no_overlap')) {
                        alert("Este horário já está ocupado ou entra em conflito com outro agendamento. Por favor, escolha outro horário.");
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
                className="w-full flex items-center justify-center gap-3 bg-[#0f3e29] text-[#C9A961] h-20 rounded-[32px] font-bold uppercase tracking-[0.2em] text-xs shadow-2xl shadow-[#0f3e29]/20 active:scale-95 transition-all"
              >
                <span>Confirmar Agendamento</span>
                <span className="material-symbols-outlined !text-xl">auto_awesome</span>
              </button>

              <p className="text-[10px] text-gray-400 text-center font-medium leading-relaxed max-w-[240px] mx-auto">
                Ao confirmar, você concorda com nossos termos de reserva.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Booking;
