
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  {
    title: "Bem-vinda ao Studio Julia Zenaro ✨",
    description: "Um espaço onde beleza, cuidado e sofisticação se encontram.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFim2_oDyqUiJUw-0J3HjkrxaHPnWjNixYmKdp1zvyeA1UnBL0E863gU9SHKPNodlB7fOW3rz9CtfPnjYShgauI2eRhRQkZRE8i8ToEVLU8NGFkP5CDcDyCivE4J-IyGyNUnP2UYB5MOEbzlb6SSQKUx6e3i2tgJ3cyq6bi0Ck63G3aKzYrOSeiqsJyKJPt3KujKAH5I2JDuaq5Px60zxYNXd4fa26fEH6l02s5-KsRvieajvuYzC0TO0742X8hBH61fQ7dZ6IEJc",
    isFullImage: true
  },
  {
    title: "Experiência Personalizada",
    description: "Seus atendimentos são únicos, respeitando seu estilo, seu tempo e sua beleza natural.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbNouFoih7BM4D4BkCXCDsJgGIPLWqFLSLMUraRMSvPS918TuJXNtRSSJAtmqMF0tWFFR_ucbEasQXEb8FU0O4aFPSwyRSmip98_j9ZjtzanrsY6p9kuCMBPqDQ_BWLW9Wr8LpFeeDr7rw3G4_AVgLPwpwKhxvFyoe5-8NnB4jIuauS64pw_f4DtSJ86_p-atG8cwz_56CG12gZDLmywhVGnL727MoyG1ltPQ9kmRrorbrvPJUrTwDrc8yPMZg4z6PXBcn3AHltDw",
    isFullImage: false
  },
  {
    title: "Controle na Palma da Mão",
    description: "Seu cuidado, no seu ritmo. Agende quando quiser e receba novidades exclusivas.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD_ER8xsFCWn0CBtAJ6k8DDSiYrh734cDSwaXw0Gs33rDaUwOSqIr8kGYlD83PjoHEu1ErJ3UQq4b_XVzFylcCq_M_O18l5aQ-vs3PbnFu8nBEXXgb55czAZvyRPmld81ox1OLxi90VvT34LyMGCATQqns60Ermr16aAdbjy2481BxzyRi48oPFlsjeqTtrYgrblSj-2Bnf_iksnTym6tA3DOF2I-Pp9hn8rO20blqNwS133EYJGlKOjre_X8vyoLkjPHg10AUxmxQ",
    isFullImage: false
  }
];

const Onboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      navigate('/login');
    }
  };

  const step = STEPS[currentStep];

  return (
    <div className="flex flex-col h-full bg-background-light">
      <div className={`relative flex-1 ${step.isFullImage ? '' : 'p-6 flex flex-col justify-center'}`}>
        {step.isFullImage ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${step.image})` }}>
            <div className="absolute inset-0 bg-gradient-to-t from-background-light via-transparent to-transparent"></div>
          </div>
        ) : (
          <div className="relative group">
             <div className="absolute -top-3 -left-3 w-24 h-24 border-t-2 border-l-2 border-accent-gold/40 rounded-tl-xl"></div>
             <div className="absolute -bottom-3 -right-3 w-24 h-24 border-b-2 border-r-2 border-accent-gold/40 rounded-br-xl"></div>
             <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-2xl z-10">
                <img src={step.image} className="w-full h-full object-cover" alt="onboarding" />
             </div>
          </div>
        )}

        <div className={`relative z-10 flex flex-col ${step.isFullImage ? 'h-full justify-end px-8 pb-32 text-center' : 'mt-10 px-4 text-center'}`}>
          <h1 className="font-display text-primary text-[32px] font-bold leading-tight mb-4">{step.title}</h1>
          <p className="text-gray-600 text-lg leading-relaxed">{step.description}</p>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className="flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-accent-gold' : 'w-2 bg-primary/20'}`}></div>
          ))}
        </div>
        
        <button 
          onClick={handleNext}
          className="w-full h-16 bg-primary text-white rounded-full font-bold text-lg shadow-lg flex items-center justify-center gap-2 group active:scale-95 transition-transform"
        >
          {currentStep === STEPS.length - 1 ? 'Criar minha conta' : 'Próximo Passo'}
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
        
        <button 
          onClick={() => navigate('/login')}
          className="w-full text-primary font-bold py-2 tracking-wide text-sm opacity-60"
        >
          {currentStep === STEPS.length - 1 ? 'Já sou cliente' : 'Pular introdução'}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
