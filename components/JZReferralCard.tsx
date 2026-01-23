
import React from 'react';
import { useNavigate } from 'react-router-dom';

const JZReferralCard: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="mt-4 mb-8 mx-4 p-8 rounded-[32px] bg-zinc-950 text-white relative overflow-hidden shadow-2xl border border-[#C9A961]/10 group">
            <div className="relative z-10 flex flex-col items-center text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C9A961] mb-2 block">Exclusive Invitation</span>
                <h4 className="font-display text-2xl font-bold mb-2 leading-tight text-white group-hover:text-[#C9A961] transition-colors">Indique uma Amiga</h4>
                <div className="text-center mb-8 space-y-1">
                    <p className="text-[14px] text-white/60 font-bold">Ganhe</p>
                    <p className="text-[#4ade80] font-black text-xl">200 JZ Privé Balance</p>
                    <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest">por indicação ativa</p>
                </div>
                <button
                    onClick={() => navigate('/profile/refer')}
                    className="w-full h-14 bg-[#0f2c22] border border-[#C9A961]/30 text-[#C9A961] rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase shadow-2xl hover:bg-[#C9A961] hover:text-zinc-950 transition-all active:scale-95"
                >
                    Indicar Agora
                </button>
            </div>

            {/* Design Elements */}
            <div className="absolute top-[-20%] right-[-20%] w-72 h-72 bg-[#4ade80]/5 rounded-full blur-[100px] pointer-events-none"></div>
            <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-[#C9A961]/5 text-[180px] rotate-[-15deg] select-none pointer-events-none group-hover:scale-110 transition-transform duration-[2s]">
                diamond
            </span>
        </div>
    );
};

export default JZReferralCard;
