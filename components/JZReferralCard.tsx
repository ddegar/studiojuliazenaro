
import React from 'react';
import { useNavigate } from 'react-router-dom';

const JZReferralCard: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="mt-4 mb-8 mx-4 p-8 rounded-[48px] bg-surface-dark/40 backdrop-blur-xl text-white relative overflow-hidden shadow-hugest border border-white/5 group">
            {/* Clipping Shell */}
            <div className="absolute inset-0 rounded-[48px] overflow-hidden">
                {/* Design Elements */}
                <div className="absolute top-[-20%] right-[-20%] w-72 h-72 bg-[#4ade80]/10 rounded-full blur-[80px] pointer-events-none group-hover:scale-150 transition-transform duration-[3s]"></div>
                <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-accent-gold/5 text-[180px] rotate-[-15deg] select-none pointer-events-none group-hover:scale-110 transition-transform duration-[2s]">
                    diamond
                </span>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-gold mb-2 block animate-pulse">Exclusive Invitation</span>
                <h4 className="font-display text-3xl font-bold mb-4 leading-tight text-white group-hover:text-accent-gold transition-colors italic">Indique uma Amiga</h4>

                <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 w-full mb-8 space-y-2 group-hover:bg-white/10 transition-colors shadow-inner">
                    <p className="text-[12px] text-white/40 font-black uppercase tracking-widest">Sua Recompensa</p>
                    <p className="text-accent-gold font-display italic text-2xl font-bold">200 JZ Credits</p>
                    <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.3em]">por indicação ativa</p>
                </div>

                <button
                    onClick={() => navigate('/profile/refer')}
                    className="group/btn relative w-full h-18 bg-primary text-white rounded-[24px] overflow-hidden shadow-xl active:scale-95 transition-all"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-[1.5s]"></div>
                    <span className="relative z-10 flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] text-accent-gold group-hover/btn:text-white transition-colors">
                        Indicar Agora
                        <span className="material-symbols-outlined !text-xl group-hover/btn:translate-x-2 transition-transform">east</span>
                    </span>
                </button>
            </div>
        </div>
    );
};

export default JZReferralCard;
