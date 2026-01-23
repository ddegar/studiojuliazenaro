
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
                const [lashPtsRes, pointTxRes, profileRes] = await Promise.all([
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
                        .single()
                ]);

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
        <div className="min-h-screen bg-[#050d0a] text-white font-sans selection:bg-[#C9A961]/30 pb-32 relative overflow-hidden">
            {/* Header */}
            <header className="px-6 py-8 flex justify-between items-center relative z-10 bg-[#050d0a]/80 backdrop-blur-xl border-b border-white/5 sticky top-0">
                <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#C9A961]">
                    <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
                </button>
                <h2 className="font-serif italic text-xl tracking-tight text-[#C9A961]">Atividades do Clube</h2>
                <div className="size-10"></div>
            </header>

            <main className="mt-8 px-6 max-w-md mx-auto relative z-10">
                <div className="mb-8 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Exclusive History</p>
                    <h1 className="text-4xl font-display font-bold leading-none">Atividades do Clube</h1>
                    <p className="text-white/40 text-[11px] font-medium leading-relaxed">Acompanhe seus créditos e utilizações no JZ Privé Club.</p>
                </div>

                {/* BALANCE CARD */}
                <section className="mb-12">
                    <div className="bg-zinc-950 rounded-[40px] px-8 py-8 shadow-2xl relative overflow-hidden border border-[#C9A961]/10">
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#C9A961]">Saldo Disponível</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-display font-bold text-white">{points.toLocaleString()}</span>
                                    <span className="text-[10px] font-bold text-[#C9A961] tracking-widest uppercase">JZ Privé Balance</span>
                                </div>
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#C9A961] text-[8px] font-black uppercase tracking-widest">
                                #{userName.charAt(0)}{points}
                            </div>
                        </div>

                        <div className="mt-8 relative z-10 flex flex-col gap-6">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#C9A961] !text-sm">auto_awesome</span>
                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Use seus créditos para ativar experiências exclusivas no catálogo</p>
                            </div>

                            <button
                                onClick={() => navigate('/prive/rewards')}
                                className="w-full h-12 bg-[#0f2c22] border border-[#C9A961]/20 rounded-2xl flex items-center justify-center gap-2 text-[#C9A961] text-[9px] font-black uppercase tracking-[0.2em] hover:bg-[#C9A961] hover:text-zinc-950 transition-all active:scale-95 shadow-xl"
                            >
                                <span className="material-symbols-outlined !text-lg">explore</span>
                                Ver Experiências
                            </button>
                        </div>

                        <span className="material-symbols-outlined absolute -right-4 -top-4 text-[#C9A961]/5 text-[120px] select-none pointer-events-none">
                            workspace_premium
                        </span>
                    </div>
                </section>

                {/* Filters */}
                <div className="flex items-center justify-start gap-8 border-b border-white/5 mb-8 overflow-x-auto no-scrollbar">
                    {(['all', 'earned', 'redeemed'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative whitespace-nowrap ${filter === f ? 'text-[#C9A961]' : 'text-white/20'}`}
                        >
                            {f === 'all' ? 'Visão Geral' : f === 'earned' ? 'Créditos' : 'Utilizações'}
                            {filter === f && (
                                <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#C9A961] shadow-[0_0_10px_#C9A961]"></div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Transaction List */}
                <div className="space-y-4 mb-20">
                    {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((tx) => (
                            <div key={tx.id} className="bg-[#0a1611] p-6 rounded-[28px] border border-white/5 flex items-center justify-between group transition-all hover:border-[#C9A961]/20">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${getIconColor(tx.type)}`}>
                                        <span className="material-symbols-outlined !text-2xl">
                                            {getIcon(tx.type)}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-[14px] text-white leading-tight">
                                            {tx.source.replace('Resgate: ', '')} {tx.type === 'service' ? '• Atendimento realizado' : ''}
                                        </h4>
                                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1.5">
                                            {new Date(tx.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')} de {new Date(tx.created_at).getFullYear()} • {tx.points > 0 ? 'Crédito aplicado' : 'Utilização de mimo'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right ml-4">
                                    <span className={`font-black text-[15px] block ${tx.points > 0 ? 'text-[#C9A961]' : 'text-emerald-400'}`}>
                                        {tx.points > 0 ? '+' : ''}{tx.points.toLocaleString()}
                                    </span>
                                    <span className="text-[7px] font-black uppercase tracking-widest text-white/20">JZ Privé Balance</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center space-y-4 opacity-20">
                            <span className="material-symbols-outlined text-4xl font-light">history</span>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Nenhuma atividade</p>
                        </div>
                    )}
                </div>

                <JZReferralCard />

                <div className="mt-20 text-center opacity-10">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] leading-relaxed">
                        JZ Privé Excellence
                    </p>
                </div>
            </main>

            {/* Background Glows */}
            <div className="fixed top-[-10%] right-[-10%] w-[80%] h-[80%] bg-[#C9A961]/5 rounded-full blur-[150px] pointer-events-none z-[-1]"></div>
            <div className="fixed bottom-[-5%] left-[-5%] w-[60%] h-[60%] bg-[#0f3e29]/10 rounded-full blur-[120px] pointer-events-none z-[-1]"></div>
        </div>
    );
};

export default PriveHistory;
