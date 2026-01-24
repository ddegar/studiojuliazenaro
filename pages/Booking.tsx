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
    <div className="flex flex-col h-full bg-background-light">
      <header className="glass-nav p-6 flex items-center justify-between border-b sticky top-0 z-50">
        <button onClick={handleStepBack} className="material-symbols-outlined text-primary">arrow_back_ios_new</button>
        <h2 className="font-display font-bold text-primary">Agendamento</h2>
        <span className="size-6"></span>
      </header>

      {/* Progress Elite (3 Steps) */}
      <div className="px-8 py-5 bg-white border-b sticky top-[68px] z-40">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
            {step === 'DATE' && 'O melhor momento'}
            {step === 'TIME' && 'Seu horário'}
            {step === 'CONFIRM' && 'Confirmação'}
          </span>
          <span className="text-[10px] font-black text-accent-gold">{['DATE', 'TIME', 'CONFIRM'].indexOf(step) + 1} / 3</span>
        </div>
        <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-700 ease-in-out"
            style={{ width: `${((['DATE', 'TIME', 'CONFIRM'].indexOf(step) + 1) / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        {step === 'DATE' && (
          <div className="p-8 space-y-8 animate-fade-in">
            <div className="space-y-3 text-center">
              <h3 className="text-3xl font-display font-bold text-primary leading-tight">Escolha o melhor dia</h3>
              <p className="text-sm text-gray-500 italic">Visualize a disponibilidade do mês 💖</p>
            </div>
            <div className="bg-white p-8 rounded-[48px] border border-gray-50 premium-shadow space-y-8">
              {/* Calendar Header */}
              <div className="flex items-center justify-between px-2">
                <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-primary"><span className="material-symbols-outlined">chevron_left</span></button>
                <h4 className="font-display font-bold text-lg text-primary capitalize">{viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h4>
                <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-primary"><span className="material-symbols-outlined">chevron_right</span></button>
              </div>
              {/* Grid */}
              <div className="grid grid-cols-7 gap-2">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((wd, i) => <div key={i} className="text-center text-[10px] font-black text-gray-300 uppercase py-2">{wd}</div>)}
                {calendarDays.map((d, i) => {
                  const isSelected = selection.date === d.full;
                  const isDisabled = !d.day || d.isPast || d.isClosed || (d.isFull && !isSelected);
                  return (
                    <button
                      key={i}
                      disabled={isDisabled}
                      onClick={() => { if (d.full) { setSelection({ ...selection, date: d.full, time: undefined }); setStep('TIME'); } }}
                      className={`relative aspect-square rounded-2xl flex items-center justify-center text-sm font-bold transition-all ${!d.day ? 'invisible' : ''} ${isSelected ? 'bg-primary text-white shadow-lg scale-110 z-10' : 'bg-transparent text-primary'} ${d.isPast ? 'opacity-10 pointer-events-none' : ''} ${d.isClosed && !d.isPast ? 'text-gray-200 pointer-events-none' : ''} ${d.isFull && !d.isPast && !isSelected ? 'text-gray-300 line-through' : ''} ${!isSelected && !isDisabled ? 'hover:bg-gray-50' : ''}`}
                    >
                      {d.day}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="bg-accent-gold/5 p-5 rounded-[32px] flex items-center gap-4 border border-accent-gold/10">
              <span className="material-symbols-outlined text-accent-gold">event_available</span>
              <p className="text-[10px] text-primary/70 font-medium leading-relaxed">Mostrando disponibilidade de {selection.professional.name}.</p>
            </div>
          </div>
        )}

        {step === 'TIME' && (
          <div className="p-8 space-y-10 animate-fade-in">
            <div className="space-y-3 text-center">
              <h3 className="text-3xl font-display font-bold text-primary leading-tight">Escolha o horário, <br />do seu jeito 💖</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {availableHours.map(t => (
                <button key={t} onClick={() => { setSelection(prev => ({ ...prev, time: t })); setStep('CONFIRM'); }} className="h-16 rounded-2xl text-xs font-black bg-white border border-gray-100 text-primary shadow-sm hover:bg-primary hover:text-white transition-all active:scale-95">{t}</button>
              ))}
              {availableHours.length === 0 && (
                <div className="col-span-3 py-16 text-center opacity-30"><span className="material-symbols-outlined !text-6xl">event_busy</span><p className="text-sm font-bold mt-4">Nenhum horário livre.</p></div>
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
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Confira os detalhes</p>
              </div>
              <div className="w-full space-y-8">
                <div className="flex justify-between items-center"><p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Especialista</p><p className="text-base font-bold text-primary">{selection.professional.name}</p></div>
                <div className="flex justify-between items-center"><p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Procedimento</p><p className="text-base font-bold text-primary">{selection.service.name}</p></div>
                <div className="flex justify-between items-center"><p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Data & Hora</p><p className="text-base font-bold text-primary">{selection.date?.split('-').reverse().join('/')} • {selection.time}</p></div>
                <div className="pt-8 border-t border-dashed border-gray-100 flex justify-between items-end">
                  <div><p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Total</p><div className="flex items-baseline gap-1"><span className="text-sm font-bold text-gray-400">R$</span><span className="text-5xl font-display font-medium text-primary leading-none tracking-tighter">{selection.service.price}</span></div></div>
                </div>
              </div>
            </div>
            <button
              onClick={async () => {
                try {
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
              }}
              className="w-full flex items-center justify-center gap-3 bg-[#0f3e29] text-[#C9A961] h-20 rounded-[32px] font-bold uppercase tracking-[0.2em] text-xs shadow-2xl shadow-[#0f3e29]/20 active:scale-95 transition-all"
            >
              Confirmar Agendamento
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Booking;
