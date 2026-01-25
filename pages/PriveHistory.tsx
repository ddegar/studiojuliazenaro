
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import JZReferralCard from '../components/JZReferralCard';

interface UnifiedTransaction {
    id: string;
    points: number;
    source: string;
    created_at: string;
    type: 'service' | 'referral' | 'reward' | 'other';
}

const PriveHistory: React.FC = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
    const [points, setPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'earned' | 'redeemed'>('all');
    const [userName, setUserName] = useState('Membro');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const [lashPtsRes, pointTxRes, profileRes, configRes] = await Promise.all([
                    supabase
                        .from('lash_points')
                        .select('*')
                        .eq('client_id', user.id),
                    supabase
                        .from('point_transactions')
                        .select('*')
                        .eq('user_id', user.id),
                    supabase
                        .from('profiles')
                        .select('name, lash_points')
                        .eq('id', user.id)
                        .maybeSingle(),
                    supabase
                        .from('studio_config')
                        .select('value')
                        .eq('key', 'prive_enabled')
                        .maybeSingle()
                ]);

                if (configRes.data?.value === 'false') {
                    navigate('/prive');
                    return;
                }

                const unified: UnifiedTransaction[] = [];

                const determineType = (source: string, pts: number): 'service' | 'referral' | 'reward' | 'other' => {
                    const s = source.toLowerCase();
                    if (pts < 0 || s.includes('resgate') || s.includes('mimo') || s.includes('ativado')) return 'reward';
                    if (s.includes('indicação') || s.includes('indicou') || s.includes('referral')) return 'referral';
                    if (s.includes('atendimento') || s.includes('serviço') || s.includes('cílios') || s.includes('lifting') || s.includes('sobrancelha')) return 'service';
                    return 'other';
                };

                if (lashPtsRes.data) {
                    lashPtsRes.data.forEach(tx => {
                        unified.push({
                            id: tx.id,
                            points: tx.points,
                            source: tx.source,
                            created_at: tx.created_at,
                            type: determineType(tx.source, tx.points)
                        });
                    });
                }

                if (pointTxRes.data) {
                    pointTxRes.data.forEach(tx => {
                        const pts = tx.amount || 0;
                        const src = tx.description || tx.source || 'Atendimento realizado';
                        unified.push({
                            id: tx.id,
                            points: pts,
                            source: src,
                            created_at: tx.created_at,
                            type: determineType(src, pts)
                        });
                    });
                }

                unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setTransactions(unified);

                if (profileRes.data) {
                    setPoints(profileRes.data.lash_points || 0);
                    setUserName(profileRes.data.name?.split(' ')[0] || 'Membro');
                }
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransactions = transactions.filter(tx => {
        if (filter === 'earned') return tx.points > 0;
        if (filter === 'redeemed') return tx.points < 0;
        return true;
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'service': return 'diamond'; // Changed from stars to diamond
            case 'referral': return 'favorite';
            case 'reward': return 'card_giftcard';
            default: return 'event_note';
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'service': return 'bg-[#C9A961]/10 text-[#C9A961] border-[#C9A961]/20';
            case 'referral': return 'bg-white/5 text-white/40 border-white/10';
            case 'reward': return 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10';
            default: return 'bg-white/5 text-white/40 border-white/10';
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050d0a] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#C9A961] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-background-dark text-white overflow-hidden selection:bg-accent-gold/20 relative">
            {/* Dynamic Background Elements */}
            <div className="fixed inset-0 pointer-events-none opacity-15 overflow-hidden">
                <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/20 blur-[120px] animate-float"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/20 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <header className="sticky top-0 z-[100] premium-nav-dark p-6 border-b border-white/5 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-accent-gold hover:bg-white/10 active:scale-90 transition-all">
                        <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
                    </button>
                    <div className="text-center">
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mb-1">Elite Transaction Ledger</p>
                        <h2 className="font-display italic text-xl leading-tight text-white tracking-tight">Atividades do Clube</h2>
                    </div>
                    <div className="size-10"></div>
                </div>

                {/* Premium Category Filter */}
                <div className="flex items-center justify-between px-2 overflow-x-auto no-scrollbar scroll-smooth gap-8">
                    {(['all', 'earned', 'redeemed'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`pb-3 text-[10px] font-black uppercase tracking-[0.3em] font-outfit transition-all relative whitespace-nowrap ${filter === f ? 'text-accent-gold' : 'text-white/20 hover:text-white/40'}`}
                        >
                            {f === 'all' ? 'Visão Geral' : f === 'earned' ? 'JZ Balance' : 'Utilizações'}
                            {filter === f && (
                                <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-accent-gold shadow-[0_0_10px_#C9A961]"></div>
                            )}
                        </button>
                    ))}
                </div>
            </header>

            <main className="relative z-10 flex-1 p-8 overflow-y-auto no-scrollbar pb-40">
                {/* BALANCE DASHBOARD */}
                <section className="mb-16 animate-reveal">
                    <div className="bg-surface-dark/40 border border-white/5 rounded-[56px] p-10 shadow-hugest relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-1 rounded-full bg-accent-gold"></div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-gold/60">Saldo Disponível</p>
                                </div>
                                <div className="flex items-baseline gap-4">
                                    <span className="text-6xl font-display font-medium text-white tracking-tighter tabular-nums group-hover:text-accent-gold transition-colors">{points.toLocaleString()}</span>
                                    <span className="text-xs font-black text-accent-gold tracking-[0.4em] uppercase font-outfit">JZ Balance</span>
                                </div>
                            </div>

                            <div className="h-20 w-px bg-white/5 hidden md:block"></div>

                            <div className="space-y-4">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Identificador JZ</p>
                                <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 font-outfit font-black text-accent-gold text-sm tracking-widest shadow-inner">
                                    #{userName.substring(0, 3).toUpperCase()}{points}
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 group-hover:translate-x-1 transition-transform duration-700">
                            <button
                                onClick={() => navigate('/prive/rewards')}
                                className="w-full h-18 bg-accent-gold text-primary rounded-3xl flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] font-outfit hover:bg-white transition-all active:scale-95 shadow-huge"
                            >
                                <span className="material-symbols-outlined !text-xl">explore</span>
                                Acessar Catálogo de Experiências
                            </button>
                        </div>

                        {/* Aesthetic Watermark */}
                        <span className="material-symbols-outlined absolute -right-10 -bottom-10 text-white/[0.02] text-[240px] select-none pointer-events-none rotate-12">
                            workspace_premium
                        </span>
                    </div>
                </section>

                {/* Transaction List */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-4 mb-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Cronologia de Prestígio</h3>
                        <span className="h-px flex-1 bg-white/5 ml-6"></span>
                    </div>

                    {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((tx, idx) => (
                            <div
                                key={tx.id}
                                className="group bg-surface-dark/20 border border-white/5 rounded-[32px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-surface-dark hover:border-accent-gold/10 transition-all duration-700 shadow-hugest animate-reveal"
                                style={{ animationDelay: `${idx * 0.05}s` }}
                            >
                                <div className="flex items-center gap-6 flex-1 w-full">
                                    <div className={`size-16 rounded-[24px] flex items-center justify-center shrink-0 border transition-all duration-700 shadow-huge group-hover:rotate-12 ${getIconColor(tx.type)}`}>
                                        <span className="material-symbols-outlined !text-3xl">
                                            {getIcon(tx.type)}
                                        </span>
                                    </div>
                                    <div className="space-y-1 overflow-hidden">
                                        <h4 className="font-display font-medium text-lg text-white leading-tight truncate group-hover:text-accent-gold transition-colors">
                                            {tx.source.replace('Resgate: ', '')}
                                        </h4>
                                        <div className="flex items-center gap-3">
                                            <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">
                                                {new Date(tx.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')} • {new Date(tx.created_at).getFullYear()}
                                            </p>
                                            <span className="size-1 rounded-full bg-white/5"></span>
                                            <p className="text-[9px] text-accent-gold/40 font-black uppercase tracking-widest italic font-outfit">
                                                {tx.points > 0 ? 'Crédito Aplicado' : 'Mimo Adquirido'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end w-full md:w-auto md:ml-6 px-4 md:px-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/10 md:hidden">Variação</span>
                                    <div className="text-right">
                                        <span className={`font-outfit font-black text-2xl tabular-nums ${tx.points > 0 ? 'text-accent-gold' : 'text-emerald-400'}`}>
                                            {tx.points > 0 ? '+' : ''}{tx.points.toLocaleString()}
                                        </span>
                                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 leading-none mt-1">Status Balance</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-40 text-center space-y-8 opacity-10 animate-reveal">
                            <span className="material-symbols-outlined !text-6xl font-light">history</span>
                            <p className="text-xl font-display italic tracking-[0.2em] uppercase">Sua história no clube <br />está apenas começando.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Integrated Referral */}
            <div className="mt-8 animate-reveal stagger-5">
                <JZReferralCard variant="dark" />
            </div>
            {/* Fixed Visual Safe Area */}
            <div className="fixed bottom-0 left-0 w-full h-12 bg-black/40 backdrop-blur-3xl border-t border-white/5 pointer-events-none z-[130]"></div>
        </div>
    );
};

export default PriveHistory;
