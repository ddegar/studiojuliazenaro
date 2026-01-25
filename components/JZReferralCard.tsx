
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

interface JZReferralCardProps {
    variant?: 'light' | 'dark';
}

const JZReferralCard: React.FC<JZReferralCardProps> = ({ variant = 'dark' }) => {
    const navigate = useNavigate();
    const isLight = variant === 'light';
    const [rewardPoints, setRewardPoints] = useState(200);

    useEffect(() => {
        const fetchReward = async () => {
            try {
                const { data } = await supabase
                    .from('loyalty_actions')
                    .select('points_reward')
                    .eq('code', 'REFERRAL')
                    .eq('is_active', true)
                    .single();

                if (data?.points_reward) {
                    setRewardPoints(data.points_reward);
                }
            } catch (err) {
                console.error('Error fetching referral reward:', err);
            }
        };
        fetchReward();
    }, []);

    return (
        <div className={`mt-4 mb-8 mx-4 p-8 rounded-[48px] relative overflow-hidden transition-all duration-700 shadow-hugest border group ${isLight
            ? 'bg-white border-primary/5 text-primary'
            : 'bg-surface-dark/40 backdrop-blur-xl border-white/5 text-white'
            }`}>
            {/* Clipping Shell for internal aesthetics */}
            <div className="absolute inset-0 rounded-[48px] overflow-hidden">
                {/* Design Elements - Theme Aware */}
                <div className={`absolute top-[-20%] right-[-20%] w-72 h-72 rounded-full blur-[80px] pointer-events-none group-hover:scale-150 transition-transform duration-[3s] ${isLight ? 'bg-primary/5' : 'bg-[#4ade80]/10'
                    }`}></div>
                <span className={`material-symbols-outlined absolute -right-6 -bottom-6 text-[180px] rotate-[-15deg] select-none pointer-events-none group-hover:scale-110 transition-transform duration-[2s] ${isLight ? 'text-primary/[0.03]' : 'text-accent-gold/5'
                    }`}>
                    diamond
                </span>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
                <span className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 block animate-pulse ${isLight ? 'text-accent-gold' : 'text-accent-gold'
                    }`}>Exclusive Invitation</span>

                <h4 className={`font-display text-3xl font-bold mb-4 leading-tight transition-colors italic ${isLight ? 'text-primary group-hover:text-accent-gold' : 'text-white group-hover:text-accent-gold'
                    }`}>Indique uma Amiga</h4>

                <div className={`rounded-[32px] p-6 w-full mb-8 space-y-2 transition-colors shadow-inner border ${isLight
                    ? 'bg-background-light border-primary/5 group-hover:bg-primary/5'
                    : 'bg-white/5 border-white/10 group-hover:bg-white/10'
                    }`}>
                    <p className={`text-[12px] font-black uppercase tracking-widest ${isLight ? 'text-primary/30' : 'text-white/40'
                        }`}>Sua Recompensa</p>
                    <p className="text-accent-gold font-display italic text-2xl font-bold">{rewardPoints} JZ Balance</p>
                    <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${isLight ? 'text-primary/20' : 'text-white/20'
                        }`}>por indicação ativa</p>
                </div>

                <button
                    onClick={() => navigate('/profile/refer')}
                    className={`group/btn relative w-full h-18 rounded-[24px] overflow-hidden shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 ${isLight
                        ? 'bg-primary text-white'
                        : 'bg-primary text-white'
                        }`}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-[1.5s]"></div>
                    <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.4em] text-accent-gold group-hover/btn:text-white transition-colors">
                        Indicar Agora
                    </span>
                    <span className="material-symbols-outlined !text-xl text-accent-gold group-hover/btn:text-white relative z-10 transition-transform group-hover/btn:translate-x-2">east</span>
                </button>
            </div>
        </div>
    );
};

export default JZReferralCard;
