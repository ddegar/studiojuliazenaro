
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

interface PointTransaction {
    id: string;
    amount: number;
    description: string;
    created_at: string;
    source: string;
}

const PriveHistory: React.FC = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<PointTransaction[]>([]);
    const [points, setPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'earned' | 'redeemed'>('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const [txRes, profileRes] = await Promise.all([
                    supabase
                        .from('point_transactions')
                        .select('*')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false }),
                    supabase
                        .from('profiles')
                        .select('lash_points')
                        .eq('id', user.id)
                        .single()
                ]);

                if (txRes.data) setTransactions(txRes.data);
                if (profileRes.data) setPoints(profileRes.data.lash_points || 0);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTier = (pts: number) => {
        if (pts >= 3000) return { name: 'Privé Elite', color: 'bg-gradient-to-br from-[#064e3b] to-[#01261d]', textColor: 'text-white' };
        if (pts >= 1500) return { name: 'Signature', color: 'bg-gradient-to-br from-[#C5A059] to-[#B8860B]', textColor: 'text-white' };
        if (pts >= 500) return { name: 'Prime', color: 'bg-slate-700', textColor: 'text-white' };
        return { name: 'Select', color: 'bg-slate-500', textColor: 'text-white' };
    };

    const currentTier = getTier(points);

    const filteredTransactions = transactions.filter(tx => {
        if (filter === 'earned') return tx.amount > 0;
        if (filter === 'redeemed') return tx.amount < 0;
        return true;
    });

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 font-sans pb-12">
            <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-white/85 dark:bg-[#121212]/85 backdrop-blur-md">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-primary dark:text-accent-gold">
                    <span className="material-symbols-outlined">arrow_back_ios_new</span>
                </button>
                <h1 className="font-display text-base font-bold text-primary dark:text-accent-gold">Extrato</h1>
                <div className="w-10 flex justify-end">
                    <button className="text-primary dark:text-accent-gold">
                        <span className="material-symbols-outlined">info</span>
                    </button>
                </div>
            </header>

            <main className="pt-20 px-6 max-w-md mx-auto">
                {/* Member Card */}
                <div className={`${currentTier.color} p-8 rounded-[32px] shadow-2xl relative overflow-hidden mb-8 mt-4`}>
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-bold mb-1">Status de Membro</p>
                                <h3 className="font-display italic text-lg text-gold-light">{currentTier.name}</h3>
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
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-8 border-b border-gray-100 dark:border-white/5 mb-8">
                    {(['all', 'earned', 'redeemed'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`pb-3 text-xs font-black uppercase tracking-widest transition-all relative ${filter === f ? 'text-gold-dark dark:text-gold-light' : 'text-gray-400 dark:text-gray-600'}`}
                        >
                            {f === 'all' ? 'Tudo' : f === 'earned' ? 'Ganhos' : 'Resgates'}
                            {filter === f && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-dark dark:bg-gold-light"></div>}
                        </button>
                    ))}
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="font-display text-lg font-bold">Histórico de Movimentações</h2>
                    <span className="material-symbols-outlined text-gray-400 text-sm">tune</span>
                </div>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="size-8 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-20 opacity-50">
                        <span className="material-symbols-outlined text-4xl mb-2">history</span>
                        <p className="text-sm">Nenhuma movimentação para este filtro.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredTransactions.map((tx) => (
                            <div key={tx.id} className="bg-white dark:bg-zinc-900/50 p-4 rounded-3xl border border-slate-50 dark:border-white/5 flex items-center justify-between group hover:shadow-lg transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 
                                        ${tx.amount > 0 ? 'bg-[#fef9c3] text-gold-dark dark:bg-gold-dark/20' : 'bg-[#f1f5f9] text-gray-500 dark:bg-zinc-800'}`}>
                                        <span className="material-symbols-outlined text-xl">
                                            {tx.amount > 0 ? 'stars' : (tx.description.toLowerCase().includes('botox') ? 'face' : 'redeem')}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-primary dark:text-white line-clamp-1">{tx.description}</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter">
                                            {new Date(tx.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <span className={`font-black text-sm whitespace-nowrap ${tx.amount > 0 ? 'text-gold-dark dark:text-gold-light' : 'text-[#064e3b] dark:text-emerald-400'}`}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}.00
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default PriveHistory;
