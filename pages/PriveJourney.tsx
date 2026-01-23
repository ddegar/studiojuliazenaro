
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import JZReferralCard from '../components/JZReferralCard';

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
                        supabase.from('profiles').select('lash_points, name').eq('id', user.id).single(),
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
                setLoading(false);
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
        switch (tierName) {
            case 'Select': return 'O início da sua experiência personalizada conosco.';
            case 'Prime': return 'Conforto e prioridade para quem nos inspira todos os dias.';
            case 'Signature': return 'A máxima expressão do luxo, conforto e prestígio absoluto.';
            case 'Privé': return 'O ápice de personalização. Apenas para conhecedores e sonhar membros.';
            default: return '';
        }
    };

    const getTierIcon = (tierName: string) => {
        switch (tierName) {
            case 'Select': return 'shield';
            case 'Prime': return 'stars';
            case 'Signature': return 'verified';
            case 'Privé': return 'diamond';
            default: return 'workspace_premium';
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050d0a] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#C9A961] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050d0a] text-white font-sans pb-32 relative overflow-hidden">
            {/* Header */}
            <header className="px-6 py-8 flex items-center justify-between border-b border-white/5 relative z-10 bg-[#050d0a]/80 backdrop-blur-xl sticky top-0">
                <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#C9A961]">
                    <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
                </button>
                <h1 className="font-serif italic text-lg tracking-tight text-[#C9A961]">Categorias de Fidelidade</h1>
                <div className="size-10"></div>
            </header>

            <main className="px-6 pt-8 space-y-8 relative z-10 max-w-md mx-auto">
                <div className="text-center space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C9A961]">JZ Privé Club</p>
                    <h2 className="text-3xl font-serif italic leading-tight text-white">
                        Sua jornada de<br />exclusividade e beleza
                    </h2>
                    <span className="material-symbols-outlined text-[#C9A961] !text-3xl mt-4 block">diamond</span>
                </div>

                {/* TIER CARDS */}
                <div className="space-y-6 pb-12">
                    {tiers.map((tier, idx) => {
                        const isConquered = points >= tier.min_points;
                        const isCurrent = idx === currentTierIdx;
                        const isLocked = points < tier.min_points;

                        return (
                            <div
                                key={tier.id}
                                className={`rounded-[32px] p-8 relative overflow-hidden shadow-2xl border transition-all duration-500 ${tier.name === 'Select' ? 'bg-white text-zinc-950 border-white/10' :
                                        tier.name === 'Prime' ? 'bg-white text-zinc-950 border-[#C9A961]/20' :
                                            tier.name === 'Signature' ? 'bg-white text-zinc-950 border-[#0a2e1f]/20' :
                                                'bg-[#0a2e1f] text-white border-[#C9A961]/20'
                                    }`}
                            >
                                {/* Icon Badge */}
                                <div className="flex justify-center mb-6">
                                    <div className={`size-16 rounded-full flex items-center justify-center shadow-inner ${tier.name === 'Select' ? 'bg-zinc-100 text-zinc-400' :
                                            tier.name === 'Prime' ? 'bg-[#C9A961]/10 text-[#C9A961]' :
                                                tier.name === 'Signature' ? 'bg-[#0a2e1f]/10 text-[#0a2e1f]' :
                                                    'bg-[#C9A961]/10 text-[#C9A961]'
                                        }`}>
                                        <span className="material-symbols-outlined !text-3xl">{getTierIcon(tier.name)}</span>
                                    </div>
                                </div>

                                {/* Title & Description */}
                                <div className="text-center space-y-2 mb-6">
                                    <h3 className="text-2xl font-serif font-bold">{tier.name}</h3>
                                    <p className={`text-[11px] font-medium leading-relaxed max-w-[240px] mx-auto ${tier.name === 'Privé' ? 'text-white/60' : 'text-zinc-500'}`}>
                                        "{getTierDescription(tier.name)}"
                                    </p>
                                </div>

                                {/* Benefits Preview */}
                                <div className="space-y-3 mb-8">
                                    {tier.benefits.slice(0, 3).map((benefit, bIdx) => (
                                        <div key={bIdx} className="flex items-center gap-3">
                                            <span className={`material-symbols-outlined !text-lg ${tier.name === 'Privé' ? 'text-[#C9A961]' : 'text-[#C9A961]'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                                check_circle
                                            </span>
                                            <span className={`text-[12px] font-medium ${tier.name === 'Privé' ? 'text-white/80' : 'text-zinc-700'}`}>
                                                {benefit}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Status Badge */}
                                {isCurrent && (
                                    <div className="flex justify-center mb-6">
                                        <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${tier.name === 'Privé' ? 'bg-[#C9A961] text-zinc-950' : 'bg-[#0a2e1f] text-white'
                                            }`}>
                                            Status Atual
                                        </span>
                                    </div>
                                )}

                                {/* Action Button */}
                                <button
                                    onClick={() => !isLocked && setSelectedTier(tier)}
                                    disabled={isLocked}
                                    className={`w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${isLocked ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed' :
                                            isCurrent && tier.name === 'Privé' ? 'bg-[#C9A961] text-zinc-950' :
                                                isCurrent ? 'bg-[#0a2e1f] text-white' :
                                                    tier.name === 'Privé' ? 'bg-white/10 border border-white/20 text-white' :
                                                        'bg-transparent border border-zinc-300 text-zinc-600'
                                        }`}
                                >
                                    {isCurrent ? 'Detalhes do Status' : isLocked ? 'Ver Requisitos' : 'Ver Detalhes'}
                                </button>

                                {/* Locked Overlay */}
                                {isLocked && (
                                    <div className={`absolute inset-0 ${tier.name === 'Privé' ? 'bg-[#050d0a]/80' : 'bg-white/80'} backdrop-blur-[2px] flex flex-col items-center justify-center rounded-[32px]`}>
                                        <span className={`material-symbols-outlined ${tier.name === 'Privé' ? 'text-white/20' : 'text-zinc-300'} !text-5xl mb-3`}>lock</span>
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${tier.name === 'Privé' ? 'text-white/40' : 'text-zinc-400'}`}>Alcance {tier.min_points.toLocaleString()} pts</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* How to level up */}
                <div className="text-center py-8 opacity-40">
                    <button className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 mx-auto text-white/60">
                        Como Subir de Nível
                        <span className="material-symbols-outlined !text-sm">add</span>
                    </button>
                </div>
            </main>

            {/* Shared Referral Card at the end */}
            <JZReferralCard />

            {/* Background effects */}
            <div className="fixed top-[-10%] right-[-10%] w-[80%] h-[80%] bg-[#C9A961]/5 rounded-full blur-[150px] pointer-events-none z-[-1]"></div>
            <div className="fixed bottom-[-5%] left-[-5%] w-[60%] h-[60%] bg-[#0f3e29]/10 rounded-full blur-[120px] pointer-events-none z-[-1]"></div>

            {/* DETAIL MODAL */}
            {selectedTier && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={() => setSelectedTier(null)}>
                    <div
                        className="w-full max-w-md bg-[#050d0a] rounded-t-[40px] p-8 pb-12 animate-slide-up border-t border-[#C9A961]/20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Handle */}
                        <div className="flex justify-center mb-8">
                            <div className="w-12 h-1 bg-white/20 rounded-full"></div>
                        </div>

                        {/* Card Preview */}
                        <div className={`rounded-[32px] p-8 mb-8 relative overflow-hidden shadow-2xl ${selectedTier.name === 'Select' ? 'bg-gradient-to-br from-zinc-100 to-zinc-200 text-zinc-950' :
                                selectedTier.name === 'Prime' ? 'bg-gradient-to-br from-[#C9A961] to-[#a88a4a] text-zinc-950' :
                                    selectedTier.name === 'Signature' ? 'bg-gradient-to-br from-[#0a2e1f] to-[#05170f] text-white' :
                                        'bg-gradient-to-br from-zinc-900 to-zinc-950 text-white border border-[#C9A961]/30'
                            }`}>
                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <p className={`text-[9px] font-black uppercase tracking-widest ${selectedTier.name === 'Privé' || selectedTier.name === 'Signature' ? 'text-[#C9A961]' : 'text-zinc-950/40'
                                        }`}>JZ Privé Club</p>
                                    <h3 className="text-3xl font-serif italic mt-1">{selectedTier.name}</h3>
                                </div>
                                <span className={`material-symbols-outlined !text-4xl ${selectedTier.name === 'Privé' || selectedTier.name === 'Signature' ? 'text-[#C9A961]' : 'text-zinc-950/20'
                                    }`}>{getTierIcon(selectedTier.name)}</span>
                            </div>

                            {/* Member Name */}
                            <div className="space-y-1">
                                <p className={`text-[9px] font-black uppercase tracking-widest ${selectedTier.name === 'Privé' || selectedTier.name === 'Signature' ? 'text-white/40' : 'text-zinc-950/40'
                                    }`}>Membro</p>
                                <p className="text-lg font-bold tracking-wide">{userName}</p>
                            </div>

                            {/* Decorative Element */}
                            <div className={`absolute bottom-[-20%] right-[-10%] w-40 h-40 rounded-full blur-[60px] ${selectedTier.name === 'Privé' ? 'bg-[#C9A961]/20' :
                                    selectedTier.name === 'Signature' ? 'bg-[#C9A961]/10' :
                                        'bg-zinc-950/10'
                                }`}></div>
                        </div>

                        {/* Benefits List */}
                        <div className="space-y-2 mb-8">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#C9A961] mb-4">Benefícios Exclusivos</p>
                            {selectedTier.benefits.map((benefit, idx) => (
                                <div key={idx} className="flex items-center gap-3 py-3 border-b border-white/5">
                                    <span className="material-symbols-outlined text-[#C9A961] !text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    <span className="text-[13px] font-medium text-white/80">{benefit}</span>
                                </div>
                            ))}
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedTier(null)}
                            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/60 active:scale-95 transition-all"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default PriveJourney;
