
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

type Step = 1 | 2 | 3 | 4 | 5;

const AestheticProfile: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // States for all selections
  const [eyeShape, setEyeShape] = useState('amendoado');
  const [style, setStyle] = useState('natural');
  const [curvature, setCurvature] = useState('D');
  const [length, setLength] = useState(50);
  const [thickness, setThickness] = useState('natural');
  const [pigment, setPigment] = useState(50);
  const [maintenance, setMaintenance] = useState('3');
  const [allergies, setAllergies] = useState('');

  // Hospitality Tastes
  const [hospitality, setHospitality] = useState({
    drink: 'cafe',
    music: 'jazz',
    snack: 'bolacha'
  });

  useEffect(() => {
    const fetchExisting = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
          if (data) {
            setProfile(data);
            if (data.preferences) {
              const p = data.preferences;
              setEyeShape(p.eyeShape || 'amendoado');
              setStyle(p.style || 'natural');
              setCurvature(p.curvature || 'D');
              setLength(p.length || 50);
              setThickness(p.thickness || 'natural');
              setPigment(p.pigment || 50);
              setMaintenance(p.maintenance || '3');
              setAllergies(p.allergies || '');
              if (p.hospitality) setHospitality(p.hospitality);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching preferences:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExisting();
  }, []);

  const handleNext = () => {
    if (step < 5) setStep((step + 1) as Step);
    else handleSave();
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step);
    else navigate(-1);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Por favor, faça login para salvar seu perfil.');
        return;
      }

      const preferences = {
        eyeShape,
        style,
        curvature,
        length,
        thickness,
        pigment,
        maintenance,
        allergies,
        hospitality,
        lastUpdate: new Date().toLocaleDateString('pt-BR')
      };

      const { error } = await supabase
        .from('profiles')
        .update({ preferences })
        .eq('id', user.id);

      if (error) throw error;

      alert('Preferências salvas com carinho! ✨');
      navigate('/profile');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && step === 1 && !profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light font-outfit">
        <div className="relative size-16 flex items-center justify-center">
          <div className="absolute inset-0 border-2 border-primary/5 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
          <span className="material-symbols-outlined text-primary scale-75">face</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-light font-outfit antialiased selection:bg-accent-gold/20 selection:text-primary">
      {/* Immersive Background Narrative */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] aspect-square organic-shape-1 bg-accent-gold/10 blur-[100px] animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <header className="relative z-50 px-6 py-8 flex items-center justify-between sticky top-0 premium-blur border-b border-primary/5">
        <button
          onClick={handleBack}
          className="size-12 rounded-2xl bg-white shadow-sm border border-primary/5 flex items-center justify-center text-primary group active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined !text-xl group-hover:-translate-x-1 transition-transform">west</span>
        </button>
        <div className="text-center">
          <p className="text-[8px] font-black uppercase tracking-[0.5em] text-primary/30 leading-none mb-1">Consultoria Digital</p>
          <h2 className="font-display italic text-xl text-primary">
            {step === 1 && 'Perfil do Olhar'}
            {step === 2 && 'Design e Forma'}
            {step === 3 && 'Acabamento VIP'}
            {step === 4 && 'Ciclo e Cuidados'}
            {step === 5 && 'Seu Momento'}
          </h2>
        </div>
        <div className="size-12 rounded-2xl flex items-center justify-center text-accent-gold/40">
          <span className="material-symbols-outlined !text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
        </div>
      </header>

      {/* Progress Elite Indicator */}
      <div className="relative z-40 px-8 py-6 bg-background-light/80 backdrop-blur-xl border-b border-primary/5 sticky top-[109px]">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em]">Sua Jornada de Beleza</span>
          <span className="text-[10px] font-black text-accent-gold uppercase tracking-[0.2em]">Fase {step} de 5</span>
        </div>
        <div className="h-[2px] w-full bg-primary/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-gold shadow-[0_0_10px_rgba(201,169,97,0.5)] transition-all duration-1000 ease-out"
            style={{ width: `${(step / 5) * 100}%` }}
          ></div>
        </div>
      </div>

      <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar p-8 pb-32">
        {step === 1 && (
          <div className="space-y-12 animate-reveal">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-display text-primary leading-tight tracking-tight italic">Qual a moldura <br /> <span className="not-italic text-accent-gold font-light font-outfit">do seu olhar?</span></h1>
              <p className="text-xs text-primary/40 font-light max-w-[280px] mx-auto leading-relaxed">Isso nos permite criar um mapeamento arquitetônico perfeito para o seu rosto.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'amendoado', label: 'Amendoado', desc: 'Clássico e versátil, harmonia natural.', icon: 'visibility' },
                { id: 'arredondado', label: 'Arredondado', desc: 'Altura e expressividade marcante.', icon: 'lens' },
                { id: 'monolidico', label: 'Monolídico', desc: 'Pálpebra única, exige projeção estratégica.', icon: 'remove_red_eye' },
                { id: 'caido', label: 'Caído', desc: 'Exige levantamento do canto externo.', icon: 'south_east' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setEyeShape(opt.id)}
                  className={`group relative w-full p-8 rounded-[40px] border flex items-center gap-6 transition-all duration-500 text-left overflow-hidden ${eyeShape === opt.id ? 'border-accent-gold/40 bg-white shadow-huge' : 'border-primary/5 bg-white/40'}`}
                >
                  <div className={`size-16 rounded-[28px] flex items-center justify-center transition-all duration-500 ${eyeShape === opt.id ? 'bg-primary text-accent-gold shadow-xl shadow-primary/20' : 'bg-primary/5 text-primary/30'}`}>
                    <span className="material-symbols-outlined !text-3xl">{opt.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className={`font-display text-xl transition-colors ${eyeShape === opt.id ? 'text-primary' : 'text-primary/40'}`}>{opt.label}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/20 leading-none mt-1">{opt.desc}</p>
                  </div>
                  <div className={`size-8 rounded-full border-2 flex items-center justify-center transition-all ${eyeShape === opt.id ? 'border-accent-gold bg-accent-gold' : 'border-primary/5'}`}>
                    {eyeShape === opt.id && <span className="material-symbols-outlined text-primary !text-sm">done</span>}
                  </div>
                </button>
              ))}
            </div>
            <div className="text-center pt-8 opacity-20">
              <p className="text-[8px] font-black uppercase tracking-[0.5em]">Julia Zenaro • Lash Design Expertise</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-14 animate-reveal">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-display text-primary leading-tight tracking-tight italic">Sua assinatura <br /> <span className="not-italic text-accent-gold font-light font-outfit">estética.</span></h1>
              <p className="text-xs text-primary/40 font-light px-6">Escolha o volume que expressa sua essência neste momento.</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { id: 'natural', label: 'Natural Look', desc: 'Realce discreto', img: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400' },
                { id: 'rimel', label: 'Efeito Rímel', desc: 'Volume clássico', img: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400' },
                { id: 'russo', label: 'Volume Russo', desc: 'Total glamour', img: 'https://images.unsplash.com/photo-1583001809033-00e930cd2645?w=400' },
                { id: 'lifting', label: 'Lash Lifting', desc: 'Curvatura natural', img: 'https://images.unsplash.com/photo-1519415510236-85591199360e?w=400' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setStyle(opt.id)}
                  className={`group relative aspect-[3/4.5] rounded-[48px] overflow-hidden border-2 transition-all duration-700 ${style === opt.id ? 'border-accent-gold shadow-huge scale-[1.02]' : 'border-transparent opacity-80 hover:opacity-100'}`}
                >
                  <img src={opt.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" alt={opt.label} />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/20 to-transparent flex flex-col justify-end p-6 text-left">
                    <p className="font-display italic text-lg text-white mb-0.5">{opt.label}</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-accent-gold/80 leading-none">{opt.desc}</p>
                  </div>
                  {style === opt.id && (
                    <div className="absolute top-5 right-5 size-8 bg-accent-gold text-primary rounded-2xl flex items-center justify-center shadow-2xl animate-reveal">
                      <span className="material-symbols-outlined !text-sm">done</span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <section className="space-y-8 pt-6">
              <div className="flex justify-between items-center px-2">
                <h3 className="font-display italic text-2xl text-primary">Curvatura</h3>
                <span className="text-[10px] font-black text-accent-gold border-b border-accent-gold/20 pb-1">CONSULTORIA TÉCNICA</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'C', label: 'C-CURL', sub: 'Natural', icon: 'gesture' },
                  { id: 'D', label: 'D-CURL', sub: 'Marcado', icon: 'all_inclusive' },
                  { id: 'L', label: 'L-CURL', sub: 'Elevado', icon: 'trending_up' }
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCurvature(c.id)}
                    className={`p-6 rounded-[32px] border flex flex-col items-center gap-3 transition-all duration-500 ${curvature === c.id ? 'border-accent-gold bg-primary text-accent-gold shadow-huge' : 'border-primary/5 bg-white/40 text-primary/30'}`}
                  >
                    <span className="material-symbols-outlined !text-3xl">{c.icon}</span>
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest">{c.label}</p>
                      <p className={`text-[8px] font-medium mt-0.5 opacity-60`}>{c.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-8">
              <div className="flex justify-between items-center px-2">
                <h3 className="font-display italic text-2xl text-primary">Extensão</h3>
                <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest">{length > 70 ? 'Cenográfico' : length > 30 ? 'Equilibrado' : 'Sutil'}</span>
              </div>
              <div className="px-6 py-8 bg-white/40 rounded-[40px] border border-primary/5">
                <input
                  type="range"
                  min="0" max="100"
                  value={length}
                  onChange={(e) => setLength(parseInt(e.target.value))}
                  className="premium-range w-full"
                />
                <div className="flex justify-between mt-6 text-[8px] font-black text-primary/20 uppercase tracking-[0.5em]">
                  <span>Minimal</span>
                  <span className="text-accent-gold">Curadoria JZ</span>
                  <span>Impact</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-14 animate-reveal">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-display text-primary leading-tight tracking-tight italic">Profundidade <br /> <span className="not-italic text-accent-gold font-light font-outfit">e Intensidade.</span></h1>
              <p className="text-xs text-primary/40 font-light px-8">A precisão do acabamento define o refinamento do seu olhar.</p>
            </div>

            <section className="space-y-8">
              <h3 className="font-display italic text-2xl text-primary px-2">Textura dos Fios</h3>
              <div className="space-y-4">
                {[
                  { id: 'natural', label: 'CURADORIA NATURAL', desc: 'Realce clássico e atemporal' },
                  { id: 'fino', label: 'ULTRA FINO (TECH)', desc: 'Leveza máxima de seda' },
                  { id: 'intenso', label: 'INTENSO DRAMA', desc: 'Destaque e densidade profunda' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setThickness(opt.id)}
                    className={`w-full p-8 rounded-[40px] border-2 text-left flex items-center justify-between transition-all duration-500 overflow-hidden relative ${thickness === opt.id ? 'border-accent-gold bg-primary shadow-huge' : 'border-primary/5 bg-white/40'}`}
                  >
                    <div>
                      <p className={`font-black text-[10px] tracking-[0.3em] uppercase ${thickness === opt.id ? 'text-accent-gold' : 'text-primary/40'}`}>{opt.label}</p>
                      <p className={`text-base font-display italic mt-1 ${thickness === opt.id ? 'text-white' : 'text-primary/60'}`}>{opt.desc}</p>
                    </div>
                    {thickness === opt.id && <span className="material-symbols-outlined text-accent-gold !text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-8">
              <div className="flex justify-between items-center px-2">
                <h3 className="font-display italic text-2xl text-primary">Pigmentação</h3>
                <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest">{pigment > 70 ? 'Ebony' : pigment > 30 ? 'Classic' : 'Smoke'}</span>
              </div>
              <div className="px-6 py-8 bg-white/40 rounded-[40px] border border-primary/5">
                <input
                  type="range"
                  min="0" max="100"
                  value={pigment}
                  onChange={(e) => setPigment(parseInt(e.target.value))}
                  className="premium-range w-full"
                />
                <div className="flex justify-between mt-6 text-[8px] font-black text-primary/20 uppercase tracking-[0.5em]">
                  <span>Translucent</span>
                  <span className="text-accent-gold">High Deep</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-14 animate-reveal">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-display text-primary leading-tight tracking-tight italic">Cuidado <br /> <span className="not-italic text-accent-gold font-light font-outfit">e Frequência.</span></h1>
              <p className="text-xs text-primary/40 font-light px-8">Planeje a manutenção da sua beleza para um brilho contínuo.</p>
            </div>

            <div className="space-y-4">
              {[
                { id: '2', label: 'Ciclo de 15 dias', desc: 'Beleza impecável, volume sempre pleno.' },
                { id: '3', label: 'Ciclo de 21 dias', desc: 'O equilíbrio perfeito entre vida e estética.', recommended: true },
                { id: '4', label: 'Ciclo de 30 dias', desc: 'Máxima praticidade para rotinas dinâmicas.' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setMaintenance(opt.id)}
                  className={`w-full p-8 rounded-[48px] border-2 text-left transition-all duration-500 relative overflow-hidden ${maintenance === opt.id ? 'border-accent-gold bg-primary shadow-huge' : 'border-primary/5 bg-white/40'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className={`font-display text-xl ${maintenance === opt.id ? 'text-white' : 'text-primary'}`}>{opt.label}</p>
                    {maintenance === opt.id && <span className="material-symbols-outlined text-accent-gold !text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_fix_high</span>}
                  </div>
                  <p className={`text-xs font-light ${maintenance === opt.id ? 'text-white/60' : 'text-primary/40'} pr-10`}>{opt.desc}</p>
                  {opt.recommended && (
                    <span className="absolute top-0 right-10 -translate-y-1/2 bg-accent-gold text-primary px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.3em] shadow-xl">ESSENCIAL</span>
                  )}
                </button>
              ))}
            </div>

            <section className="space-y-6 pt-6">
              <div className="flex items-center gap-4 px-2">
                <div className="size-10 rounded-2xl bg-primary text-accent-gold flex items-center justify-center">
                  <span className="material-symbols-outlined !text-xl">medical_information</span>
                </div>
                <h3 className="font-display italic text-2xl text-primary">Sensibilidade</h3>
              </div>
              <textarea
                placeholder="Informe-nos sobre alergias, restrições ou observações que tornem seu atendimento mais seguro..."
                className="w-full bg-white/40 border border-primary/5 rounded-[40px] p-8 text-sm focus:bg-white focus:ring-accent-gold/20 h-44 italic placeholder:text-primary/20 shadow-inner outline-none transition-all"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
              />
            </section>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-16 animate-reveal">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-display text-primary leading-tight tracking-tight italic">Seu Ritual <br /> <span className="not-italic text-accent-gold font-light font-outfit">de Bem-estar.</span></h1>
              <p className="text-xs text-primary/40 font-light px-6">Hospitalidade é a nossa arte. Como podemos acolher você hoje?</p>
            </div>

            <section className="space-y-12">
              <div className="space-y-8">
                <div className="flex items-center gap-4 px-2">
                  <span className="material-symbols-outlined text-accent-gold">local_bar</span>
                  <h3 className="font-display italic text-2xl text-primary">Bar JZ</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'cafe', label: 'Expresso Gourmet' },
                    { id: 'agua', label: 'Acqua Detox' },
                    { id: 'refri', label: 'Beverage Selection' },
                    { id: 'cha', label: 'Herbal Tea' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setHospitality({ ...hospitality, drink: opt.id })}
                      className={`h-20 rounded-[32px] border text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${hospitality.drink === opt.id ? 'border-accent-gold bg-primary text-accent-gold shadow-huge' : 'border-primary/5 bg-white/40 text-primary/30 hover:bg-white'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-4 px-2">
                  <span className="material-symbols-outlined text-accent-gold">music_note</span>
                  <h3 className="font-display italic text-2xl text-primary">Atmosphere</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'jazz', label: 'Jazz & Soul' },
                    { id: 'pop', label: 'Soft Pop' },
                    { id: 'lofi', label: 'Deep Focus' },
                    { id: 'silencio', label: 'Deep Silence' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setHospitality({ ...hospitality, music: opt.id })}
                      className={`h-20 rounded-[32px] border text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${hospitality.music === opt.id ? 'border-accent-gold bg-primary text-accent-gold shadow-huge' : 'border-primary/5 bg-white/40 text-primary/30 hover:bg-white'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-4 px-2">
                  <span className="material-symbols-outlined text-accent-gold">cookie</span>
                  <h3 className="font-display italic text-2xl text-primary">Delicatesse</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'bolacha', label: 'Fine Biscuits' },
                    { id: 'frutas', label: 'Fresh Fruits' },
                    { id: 'chocolate', label: 'Gourmet Choc' },
                    { id: 'nenhum', label: 'Just Drinks' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setHospitality({ ...hospitality, snack: opt.id })}
                      className={`h-20 rounded-[32px] border text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${hospitality.snack === opt.id ? 'border-accent-gold bg-primary text-accent-gold shadow-huge' : 'border-primary/5 bg-white/40 text-primary/30 hover:bg-white'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="bg-primary/5 border border-primary/5 p-10 rounded-[56px] text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-1 bg-gradient-to-l from-accent-gold/40 to-transparent"></div>
              <span className="material-symbols-outlined text-accent-gold !text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <h4 className="font-display text-primary text-2xl italic tracking-tight leading-tight">Sua jornada de <br />personalização está concluída.</h4>
              <p className="text-primary/40 text-xs font-light px-4">Cada detalhe selecionado será cuidadosamente preparado pela equipe Julia Zenaro.</p>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 inset-x-0 p-8 z-[100]">
        <div className="premium-blur rounded-[32px] border border-primary/5 p-2 shadow-huge">
          <button
            onClick={handleNext}
            disabled={loading}
            className="w-full h-18 bg-primary text-white rounded-[24px] font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="size-6 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                {step === 5 ? 'Salvar Experiência' : 'Continuar Jornada'}
                <span className="material-symbols-outlined !text-xl text-accent-gold">{step === 5 ? 'verified' : 'east'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Safe Area View Inset */}
      <div className="fixed bottom-0 left-0 w-full h-4 bg-background-light pointer-events-none z-[110]"></div>
    </div>
  );
};

export default AestheticProfile;
