
import React from 'react';
import { useNavigate } from 'react-router-dom';

const PriveHowToEarn: React.FC = () => {
    const navigate = useNavigate();

    const earnMethods = [
        {
            icon: 'calendar_month',
            title: 'Agendamentos',
            desc: 'Ganhe 1 JZ Balance a cada R$ 1,00 gasto em serviços.',
            points: '1 JZ Balance / R$1'
        },
        {
            icon: 'diversity_3',
            title: 'Indique Amigas',
            desc: 'Sua amiga e você ganham JZ Balance extras.',
            points: '+200 JZ Balance'
        },
        {
            icon: 'check_circle',
            title: 'Check-in',
            desc: 'Realize o check-in ao chegar no estúdio pelo App.',
            points: '+10 JZ Balance'
        },
        {
            icon: 'share',
            title: 'Stories',
            desc: 'Poste um story marcando @studiojuliazenaro.',
            points: '+50 JZ Balance'
        }
    ];

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 font-sans pb-12">
            <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-white/85 dark:bg-[#121212]/85 backdrop-blur-md">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-primary dark:text-accent-gold">
                    <span className="material-symbols-outlined">arrow_back_ios_new</span>
                </button>
                <h1 className="font-display italic text-xl tracking-tight text-primary dark:text-gold-light">JZ Privé Club</h1>
                <div className="w-10"></div>
            </header>

            <main className="pt-24 px-6 max-w-md mx-auto space-y-8">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-accent-gold/10 rounded-full flex items-center justify-center mx-auto mb-4 text-accent-gold">
                        <span className="material-symbols-outlined text-4xl">savings</span>
                    </div>
                    <h2 className="font-display text-2xl font-bold text-primary dark:text-white mb-2">Acumule e Desfrute</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        Cada interação com o Studio Julia Zenaro te aproxima de experiências exclusivas.
                    </p>
                </div>

                <div className="grid gap-4">
                    {earnMethods.map((method, index) => (
                        <div key={index} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary dark:text-accent-gold shrink-0">
                                <span className="material-symbols-outlined">{method.icon}</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-primary dark:text-white text-base">{method.title}</h3>
                                <p className="text-xs text-gray-400 mt-1 leading-tight">{method.desc}</p>
                            </div>
                            <div className="bg-accent-gold/10 px-3 py-1.5 rounded-lg whitespace-nowrap">
                                <span className="text-xs font-black text-accent-gold uppercase tracking-wider">{method.points}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-primary rounded-3xl p-8 relative overflow-hidden mt-8 text-white text-center">
                    <div className="relative z-10">
                        <h3 className="font-display text-xl font-bold mb-2">Indique Agora</h3>
                        <p className="text-sm opacity-80 mb-6">Envie seu link exclusivo de convite.</p>
                        <button onClick={() => navigate('/profile/refer')} className="bg-white text-primary px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-colors">
                            Convidar Amigas
                        </button>
                    </div>
                    {/* Abstract Shapes */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent-gold/20 rounded-full blur-xl -ml-12 -mb-12"></div>
                </div>
            </main>
        </div>
    );
};

export default PriveHowToEarn;
