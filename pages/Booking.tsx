
import React, { useState, useMemo } from 'react';
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
  const [bookedAppointments, setBookedAppointments] = useState<Partial<Appointment>[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [prosRes, servsRes] = await Promise.all([
          supabase.from('professionals').select('*').eq('active', true),
          supabase.from('services').select('*').eq('active', true)
        ]);

        if (prosRes.data) setProfessionals(prosRes.data);
        if (servsRes.data) {
          setServices(servsRes.data.map((s: any) => ({
            ...s,
            imageUrl: s.image_url,
            professionalIds: s.professional_ids,
            pointsReward: s.points_reward
          })));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [step, setStep] = useState<BookingStep>(
    preSelected?.service ? 'DATE' : (preSelected?.professional ? 'SERVICE' : 'PROFESSIONAL')
  );

  const [selection, setSelection] = useState<{
    professional?: Professional;
    service?: Service;
    date?: string;
    time?: string;
  }>({
    service: preSelected?.service,
  });

  // Fetch appointments for availability
  React.useEffect(() => {
    if (selection.date && selection.professional) {
      const fetchAppts = async () => {
        const { data } = await supabase.from('appointments')
          .select('*')
          .eq('date', selection.date)
          .eq('professional_id', selection.professional!.id); // UUID match

        if (data) {
          setBookedAppointments(data.map((a: any) => ({
            date: a.date,
            time: a.time,
            professionalId: a.professional_id,
            status: a.status
          })));
        } else {
          setBookedAppointments([]);
        }
      };
      fetchAppts();
    }
  }, [selection.date, selection.professional]);

  const availableHours = useMemo(() => {
    if (!selection.date || !selection.professional) return [];
    const allHours = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    const occupied = bookedAppointments
      .filter(a => a.date === selection.date && a.professionalId === selection.professional?.id)
      .map(a => a.time);
    return allHours.filter(h => !occupied.includes(h));
  }, [selection.date, selection.professional, bookedAppointments]);

  const handleStepBack = () => {
    if (step === 'CONFIRM') setStep('TIME');
    else if (step === 'TIME') setStep('DATE');
    else if (step === 'DATE') setStep('SERVICE');
    else if (step === 'SERVICE') setStep('PROFESSIONAL');
    else navigate(-1);
  };

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
              {loading ? <p>Carregando...</p> : professionals.map(p => (
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
              ))}
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
              {loading ? <p>Carregando...</p> : services.filter(s => s.professionalIds.includes(selection.professional?.id!)).map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelection(prev => ({ ...prev, service: s })); setStep('DATE'); }}
                  className="w-full bg-white p-6 rounded-[32px] border border-gray-100 flex items-center gap-5 active:scale-[0.98] transition-all shadow-sm text-left group"
                >
                  <img src={s.imageUrl} className="size-16 rounded-2xl object-cover" alt={s.name} />
                  <div className="flex-1 space-y-0.5">
                    <p className="font-bold text-lg text-primary">{s.name}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{s.duration} min • R$ {s.price}</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-200">chevron_right</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'DATE' && (
          <div className="p-8 space-y-10 animate-fade-in">
            <div className="space-y-3 text-center">
              <h3 className="text-3xl font-display font-bold text-primary leading-tight">Encontre o melhor <br />momento para você</h3>
              <p className="text-sm text-gray-500 italic">Escolha com calma. Estamos aqui para te receber.</p>
            </div>

            <div className="bg-white p-10 rounded-[48px] border border-gray-50 premium-shadow space-y-12">
              <div className="flex justify-between">
                {['06', '07', '08', '09', '10'].map(d => (
                  <button
                    key={d}
                    onClick={() => { setSelection({ ...selection, date: `2023-11-${d}`, time: undefined }); setStep('TIME'); }}
                    className={`size-16 rounded-2xl flex flex-col items-center justify-center transition-all ${selection.date?.includes(d) ? 'bg-primary text-white shadow-2xl scale-110' : 'bg-gray-50 text-gray-400'}`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest">Nov</span>
                    <span className="text-xl font-black">{d}</span>
                  </button>
                ))}
              </div>

              <div className="bg-accent-gold/5 p-5 rounded-2xl flex items-center gap-4">
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
                  <p className="text-[10px] uppercase font-black tracking-widest mt-2">Vamos encontrar outro perfeito para você</p>
                </div>
              )}
            </div>

            <button onClick={() => setStep('DATE')} className="w-full text-[10px] font-black text-accent-gold uppercase tracking-[0.3em] text-center mt-6">Alterar Data</button>
          </div>
        )}

        {step === 'CONFIRM' && (
          <div className="p-8 space-y-12 animate-fade-in">
            <div className="bg-white rounded-[48px] p-10 border border-gray-100 premium-shadow space-y-10">
              <div className="text-center space-y-3">
                <h3 className="text-4xl font-display font-bold text-primary">Tudo certo 💖</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.25em]">Seu atendimento foi reservado com carinho</p>
              </div>

              <div className="space-y-8 pt-6 border-t border-gray-50">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Especialista</p>
                  <p className="text-sm font-bold text-primary">{selection.professional?.name}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Procedimento</p>
                  <p className="text-sm font-bold text-primary">{selection.service?.name}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Data & Hora</p>
                  <p className="text-sm font-bold text-primary">{selection.date} • {selection.time}</p>
                </div>
                <div className="flex justify-between pt-8 border-t border-dashed border-gray-100">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Estimado</p>
                  <div className="text-right">
                    <p className="text-3xl font-black text-primary">R$ {selection.service?.price}</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                try {
                  // Get current user (assuming auth wrapper/context handles this or we fetch it)
                  // For now, let's blindly insert. If RLS fails, we catch error.
                  // Ideally we get user_id from session.
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) {
                    alert('Você precisa estar logado para agendar.');
                    navigate('/login');
                    return;
                  }

                  const { error } = await supabase.from('appointments').insert({
                    user_id: user.id,
                    service_id: selection.service!.id,
                    professional_id: selection.professional!.id,
                    date: selection.date,
                    time: selection.time,
                    price: selection.service!.price,
                    status: 'PENDING'
                  });
                  if (error) throw error;
                  navigate('/booking/confirmed', { state: { selection } });
                } catch (e: any) {
                  alert('Erro ao agendar: ' + e.message);
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
