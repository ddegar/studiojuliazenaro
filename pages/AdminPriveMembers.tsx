
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

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
        setLoading(true);
        try {
            // Fetch Members (Critical)
            const { data: membersData, error: membersError } = await supabase
                .from('profiles')
                .select('*')
                .order('name');

            if (membersError) throw membersError;
            setMembers(membersData || []);

            // Fetch Levels (Non-critical, can fallback to default)
            const { data: levelsData, error: levelsError } = await supabase
                .from('loyalty_tiers')
                .select('*')
                .order('min_points', { ascending: true });

            if (!levelsError && levelsData) {
                setLevels(levelsData);
            }
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
        <div className="flex flex-col h-full bg-background-dark text-white overflow-hidden selection:bg-accent-gold/20 relative">
            {/* Dynamic Background Elements */}
            <div className="fixed inset-0 pointer-events-none opacity-15 overflow-hidden">
                <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/20 blur-[120px] animate-float"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/20 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <header className="sticky top-0 z-[100] premium-nav-dark p-6 border-b border-white/5 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-surface-dark border border-white/10 flex items-center justify-center text-accent-gold relative shadow-huge">
                            <span className="material-symbols-outlined !text-2xl">groups</span>
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mb-1">Elite Database Management</p>
                            <h2 className="font-display italic text-xl leading-tight text-white tracking-tight">Membros JZ Privé</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end">
                            <p className="text-[8px] font-black uppercase tracking-widest text-white/20">Membros Ativos</p>
                            <p className="text-xl font-outfit font-black text-accent-gold tracking-tighter tabular-nums">{members.length}</p>
                        </div>
                        <button className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-white transition-all shadow-huge">
                            <span className="material-symbols-outlined !text-xl">notifications</span>
                        </button>
                    </div>
                </div>

                {/* Strategic Filters */}
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative flex-1 group">
                        <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent-gold transition-colors">search</span>
                        <input
                            placeholder="Buscar na base de elite.."
                            className="w-full h-14 bg-surface-dark/40 border border-white/5 rounded-[20px] pl-14 pr-6 text-xs font-medium text-white outline-none focus:border-accent-gold/40 focus:bg-surface-dark transition-all placeholder:text-white/10"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        {['TODOS', 'SELECT', 'PRIME', 'SIGNATURE', 'PRIVÉ'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`h-14 px-8 rounded-[20px] text-[9px] font-black uppercase tracking-[0.2em] border transition-all whitespace-nowrap shadow-huge active:scale-95 ${activeFilter === filter
                                    ? 'bg-accent-gold text-primary border-accent-gold'
                                    : 'bg-surface-dark/40 text-white/40 border-white/5 hover:border-white/10'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="relative z-10 flex-1 p-8 overflow-y-auto no-scrollbar pb-40">
                {loading ? (
                    <div className="py-40 flex flex-col items-center gap-6 animate-pulse">
                        <div className="size-14 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-accent-gold uppercase tracking-[0.4em]">Sincronizando Dossier...</p>
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div className="py-40 text-center space-y-6 opacity-10">
                        <span className="material-symbols-outlined !text-6xl font-light">person_search</span>
                        <p className="text-xl font-display italic tracking-[0.2em] uppercase">Nenhum membro <br />encontrado nesta categoria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredMembers.map((member, idx) => {
                            const tier = calculateTier(member.lash_points || 0);
                            return (
                                <div
                                    key={member.id}
                                    className="group bg-surface-dark/40 border border-white/5 rounded-[48px] p-8 hover:bg-surface-dark hover:border-accent-gold/20 transition-all duration-700 shadow-hugest animate-reveal relative overflow-hidden h-fit"
                                    style={{ animationDelay: `${idx * 0.05}s` }}
                                >
                                    {/* Tier Badge Accent */}
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <span className="material-symbols-outlined !text-6xl">{tier === 'PRIVÉ' ? 'diamond' : tier === 'SIGNATURE' ? 'auto_awesome' : 'shield'}</span>
                                    </div>

                                    <div className="space-y-8 relative z-10">
                                        <div className="flex items-center gap-5">
                                            <div className="relative size-16 group-hover:scale-105 transition-transform duration-700">
                                                <div className="w-full h-full rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center text-lg font-black text-accent-gold overflow-hidden ring-1 ring-white/5 shadow-huge">
                                                    {member.avatar_url ? (
                                                        <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover scale-110" />
                                                    ) : (
                                                        <img src={`https://ui-avatars.com/api/?name=${member.name}&background=122b22&color=c9a961&bold=true`} className="w-full h-full scale-110" alt="" />
                                                    )}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 size-5 bg-emerald-500 rounded-full border-4 border-surface-dark"></div>
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-display font-bold text-xl text-white group-hover:text-accent-gold transition-colors truncate max-w-[150px]">{member.name}</h3>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[9px] uppercase font-black text-accent-gold tracking-[0.2em] font-outfit">{tier}</span>
                                                    <span className="size-1 rounded-full bg-white/10"></span>
                                                    <span className="text-[8px] text-white/20 uppercase tracking-widest font-black">Ref #{member.id.split('-')[0].toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 rounded-[32px] bg-white/2 border border-white/5 space-y-4">
                                            <div className="flex justify-between items-end">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] uppercase font-black text-white/20 tracking-[0.2em]">Prive Balance</p>
                                                    <p className="font-display text-4xl text-white tracking-tighter tabular-nums group-hover:text-accent-gold transition-colors">{(member.lash_points || 0).toLocaleString()}</p>
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Credits</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => navigate(`/admin/profile/${member.id}`)}
                                                className="flex-1 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center gap-3 text-white/40 hover:bg-white/10 hover:text-white transition-all active:scale-95 group/btn"
                                            >
                                                <span className="material-symbols-outlined !text-xl group-hover/btn:rotate-12 transition-transform italic">visibility</span>
                                                <span className="text-[9px] font-black uppercase tracking-widest">Dossier</span>
                                            </button>
                                            <button
                                                onClick={() => { setIsAdjusting(member.id); setAdjustValue(0); }}
                                                className="flex-1 h-16 rounded-[24px] bg-accent-gold text-primary border border-accent-gold flex items-center justify-center gap-3 hover:bg-white hover:text-primary transition-all active:scale-95 shadow-lg group/btn"
                                            >
                                                <span className="material-symbols-outlined !text-xl group-hover/btn:scale-110 transition-transform">bolt</span>
                                                <span className="text-[9px] font-black uppercase tracking-widest font-outfit">Credits</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Background Hover Aura */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-40 bg-accent-gold/5 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Strategic Action Button */}
            <div className="fixed bottom-10 left-0 right-0 px-6 flex justify-center z-[150] pointer-events-none">
                <button
                    onClick={() => navigate('/admin/clients')}
                    className="pointer-events-auto bg-accent-gold text-primary h-20 px-12 rounded-[32px] font-black text-[10px] uppercase tracking-[0.3em] font-outfit shadow-hugest hover:scale-105 active:scale-95 transition-all flex items-center gap-4 border border-white/20 backdrop-blur-md group"
                >
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <span className="material-symbols-outlined !text-2xl">person_add</span>
                    </div>
                    Cadastrar Novo Membro Privé
                </button>
            </div>

            {/* Adjust Balance Command Center */}
            {isAdjusting && (
                <div className="fixed inset-0 z-[200] bg-background-dark/80 backdrop-blur-xl flex items-center justify-center p-6 animate-reveal" onClick={() => setIsAdjusting(null)}>
                    <div className="bg-surface-dark w-full max-w-lg border border-white/10 rounded-[56px] p-12 space-y-10 relative overflow-hidden shadow-hugest" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/5 blur-[50px] rounded-full pointer-events-none"></div>

                        <div className="text-center space-y-4">
                            <div className="size-20 bg-accent-gold/10 border border-accent-gold/20 rounded-[32px] flex items-center justify-center text-accent-gold mx-auto mb-4 shadow-huge">
                                <span className="material-symbols-outlined !text-4xl">account_balance_wallet</span>
                            </div>
                            <h2 className="text-3xl font-display font-medium text-white tracking-tighter uppercase tabular-nums tracking-widest">Ajuste de Créditos</h2>
                            <p className="text-sm font-outfit font-light text-white/40 italic">Comando administrativo para balanceamento de privilégios.</p>
                        </div>

                        <div className="space-y-8">
                            <div className="relative group">
                                <input
                                    type="number"
                                    className="w-full h-32 bg-primary/20 border-2 border-white/10 rounded-[40px] text-center text-7xl font-display text-accent-gold outline-none focus:border-accent-gold/40 focus:bg-primary/40 transition-all font-medium tabular-nums shadow-inner"
                                    value={adjustValue}
                                    onChange={e => setAdjustValue(parseInt(e.target.value) || 0)}
                                    autoFocus
                                />
                                <span className="absolute right-12 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/10 uppercase tracking-[0.4em] pointer-events-none">Credits</span>
                            </div>

                            <div className="flex flex-wrap gap-3 justify-center">
                                {[100, 500, 1000].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setAdjustValue(prev => prev + v)}
                                        className="px-6 h-12 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-accent-gold/60 hover:bg-accent-gold hover:text-primary transition-all"
                                    >+{v}</button>
                                ))}
                                {[-100, -500].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setAdjustValue(prev => prev + v)}
                                        className="px-6 h-12 rounded-2xl bg-red-500/5 border border-red-500/10 text-[10px] font-black uppercase tracking-widest text-red-400/60 hover:bg-red-500 hover:text-white transition-all"
                                    >{v}</button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6">
                            <button onClick={() => setIsAdjusting(null)} className="flex-1 h-18 rounded-[24px] bg-white/5 border border-white/10 text-white/20 font-black text-[10px] uppercase tracking-[0.3em] font-outfit hover:text-white transition-all">Cancelar</button>
                            <button onClick={handleAdjustBalance} className="flex-[1.5] h-18 rounded-[24px] bg-accent-gold text-primary font-black text-[10px] uppercase tracking-[0.3em] font-outfit hover:bg-white hover:text-primary transition-all shadow-huge active:scale-95">Executar Ajuste</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPriveMembers;
