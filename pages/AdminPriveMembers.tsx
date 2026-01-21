
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

// Helper to determine tier based on points (Matching PriveDashboard logic)
const calculateTier = (points: number) => {
    if (points >= 3000) return 'PRIVÉ';
    if (points >= 1500) return 'SIGNATURE';
    if (points >= 500) return 'PRIME';
    return 'SELECT';
};

const AdminPriveMembers: React.FC = () => {
    const navigate = useNavigate();
    const [members, setMembers] = useState<any[]>([]);
    const [levels, setLevels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('TODOS');
    const [isAdjusting, setIsAdjusting] = useState<string | null>(null);
    const [adjustValue, setAdjustValue] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [membersRes, levelsRes] = await Promise.all([
                supabase.from('profiles').select('*').order('name'),
                supabase.from('loyalty_levels').select('*').order('min_points', { ascending: true })
            ]);

            if (membersRes.error) throw membersRes.error;
            if (levelsRes.error) throw levelsRes.error;

            setMembers(membersRes.data || []);
            setLevels(levelsRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Helper to determine tier based on points using dynamic levels
    const calculateTier = (points: number) => {
        if (levels.length === 0) return 'SELECT'; // Fallback
        // Create a copy and sort descending to find the highest matching tier
        const sortedLevels = [...levels].sort((a, b) => b.min_points - a.min_points);
        const match = sortedLevels.find(l => points >= l.min_points);
        return match ? match.name.toUpperCase() : 'SELECT';
    };

    const handleAdjustBalance = async () => {
        if (!isAdjusting) return;
        try {
            const member = members.find(m => m.id === isAdjusting);
            const newBalance = (member.lash_points || 0) + adjustValue;

            const { error } = await supabase
                .from('profiles')
                .update({ lash_points: newBalance })
                .eq('id', isAdjusting);

            if (error) throw error;

            // Registrar transação
            await supabase.from('loyalty_transactions').insert({
                profile_id: isAdjusting,
                points: adjustValue,
                type: adjustValue > 0 ? 'earned' : 'redeemed',
                description: `Ajuste manual administrativo (${adjustValue > 0 ? '+' : ''}${adjustValue} Pts)`
            });

            alert('Saldo atualizado com sucesso!');
            setIsAdjusting(null);
            setAdjustValue(0);
            fetchData(); // Refresh both to be safe, though mainly members
        } catch (err: any) {
            alert('Erro ao ajustar: ' + err.message);
        }
    };

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.name?.toLowerCase().includes(search.toLowerCase());
        const tier = calculateTier(m.lash_points || 0);
        const matchesTier = activeFilter === 'TODOS' || tier === activeFilter;
        return matchesSearch && matchesTier;
    });

    return (
        <div className="animate-fade-in pb-32">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-display flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#C5A059]">groups</span>
                        Gestão de Membros
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-2xl font-bold text-white">{members.length}</span>
                        <span className="text-[10px] uppercase font-black tracking-[0.2em] text-[#059669]">Membros Ativos</span>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#141814] border border-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-lg">notifications</span>
                </div>
            </header>

            {/* Filter & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20">search</span>
                    <input
                        placeholder="Buscar por nome.."
                        className="w-full bg-[#141814] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs font-medium text-white outline-none focus:border-[#C5A059]/30 transition-colors placeholder:text-white/20"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <button className="px-6 py-4 bg-[#141814] border border-white/5 rounded-2xl flex items-center gap-2 text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                    <span className="material-symbols-outlined text-lg">tune</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Filtrar por Status</span>
                </button>
            </div>

            {/* Chips */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar mb-8 pb-2">
                {['TODOS', 'SELECT', 'PRIME', 'SIGNATURE', 'PRIVÉ'].map(filter => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeFilter === filter
                            ? 'bg-[#C5A059] text-[#0a0c0a] border-[#C5A059] shadow-lg shadow-[#C5A059]/20'
                            : 'bg-[#141814] text-white/40 border-white/5 hover:bg-white/5'
                            }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Members Grid */}
            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div></div>
                ) : filteredMembers.length === 0 ? (
                    <div className="py-20 text-center text-white/30 text-sm border border-dashed border-white/5 rounded-[32px]">
                        Nenhum membro encontrado com este filtro.
                    </div>
                ) : (
                    filteredMembers.map(member => (
                        <div key={member.id} className="bg-[#0b1511] border border-[#1A2520] rounded-[32px] p-6 hover:border-[#C5A059]/20 transition-all group relative overflow-hidden">
                            {/* Darker background card effect */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#059669]/5 rounded-bl-[100px] pointer-events-none"></div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                {/* Left Info */}
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-full bg-[#141814] border border-white/5 flex items-center justify-center text-lg font-display text-[#C5A059] overflow-hidden">
                                            {member.avatar_url ? (
                                                <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                                            ) : (
                                                member.name?.split(' ').slice(0, 2).map((n: string) => n[0]).join('')
                                            )}
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#059669] rounded-full border-2 border-[#0b1511]"></div>
                                    </div>
                                    <div>
                                        <h3 className="font-display font-bold text-lg text-white leading-tight">{member.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] uppercase font-black text-white/40 tracking-widest">{calculateTier(member.lash_points || 0)}</span>
                                            <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                            <span className="text-[9px] text-white/30 uppercase tracking-wide font-medium">Desde {new Date(member.created_at || Date.now()).getFullYear()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Info (Balance) */}
                                <div className="text-right">
                                    <p className="text-[9px] uppercase font-black text-white/30 tracking-[0.2em] mb-1">JZ Privé Balance</p>
                                    <p className="font-display text-2xl text-[#C5A059] tracking-tight">{(member.lash_points || 0).toLocaleString()} <span className="text-xs font-sans font-bold opacity-60">PTS</span></p>
                                </div>
                            </div>

                            {/* Action Buttons Row */}
                            <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-white/5">
                                <button className="py-3 rounded-[14px] bg-[#141814] border border-white/5 flex items-center justify-center gap-2 text-white/60 hover:bg-white/5 hover:text-white transition-colors group/btn">
                                    <span className="material-symbols-outlined text-sm group-hover/btn:scale-110 transition-transform">visibility</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest">Ver Perfil</span>
                                </button>
                                <button
                                    onClick={() => { setIsAdjusting(member.id); setAdjustValue(0); }}
                                    className="py-3 rounded-[14px] bg-[#C5A059] border border-[#C5A059] flex items-center justify-center gap-2 text-[#0a0c0a] hover:bg-[#D4B375] transition-colors shadow-lg shadow-[#C5A059]/10 group/btn"
                                >
                                    <span className="material-symbols-outlined text-sm group-hover/btn:scale-110 transition-transform">account_balance_wallet</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest">Ajustar Balance</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Global CTA - Sticky Bottom/Floating */}
            <div className="fixed bottom-6 left-0 right-0 px-6 flex justify-center z-30 pointer-events-none">
                <button
                    onClick={() => navigate('/admin/clients')}
                    className="pointer-events-auto bg-[#C5A059] text-[#0a0c0a] px-8 py-4 rounded-full font-black text-xs uppercase tracking-[0.15em] shadow-2xl shadow-black/50 hover:scale-105 transition-transform flex items-center gap-3 border border-white/10 backdrop-blur-md"
                >
                    <span className="material-symbols-outlined text-xl">person_add</span>
                    Cadastrar Novo Membro
                </button>
            </div>

            {/* Adjust Modal */}
            {isAdjusting && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setIsAdjusting(null)}>
                    <div className="bg-[#141814] w-full max-w-md border border-white/10 rounded-[40px] p-8 space-y-8 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <div className="text-center">
                            <h2 className="text-2xl font-display mb-2 text-white">Ajustar Balance</h2>
                            <p className="text-sm text-white/40">Use valores positivos para adicionar e negativos para remover.</p>
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            <div className="relative w-full">
                                <input
                                    type="number"
                                    className="w-full bg-black/40 border-2 border-white/10 rounded-3xl py-8 text-center text-4xl font-display text-[#C5A059] outline-none focus:border-[#C5A059] transition-colors"
                                    value={adjustValue}
                                    onChange={e => setAdjustValue(parseInt(e.target.value) || 0)}
                                    autoFocus
                                />
                                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-sm font-black text-white/20 uppercase tracking-widest">PTS</span>
                            </div>
                            <div className="flex gap-2 w-full justify-center">
                                {[100, 500, 1000].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setAdjustValue(prev => prev + v)}
                                        className="px-4 py-2 rounded-full bg-white/5 text-[10px] font-bold border border-white/5 hover:bg-white/10 hover:border-white/10 transition-colors text-white"
                                    >+{v}</button>
                                ))}
                                {[-100, -500].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setAdjustValue(prev => prev + v)}
                                        className="px-4 py-2 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                    >{v}</button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button onClick={() => setIsAdjusting(null)} className="flex-1 py-4 rounded-2xl bg-white/5 text-white/40 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors">Cancelar</button>
                            <button onClick={handleAdjustBalance} className="flex-2 py-4 rounded-2xl bg-[#C5A059] text-[#0a0c0a] font-black text-[10px] uppercase tracking-widest w-full hover:bg-[#D4B375] transition-colors shadow-lg shadow-[#C5A059]/10">Confirmar Ajuste</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPriveMembers;
