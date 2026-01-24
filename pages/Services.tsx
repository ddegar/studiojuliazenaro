import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Professional, Service } from '../types';
import { supabase } from '../services/supabase';

const Services: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

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
            active: p.active,
            working_hours: p.working_hours,
            closed_days: p.closed_days,
            start_hour: p.start_hour,
            end_hour: p.end_hour,
            dbRole: p.role
          }));

          const sortedPros = mappedPros.sort((a, b) => {
            if (a.name.toLowerCase().includes('julia zenaro')) return -1;
            if (b.name.toLowerCase().includes('julia zenaro')) return 1;
            return a.name.localeCompare(b.name);
          });

          setProfessionals(sortedPros);
        }

        if (servsRes.data) {
          setServices(servsRes.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            price: s.price,
            duration: s.duration,
            category: s.category || 'Procedimento',
            imageUrl: s.image_url || 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            professionalIds: s.professional_ids || [],
            pointsReward: s.points_reward || 0,
            isPopular: s.is_popular || false,
            active: s.active,
            carePremium: s.care_premium,
            biosafety: s.biosafety,
            features: s.features || []
          })));
        }
      } catch (error) {
        console.error('Error fetching services/pros:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredServices = services.filter(s => selectedPro && s.professionalIds.includes(selectedPro.id));

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light">
        <div className="flex flex-col items-center gap-6">
          <div className="relative size-20 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-primary/10 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="font-display italic text-primary text-xl">JZ</span>
          </div>
          <p className="text-primary font-outfit font-light tracking-[0.3em] uppercase text-[10px] animate-pulse">Consultando catálogos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light font-sans text-primary antialiased pb-32">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20 dark:opacity-10 overflow-hidden">
        <div className="absolute top-[-5%] left-[-5%] w-[50%] aspect-square organic-shape-1 bg-accent-gold/20 blur-[100px] animate-float"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      {!selectedPro ? (
        // Step 1: Select Professional
        <div className="relative flex min-h-screen w-full flex-col pb-32 animate-reveal">
          <header className="flex items-center px-6 py-10 justify-between sticky top-0 bg-background-light/80 backdrop-blur-md z-[100]">
            <button
              onClick={() => navigate('/home')}
              className="text-primary flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm border border-primary/5 hover:scale-105 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined !text-xl">west</span>
            </button>
            <div className="text-accent-gold flex flex-col items-center">
              <span className="material-symbols-outlined !text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
              <p className="text-[7px] font-outfit font-black uppercase tracking-[0.5em] mt-1 ml-1 leading-none">Curadoria</p>
            </div>
            <div className="size-12"></div>
          </header>

          <div className="px-8 mt-4 mb-14 space-y-4">
            <h1 className="font-display text-4xl text-primary leading-[1.1] tracking-tight">
              A maestria por trás <br />
              <span className="italic text-accent-gold">da sua arte.</span>
            </h1>
            <p className="text-primary/50 text-xs font-outfit font-normal tracking-wider leading-relaxed max-w-[85%]">
              Selecione a especialista que melhor harmoniza com seu estilo e objetivos de beleza.
            </p>
          </div>

          <div className="px-6 space-y-6">
            {professionals.length > 0 ? professionals.map((pro, i) => (
              <div
                key={pro.id}
                onClick={() => setSelectedPro(pro)}
                className={`group animate-reveal bg-white rounded-[40px] p-6 flex items-center gap-6 shadow-2xl shadow-primary/5 border border-primary/5 active:scale-[0.98] transition-all cursor-pointer hover:border-accent-gold/20`}
                style={{ animationDelay: `${0.1 * i}s` }}
              >
                <div className="relative">
                  <div className="size-20 rounded-[28px] overflow-hidden p-1 border border-accent-gold/20 group-hover:rotate-6 transition-transform duration-500">
                    <img src={pro.avatar} alt={pro.name} className="size-full object-cover rounded-[24px]" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 size-5 bg-primary rounded-full border-2 border-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-accent-gold !text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-outfit text-xl text-primary tracking-tight font-medium">{pro.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-outfit font-black tracking-[0.15em] text-accent-gold">{pro.role}</span>
                    <span className="size-1 bg-primary/10 rounded-full"></span>
                    <div className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-accent-gold !text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-[10px] font-outfit font-bold text-primary/40">Premium</span>
                    </div>
                  </div>
                </div>
                <div className="p-2 rounded-full bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined !text-xl group-hover:translate-x-1 transition-transform">east</span>
                </div>
              </div>
            )) : (
              <div className="py-24 text-center space-y-6 opacity-40 bg-white/40 rounded-[48px] border-2 border-dashed border-primary/10">
                <span className="material-symbols-outlined !text-5xl text-primary/30">concierge</span>
                <p className="font-outfit text-xs font-black uppercase tracking-[0.3em]">Preparando nossa equipe</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Step 2: Service Catalogue
        <div className="max-w-md mx-auto min-h-screen relative animate-reveal">
          {/* Sub-Header Selection Pin */}
          <div className="sticky top-0 z-[110] px-6 py-8">
            <div className="premium-blur border border-primary/10 shadow-2xl rounded-[32px] p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative size-12">
                  <img alt={selectedPro.name} className="size-full rounded-2xl object-cover border border-accent-gold/30" src={selectedPro.avatar} />
                  <div className="absolute -top-1 -right-1 bg-primary size-4 rounded-full border border-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-accent-gold !text-[8px]">check</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-sm font-outfit font-bold text-primary tracking-tight">{selectedPro.name}</h2>
                  <p className="text-[9px] font-outfit font-black uppercase tracking-widest text-accent-gold/60">{selectedPro.role}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPro(null)}
                className="size-10 flex items-center justify-center rounded-xl bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
              >
                <span className="material-symbols-outlined !text-lg">cached</span>
              </button>
            </div>
          </div>

          <section className="px-8 mt-2 mb-12 space-y-4">
            <h1 className="text-4xl font-display leading-[1.1] text-primary tracking-tight">
              Um cuidado feito <br />
              <span className="italic text-accent-gold">sob medida.</span> ✨
            </h1>
            <p className="text-primary/50 text-xs font-outfit font-light leading-relaxed max-w-[80%]">
              Nossos serviços são experiências sensoriais desenhadas para elevar sua autoconfiança.
            </p>
          </section>

          <section className="px-6 space-y-12 pb-16">
            {filteredServices.length > 0 ? filteredServices.map((service, i) => (
              <div key={service.id} className="animate-reveal group relative flex flex-col gap-6" style={{ animationDelay: `${0.2 * i}s` }}>
                {/* Visual Image Area */}
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[48px] shadow-2xl group-hover:shadow-primary/20 transition-all duration-700">
                  <img
                    alt={service.name}
                    className="size-full object-cover transition-transform duration-[4s] group-hover:scale-110"
                    src={service.imageUrl}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/30 to-transparent"></div>

                  {/* Category Badge */}
                  <div className="absolute top-8 left-8">
                    <span className="bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[9px] font-outfit font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full shadow-2xl">
                      {service.category}
                    </span>
                  </div>

                  {/* Hover Meta Info (appears on larger mobile screens or desktop) */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-end gap-6">
                    <div className="h-px w-10 bg-accent-gold transform group-hover:w-20 transition-all duration-700"></div>
                    <div>
                      <h3 className="text-3xl font-display text-white mb-2 leading-tight drop-shadow-2xl">{service.name}</h3>
                      <p className="text-white/70 text-xs font-outfit font-light leading-relaxed line-clamp-2">{service.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-white/20">
                      <div className="flex flex-col">
                        <p className="text-[10px] font-outfit font-black uppercase tracking-[0.2em] text-accent-gold mb-1">Investimento</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-outfit font-light text-white tracking-tighter">R$ {service.price}</span>
                          <span className="text-[10px] font-outfit font-bold text-white/40 uppercase tracking-widest leading-none">/ {service.duration} min</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/service/${service.id}`, { state: { service: service, professional: selectedPro } })}
                        className="size-14 rounded-2xl bg-white text-primary flex items-center justify-center hover:bg-accent-gold transition-all shadow-xl active:scale-90"
                      >
                        <span className="material-symbols-outlined !text-2xl">visibility</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Book Action Card */}
                <div className="px-2">
                  <button
                    onClick={() => navigate('/booking', { state: { professional: selectedPro, service: service } })}
                    className="w-full h-16 rounded-[28px] bg-primary text-white font-outfit font-black uppercase tracking-[0.25em] text-[10px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-primary-light"
                  >
                    Reserva Prioritária
                    <span className="material-symbols-outlined !text-lg text-accent-gold">event_seat</span>
                  </button>
                </div>
              </div>
            )) : (
              <div className="py-24 text-center space-y-6 opacity-40">
                <span className="material-symbols-outlined !text-5xl text-primary/30">content_paste_off</span>
                <p className="font-outfit text-xs font-black uppercase tracking-[0.3em]">Nenhum serviço disponível</p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Persistent Premium Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-[120]">
        <nav className="animate-reveal" style={{ animationDelay: '0.4s' }}>
          <div className="premium-blur rounded-[28px] border border-primary/10 shadow-2xl px-6 py-3 flex justify-between items-center bg-white/80">
            <button onClick={() => navigate('/home')} className="p-2 text-primary/30 hover:text-primary transition-colors group">
              <span className="material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform">home</span>
            </button>
            <button onClick={() => navigate('/feed')} className="p-2 text-primary/30 hover:text-primary transition-colors group">
              <span className="material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform">grid_view</span>
            </button>
            <button className="relative size-14 -translate-y-6 rounded-3xl bg-primary text-accent-gold shadow-lg shadow-primary/40 flex items-center justify-center border-4 border-background-light group-active:scale-90 transition-transform ring-1 ring-primary/5">
              <span className="material-symbols-outlined !text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
              <span className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 w-1 h-1 bg-accent-gold rounded-full"></span>
            </button>
            <button onClick={() => navigate('/history')} className="p-2 text-primary/30 hover:text-primary transition-colors group">
              <span className="material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform">calendar_today</span>
            </button>
            <button onClick={() => navigate('/profile')} className="p-2 text-primary/30 hover:text-primary transition-colors group">
              <span className="material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform">person_outline</span>
            </button>
          </div>
        </nav>
      </div>

      <div className="fixed bottom-0 left-0 w-full h-8 bg-background-light pointer-events-none z-[110]"></div>
    </div>
  );
};

export default Services;
