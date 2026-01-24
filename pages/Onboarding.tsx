
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

const STEPS = [
  {
    badge: 'PREMIUM EXPERIENCE',
    title: 'Bem-vinda ao',
    titleHighlight: 'LOGO_PLACEHOLDER', // Special marker
    emoji: '✨',
    description: 'Um espaço onde beleza, cuidado e exclusividade se encontram.',
    subdescription: 'Seu momento começa aqui.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAy5GldwqRGHG6g26GVS-JVYudaiA_vE6mOQ5LZjfg8mO8HZWX4VrbW5zeZAyEy62XbXP9gt_DlX8gzFs2_GjrC_mZbdmBsZEkYcxYFqdWxExccxBzI6SGt_tN9bI1pOjpk4FmZX6AF4FguL3xobL5_2Ht8C1JgJNozi9qsSSdQS_UvtoL4OKk9DjFPYlD08ZPAHNpvQutY533cT93-fRR-8w9G81yZVz0vAR4Ncq0KVQPuMOJFm66a1BRisCGwxyU0vbiopEnC',
    layout: 'fullscreen',
    buttonText: 'Próximo passo',
    skipText: 'Pular introdução'
  },
  {
    title: 'Sua beleza.',
    titleHighlight: 'Seu estilo. Seu tempo.',
    description: 'Cada atendimento é pensado para você, com técnica, sensibilidade e personalização total.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAbNouFoih7BM4D4BkCXCDsJgGIPLWqFLSLMUraRMSvPS918TuJXNtRSSJAtmqMF0tWFFR_ucbEasQXEb8FU0O4aFPSwyRSmip98_j9ZjtzanrsY6p9kuCMBPqDQ_BWLW9Wr8LpFeeDr7rw3G4_AVgLPwpwKhxvFyoe5-8NnB4jIuauS64pw_f4DtSJ86_p-atG8cwz_56CG12gZDLmywhVGnL727MoyG1ltPQ9kmRrorbrvPJUrTwDrc8yPMZg4z6PXBcn3AHltDw',
    layout: 'centered',
    buttonText: 'Continuar',
    skipText: 'Pular introdução'
  },
  {
    title: 'Você no controle da',
    titleHighlight: 'sua experiência',
    description: 'Agende quando quiser, acompanhe seus atendimentos e descubra benefícios exclusivos do',
    highlightWord: 'JZ Privé Club',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAc2LMzZfhE_XhL2PHu_bvNW5v1g2HokINt7k5ys6AJ0vHHC6jIfQ4yzYh_oQdNPjWIuXFzaFosuLGHbgl-U_DXOYMeeXvTQ9-7XDNSMqsrzZHpAccbdM4An2jivw8GKkKM2rDmajsbL3TVp6aD7gdL9wdETl7ZK11Lj4sYWm3M-LGOkHrxvLZXm_0HYOt9jDKwDu-0Pv2uVKKykOlWRhNRMQm3zijOG--X4kd30i6fyLyvjT8wGzoRsebPS8Rgx0dNaPUM_P2N',
    layout: 'centered',
    buttonText: 'Criar minha conta',
    skipText: 'Já sou cliente'
  }
];

const Onboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      navigate('/register');
    }
  };

  const handleSkip = () => {
    navigate('/login');
  };

  const step = STEPS[currentStep];

  // Layout 1: Fullscreen experience with narrative focus (Tela 1)
  if (step.layout === 'fullscreen') {
    return (
      <div className="relative h-full w-full overflow-hidden flex flex-col bg-background-dark text-white selection:bg-accent-gold/20">
        {/* Background Narrative Image */}
        <div className="absolute inset-0 z-0 h-[70%]">
          <img
            src={step.image}
            alt="Studio Julia Zenaro"
            className="w-full h-full object-cover grayscale-[0.2]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background-dark/60 to-background-dark"></div>
        </div>

        {/* Dynamic Silhouettes */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden z-1">
          <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/20 blur-[100px] animate-float"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-10 pb-16">
          <div className="flex-grow"></div>

          {/* Narrative Text Section */}
          <div className="text-center space-y-6 mb-12 animate-reveal">
            {step.badge && (
              <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/5 border border-white/10 rounded-full mb-2">
                <span className="h-px w-3 bg-accent-gold/60"></span>
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-accent-gold/80">
                  {step.badge}
                </span>
                <span className="h-px w-3 bg-accent-gold/60"></span>
              </div>
            )}

            <h1 className="font-display text-4xl text-white italic leading-tight flex flex-col items-center">
              {step.title}
              {step.titleHighlight === 'LOGO_PLACEHOLDER' ? (
                <div className="mt-4 drop-shadow-huge">
                  <Logo size="xl" variant="gold" className="w-[240px]" />
                </div>
              ) : (
                <span className="text-accent-gold not-italic font-bold tracking-tight mt-2">{step.titleHighlight}</span>
              )}
            </h1>

            <p className="text-white/40 text-sm font-outfit font-light leading-relaxed max-w-[280px] mx-auto italic">
              {step.description}
            </p>

            {step.subdescription && (
              <p className="text-accent-gold/60 text-[9px] font-black uppercase tracking-[0.4em] pt-4 select-none">
                {step.subdescription}
              </p>
            )}
          </div>

          {/* Progress & Interaction */}
          <div className="space-y-10">
            <div className="flex justify-center items-center gap-3">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-700 ${i === currentStep ? 'w-12 bg-accent-gold shadow-[0_0_15px_rgba(201,169,97,0.4)]' : 'w-2 bg-white/10'
                    }`}
                />
              ))}
            </div>

            <div className="space-y-6">
              <button
                onClick={handleNext}
                className="group relative w-full h-20 bg-accent-gold text-primary rounded-[32px] font-outfit font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-accent-gold/10 overflow-hidden active:scale-95 transition-all"
              >
                <div className="absolute inset-x-0 bottom-0 h-1 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {step.buttonText}
                  <span className="material-symbols-outlined !text-xl group-hover:translate-x-2 transition-transform">east</span>
                </span>
              </button>

              <button
                onClick={handleSkip}
                className="w-full text-white/20 hover:text-white font-black text-[9px] uppercase tracking-[0.4em] py-2 transition-colors"
              >
                {step.skipText}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Layout 2 & 3: Centered portrait experience (Tela 2 e 3)
  return (
    <div className="flex flex-col h-full bg-background-dark text-white px-10 py-16 overflow-hidden relative selection:bg-accent-gold/20">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-[-10%] left-[-20%] w-[70%] aspect-square organic-shape-1 bg-emerald-500/10 blur-[120px] animate-float"></div>
        <div className="absolute bottom-[-5%] right-[-10%] w-[60%] aspect-square organic-shape-2 bg-accent-gold/10 blur-[100px] animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Image Artwork Section */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center animate-reveal">
        <div className="relative w-full aspect-[4/5] max-h-[420px]">
          {/* Elite Framing */}
          <div className="absolute -right-4 -bottom-4 w-full h-full border border-accent-gold/20 rounded-[56px] pointer-events-none scale-105"></div>
          <div className="absolute -left-4 -top-4 w-full h-full border border-white/5 rounded-[56px] pointer-events-none -rotate-3"></div>

          {/* Portrait Image */}
          <div className="relative w-full h-full overflow-hidden rounded-[56px] shadow-hugest border-4 border-white/5">
            <img
              src={step.image}
              alt="Onboarding"
              className="w-full h-full object-cover grayscale-[0.3] hover:grayscale-0 transition-all duration-[2000ms]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 via-transparent to-transparent"></div>

            <div className="absolute top-6 left-6">
              <div className="premium-blur px-4 py-2 rounded-full border border-white/10">
                <p className="text-[8px] font-black uppercase tracking-widest text-accent-gold/80">Signature Art</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Narrative Progress Section */}
      <div className="relative z-10 flex flex-col items-center text-center mt-12 space-y-8 animate-reveal" style={{ animationDelay: '0.2s' }}>
        <div className="space-y-4">
          <h1 className="font-display text-4xl text-white italic leading-tight">
            {step.title} <br />
            <span className="text-accent-gold not-italic font-bold tracking-tight">{step.titleHighlight}</span>
          </h1>

          <p className="text-white/40 text-[13px] font-outfit font-light leading-relaxed max-w-[300px] mx-auto italic px-4">
            {step.description}
            {step.highlightWord && (
              <span className="text-accent-gold font-bold not-italic"> {step.highlightWord}</span>
            )}
          </p>
        </div>

        {/* Progress Timeline */}
        <div className="flex gap-3 py-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-700 ${i === currentStep ? 'h-1.5 w-12 bg-accent-gold shadow-huge' : 'h-1.5 w-1.5 bg-white/10'
                }`}
            />
          ))}
        </div>

        {/* Action Controls */}
        <div className="w-full space-y-6 pt-4">
          <button
            onClick={handleNext}
            className="group relative w-full h-18 bg-white/5 border border-white/10 text-white rounded-[32px] font-outfit font-black text-[10px] uppercase tracking-[0.4em] overflow-hidden shadow-2xl active:scale-95 transition-all hover:bg-white hover:text-primary hover:border-white"
          >
            <div className="absolute inset-x-0 bottom-0 h-1 bg-accent-gold translate-y-full group-hover:translate-y-0 transition-transform"></div>
            <span className="relative z-10 flex items-center justify-center gap-3">
              {step.buttonText}
              <span className="material-symbols-outlined !text-xl group-hover:translate-x-2 transition-transform">east</span>
            </span>
          </button>

          <button
            onClick={handleSkip}
            className="w-full text-white/10 hover:text-white font-black py-2 text-[9px] uppercase tracking-[0.4em] transition-colors"
          >
            {step.skipText}
          </button>
        </div>
      </div>

      {/* Visual Safe Area Inset */}
      <div className="fixed bottom-0 left-0 w-full h-8 bg-background-dark pointer-events-none z-[90]"></div>
    </div>
  );
};

export default Onboarding;
