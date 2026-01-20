
import React from 'react';
import { useNavigate } from 'react-router-dom';

const PriveJourney: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 font-sans antialiased pb-24">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-white/85 dark:bg-[#121212]/85 backdrop-blur-md">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-primary dark:text-gold">
                    <span className="material-symbols-outlined">arrow_back_ios_new</span>
                </button>
                <h1 className="font-display italic text-xl tracking-tight text-primary dark:text-gold-light">JZ Privé Club</h1>
                <button onClick={() => alert('Informações sobre níveis e benefícios em breve.')} className="p-2 -mr-2 text-primary dark:text-gold">
                    <span className="material-symbols-outlined">info</span>
                </button>
            </header>

            <main className="pt-24 pb-32 px-6 max-w-md mx-auto space-y-8">
                <div className="mb-10 text-center">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-primary/60 dark:text-gold/60">JZ PRIVÉ CLUB</span>
                    <h2 className="font-display italic text-3xl mt-2 leading-tight">Sua jornada de exclusividade e beleza</h2>
                </div>

                {/* SELECT TIER */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl relative overflow-hidden transition-all border border-slate-100 dark:border-white/5">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-3xl text-slate-400">workspace_premium</span>
                        </div>
                        <h3 className="font-display text-2xl mb-2">Select</h3>
                        <p className="italic text-sm text-slate-500 dark:text-slate-400 mb-6 px-4">"O início de sua experiência personalizada conosco."</p>
                        <ul className="w-full space-y-4 mb-8">
                            <li className="flex items-center text-sm gap-3">
                                <span className="material-symbols-outlined text-gold text-lg">check_circle</span>
                                <span>5% de cashback em serviços</span>
                            </li>
                            <li className="flex items-center text-sm gap-3">
                                <span className="material-symbols-outlined text-gold text-lg">check_circle</span>
                                <span>Mimo de boas-vindas</span>
                            </li>
                        </ul>
                        <button className="w-full py-3 px-6 rounded-full border border-primary/20 dark:border-gold/20 text-xs font-bold tracking-widest uppercase hover:bg-primary hover:text-white transition-colors">
                            Ver Detalhes
                        </button>
                    </div>
                </div>

                {/* PRIME TIER */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl relative overflow-hidden transition-all border border-gold/30 shadow-gold/10">
                    <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full">
                        Status Popular
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-3xl text-gold">star</span>
                        </div>
                        <h3 className="font-display text-2xl mb-2">Prime</h3>
                        <p className="italic text-sm text-slate-500 dark:text-slate-400 mb-6 px-4">"Conforto e prioridade para quem nos inspira todos os dias."</p>
                        <ul className="w-full space-y-4 mb-8">
                            <li className="flex items-center text-sm gap-3">
                                <span className="material-symbols-outlined text-gold text-lg">check_circle</span>
                                <span className="font-medium">10% de cashback em serviços</span>
                            </li>
                            <li className="flex items-center text-sm gap-3">
                                <span className="material-symbols-outlined text-gold text-lg">check_circle</span>
                                <span>Check-in antecipado</span>
                            </li>
                            <li className="flex items-center text-sm gap-3">
                                <span className="material-symbols-outlined text-gold text-lg">check_circle</span>
                                <span>Brinde de aniversário exclusivo</span>
                            </li>
                        </ul>
                        <button className="w-full py-4 px-6 bg-primary text-white rounded-full text-xs font-bold tracking-widest uppercase shadow-lg shadow-primary/20">
                            Detalhes do Status
                        </button>
                    </div>
                </div>

                {/* SIGNATURE TIER */}
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl relative overflow-hidden transition-all border border-slate-100 dark:border-white/5 opacity-80 hover:opacity-100">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/10 rounded-full flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-3xl text-blue-300">diamond</span>
                        </div>
                        <h3 className="font-display text-2xl mb-2 text-slate-400 dark:text-slate-500">Signature</h3>
                        <p className="italic text-sm text-slate-400 dark:text-slate-600 mb-6 px-4">"A máxima expressão de luxo, cuidado e prioridade absoluta."</p>
                        <ul className="w-full space-y-4 mb-8 text-slate-400 dark:text-slate-500">
                            <li className="flex items-center text-sm gap-3">
                                <span className="material-symbols-outlined text-slate-300 text-lg">check_circle</span>
                                <span>15% de cashback em serviços</span>
                            </li>
                            <li className="flex items-center text-sm gap-3">
                                <span className="material-symbols-outlined text-slate-300 text-lg">check_circle</span>
                                <span>Prioridade absoluta na agenda</span>
                            </li>
                            <li className="flex items-center text-sm gap-3">
                                <span className="material-symbols-outlined text-slate-300 text-lg">check_circle</span>
                                <span>Consultoria estética trimestral</span>
                            </li>
                        </ul>
                        <button className="w-full py-3 px-6 rounded-full border border-slate-200 dark:border-white/10 text-xs font-bold tracking-widest uppercase text-slate-400">
                            Ver Requisitos
                        </button>
                    </div>
                </div>

                {/* PRIVÉ TIER */}
                <div className="bg-primary rounded-3xl p-8 shadow-xl relative overflow-hidden transition-all">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gold/10 rounded-full blur-2xl"></div>
                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-3xl text-gold">verified_user</span>
                        </div>
                        <h3 className="font-display text-2xl mb-2 text-white">Privé</h3>
                        <p className="italic text-sm text-white/60 mb-6 px-4">"O ápice da personalização. Apenas para convidados e seletos membros."</p>
                        <ul className="w-full space-y-4 mb-8 text-white/80">
                            <li className="flex items-center text-sm gap-3">
                                <span className="material-symbols-outlined text-gold text-lg">auto_awesome</span>
                                <span>Concierge privado 24/7</span>
                            </li>
                            <li className="flex items-center text-sm gap-3">
                                <span className="material-symbols-outlined text-gold text-lg">auto_awesome</span>
                                <span>Acesso a eventos ultra-exclusivos</span>
                            </li>
                            <li className="flex items-center text-sm gap-3">
                                <span className="material-symbols-outlined text-gold text-lg">auto_awesome</span>
                                <span>Tratamentos em domicílio inclusos</span>
                            </li>
                        </ul>
                        <div className="w-full py-3 px-6 rounded-full bg-white/10 text-xs font-bold tracking-widest uppercase text-white border border-white/20">
                            Nível de Prestígio
                        </div>
                    </div>
                </div>

                <div className="mt-16 text-center space-y-6">
                    <button className="flex items-center justify-center gap-2 mx-auto text-primary dark:text-gold font-semibold text-sm tracking-wide">
                        <span>COMO SUBIR DE NÍVEL</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                    <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed px-8">
                        Cada serviço realizado aproxima você de uma nova experiência no Studio Julia Zenaro.
                    </p>
                </div>
            </main>

        </div>
    );
};

export default PriveJourney;
