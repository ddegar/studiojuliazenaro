
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
            name: 'Privé Elite',
            color: 'from-[#064e3b] to-[#01261d]',
            textColor: 'text-white',
            gradient: 'bg-gradient-to-br from-[#064e3b] to-[#01261d]'
        };
        if (pts >= 1500) return {
            name: 'Signature',
            color: 'from-[#C5A059] to-[#B8860B]',
            textColor: 'text-white',
            gradient: 'bg-gradient-to-br from-[#C5A059] to-[#B8860B]'
        };
        if (pts >= 500) return {
            name: 'Prime',
            color: 'from-slate-700 to-slate-800',
            textColor: 'text-white',
            gradient: 'bg-gradient-to-br from-slate-700 to-slate-800'
        };
        return {
            name: 'Select',
            color: 'from-slate-500 to-slate-600',
            textColor: 'text-white',
            gradient: 'bg-gradient-to-br from-slate-500 to-slate-600'
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
            <div className={`${currentTier.gradient} rounded-2xl p-4 animate-pulse`}>
                <div className="h-16 bg-white/10 rounded-xl"></div>
            </div>
        );
    }

    // Compact variant for Home
    if (variant === 'compact') {
        return (
            <div
                onClick={() => navigate('/prive')}
                className={`${currentTier.gradient} rounded-2xl p-5 shadow-xl relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform`}
            >
                {/* Background Pattern */}
                <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                        backgroundSize: '12px 12px'
                    }}
                />

                <div className="relative z-10">
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white/80 text-lg">diamond</span>
                            </div>
                            <div>
                                <p className="text-[8px] uppercase tracking-[0.2em] text-white/50 font-bold">JZ Privé Club</p>
                                <p className="text-sm font-display font-bold text-accent-gold italic">{currentTier.name}</p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-white/40 text-xl">chevron_right</span>
                    </div>

                    {/* Points */}
                    <div className="flex items-baseline gap-1.5 mb-3">
                        <span className="text-2xl font-display font-bold text-white">{points.toLocaleString()}</span>
                        <span className="text-[10px] uppercase tracking-widest text-accent-gold font-semibold">pontos</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-accent-gold transition-all duration-1000 ease-out rounded-full"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        {!isMaxLevel && (
                            <p className="text-[9px] text-white/60">
                                <span className="text-white font-semibold">{pointsToNext}</span> pontos para <span className="text-accent-gold font-semibold">{nextTierName}</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Full variant for PriveHistory
    return (
        <div className={`${currentTier.gradient} p-8 rounded-[32px] shadow-2xl relative overflow-hidden`}>
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                    backgroundSize: '16px 16px'
                }}
            />
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold mb-1">Status de Membro</p>
                        <h3 className="font-display italic text-lg text-accent-gold">{currentTier.name}</h3>
                    </div>
                    <div className="size-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                        <span className="material-symbols-outlined text-white/80">auto_awesome</span>
                    </div>
                </div>

                <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold mb-1 text-center">Saldo JZ Privé</p>
                    <h2 className="text-4xl font-display font-bold text-white text-center">
                        {points.toLocaleString()} <span className="text-xs font-medium opacity-60 ml-1">pts</span>
                    </h2>
                </div>

                {/* Progress section for full variant */}
                <div className="mt-6 space-y-2">
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-accent-gold transition-all duration-1000 ease-out rounded-full"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    {!isMaxLevel && (
                        <p className="text-[10px] text-white/70 text-center">
                            Faltam <span className="text-white font-bold">{pointsToNext}</span> pontos para <span className="text-accent-gold font-bold">{nextTierName}</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JZPriveCard;
