
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const PriveDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [points, setPoints] = useState(0);
    const [memberSince, setMemberSince] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('lash_points, created_at').eq('id', user.id).single();
                if (data) {
                    setPoints(data.lash_points || 0);
                    if (data.created_at) {
                        const date = new Date(data.created_at);
                        const month = date.toLocaleString('pt-BR', { month: 'short' });
                        const year = date.getFullYear();
                        setMemberSince(`${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTier = (pts: number) => {
        if (pts >= 3000) return { name: 'Privé', color: 'text-white', bg: 'bg-primary' };
        if (pts >= 1500) return { name: 'Signature', color: 'text-gold-dark', bg: 'bg-white' };
        if (pts >= 500) return { name: 'Prime', color: 'text-gray-800', bg: 'bg-gray-100' };
        return { name: 'Select', color: 'text-gray-500', bg: 'bg-gray-50' };
    };

    const currentTier = calculateTier(points);

    const nextTierPoints =
        points < 500 ? 500 :
            points < 1500 ? 1500 :
                points < 3000 ? 3000 : 3000;

    const nextTierName =
        points < 500 ? 'Prime' :
            points < 1500 ? 'Signature' :
                points < 3000 ? 'Privé' : 'Nível Máximo';

    const pointsToNext = Math.max(0, nextTierPoints - points);
    const progressPercent = points >= 3000 ? 100 : Math.min(100, (points / nextTierPoints) * 100);

    if (loading) return (
        <div className="min-h-screen bg-background-light dark:bg-zinc-950 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gold-dark font-display font-medium animate-pulse">Carregando JZ Privé...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-primary dark:text-gray-100 font-sans selection:bg-gold/30 pb-12 relative overflow-hidden">

            {/* Header */}
            <header className="flex justify-between items-center px-6 pt-8 pb-4 z-10 relative">
                <div className="flex flex-col">
                    <span className="text-[10px] tracking-[0.2em] uppercase font-display font-semibold text-gold-dark dark:text-gold-light">Dashboard do Clube</span>
                    <h1 className="text-2xl font-display font-bold tracking-tight">JZ Privé Club</h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => navigate('/prive/history')} className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center bg-white dark:bg-zinc-900 shadow-sm text-gold-dark" title="Extrato de Pontos">
                        <span className="material-symbols-outlined text-xl">history</span>
                    </button>
                    <button className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center bg-white dark:bg-zinc-900 shadow-sm">
                        <span className="material-symbols-outlined text-xl">notifications</span>
                    </button>
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center bg-white dark:bg-zinc-900 shadow-sm ml-1">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>
            </header>

            {/* Main Card */}
            <section className="px-6 mt-4 relative z-10">
                <div className="bg-gradient-to-br from-[#D4AF37] via-[#C5A059] to-[#B8860B] p-8 rounded-xl shadow-2xl shadow-gold/20 relative overflow-hidden group text-white">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-2xl"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-white/80 font-semibold">Saldo Disponível</p>
                                <h2 className="text-4xl font-display font-bold text-white mt-1">{points.toLocaleString()} <span className="text-lg font-medium opacity-80">pts</span></h2>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
                                <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Nível {currentTier.name}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-white/70">Membro desde</p>
                                <p className="text-white font-medium">{memberSince || '---'}</p>
                            </div>
                            <button
                                onClick={() => navigate('/prive/rewards')}
                                className="bg-primary text-white text-xs px-5 py-2.5 rounded-full font-semibold hover:bg-opacity-90 transition-all flex items-center gap-2"
                            >
                                <span>RESGATAR AGORA</span>
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Progress Section */}
            <section className="px-6 mt-10 relative z-10">
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-sm font-display font-bold uppercase tracking-widest">Jornada de Fidelidade</h3>
                    {pointsToNext > 0 ? (
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{nextTierName} em {pointsToNext} pts</span>
                    ) : (
                        <span className="text-xs text-gold-dark font-bold animate-pulse">NÍVEL MÁXIMO ATINGIDO</span>
                    )}
                </div>

                <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between text-[8px] font-semibold text-gray-400 uppercase tracking-tighter">
                        <span className={points < 500 ? 'text-primary font-bold' : ''}>Select</span>
                        <span className={points >= 500 && points < 1500 ? 'text-primary font-bold' : ''}>Prime</span>
                        <span className={points >= 1500 && points < 3000 ? 'text-gold-dark font-bold' : ''}>Signature</span>
                        <span className={points >= 3000 ? 'text-purple-600 font-bold' : ''}>Privé</span>
                    </div>

                    <div className="overflow-hidden h-1.5 mb-4 text-xs flex rounded-full bg-gray-200 dark:bg-zinc-800">
                        <div
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-1000"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>

                    <div className="flex justify-between px-1 -mt-[26px] relative z-0">
                        <div className={`w-2 h-2 rounded-full border border-white dark:border-zinc-900 ${points >= 0 ? 'bg-primary' : 'bg-gray-300'}`}></div>
                        <div className={`w-2 h-2 rounded-full border border-white dark:border-zinc-900 ${points >= 500 ? 'bg-primary' : 'bg-gray-300'}`}></div>
                        <div className={`w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 -mt-1 ${points >= 1500 ? 'bg-gold' : 'bg-gray-300'}`}></div>
                        <div className={`w-2 h-2 rounded-full border border-white dark:border-zinc-900 ${points >= 3000 ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
                    </div>
                </div>
            </section>

            {/* Experiences Section */}
            <section className="mt-10 relative z-10">
                <div className="px-6 flex justify-between items-baseline mb-6">
                    <h3 className="text-lg font-display font-bold">Experiências Privé</h3>
                    <button onClick={() => navigate('/prive/rewards')} className="text-xs font-semibold text-gold-dark dark:text-gold-light uppercase tracking-widest">Ver Todas</button>
                </div>

                <div className="flex overflow-x-auto gap-5 px-6 pb-4 no-scrollbar">
                    {/* Exemplo 1 */}
                    <div onClick={() => navigate('/prive/rewards')} className="flex-shrink-0 w-64 rounded-xl overflow-hidden shadow-lg border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 group cursor-pointer">
                        <div className="h-48 relative overflow-hidden">
                            <img alt="Rito Diamond Glow" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            <div className="absolute bottom-4 left-4 right-4 text-white">
                                <span className="text-[9px] uppercase tracking-widest font-bold bg-gold px-2 py-0.5 rounded text-black">Exclusivo</span>
                                <h4 className="mt-1 font-display font-bold text-base">Rito Diamond Glow</h4>
                            </div>
                        </div>
                        <div className="p-4 flex justify-between items-center">
                            <span className="text-xs text-gray-500 font-medium">900 pontos</span>
                            <span className="material-symbols-outlined text-lg text-gold-dark">favorite_border</span>
                        </div>
                    </div>

                    {/* Exemplo 2 */}
                    <div onClick={() => navigate('/prive/rewards')} className="flex-shrink-0 w-64 rounded-xl overflow-hidden shadow-lg border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 group cursor-pointer">
                        <div className="h-48 relative overflow-hidden">
                            <img alt="Luxury Lounge" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://images.unsplash.com/photo-1560624052-449f5ddf0c31?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            <div className="absolute bottom-4 left-4 right-4 text-white">
                                <span className="text-[9px] uppercase tracking-widest font-bold bg-primary px-2 py-0.5 rounded text-white">Apenas Membros</span>
                                <h4 className="mt-1 font-display font-bold text-base">Acesso VIP Signature</h4>
                            </div>
                        </div>
                        <div className="p-4 flex justify-between items-center">
                            <span className="text-xs text-gray-500 font-medium">1,200 pontos</span>
                            <span className="material-symbols-outlined text-lg text-gold-dark">favorite_border</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefícios List */}
            <section className="px-6 mt-10 space-y-3 pb-8 relative z-10">
                <h3 className="text-sm font-display font-bold uppercase tracking-widest mb-4">Seus Privilégios</h3>

                <div className="flex items-center p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm" onClick={() => navigate('/prive/journey')}>
                    <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center mr-4">
                        <span className="material-symbols-outlined text-primary dark:text-gray-300">event_available</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold">Agendamento Prioritário</p>
                        <p className="text-[10px] text-gray-500">Acesso antecipado a horários nobres</p>
                    </div>
                    <span className="material-symbols-outlined text-gray-400 text-sm">chevron_right</span>
                </div>

                <div className="flex items-center p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm" onClick={() => navigate('/prive/journey')}>
                    <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center mr-4">
                        <span className="material-symbols-outlined text-primary dark:text-gray-300">workspace_premium</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold">Mimo de Aniversário</p>
                        <p className="text-[10px] text-gray-500">Resgate seu presente especial no mês</p>
                    </div>
                    <span className="material-symbols-outlined text-gray-400 text-sm">chevron_right</span>
                </div>

                <div className="flex items-center p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm" onClick={() => navigate('/prive/journey')}>
                    <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center mr-4">
                        <span className="material-symbols-outlined text-primary dark:text-gray-300">face</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold">Concierge Estético Pessoal</p>
                        <p className="text-[10px] text-gray-500">Consultoria VIP dedicada</p>
                    </div>
                    <span className="material-symbols-outlined text-gray-400 text-sm">chevron_right</span>
                </div>

                {/* Extrato Link Rapido */}
                <button
                    onClick={() => navigate('/prive/history')}
                    className="w-full mt-6 py-4 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800 text-xs font-bold text-gray-400 dark:text-zinc-600 uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">list_alt</span>
                    Ver Extrato Completo de Pontos
                </button>
            </section>

            {/* Ambient Glows */}
            <div className="fixed top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
            <div className="fixed bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
        </div>
    );
};

export default PriveDashboard;
