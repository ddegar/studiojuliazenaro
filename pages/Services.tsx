
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Professional, Service } from '../types';
import { supabase } from '../services/supabase';

const Services: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [prosRes, servsRes] = await Promise.all([
          supabase.from('professionals').select('*').eq('active', true),
          supabase.from('services').select('*').eq('active', true)
        ]);

        if (prosRes.data) {
          setProfessionals(prosRes.data.map((p: any) => ({
            ...p,
            // Map standard fields if needed, assumes mostly matching or UI ignores extras
          })));
        }

        if (servsRes.data) {
          setServices(servsRes.data.map((s: any) => ({
            ...s,
            imageUrl: s.image_url,
            professionalIds: s.professional_ids,
            pointsReward: s.points_reward,
            isPopular: s.is_popular
          })));
        }
      } catch (error) {
        console.error('Error fetching data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredServices = services.filter(s => selectedPro && s.professionalIds.includes(selectedPro.id));

  return (
    <div className="flex flex-col h-full bg-background-light pb-32">
      <header className="sticky top-0 z-50 glass-nav p-6 flex items-center justify-between border-b">
        <button onClick={() => selectedPro ? setSelectedPro(null) : navigate('/home')} className="material-symbols-outlined text-primary">
          {selectedPro ? 'arrow_back_ios_new' : 'home'}
        </button>
        <h2 className="font-display font-bold text-primary">Catálogo Studio</h2>
        <span className="size-6"></span>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar">
        {!selectedPro ? (
          <div className="p-8 space-y-10 animate-fade-in">
            <div className="space-y-3">
              <h1 className="text-3xl font-display font-bold leading-tight text-primary">Escolha quem vai <br />cuidar de você</h1>
              <p className="text-sm text-gray-500 italic">Cada profissional tem um estilo único e especial</p>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {loading ? <p className="text-center text-gray-500">Carregando...</p> : professionals.map(pro => (
                <button
                  key={pro.id}
                  onClick={() => setSelectedPro(pro)}
                  className="bg-white p-6 rounded-[40px] border border-gray-100 premium-shadow flex items-center gap-6 active:scale-[0.98] transition-all group"
                >
                  <div className="size-24 rounded-2xl overflow-hidden ring-4 ring-primary/5 group-hover:ring-accent-gold/20 transition-all">
                    <img src={pro.avatar} className="w-full h-full object-cover" alt={pro.name} />
                  </div>
                  <div className="text-left flex-1 space-y-1">
                    <h3 className="text-xl font-bold text-primary">{pro.name}</h3>
                    <p className="text-[10px] text-accent-gold font-black uppercase tracking-[0.2em]">{pro.role}</p>
                    <div className="flex items-center gap-1 pt-1">
                      <span className="material-symbols-outlined text-accent-gold !text-xs fill-1">star</span>
                      <span className="text-[10px] font-bold text-gray-400">Especialista</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 space-y-10 animate-fade-in">
            <div className="flex items-center gap-5 bg-primary/5 p-6 rounded-[32px] border border-primary/10">
              <img src={selectedPro.avatar} className="size-14 rounded-full object-cover border-2 border-white shadow-sm" alt={selectedPro.name} />
              <div className="flex-1">
                <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest">Sua escolha de cuidado</p>
                <p className="font-bold text-primary text-lg">{selectedPro.name}</p>
              </div>
              <button onClick={() => setSelectedPro(null)} className="text-[10px] font-black text-accent-gold uppercase underline">Trocar</button>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-display font-bold text-primary">Um cuidado feito <br />sob medida ✨</h2>
              <p className="text-sm text-gray-500 italic">Escolha o serviço que combina com você hoje</p>
            </div>

            <div className="space-y-6">
              {filteredServices.map(service => (
                <div key={service.id} className="bg-white rounded-[40px] overflow-hidden border border-gray-100 shadow-sm flex flex-col group">
                  <div className="h-56 overflow-hidden relative">
                    <img src={service.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt={service.name} />
                    <div className="absolute bottom-6 left-6">
                      <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black text-primary uppercase tracking-widest">{service.category}</span>
                    </div>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-2xl font-display font-bold text-primary">{service.name}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed font-medium">{service.description}</p>
                    </div>
                    <div className="flex justify-between items-end pt-6 border-t border-gray-50">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seu investimento</p>
                        <p className="text-2xl font-black text-primary">R$ {service.price} <span className="text-xs font-normal text-gray-400">/ {service.duration} min</span></p>
                      </div>
                      <button
                        onClick={() => navigate('/booking', { state: { professional: selectedPro, service: service } })}
                        className="bg-primary text-white h-14 px-10 rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 active:scale-95 transition-transform"
                      >
                        Agendar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Nav de 5 itens */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] glass-nav border-t border-gray-100 flex justify-around items-center py-6 px-4 z-50 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button onClick={() => navigate('/home')} className="flex flex-col items-center gap-1.5 text-gray-400">
          <span className="material-symbols-outlined !text-3xl">home</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Início</span>
        </button>
        <button onClick={() => navigate('/feed')} className="flex flex-col items-center gap-1.5 text-gray-400">
          <span className="material-symbols-outlined !text-3xl">grid_view</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Feed</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 text-primary">
          <span className="material-symbols-outlined !text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>content_cut</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Serviços</span>
        </button>
        <button onClick={() => navigate('/history')} className="flex flex-col items-center gap-1.5 text-gray-400">
          <span className="material-symbols-outlined !text-3xl">calendar_today</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Agenda</span>
        </button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1.5 text-gray-400">
          <span className="material-symbols-outlined !text-3xl">person</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Perfil</span>
        </button>
      </nav>
    </div>
  );
};

export default Services;
