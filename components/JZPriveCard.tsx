
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

interface JZPriveCardProps {
    variant?: 'compact' | 'full';
}

interface TierInfo {
    name: string;
    color: string;
    textColor: string;
    gradient: string;
}

const JZPriveCard: React.FC<JZPriveCardProps> = ({ variant = 'compact' }) => {
    const navigate = useNavigate();
    const [points, setPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [levels, setLevels] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const [profileRes, levelsRes] = await Promise.all([
                user ? supabase.from('profiles').select('lash_points').eq('id', user.id).single() : Promise.resolve({ data: null }),
                supabase.from('loyalty_tiers').select('*').order('min_points', { ascending: true })
            ]);

            if (levelsRes.data) setLevels(levelsRes.data);
            if (profileRes.data) setPoints(profileRes.data.lash_points || 0);
        } catch (error) {
            console.error('Error fetching JZ Prive data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTier = (pts: number): TierInfo => {
        if (pts >= 3000) return {
            name: 'Privé',
            color: 'from-zinc-900 to-zinc-950',
            textColor: 'text-white',
            gradient: 'bg-gradient-to-br from-zinc-900 to-zinc-950'
        };
        if (pts >= 1500) return {
            name: 'Signature',
            color: 'from-[#0a2e1f] to-[#05170f]',
            textColor: 'text-white',
            gradient: 'bg-gradient-to-br from-[#0a2e1f] to-[#05170f]'
        };
        if (pts >= 500) return {
            name: 'Prime',
            color: 'from-[#C9A961] to-[#a88a4a]',
            textColor: 'text-zinc-950',
            gradient: 'bg-gradient-to-br from-[#C9A961] to-[#a88a4a]'
        };
        return {
            name: 'Select',
            color: 'from-zinc-300 to-zinc-400',
            textColor: 'text-zinc-950',
            gradient: 'bg-gradient-to-br from-zinc-300 to-zinc-400'
        };
    };

    const currentTier = getTier(points);

    // Calculate next tier
    const sortedAsc = [...levels].sort((a, b) => a.min_points - b.min_points);
    const nextLevel = sortedAsc.find(l => l.min_points > points);
    const nextTierPoints = nextLevel ? nextLevel.min_points : points;
    const nextTierName = nextLevel ? nextLevel.name : 'Nível Máximo';
    const isMaxLevel = !nextLevel;
    const pointsToNext = isMaxLevel ? 0 : Math.max(0, nextTierPoints - points);

    // Progress calculation (within current bracket)
    const currentLevelMin = sortedAsc.filter(l => l.min_points <= points).pop()?.min_points || 0;
    const progressPercent = isMaxLevel
        ? 100
        : Math.min(100, ((points - currentLevelMin) / (nextTierPoints - currentLevelMin)) * 100);

    if (loading) {
        return (
            <div className={`${currentTier.gradient} rounded-[32px] p-8 animate-pulse shadow-hugest border border-white/10`}>
                <div className="h-24 bg-white/5 rounded-2xl w-full"></div>
            </div>
        );
    }

    // Compact variant for Home (Membership Card style)
    if (variant === 'compact') {
        return (
            <div
                onClick={() => navigate('/prive')}
                className={`animate-reveal stagger-2 group relative rounded-[32px] aspect-[1.6/1] w-full max-w-sm mx-auto shadow-hugest transition-all duration-700 cursor-pointer active:scale-95 ${currentTier.gradient} border border-white/10`}
            >
                {/* Internal container to clip blurs without clipping the parent shadow */}
                <div className="absolute inset-0 rounded-[32px] overflow-hidden">
                    {/* Holographic Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.08] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s] ease-in-out"></div>

                    {/* Optimized Visual Textures */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 organic-shape-1 blur-[60px] opacity-30 group-hover:scale-150 transition-transform duration-[3s]"></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-accent-gold/10 organic-shape-2 blur-[40px] opacity-40"></div>
                </div>

                <div className="relative h-full flex flex-col justify-between p-8 z-10">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-[9px] font-outfit font-black uppercase tracking-[0.4em] text-white/40 leading-none mb-1">Elite Identifier</p>
                            <h3 className="text-xl font-display italic text-accent-gold tracking-tighter">JZ Privé Club</h3>
                        </div>
                        <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-inner">
                            <span className="material-symbols-outlined text-accent-gold text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="space-y-1">
                                <p className="text-[8px] font-outfit font-black uppercase tracking-widest text-white/20">Status Atual</p>
                                <p className="text-2xl font-display font-medium text-white tracking-tight italic">{currentTier.name} Member</p>
                            </div>
                            <div className="text-right space-y-1">
                                <p className="text-[8px] font-outfit font-black uppercase tracking-widest text-white/20">Créditos</p>
                                <p className="text-2xl font-outfit font-black text-accent-gold tabular-nums leading-none">{points.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Visual Progress Line */}
                        <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-accent-gold to-white shadow-[0_0_10px_#C9A961] transition-all duration-1000 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Aesthetic Watermark */}
                <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-white/[0.03] text-8xl select-none pointer-events-none rotate-12 z-0">
                    workspace_premium
                </span>
            </div>
        );
    }

    // Full variant for Prive Dashboard
    return (
        <div className={`relative rounded-[48px] p-8 shadow-hugest transition-all duration-700 ${currentTier.gradient} border border-white/5`}>
            {/* Internal container to clip blurs without clipping the parent shadow */}
            <div className="absolute inset-0 rounded-[48px] overflow-hidden">
                {/* Immersive Background */}
                <div className="absolute top-[-20%] right-[-10%] w-[60%] aspect-square bg-white/5 organic-shape-1 blur-[60px] animate-float"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[50%] aspect-square bg-accent-gold/10 organic-shape-2 blur-[40px] animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center gap-10">
                <div className="space-y-2">
                    <div className="size-16 mx-auto rounded-3xl bg-white/10 flex items-center justify-center backdrop-blur-xl border border-white/5 shadow-2xl mb-4 transform rotate-12">
                        <span className="material-symbols-outlined text-accent-gold !text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    </div>
                    <p className="text-[10px] font-outfit font-black uppercase tracking-[0.3em] text-white/40">Sua Experiência Exclusiva</p>
                    <h3 className="font-display italic text-3xl text-accent-gold">{currentTier.name}</h3>
                </div>

                <div className="space-y-1">
                    <h2 className="text-6xl font-outfit font-light text-white tracking-tighter">
                        {points.toLocaleString()}
                    </h2>
                    <p className="text-[12px] font-outfit font-black uppercase tracking-[0.4em] text-accent-gold/60">Pontos Privé</p>
                </div>

                <div className="w-full max-w-xs space-y-4">
                    <div className="h-[3px] w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-accent-gold transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(201,169,97,0.8)]"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    {!isMaxLevel && (
                        <p className="text-[10px] font-outfit text-white/50 tracking-widest leading-loose">
                            Mais <span className="text-white font-bold">{pointsToNext}</span> pontos para o nível <span className="text-accent-gold font-bold">{nextTierName}</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JZPriveCard;
