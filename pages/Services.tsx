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
      <div className="flex flex-col h-screen bg-background-light items-center justify-center">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-primary font-bold animate-pulse uppercase text-[10px] tracking-widest">Carregando Catálogo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light font-sans text-primary antialiased pb-32">
      {!selectedPro ? (
        // Step 1: Select Professional (Light Mode Premium)
        <div className="relative flex min-h-screen w-full flex-col pb-32 animate-fade-in">
          <div className="flex items-center px-6 py-8 justify-between">
            <button
              onClick={() => navigate('/home')}
              className="text-primary flex size-10 items-center justify-start rounded-full hover:bg-black/5 transition-colors"
            >
              <span className="material-symbols-outlined !text-2xl">arrow_back_ios</span>
            </button>
            <div className="text-primary opacity-80">
              <span className="material-symbols-outlined !text-3xl">spa</span>
            </div>
            <div className="size-10"></div>
          </div>

          <div className="px-8 mb-10">
            <h1 className="font-display text-4xl text-primary leading-tight mb-2">
              Escolha sua <br />
              <span className="italic text-[#c5a059] font-serif">especialista</span>
            </h1>
            <p className="text-primary/60 text-sm font-sans tracking-tight">
              Cada profissional possui um estilo único de cuidado.
            </p>
          </div>

          <div className="px-6 space-y-4">
            {professionals.length > 0 ? professionals.map(pro => (
              <div
                key={pro.id}
                onClick={() => setSelectedPro(pro)}
                className="bg-white rounded-[2rem] p-5 flex items-center gap-5 shadow-sm border border-[#d4af37]/5 active:scale-[0.98] transition-all cursor-pointer hover:border-[#d4af37]/20"
              >
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border border-[#d4af37]/30 p-1">
                    <img src={pro.avatar} alt={pro.name} className="w-full h-full object-cover rounded-full" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <h3 className="font-display text-xl text-primary font-bold">{pro.name}</h3>
                  <p className="text-[10px] uppercase tracking-widest text-[#c5a059] font-semibold mt-0.5">{pro.role}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="material-symbols-outlined text-[#c5a059] !text-xs">star</span>
                    <span className="text-[10px] text-primary/40 font-medium">Especialista</span>
                  </div>
                </div>
                <div className="ml-auto">
                  <span className="material-symbols-outlined text-primary/20">chevron_right</span>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center opacity-30 border-2 border-dashed border-gray-200 rounded-[40px]">
                <span className="material-symbols-outlined !text-6xl text-gray-300">person_off</span>
                <p className="mt-4 font-bold text-sm text-gray-400">Nenhuma profissional ativa.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Step 2: Service Catalogue (HTML Layout with Light Theme Colors)
        <div className="max-w-md mx-auto min-h-screen relative animate-fade-in">
          <header className="p-6 pt-10">
            <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img alt={selectedPro.name} className="w-14 h-14 rounded-full object-cover border border-accent-gold/30" src={selectedPro.avatar} />
                  <div className="absolute -bottom-1 -right-1 bg-accent-gold w-4 h-4 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium">Sua escolha de cuidado</p>
                  <h2 className="text-lg font-display font-medium text-primary">{selectedPro.name}</h2>
                </div>
              </div>
              <button
                onClick={() => setSelectedPro(null)}
                className="text-[11px] uppercase tracking-widest text-accent-gold font-semibold border-b border-accent-gold/30 pb-0.5"
              >
                Trocar
              </button>
            </div>
          </header>

          <section className="px-6 mb-8">
            <h1 className="text-4xl font-display leading-tight mb-2 text-primary">
              Um cuidado feito <br />
              <span className="italic text-accent-gold">sob medida</span> ✨
            </h1>
            <p className="text-gray-500 text-sm font-light">
              Descubra a experiência que mais harmoniza com você hoje.
            </p>
          </section>

          <section className="px-6 space-y-8">
            {filteredServices.length > 0 ? filteredServices.map(service => (
              <div key={service.id} className="group relative bg-white rounded-[2rem] overflow-hidden border border-gray-100 premium-shadow transition-transform active:scale-[0.98]">
                <div className="relative h-[420px] w-full overflow-hidden">
                  <img
                    alt={service.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src={service.imageUrl}
                  />
                  {/* Gradient overlay using PRIMARY (Green) for brand identity */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent"></div>

                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-md text-primary text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border border-gray-200">
                      {service.category}
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
                    <div>
                      <h3 className="text-3xl font-display mb-2 drop-shadow-md text-white text-shadow-elegant">{service.name}</h3>
                      <p className="text-white/90 text-sm font-light leading-relaxed max-w-[90%] line-clamp-2">
                        {service.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/20">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-widest text-white/70">Investimento</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-display text-accent-gold">R$ {service.price}</span>
                          <span className="text-xs text-white/50">/ {service.duration} min</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/service/${service.id}`, { state: { service: service, professional: selectedPro } })}
                        className="text-[11px] uppercase tracking-widest text-[#D4AF37] border border-[#D4AF37]/50 px-4 py-2 rounded-full hover:bg-white/10 transition-colors text-shadow-sm font-semibold"
                      >
                        Ver detalhes
                      </button>
                    </div>
                    <button
                      onClick={() => navigate('/booking', { state: { professional: selectedPro, service: service } })}
                      className="w-full bg-[#D4AF37] py-4 rounded-xl text-primary font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-black/20 active:opacity-90 transition-all hover:scale-[1.02]"
                    >
                      Reservar Experiência
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center opacity-30 border-2 border-dashed border-gray-300 rounded-[40px]">
                <span className="material-symbols-outlined !text-6xl text-gray-400">inventory_2</span>
                <p className="mt-4 font-bold text-sm text-gray-500">Nenhum serviço disponível.</p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Bottom Nav (Light/Glass to match Home) */}
      <nav className="fixed bottom-0 left-0 right-0 glass-nav px-8 pt-4 pb-10 flex justify-between items-center shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-50 bg-[#fdfcf9]/80 backdrop-blur-xl border-t border-[#d4af37]/10">
        <button onClick={() => navigate('/home')} className="flex flex-col items-center gap-1 text-primary/40 hover:text-primary transition-colors">
          <span className="material-symbols-outlined !text-2xl">home</span>
          <span className="text-[9px] uppercase tracking-tighter font-bold">Início</span>
        </button>
        <button onClick={() => navigate('/feed')} className="flex flex-col items-center gap-1 text-primary/40 hover:text-primary transition-colors">
          <span className="material-symbols-outlined !text-2xl">grid_view</span>
          <span className="text-[9px] uppercase tracking-tighter font-bold">Feed</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#c5a059]">
          <span className="material-symbols-outlined !text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
          <span className="text-[9px] uppercase tracking-tighter font-bold">Serviços</span>
        </button>
        <button onClick={() => navigate('/history')} className="flex flex-col items-center gap-1 text-primary/40 hover:text-primary transition-colors">
          <span className="material-symbols-outlined !text-2xl">calendar_today</span>
          <span className="text-[9px] uppercase tracking-tighter font-bold">Agenda</span>
        </button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1 text-primary/40 hover:text-primary transition-colors">
          <span className="material-symbols-outlined !text-2xl">person_outline</span>
          <span className="text-[9px] uppercase tracking-tighter font-bold">Perfil</span>
        </button>
      </nav>
      <div className="fixed bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-primary/5 rounded-full z-[60]"></div>
    </div>
  );
};

export default Services;
