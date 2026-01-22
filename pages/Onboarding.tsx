
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  {
    badge: 'PREMIUM EXPERIENCE',
    title: 'Bem-vinda ao',
    titleHighlight: 'Studio Julia Zenaro',
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

  // Layout 1: Fullscreen image with gradient overlay (Tela 1)
  if (step.layout === 'fullscreen') {
    return (
      <div className="relative h-full w-full overflow-hidden flex flex-col bg-background-light">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 h-[65%]">
          <img
            src={step.image}
            alt="Studio Julia Zenaro"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background-light/80 to-background-light"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-8 pb-12">
          <div className="flex-grow"></div>

          {/* Text Section */}
          <div className="text-center space-y-4 mb-12">
            {step.badge && (
              <div className="inline-block px-4 py-1.5 bg-primary/10 rounded-full mb-2">
                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-primary">
                  {step.badge}
                </span>
              </div>
            )}

            <h1 className="font-display text-4xl text-primary leading-tight">
              {step.title} <br />
              <span className="italic">{step.titleHighlight}</span>
            </h1>

            {step.emoji && (
              <div className="text-2xl">{step.emoji}</div>
            )}

            <p className="text-gray-600 text-lg leading-relaxed max-w-[280px] mx-auto">
              {step.description}
            </p>

            {step.subdescription && (
              <p className="text-gray-400 text-sm font-medium pt-2">
                {step.subdescription}
              </p>
            )}
          </div>

          {/* Progress & Buttons */}
          <div className="space-y-8">
            <div className="flex justify-center items-center gap-2">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-accent-gold' : 'w-2 bg-gray-300'
                    }`}
                />
              ))}
            </div>

            <div className="space-y-4">
              <button
                onClick={handleNext}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-5 px-6 rounded-full flex justify-center items-center gap-2 shadow-xl shadow-primary/20 transition-all active:scale-95 group"
              >
                {step.buttonText}
                <span className="material-symbols-outlined text-accent-gold group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>

              <button
                onClick={handleSkip}
                className="w-full text-gray-400 hover:text-primary font-medium text-sm py-2 transition-colors"
              >
                {step.skipText}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Layout 2 & 3: Centered image card (Tela 2 e 3)
  return (
    <div className="flex flex-col min-h-full bg-background-light relative px-6 py-12 overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-accent-gold/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      {/* Image Section */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-full aspect-[4/5] max-h-[400px]">
          {/* Border decoration */}
          <div className="absolute -right-2 -bottom-2 w-full h-full border border-accent-gold/30 rounded-[2.5rem] pointer-events-none"></div>

          {/* Image */}
          <div className="relative w-full h-full overflow-hidden rounded-[2.5rem] shadow-2xl">
            <img
              src={step.image}
              alt="Onboarding"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent"></div>
          </div>
        </div>
      </div>

      {/* Text Section */}
      <div className="flex flex-col items-center text-center mt-8 space-y-4">
        <h1 className="font-display text-3xl font-semibold text-primary leading-tight">
          {step.title} <br />
          <span className="italic">{step.titleHighlight}</span>
        </h1>

        <p className="text-gray-600 text-sm leading-relaxed max-w-[280px]">
          {step.description}
          {step.highlightWord && (
            <span className="font-semibold text-primary"> {step.highlightWord}</span>
          )}
          {step.highlightWord && '.'}
        </p>

        {/* Progress Dots */}
        <div className="flex gap-2 py-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${i === currentStep ? 'h-1.5 w-8 bg-accent-gold' : 'h-1.5 w-1.5 bg-gray-300'
                }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="w-full space-y-4 pt-2">
          <button
            onClick={handleNext}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            {step.buttonText}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>

          <button
            onClick={handleSkip}
            className="w-full text-gray-500 font-medium py-2 text-sm hover:text-primary transition-colors"
          >
            {step.skipText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
