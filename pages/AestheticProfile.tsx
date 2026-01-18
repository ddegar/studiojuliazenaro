
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Step = 1 | 2 | 3 | 4 | 5;

const AestheticProfile: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // States for all selections
  const [eyeShape, setEyeShape] = useState('amendoado');
  const [style, setStyle] = useState('natural');
  const [curvature, setCurvature] = useState('D');
  const [length, setLength] = useState(50); // 0-100 slider
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

  const handleNext = () => {
    if (step < 5) setStep((step + 1) as Step);
    else handleSave();
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step);
    else navigate(-1);
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Preferências salvas com carinho! ✨');
      navigate('/profile');
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-[#fbfaf9]">
      {/* Header Fixo Premium */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md p-6 border-b border-gray-100 flex items-center justify-between">
        <button onClick={handleBack} className="material-symbols-outlined text-primary">arrow_back_ios_new</button>
        <div className="text-center">
          <h2 className="font-display font-bold text-primary text-lg">
            {step === 1 && 'Perfil do Olhar'}
            {step === 2 && 'Preferências Estéticas'}
            {step === 3 && 'Espessura e Intensidade'}
            {step === 4 && 'Manutenção e Alergias'}
            {step === 5 && 'Seu Bem-estar'}
          </h2>
          <p className="text-[9px] uppercase tracking-[0.2em] text-accent-gold font-black">Studio Julia Zenaro</p>
        </div>
        <span className="material-symbols-outlined text-primary opacity-60">info</span>
      </header>

      {/* Progress Bar Passo a Passo */}
      <div className="px-8 pt-6 pb-2">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">
            {step === 1 && 'Preferências - Formato dos Olhos'}
            {step === 2 && 'Personalização do Olhar'}
            {step === 3 && 'Personalização do Olhar'}
            {step === 4 && 'Frequência e Cuidados'}
            {step === 5 && 'Hospitalidade Premium'}
          </span>
          <span className="text-[10px] font-black text-accent-gold uppercase tracking-widest">Passo {step} de 5</span>
        </div>
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out" 
            style={{ width: `${(step / 5) * 100}%` }}
          ></div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto no-scrollbar p-8 pb-32">
        {step === 1 && (
          <div className="space-y-10 animate-fade-in">
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-display font-bold text-primary leading-tight">Qual o formato dos seus olhos?</h1>
              <p className="text-sm text-gray-500 font-medium px-4">Isso nos ajuda a definir o mapeamento ideal para o seu rosto.</p>
            </div>

            <div className="space-y-4">
              {[
                { id: 'amendoado', label: 'Amendoado', desc: 'Formato clássico e versátil.', icon: 'visibility' },
                { id: 'arredondado', label: 'Arredondado', desc: 'Mais altura e expressividade.', icon: 'lens' },
                { id: 'monolidico', label: 'Monolídico', desc: 'Pálpebra única, exige projeção.', icon: 'remove_red_eye' },
                { id: 'caido', label: 'Caído', desc: 'Canto externo inclinado para baixo.', icon: 'south_east' }
              ].map((opt) => (
                <button 
                  key={opt.id}
                  onClick={() => setEyeShape(opt.id)}
                  className={`w-full p-6 rounded-[32px] border-2 flex items-center gap-5 transition-all text-left group ${eyeShape === opt.id ? 'border-primary bg-primary/5 shadow-lg' : 'border-gray-100 bg-white'}`}
                >
                  <div className={`size-14 rounded-full flex items-center justify-center transition-colors ${eyeShape === opt.id ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400'}`}>
                    <span className="material-symbols-outlined !text-3xl">{opt.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-lg text-primary">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                  <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${eyeShape === opt.id ? 'border-primary bg-primary' : 'border-gray-200'}`}>
                    {eyeShape === opt.id && <span className="material-symbols-outlined text-white !text-sm">check</span>}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-center text-[10px] font-black text-accent-gold uppercase tracking-[0.3em] pt-4">Consultoria Profissional Julia Zenaro</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10 animate-fade-in">
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-display font-bold text-primary leading-tight">Escolha o seu Estilo</h1>
              <p className="text-sm text-gray-500 font-medium px-4">Selecione o volume que melhor expressa sua personalidade hoje.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'natural', label: 'Natural Look', desc: 'Um fio por vez, realce discreto.', img: 'https://picsum.photos/400/500?sig=10' },
                { id: 'rimel', label: 'Efeito Rímel', desc: 'Volume clássico com mais definição.', img: 'https://picsum.photos/400/500?sig=11' },
                { id: 'russo', label: 'Volume Russo', desc: 'Preenchimento total e glamour.', img: 'https://picsum.photos/400/500?sig=12' },
                { id: 'lifting', label: 'Lash Lifting', desc: 'Curvatura natural sem extensões.', img: 'https://picsum.photos/400/500?sig=13' }
              ].map((opt) => (
                <button 
                  key={opt.id}
                  onClick={() => setStyle(opt.id)}
                  className={`relative aspect-[3/4] rounded-[32px] overflow-hidden border-2 transition-all ${style === opt.id ? 'border-primary ring-4 ring-primary/5 shadow-xl' : 'border-transparent'}`}
                >
                  <img src={opt.img} className="w-full h-full object-cover" alt={opt.label} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-left">
                    <p className="font-bold text-white text-base leading-tight mb-1">{opt.label}</p>
                    <p className="text-[10px] text-white/70 leading-tight">{opt.desc}</p>
                  </div>
                  {style === opt.id && (
                    <div className="absolute top-4 right-4 size-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg">
                      <span className="material-symbols-outlined !text-sm">check</span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <section className="space-y-6 pt-4">
              <div className="flex justify-between items-end">
                <h3 className="font-display font-bold text-xl text-primary">Curvatura</h3>
                <button className="text-[10px] font-black text-accent-gold uppercase underline">Ver Guia ?</button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'C', label: 'C-CURL', sub: 'Natural', icon: 'gesture' },
                  { id: 'D', label: 'D-CURL', sub: 'Marcado', icon: 'all_inclusive' },
                  { id: 'L', label: 'L-CURL', sub: 'Elevado', icon: 'trending_up' }
                ].map((c) => (
                  <button 
                    key={c.id}
                    onClick={() => setCurvature(c.id)}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${curvature === c.id ? 'border-primary bg-primary text-white' : 'border-gray-50 bg-white text-gray-400'}`}
                  >
                    <span className="material-symbols-outlined !text-3xl">{c.icon}</span>
                    <div className="text-center">
                      <p className="text-[10px] font-black tracking-widest">{c.label}</p>
                      <p className={`text-[8px] font-bold uppercase tracking-widest ${curvature === c.id ? 'text-white/60' : 'text-gray-300'}`}>{c.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-display font-bold text-xl text-primary">Comprimento</h3>
                <span className="bg-gray-100 px-4 py-1.5 rounded-full text-[10px] font-black text-primary">11-13mm (Médio)</span>
              </div>
              <div className="px-4">
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={length}
                  onChange={(e) => setLength(parseInt(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" 
                />
                <div className="flex justify-between mt-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <span>Discreto</span>
                  <span className="text-primary">Equilibrado</span>
                  <span>Impactante</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-10 animate-fade-in">
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-display font-bold text-primary leading-tight">Defina a intensidade do seu olhar</h1>
              <p className="text-sm text-gray-500 font-medium px-4">Escolha o acabamento ideal para seus fios ou pigmento.</p>
            </div>

            <section className="space-y-6">
              <h3 className="font-display font-bold text-xl text-primary">Espessura dos Fios</h3>
              <div className="space-y-3">
                {[
                  { id: 'natural', label: 'NATURAL', desc: 'Para um realce clássico e sutil.' },
                  { id: 'fino', label: 'ULTRA FINO', desc: 'Leveza máxima, aspecto imperceptível.' },
                  { id: 'intenso', label: 'INTENSO', desc: 'Fios mais espessos para maior destaque.' }
                ].map((opt) => (
                  <button 
                    key={opt.id}
                    onClick={() => setThickness(opt.id)}
                    className={`w-full p-6 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${thickness === opt.id ? 'border-primary bg-primary text-white' : 'border-gray-50 bg-white'}`}
                  >
                    <div>
                      <p className={`font-black text-xs tracking-widest ${thickness === opt.id ? 'text-white' : 'text-primary'}`}>{opt.label}</p>
                      <p className={`text-[10px] mt-1 ${thickness === opt.id ? 'text-white/60' : 'text-gray-400'}`}>{opt.desc}</p>
                    </div>
                    {thickness === opt.id && <span className="material-symbols-outlined text-white">check_circle</span>}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-display font-bold text-xl text-primary">Intensidade do Pigmento</h3>
                <span className="bg-gray-100 px-4 py-1.5 rounded-full text-[10px] font-black text-primary">Médio</span>
              </div>
              <div className="px-4">
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={pigment}
                  onChange={(e) => setPigment(parseInt(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" 
                />
                <div className="flex justify-between mt-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <span>Discreto</span>
                  <span className="text-primary">Equilibrado</span>
                  <span>Marcante</span>
                </div>
              </div>
              <div className="bg-accent-gold/5 p-6 rounded-3xl border border-accent-gold/20 flex gap-4">
                <span className="material-symbols-outlined text-accent-gold">lightbulb</span>
                <p className="text-[11px] text-primary/70 italic leading-relaxed">A intensidade "Equilibrada" é a mais escolhida para Lash Lifting, proporcionando brilho e profundidade sem pesar o olhar.</p>
              </div>
            </section>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-10 animate-fade-in">
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-display font-bold text-primary leading-tight">Intervalo de Manutenção</h1>
              <p className="text-sm text-gray-500 font-medium px-4">Com que frequência você gostaria de renovar seu olhar?</p>
            </div>

            <div className="space-y-4">
              {[
                { id: '2', label: 'A cada 2 semanas', desc: 'Ideal para manter o volume sempre impecável.' },
                { id: '3', label: 'A cada 3 semanas', desc: 'Equilíbrio perfeito entre durabilidade e estética.', recommended: true },
                { id: '4', label: 'A cada 4 semanas', desc: 'Para quem busca praticidade e um ciclo longo.' }
              ].map((opt) => (
                <button 
                  key={opt.id}
                  onClick={() => setMaintenance(opt.id)}
                  className={`w-full p-6 rounded-[32px] border-2 text-left transition-all relative ${maintenance === opt.id ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-50 bg-white'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-primary text-lg">{opt.label}</p>
                    <div className={`size-6 rounded-full border-2 flex items-center justify-center ${maintenance === opt.id ? 'border-primary bg-primary' : 'border-gray-200'}`}>
                      {maintenance === opt.id && <span className="material-symbols-outlined text-white !text-sm">check</span>}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 pr-10">{opt.desc}</p>
                  {opt.recommended && (
                    <span className="absolute top-0 right-10 -translate-y-1/2 bg-accent-gold/10 text-accent-gold px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-accent-gold/20">RECOMENDADO</span>
                  )}
                </button>
              ))}
            </div>

            <section className="space-y-4 pt-4">
               <div className="flex items-center gap-3 px-1 text-primary">
                  <span className="material-symbols-outlined !text-2xl">medical_services</span>
                  <h3 className="font-display font-bold text-xl">Alergias ou Observações</h3>
               </div>
               <textarea 
                  placeholder="Ex: Tenho sensibilidade a colas específicas ou rinite..."
                  className="w-full bg-white border border-gray-100 rounded-[32px] p-8 text-sm focus:ring-primary h-40 italic placeholder:text-gray-300 shadow-sm"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
               />
               <p className="text-right text-[9px] font-black text-gray-300 uppercase tracking-widest">Opcional</p>
            </section>
            
            <p className="text-center font-display italic text-primary/40 text-lg pt-4 animate-pulse">Estamos quase lá ✨</p>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-12 animate-fade-in">
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-display font-bold text-primary leading-tight">Seu Momento VIP</h1>
              <p className="text-sm text-gray-500 font-medium px-4">Como podemos tornar sua experiência ainda mais acolhedora?</p>
            </div>

            <section className="space-y-8">
              {/* Preferência de Bebida */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <span className="material-symbols-outlined">coffee</span>
                  <h3 className="font-display font-bold text-lg">O que você aceita beber?</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'cafe', label: 'Café Expresso' },
                    { id: 'agua', label: 'Água Aromatizada' },
                    { id: 'refri', label: 'Refrigerante' },
                    { id: 'cha', label: 'Chá Gelado' }
                  ].map(opt => (
                    <button 
                      key={opt.id}
                      onClick={() => setHospitality({...hospitality, drink: opt.id})}
                      className={`h-14 rounded-2xl border-2 text-xs font-bold uppercase transition-all ${hospitality.drink === opt.id ? 'border-primary bg-primary text-white shadow-md' : 'border-gray-50 bg-white text-gray-400'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferência de Música */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <span className="material-symbols-outlined">music_note</span>
                  <h3 className="font-display font-bold text-lg">Gênero Musical favorito</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'jazz', label: 'Jazz & Bossa' },
                    { id: 'pop', label: 'Pop Acústico' },
                    { id: 'lofi', label: 'Lofi & Relax' },
                    { id: 'silencio', label: 'Silêncio (Deep)' }
                  ].map(opt => (
                    <button 
                      key={opt.id}
                      onClick={() => setHospitality({...hospitality, music: opt.id})}
                      className={`h-14 rounded-2xl border-2 text-xs font-bold uppercase transition-all ${hospitality.music === opt.id ? 'border-primary bg-primary text-white shadow-md' : 'border-gray-50 bg-white text-gray-400'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferência de Snacks */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <span className="material-symbols-outlined">cookie</span>
                  <h3 className="font-display font-bold text-lg">Acompanhamento</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'bolacha', label: 'Bolachas Finas' },
                    { id: 'frutas', label: 'Frutas Frescas' },
                    { id: 'chocolate', label: 'Chocolate 70%' },
                    { id: 'nenhum', label: 'Apenas a bebida' }
                  ].map(opt => (
                    <button 
                      key={opt.id}
                      onClick={() => setHospitality({...hospitality, snack: opt.id})}
                      className={`h-14 rounded-2xl border-2 text-xs font-bold uppercase transition-all ${hospitality.snack === opt.id ? 'border-primary bg-primary text-white shadow-md' : 'border-gray-50 bg-white text-gray-400'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="bg-primary p-8 rounded-[40px] text-center space-y-4 shadow-2xl shadow-primary/20">
              <span className="material-symbols-outlined text-accent-gold !text-5xl">auto_awesome</span>
              <h4 className="font-display text-white text-xl">Sua experiência personalizada está pronta!</h4>
              <p className="text-white/60 text-xs">Cuidamos de cada detalhe para que você se sinta em casa.</p>
            </div>
          </div>
        )}
      </main>

      {/* Botão de Ação Inferior */}
      <div className="fixed bottom-0 inset-x-0 p-8 glass-nav border-t border-gray-100 rounded-t-[40px] shadow-[0_-15px_40px_rgba(0,0,0,0.05)] z-50">
        <button 
          onClick={handleNext}
          disabled={loading}
          className="w-full h-18 bg-primary text-white rounded-[24px] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all"
        >
          {loading ? (
            <div className="size-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              {step === 5 ? 'Salvar Minhas Preferências' : 'Continuar'}
              <span className="material-symbols-outlined !text-base">{step === 5 ? 'done_all' : 'east'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AestheticProfile;
