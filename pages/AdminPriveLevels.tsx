
import React, { useState } from 'react';
import { supabase } from '../services/supabase';

const AdminPriveLevels: React.FC = () => {
    const [levels, setLevels] = useState<any[]>([]);

    useEffect(() => {
        fetchLevels();
    }, []);

    const fetchLevels = async () => {
        const { data, error } = await supabase
            .from('loyalty_tiers')
            .select('*')
            .order('min_points', { ascending: true });

        if (data) {
            // Map DB columns to component state structure if needed, or just use raw data
            // To minimize changes in JSX, ensuring we map correctly
            const formatted = data.map(l => ({
                ...l,
                minPoints: l.min_points,
                isVip: l.is_vip
            }));
            setLevels(formatted);
        }
    };

    return (
        <div className="animate-fade-in space-y-8">
            <header className="flex justify-between items-center pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-2xl font-display">Níveis e Privilégios</h1>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black">Gestão JZ Privé Club</p>
                </div>
                <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined !text-sm">add</span>
                    Novo Nível
                </button>
            </header>

            <div className="bg-[#0e110e] border border-white/5 rounded-[32px] p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-[10px] uppercase tracking-widest text-white/40 font-black">Fluxo de Ascensão</h2>
                    <span className="text-[10px] uppercase font-black text-gold-light">Estágio 01</span>
                </div>
                <div className="relative flex justify-between items-center px-4">
                    <div className="absolute left-8 right-8 h-[2px] bg-white/5 top-1/2 -translate-y-1/2 -z-0"></div>
                    {levels.map((lvl, idx) => (
                        <div key={idx} className="relative z-10 flex flex-col items-center gap-3 group cursor-default">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${idx <= 1 ? 'bg-gold-dark border-gold-dark scale-110 shadow-lg shadow-gold-dark/20' : 'bg-[#0a0c0a] border-white/10 group-hover:border-gold-dark/50'}`}>
                                {idx <= 1 ? <span className="material-symbols-outlined text-slate-900 text-sm font-bold">check</span> : <span className="text-xs font-bold text-white/40 group-hover:text-gold-light transition-colors">0{idx + 1}</span>}
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-widest transition-colors ${idx <= 1 ? 'text-gold-light' : 'text-white/20 group-hover:text-white/40'}`}>{lvl.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {levels.map((lvl, idx) => (
                    <div key={idx} className="bg-[#0e110e] border border-white/5 rounded-[40px] p-8 relative overflow-hidden group hover:border-white/10 transition-all hover:scale-[1.01]">
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className="flex items-center gap-6">
                                <div className={`w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors`}>
                                    <span className={`material-symbols-outlined text-3xl opacity-60 text-white group-hover:text-gold-light transition-colors`}>{lvl.icon}</span>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-display flex items-center gap-2">
                                        {lvl.name}
                                        {lvl.isVip && <span className="bg-gold-dark/10 text-gold-dark px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-gold-dark/20 leading-none">VIP</span>}
                                    </h3>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">{lvl.subtitle}</p>
                                </div>
                            </div>
                            <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                                <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="p-5 rounded-3xl bg-black/20 border border-white/5">
                                <p className="text-[8px] uppercase tracking-widest text-white/30 font-black mb-2 leading-none">Critério de Acesso</p>
                                <p className="text-sm font-bold leading-tight flex flex-col">
                                    <span className="text-lg">{lvl.minPoints.toLocaleString()}</span>
                                    <span className="text-[9px] uppercase font-light text-gold-light tracking-wide">JZ Privé Balance</span>
                                </p>
                            </div>
                            <div className="p-5 rounded-3xl bg-black/20 border border-white/5">
                                <p className="text-[8px] uppercase tracking-widest text-white/30 font-black mb-2 leading-none">Privilégios</p>
                                <p className="text-sm font-bold italic text-gold-light">
                                    {Array.isArray(lvl.benefits) ? lvl.benefits.join(', ') : lvl.benefits || 'Padrão'}
                                </p>
                            </div>
                        </div>

                        {lvl.name === 'Signature' && (
                            <div className="mt-4 flex flex-wrap gap-2 relative z-10">
                                <span className="bg-white/5 px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest border border-white/5 text-white/60">Atendimento Concierge</span>
                                <span className="bg-white/5 px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest border border-white/5 text-white/60">Prioridade</span>
                            </div>
                        )}

                        <div className={`absolute -right-8 -bottom-8 w-40 h-40 rounded-full ${lvl.color} opacity-[0.03] group-hover:scale-150 transition-transform duration-1000 blur-2xl`}></div>
                    </div>
                ))}
            </div>

            <div className="pt-8 border-t border-white/5">
                <h2 className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-black mb-6">Regras de Acúmulo</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#0e110e] border border-white/5 rounded-[32px] p-6 flex items-center gap-6 hover:bg-white/5 transition-colors group">
                        <div className="w-16 h-16 rounded-2xl bg-gold-dark/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-gold-dark text-2xl">person_add</span>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 font-black mb-1 leading-none">Indicação de Amigo</p>
                            <p className="font-display text-3xl">200 <span className="text-[10px] font-sans font-bold tracking-widest opacity-40">PTS</span></p>
                        </div>
                    </div>
                    <div className="bg-[#0e110e] border border-white/5 rounded-[32px] p-6 flex items-center gap-6 hover:bg-white/5 transition-colors group">
                        <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-pink-500 text-2xl">photo_camera</span>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 font-black mb-1 leading-none">Marcação em Stories</p>
                            <p className="font-display text-3xl">50 <span className="text-[10px] font-sans font-bold tracking-widest opacity-40">PTS</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPriveLevels;
