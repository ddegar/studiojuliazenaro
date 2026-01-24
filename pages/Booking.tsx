import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Service, Professional } from '../types';
import { supabase } from '../services/supabase';

type BookingStep = 'DATE' | 'TIME' | 'CONFIRM';

const Booking: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preSelected = location.state as { professional: Professional, service: Service } | null;

  // Validation: If no service/pro selected, redirect to Services
  useEffect(() => {
    if (!preSelected?.service || !preSelected?.professional) {
      navigate('/services', { replace: true });
    }
  }, [preSelected, navigate]);

  const [bookedIntervals, setBookedIntervals] = useState<{ start: number, end: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<{ [key: string]: any }>({
    business_hours_start: '08:00',
    business_hours_end: '22:00',
    closed_days: '[0]'
  });
  const [viewDate, setViewDate] = useState(new Date());
  const [appointmentsOfMonth, setAppointmentsOfMonth] = useState<any[]>([]);

  const [step, setStep] = useState<BookingStep>('DATE');

  const [selection, setSelection] = useState<{
    professional?: Professional;
    service?: Service;
    date?: string;
    time?: string;
  }>({
    professional: preSelected?.professional,
    service: preSelected?.service,
  });

  // Fetch Configs and Appointments
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        setLoading(true);
        const { data: configData } = await supabase.from('studio_config').select('*');
        if (configData) {
          const configMap = (configData || []).reduce((acc: any, item: any) => {
            acc[item.key] = item.value;
            return acc;
          }, {});
          setConfigs(prev => ({ ...prev, ...configMap }));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfigs();
  }, []);

  // Fetch Appointments for Month
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

  // Sync Daily Intervals
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
      setBookedIntervals([]);
    }
  }, [selection.date, appointmentsOfMonth]);

  // Available Hours Logic
  const availableHours = useMemo(() => {
    if (!selection.date || !selection.professional || !selection.service) return [];

    const serviceDuration = selection.service.duration || 30;
    const allSlots: string[] = [];
    const p = selection.professional as any;
    const dayOfWeek = new Date(selection.date + 'T00:00:00').getDay();
    const dayConfig = p.working_hours?.[dayOfWeek];

    if (dayConfig?.closed === true) return [];

    const startRange = dayConfig?.start || p.start_hour || configs.business_hours_start || '08:00';
    const endRange = dayConfig?.end || p.end_hour || configs.business_hours_end || '22:00';

    const [startH, startM = 0] = startRange.split(':').map(Number);
    const [endH, endM = 0] = endRange.split(':').map(Number);

    const businessEndMinutes = (endH * 60 + endM);
    const startMinutesBound = startH * 60 + startM;

    if (businessEndMinutes < startMinutesBound) return [];

    for (let m = startMinutesBound; m <= businessEndMinutes; m += 30) {
      const hStr = Math.floor(m / 60).toString().padStart(2, '0');
      const mStr = (m % 60).toString().padStart(2, '0');
      allSlots.push(`${hStr}:${mStr}`);
    }

    return allSlots.filter(startTime => {
      const [hStr, mStr] = startTime.split(':');
      const startMinutes = parseInt(hStr) * 60 + parseInt(mStr);
      const endMinutes = startMinutes + serviceDuration;
      const hasOverlap = bookedIntervals.some(booked => startMinutes < booked.end && endMinutes > booked.start);
      return !hasOverlap;
    });
  }, [selection.date, selection.professional, bookedIntervals, selection.service, configs]);

  // Calendar Days Logic
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push({ day: null, full: null, isPast: true });

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
        let closedDays = [0];
        try { closedDays = JSON.parse(typeof closedDaysStr === 'string' ? closedDaysStr : JSON.stringify(closedDaysStr)); } catch { }
        isClosed = closedDays.includes(dayOfWeek);
      }

      let isFull = false;
      if (!isClosed && !isPast && selection.service) {
        // Logic for isFull (simplified: check if availableHours > 0 is expensive per day. 
        // Usually we skip deep isFull check on Month View for performance OR replicate it.
        // For now, I'll trust the simple check or skip strict "Full" marking if too complex, 
        // but I'll add the basic check if desired. 
        // Replicating basic availability check:
        const dayAppts = appointmentsOfMonth.filter(a => a.date === dateString);
        const dayIntervals = dayAppts.map(a => {
          const s = new Date(a.start_time);
          const e = new Date(a.end_time);
          return { start: s.getHours() * 60 + s.getMinutes(), end: e.getHours() * 60 + e.getMinutes() };
        });

        const serviceDuration = selection.service.duration || 30;
        const dayConfig = workingHours?.[dayOfWeek];
        const startRange = dayConfig?.start || p?.start_hour || configs.business_hours_start || '08:00';
        const endRange = dayConfig?.end || p?.end_hour || configs.business_hours_end || '22:00';
        const [sH, sM = 0] = startRange.split(':').map(Number);
        const [eH, eM = 0] = endRange.split(':').map(Number);
        const startBound = sH * 60 + sM;
        const endBound = eH * 60 + eM;

        let hasSlot = false;
        for (let m = startBound; m <= endBound; m += 30) {
          const eM = m + serviceDuration;
          if (!dayIntervals.some(b => m < b.end && eM > b.start)) {
            hasSlot = true; break;
          }
        }
        if (!hasSlot) isFull = true;
      }

      days.push({ day, full: dateString, isPast, isClosed, isFull });
    }
    return days;
  }, [viewDate, selection.professional, appointmentsOfMonth, selection.service, configs]);

  const handleStepBack = () => {
    if (step === 'CONFIRM') setStep('TIME');
    else if (step === 'TIME') setStep('DATE');
    else navigate(-1);
  };

  if (!selection.service || !selection.professional) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background-light font-outfit antialiased selection:bg-accent-gold/20 selection:text-primary">
      {/* Dynamic Background Flora */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/20 blur-[100px] animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <header className="relative z-50 premium-blur sticky top-0 px-6 py-8 flex items-center justify-between border-b border-primary/5">
        <button
          onClick={handleStepBack}
          className="size-12 rounded-2xl bg-white shadow-sm border border-primary/5 flex items-center justify-center text-primary group active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined !text-xl group-hover:-translate-x-1 transition-transform">west</span>
        </button>
        <div className="text-center">
          <p className="text-[8px] font-black uppercase tracking-[0.5em] text-primary/30 leading-none mb-1">Experiência</p>
          <h2 className="font-display italic text-xl text-primary">Agendamento</h2>
        </div>
        <div className="size-12"></div>
      </header>

      {/* Progress Elite Indicator */}
      <div className="relative z-40 px-8 py-6 bg-background-light/80 backdrop-blur-xl border-b border-primary/5 sticky top-[109px]">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] mb-1">Fase Étapa</span>
            <span className="text-sm font-display italic text-accent-gold">
              {step === 'DATE' && 'O momento perfeito'}
              {step === 'TIME' && 'Sua hora de brilhar'}
              {step === 'CONFIRM' && 'Toque final'}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] mb-1">Progresso</span>
            <span className="text-sm font-outfit font-bold text-primary">{['DATE', 'TIME', 'CONFIRM'].indexOf(step) + 1} de 3</span>
          </div>
        </div>
        <div className="h-[2px] w-full bg-primary/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-gold shadow-[0_0_10px_rgba(201,169,97,0.5)] transition-all duration-1000 ease-out"
            style={{ width: `${((['DATE', 'TIME', 'CONFIRM'].indexOf(step) + 1) / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar pb-32">
        {step === 'DATE' && (
          <div className="p-8 space-y-10 animate-reveal">
            <div className="space-y-4 text-center">
              <h3 className="text-4xl font-display text-primary leading-tight tracking-tight">Quando deseja <br /> <span className="italic text-accent-gold">ser cuidada?</span></h3>
              <p className="text-xs text-primary/40 font-outfit font-light tracking-wide">Selecione uma data disponível em nossa curadoria.</p>
            </div>

            <div className="bg-white p-8 rounded-[48px] shadow-huge border border-primary/5 space-y-10 relative overflow-hidden">
              {/* Aesthetic Accent */}
              <div className="absolute top-0 right-0 w-24 h-1 bg-gradient-to-l from-accent-gold/40 to-transparent"></div>

              {/* Calendar Header Navigation */}
              <div className="flex items-center justify-between px-2">
                <button
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                  className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                >
                  <span className="material-symbols-outlined !text-xl">chevron_left</span>
                </button>
                <h4 className="font-display italic text-2xl text-primary capitalize tracking-tight">
                  {viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h4>
                <button
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                  className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                >
                  <span className="material-symbols-outlined !text-xl">chevron_right</span>
                </button>
              </div>

              {/* Day Names */}
              <div className="grid grid-cols-7 gap-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((wd, i) => (
                  <div key={i} className="text-center text-[9px] font-black text-primary/20 uppercase tracking-[0.2em] pb-4">{wd}</div>
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
                        relative aspect-square rounded-2xl flex flex-col items-center justify-center text-sm font-outfit transition-all duration-500
                        ${!d.day ? 'invisible' : 'visible'} 
                        ${isSelected ? 'bg-primary text-accent-gold shadow-2xl scale-110 z-10' : 'bg-transparent text-primary'} 
                        ${d.isPast ? 'opacity-5 pointer-events-none' : ''} 
                        ${d.isClosed && !d.isPast ? 'opacity-10 pointer-events-none' : ''} 
                        ${d.isFull && !d.isPast && !isSelected ? 'text-primary/10 line-through' : ''} 
                        ${!isSelected && !isDisabled ? 'hover:bg-primary/5 font-bold' : 'font-light'}
                      `}
                    >
                      {d.day}
                      {isSelected && <span className="absolute bottom-2 size-1 bg-accent-gold rounded-full animate-ping"></span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white/40 border border-primary/5 p-6 rounded-[32px] flex items-center gap-5 backdrop-blur-sm">
              <div className="size-10 rounded-2xl bg-accent-gold/10 flex items-center justify-center text-accent-gold">
                <span className="material-symbols-outlined !text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1 leading-none">Status de Agenda</p>
                <p className="text-xs text-primary/40 font-light leading-relaxed">Mostrando horários exclusivos para <span className="font-bold text-primary">{selection.professional.name}</span>.</p>
              </div>
            </div>
          </div>
        )}

        {step === 'TIME' && (
          <div className="p-8 space-y-12 animate-reveal">
            <div className="space-y-4 text-center">
              <h3 className="text-4xl font-display text-primary leading-tight tracking-tight">O momento de <br /> <span className="italic text-accent-gold">renovar-se.</span></h3>
              <p className="text-xs text-primary/40 font-outfit font-light tracking-wide">
                Escolhido o dia <span className="font-bold text-primary">{selection.date?.split('-').reverse().join('/')}</span>. Agora, defina seu horário.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {availableHours.map((t, i) => (
                <button
                  key={t}
                  onClick={() => { setSelection(prev => ({ ...prev, time: t })); setStep('CONFIRM'); }}
                  className={`
                    group animate-reveal h-20 rounded-[32px] flex flex-col items-center justify-center gap-1
                    bg-white border border-primary/5 shadow-xl shadow-primary/5 text-primary tracking-widest
                    hover:bg-primary hover:text-white transition-all duration-500 active:scale-95
                  `}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <span className="text-[10px] font-black uppercase text-primary/30 group-hover:text-white/40 transition-colors">Horário</span>
                  <span className="text-xl font-outfit font-light">{t}</span>
                </button>
              ))}

              {availableHours.length === 0 && (
                <div className="col-span-2 py-24 text-center space-y-6 opacity-30">
                  <div className="size-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined !text-5xl text-primary/20">event_busy</span>
                  </div>
                  <p className="font-outfit text-xs font-black uppercase tracking-[0.3em]">Agenda indisponível para este dia</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setStep('DATE')}
              className="w-full text-[9px] font-black text-accent-gold uppercase tracking-[0.4em] text-center mt-6 py-4 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined !text-sm">calendar_month</span>
              Trocar data de atendimento
            </button>
          </div>
        )}

        {step === 'CONFIRM' && (selection.service && selection.professional) && (
          <div className="px-8 pt-6 pb-20 space-y-12 animate-reveal flex flex-col items-center">
            <div className="w-full relative">
              {/* Detail Ticket Aesthetic */}
              <div className="absolute -top-4 -left-4 size-16 organic-shape-1 bg-accent-gold/10 blur-xl"></div>
              <div className="absolute -bottom-4 -right-4 size-20 organic-shape-2 bg-primary/5 blur-xl"></div>

              <div className="relative w-full bg-white rounded-[56px] p-10 border border-primary/5 shadow-huge overflow-hidden">
                {/* Decorative Header Row */}
                <div className="flex justify-between items-center mb-12">
                  <div className="p-3 bg-primary/5 rounded-2xl border border-primary/5">
                    <span className="material-symbols-outlined text-accent-gold !text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/20 leading-none mb-1">Status</p>
                    <p className="text-xs font-outfit font-bold text-accent-gold">Pronto para Reserva</p>
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-primary/20 uppercase tracking-[0.4em] text-center">Resumo da Experiência</p>
                    <h3 className="text-4xl font-display text-primary leading-tight italic text-center text-shadow-elegant">{selection.service.name}</h3>
                  </div>

                  <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/5 to-transparent"></div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary/40">
                          <span className="material-symbols-outlined !text-xl">person</span>
                        </div>
                        <p className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em]">Especialista</p>
                      </div>
                      <p className="font-outfit text-sm font-bold text-primary">{selection.professional.name}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary/40">
                          <span className="material-symbols-outlined !text-xl">schedule</span>
                        </div>
                        <p className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em]">Data e Hora</p>
                      </div>
                      <p className="font-outfit text-sm font-bold text-primary">
                        {selection.date?.split('-').reverse().join('/')} <span className="text-accent-gold opacity-40 ml-1">•</span> {selection.time}
                      </p>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-dashed border-primary/10 flex flex-col items-center gap-2">
                    <p className="text-[10px] font-black text-primary/20 uppercase tracking-[0.3em]">Total do Investimento</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-outfit font-black text-primary/20">R$</span>
                      <span className="text-6xl font-outfit font-light text-primary tracking-tighter leading-none">{selection.service.price}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full space-y-6">
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) { alert('Sessão expirada.'); navigate('/login'); return; }

                    const startDate = new Date(`${selection.date}T${selection.time}:00`);
                    const duration = selection.service!.duration || 30;
                    const endDate = new Date(startDate.getTime() + duration * 60000);

                    const payload = {
                      user_id: user.id,
                      service_id: selection.service!.id,
                      professional_id: selection.professional!.id,
                      date: selection.date,
                      time: selection.time,
                      duration: duration,
                      start_time: startDate.toISOString(),
                      end_time: endDate.toISOString(),
                      price: selection.service!.price,
                      status: 'scheduled',
                      service_name: selection.service!.name,
                      professional_name: selection.professional!.name
                    };

                    const { error } = await supabase.from('appointments').insert(payload);
                    if (error) throw error;
                    navigate('/booking/confirmed', { state: { selection } });
                  } catch (e: any) { alert('Erro: ' + e.message); }
                  finally { setLoading(false); }
                }}
                disabled={loading}
                className="group relative w-full h-20 bg-primary text-white rounded-[32px] overflow-hidden shadow-huge hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <div className="relative z-10 flex items-center justify-center gap-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.4em] text-accent-gold group-hover:text-white transition-colors">
                    {loading ? 'Confirmando...' : 'Finalizar Agendamento'}
                  </span>
                  <span className="material-symbols-outlined !text-xl text-accent-gold group-hover:translate-x-2 transition-transform">verified</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s]"></div>
              </button>

              <button
                onClick={() => setStep('TIME')}
                className="w-full text-[9px] font-black text-primary/30 uppercase tracking-[0.4em] text-center hover:text-primary transition-colors py-4"
              >
                Revisar horário
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Persistence Safe Area Blur */}
      <div className="fixed bottom-0 left-0 w-full h-8 bg-background-light pointer-events-none z-[100]"></div>
    </div>
  );
};

export default Booking;
