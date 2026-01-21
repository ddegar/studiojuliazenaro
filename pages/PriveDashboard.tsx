
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const PriveDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [levels, setLevels] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Parallel fetch
            const [profileRes, levelsRes] = await Promise.all([
                user ? supabase.from('profiles').select('lash_points, created_at').eq('id', user.id).single() : Promise.resolve({ data: null, error: null }),
                supabase.from('loyalty_tiers').select('*').order('min_points', { ascending: true })
            ]);

            if (levelsRes.data) {
                setLevels(levelsRes.data);
            }

            if (profileRes.data) {
                setPoints(profileRes.data.lash_points || 0);
                if (profileRes.data.created_at) {
                    const date = new Date(profileRes.data.created_at);
                    const month = date.toLocaleString('pt-BR', { month: 'short' });
                    const year = date.getFullYear();
                    setMemberSince(`${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTier = (pts: number) => {
        if (levels.length === 0) return { name: 'Select', color: 'text-gray-500', bg: 'bg-gray-50' }; // Fallback

        const sortedLevels = [...levels].sort((a, b) => b.min_points - a.min_points);
        const match = sortedLevels.find(l => pts >= l.min_points);

        if (!match) return { name: 'Select', color: 'text-gray-500', bg: 'bg-gray-50' };

        // Visual mapping based on name content (since DB doesn't store Tailwind objects yet, or we use name map)
        // Simplification: Using name for Logic, preserving existing visual map logic for now based on name match
        const nameUpper = match.name.toUpperCase();
        if (nameUpper.includes('PRIV')) return { name: match.name, color: 'text-white', bg: 'bg-primary' };
        if (nameUpper.includes('SIGNATURE')) return { name: match.name, color: 'text-gold-dark', bg: 'bg-white' };
        if (nameUpper.includes('PRIME')) return { name: match.name, color: 'text-gray-800', bg: 'bg-gray-100' };
        return { name: match.name, color: 'text-gray-500', bg: 'bg-gray-50' };
    };

    const currentTier = calculateTier(points);

    // Calculate Next Tier
    const sortedAsc = [...levels].sort((a, b) => a.min_points - b.min_points);
    const nextLevel = sortedAsc.find(l => l.min_points > points);

    const nextTierPoints = nextLevel ? nextLevel.min_points : points;
    const nextTierName = nextLevel ? nextLevel.name : 'Nível Máximo';
    const isMaxLevel = !nextLevel;

    const pointsToNext = isMaxLevel ? 0 : Math.max(0, nextTierPoints - points);

    // Calculate Progress % correctly relative to current bracket could be complex, 
    // but simplify to absolute ratio of max level points for the bar visualization?
    // The original code was: Math.min(100, (points / nextTierPoints) * 100); which is relative to "reaching next tier" from 0? 
    // No, it was absolute. let's stick to absolute mapping for the bar if possible, 
    // OR create a linear progress between levels. 
    // Let's keep specific logic: 
    // If Max Level (Privé 3000), 100%. 
    // Else, points / nextTierPoints * 100.
    const progressPercent = isMaxLevel ? 100 : Math.min(100, (points / nextTierPoints) * 100);

    // Dynamic Checkpoints for Progress Bar
    const renderCheckpoints = () => {
        if (levels.length === 0) return null;
        return (
            <div className="flex mb-2 items-center justify-between text-[8px] font-semibold text-gray-400 uppercase tracking-tighter w-full">
                {levels.map((l, idx) => (
                    <span key={l.id} className={points >= l.min_points ? 'text-primary font-bold' : ''}>{l.name}</span>
                ))}
            </div>
        );
    };

    if (loading) return (
        <div className="min-h-screen bg-background-light dark:bg-zinc-950 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gold-dark font-display font-medium animate-pulse">Carregando JZ Privé...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-primary dark:text-gray-100 font-sans selection:bg-gold/30 pb-12 relative overflow-hidden">
            {/* ... Header and Main Card ... */}
            {/* Re-using context, just need to change the implementation details above the Return logic mostly 
            wait, replace_file_content needs me to replace the chunk.
            So I will replace from `const [points` down to the end of `Progress Section` opening.
        */}


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
