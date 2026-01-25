
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import JZReferralCard from '../components/JZReferralCard';
import Logo from '../components/Logo';

interface Tier {
    id: string;
    name: string;
    min_points: number;
    benefits: string[];
    color: string;
    icon: string;
}

const PriveJourney: React.FC = () => {
    const navigate = useNavigate();
    const [points, setPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
    const [userName, setUserName] = useState('Membro');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const [profileRes, tiersRes] = await Promise.all([
                        supabase.from('profiles').select('lash_points, name').eq('id', user.id).maybeSingle(),
                        supabase.from('loyalty_tiers').select('*').order('min_points')
                    ]);

                    if (profileRes.data) {
                        setPoints(profileRes.data.lash_points || 0);
                        setUserName(profileRes.data.name?.split(' ')[0] || 'Membro');
                    }
                    if (tiersRes.data) setTiers(tiersRes.data);
                }
            } catch (error) {
                console.error('Error fetching journey data:', error);
            } finally {
                // Short artificial delay to ensure smooth transition from logo loader
                setTimeout(() => setLoading(false), 500);
            }
        };
        fetchData();
    }, []);

    const getCurrentTierIndex = () => {
        for (let i = tiers.length - 1; i >= 0; i--) {
            if (points >= tiers[i].min_points) return i;
        }
        return 0;
    };

    const currentTierIdx = getCurrentTierIndex();

    const getTierDescription = (tierName: string) => {
        const name = tierName?.toUpperCase() || '';
        if (name.includes('SELECT')) return 'O início da sua experiência personalizada conosco.';
        if (name.includes('PRIME')) return 'Conforto e prioridade para quem nos inspira todos os dias.';
        if (name.includes('SIGNATURE')) return 'A máxima expressão do luxo, conforto e prestígio absoluto.';
        if (name.includes('PRIVÉ') || name.includes('PRIVE')) return 'O ápice de personalização. Apenas para conhecedores e membros elite.';
        return 'Uma etapa fundamental em sua jornada de beleza e sofisticação.';
    };

    const getTierIcon = (tierName: string) => {
        const name = tierName?.toUpperCase() || '';
        if (name.includes('SELECT')) return 'shield';
        if (name.includes('PRIME')) return 'stars';
        if (name.includes('SIGNATURE')) return 'verified';
        if (name.includes('PRIVÉ') || name.includes('PRIVE')) return 'diamond';
        return 'workspace_premium';
    };

    if (loading) return (
        <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center space-y-8 animate-reveal">
            <div className="relative">
                <Logo size="lg" variant="gold" className="animate-pulse" />
                <div className="absolute inset-0 border-2 border-accent-gold/20 rounded-full animate-ping scale-150 opacity-0"></div>
            </div>
            <div className="flex flex-col items-center gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-accent-gold/40 animate-pulse">Sincronizando Jornada</p>
                <div className="h-0.5 w-12 bg-accent-gold/20 rounded-full overflow-hidden">
                    <div className="h-full bg-accent-gold w-1/2 animate-shimmer"></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-background-dark text-white overflow-hidden selection:bg-accent-gold/20 relative">
            {/* Optimized Dynamic Background Elements */}
            <div className="fixed inset-0 pointer-events-none opacity-10 overflow-hidden">
                <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/20 blur-[80px] animate-float"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/20 blur-[60px] animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <header className="sticky top-0 z-[100] premium-nav-dark p-6 border-b border-white/5 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-accent-gold hover:bg-white/10 active:scale-90 transition-all">
                        <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
                    </button>
                    <div className="text-center">
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mb-1">Loyalty Progression</p>
                        <h2 className="font-display italic text-xl leading-tight text-white tracking-tight">JZ Privé Club</h2>
                    </div>
                    <div className="size-10"></div>
                </div>
            </header>

            <main className="relative z-10 flex-1 p-8 overflow-y-auto no-scrollbar pb-40">
                <div className="text-center space-y-4 mb-16 animate-reveal">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <span className="h-px w-8 bg-accent-gold/40"></span>
                        <p className="text-[10px] font-black uppercase text-accent-gold tracking-[0.5em] font-outfit">The Elite Path</p>
                        <span className="h-px w-8 bg-accent-gold/40"></span>
                    </div>
                    <h1 className="text-5xl font-display font-bold leading-none tracking-tighter">
                        Sua jornada de<br /><span className="italic text-accent-gold font-light">Exclusividade</span>.
                    </h1>
                </div>

                <div className="space-y-12 max-w-lg mx-auto pb-20">
                    {tiers.length === 0 ? (
                        <div className="p-12 rounded-[48px] bg-white/2 border border-white/5 text-center space-y-4 opacity-50">
                            <span className="material-symbols-outlined !text-5xl text-accent-gold/40">auto_awesome</span>
                            <p className="text-sm font-display italic">Prepare-se. Novos privilégios estão sendo desenhados para você.</p>
                        </div>
                    ) : tiers.map((tier, idx) => {
                        const isConquered = points >= tier.min_points;
                        const isCurrent = idx === currentTierIdx;
                        const isLocked = points < tier.min_points;
                        const icon = getTierIcon(tier.name);

                        return (
                            <div
                                key={tier.id}
                                className={`group relative rounded-[56px] p-10 border transition-all duration-700 animate-reveal shadow-hugest overflow-hidden ${isCurrent ? 'bg-surface-dark border-accent-gold/30 ring-1 ring-accent-gold/10' :
                                    isConquered ? 'bg-surface-dark/40 border-white/10' :
                                        'bg-surface-dark/20 border-white/5 opacity-50'
                                    }`}
                                style={{ animationDelay: `${idx * 0.05}s` }}
                            >
                                {/* Status Ribbon */}
                                {isCurrent && (
                                    <div className="absolute top-0 right-10 bg-accent-gold text-primary text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-b-xl shadow-lg">
                                        Status Atual
                                    </div>
                                )}

                                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10 text-center md:text-left">
                                    <div className={`size-20 shrink-0 rounded-[32px] flex items-center justify-center border transition-all duration-[2s] group-hover:rotate-[360deg] ${isConquered ? 'bg-accent-gold border-accent-gold/20 text-primary shadow-huge' : 'bg-white/5 border-white/10 text-white/20'
                                        }`}>
                                        <span className="material-symbols-outlined !text-4xl">{icon}</span>
                                    </div>

                                    <div className="flex-1 space-y-6">
                                        <div className="space-y-2">
                                            <h3 className="text-3xl font-display font-medium text-white">{tier.name}</h3>
                                            <p className="text-sm font-outfit font-light text-white/40 italic leading-relaxed">
                                                "{getTierDescription(tier.name)}"
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-1 rounded-full bg-accent-gold"></div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-gold/60">Privilégios da Categoria</p>
                                            </div>
                                            <div className="grid grid-cols-1 gap-3">
                                                {(tier.benefits || []).map((benefit, bIdx) => (
                                                    <div key={bIdx} className="flex items-start gap-4 p-4 rounded-2xl bg-white/2 border border-white/5 group-hover:border-white/10 transition-colors">
                                                        <span className="material-symbols-outlined !text-lg text-accent-gold/40 group-hover:text-accent-gold transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                                        <span className="text-[12px] font-outfit text-white/60 group-hover:text-white transition-colors">{benefit}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-6">
                                            <button
                                                onClick={() => !isLocked && setSelectedTier(tier)}
                                                disabled={isLocked}
                                                className={`w-full h-18 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] font-outfit transition-all active:scale-95 shadow-huge ${isCurrent ? 'bg-accent-gold text-primary' :
                                                    isConquered ? 'bg-white/5 border border-white/10 text-white' :
                                                        'bg-white/2 border border-white/5 text-white/10 cursor-not-allowed backdrop-blur-sm'
                                                    }`}
                                            >
                                                {isLocked ? `Atingir ${tier.min_points.toLocaleString()} PTS` : 'Explorar Detalhes'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Optimized Background Aura */}
                                <div className={`absolute -bottom-20 -right-20 size-64 blur-[60px] rounded-full pointer-events-none opacity-20 transition-all duration-1000 ${isCurrent ? 'bg-accent-gold/40' : 'bg-primary/20'
                                    }`}></div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-16">
                    <JZReferralCard variant="dark" />
                </div>
            </main>

            {/* DETAIL MODAL (Elite Style) */}
            {selectedTier && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background-dark/80 backdrop-blur-xl animate-reveal" onClick={() => setSelectedTier(null)}>
                    <div
                        className="w-full max-w-lg bg-surface-dark border border-white/10 rounded-[56px] p-10 pb-12 relative overflow-hidden shadow-hugest"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/5 blur-[40px] rounded-full pointer-events-none"></div>

                        <div className="flex justify-between items-start mb-10">
                            <div className="space-y-4">
                                <div className="size-16 rounded-[24px] bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center text-accent-gold shadow-huge">
                                    <span className="material-symbols-outlined !text-4xl">{getTierIcon(selectedTier.name)}</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-gold/40 mb-1">Coleção Privé</p>
                                    <h3 className="text-4xl font-display font-medium text-white tracking-tighter">Status: <span className="italic text-accent-gold">{selectedTier.name}</span></h3>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTier(null)} className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                                <span className="material-symbols-outlined !text-xl">close</span>
                            </button>
                        </div>

                        <div className="space-y-8 mb-12">
                            <div className="p-8 rounded-[40px] bg-white/2 border border-white/5 space-y-4">
                                <p className="text-sm font-outfit font-light text-white/60 italic leading-relaxed">"{getTierDescription(selectedTier.name)}"</p>
                                <div className="h-px w-full bg-white/5"></div>
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Requisito Mínimo</p>
                                    <p className="text-lg font-outfit font-black text-accent-gold">{selectedTier.min_points.toLocaleString()} <span className="text-[10px] opacity-40">PTS</span></p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-accent-gold/40 px-4">Benefícios Completos</p>
                                <div className="space-y-3">
                                    {(selectedTier.benefits || []).map((benefit, idx) => (
                                        <div key={idx} className="flex items-center gap-5 p-5 rounded-3xl bg-white/2 border border-white/5 hover:bg-white/5 transition-all">
                                            <span className="material-symbols-outlined text-accent-gold !text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                            <span className="text-sm font-outfit text-white/80">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedTier(null)}
                            className="w-full h-18 bg-white/5 border border-white/10 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] font-outfit text-white/60 hover:text-white hover:bg-white/10 transition-all shadow-huge active:scale-95"
                        >
                            Retornar à Jornada
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PriveJourney;
