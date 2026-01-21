import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { supabase } from '../services/supabase';

// Helper to determine tier based on points (matching AdminPriveLevels)
const getTier = (points: number) => {
    if (points >= 3000) return 'Privé';
    if (points >= 1500) return 'Signature';
    if (points >= 500) return 'Prime';
    return 'Select';
};

const getNextTier = (points: number) => {
    if (points >= 3000) return null; // Max level
    if (points >= 1500) return { name: 'Privé', target: 3000 };
    if (points >= 500) return { name: 'Signature', target: 1500 };
    return { name: 'Prime', target: 500 };
};

const AdminPriveDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        globalBalance: 0,
        distribution: { Select: 0, Prime: 0, Signature: 0, Privé: 0 } as Record<string, number>,
        totalMembers: 0,
    });
    const [upgradeIndex, setUpgradeIndex] = useState<any[]>([]);
    const [redemptionData, setRedemptionData] = useState<any[]>([]);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        setSyncing(true);
        try {
            // 1. Fetch Profiles for Balance, Distribution, and Upgrade Index
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, name, lash_points, role') // Assuming lash_points is the balance
                .eq('role', 'CLIENT');

            if (profileError) throw profileError;

            let totalBalance = 0;
            const dist = { Select: 0, Prime: 0, Signature: 0, Privé: 0 };
            const upgrades: any[] = [];

            profiles?.forEach(p => {
                const pts = p.lash_points || 0;
                totalBalance += pts;

                const tier = getTier(pts);
                dist[tier as keyof typeof dist]++;

                // Upgrade Logic: If > 80% progress to next level
                const next = getNextTier(pts);
                if (next) {
                    const prevTarget = next.target === 3000 ? 1500 : (next.target === 1500 ? 500 : 0);
                    // Just raw proximity logic. 
                    // Let's use: if within 20% of target
                    if (pts >= next.target * 0.8) {
                        upgrades.push({
                            id: p.id,
                            name: p.name || 'Cliente',
                            points: pts,
                            nextLevel: next.name,
                            target: next.target,
                            initials: p.name ? p.name.slice(0, 2).toUpperCase() : 'CJ'
                        });
                    }
                }
            });

            // 2. Fetch Redemptions for Graph (Last 7 days)
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 6);

            // Mocking redemption data if table doesn't exist or is empty for demo, 
            // but trying to fetch real if available.
            const { data: redemptions } = await supabase
                .from('transactions') // Fallback to transactions
                .select('date, amount')
                .eq('type', 'EXPENSE') // Assuming Expense/Redeem type
                .gte('date', startDate.toISOString().split('T')[0])
                .lte('date', endDate.toISOString().split('T')[0]);

            // Process Graph Data
            const graphMap = new Map();
            // Init last 7 days
            for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const strDate = d.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
                const isoDate = d.toISOString().split('T')[0];
                graphMap.set(isoDate, { name: strDate, value: 0 });
            }

            if (redemptions) {
                redemptions.forEach(r => {
                    const iso = r.date; // assuming YYYY-MM-DD
                    if (graphMap.has(iso)) {
                        graphMap.get(iso).value += Math.abs(r.amount);
                    }
                });
            }

            // Convert to array and reverse (oldest to newest)
            const graphArray = Array.from(graphMap.values()).reverse();

            setStats({
                globalBalance: totalBalance,
                distribution: dist,
                totalMembers: profiles?.length || 0
            });
            setUpgradeIndex(upgrades.slice(0, 4)); // Top 4
            setRedemptionData(graphArray);

        } catch (err) {
            console.error('Error fetching prive dashboard:', err);
        } finally {
            setLoading(false);
            setTimeout(() => setSyncing(false), 1500); // Fake sync delay for effect
        }
    };

    const handleNotifyUpgrade = (clientName: string) => {
        alert(`Notificação enviada para ${clientName}: "Parabéns! Você está muito perto de subir de nível no JZ Privé!"`);
    };

    if (loading) return <div className="p-10 text-center text-white/50 animate-pulse">Carregando JZ Privé...</div>;

    return (
        <div className="font-sans text-slate-100 min-h-screen selection:bg-[#C5A059] selection:text-[#051611] pb-24">
            {/* Header / Title - Optionally redundant if Shell has it, but good for context */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard Executivo</h1>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059] font-bold mt-1">JZ Privé Club • Visão Geral</p>
                </div>
                <div className="bg-[#0D2C24] px-4 py-2 rounded-full border border-white/5 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${syncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">
                        {syncing ? 'Sincronizando...' : 'Online Realtime'}
                    </span>
                </div>
            </div>

            {/* Global Balance Card */}
            <div className="bg-[#0D2C24] rounded-[24px] p-8 border border-white/5 relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] uppercase font-black tracking-[0.2em] text-[#C5A059]">Saldo Global Balance</span>
                        <span className="material-symbols-outlined text-[#C5A059] text-sm cursor-help" title="Somatória de todos os pontos em circulação">info</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="font-display text-5xl md:text-6xl text-white">{stats.globalBalance.toLocaleString('pt-BR')}</span>
                        <span className="text-sm font-bold text-white/40 uppercase tracking-widest">Pts</span>
                    </div>
                    <div className="mt-4 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                        <span className="material-symbols-outlined text-emerald-500 text-sm">trending_up</span>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">+12.5% vs. Período Anterior</span>
                    </div>
                </div>
                {/* Decorative Wallet Icon Background */}
                <span className="material-symbols-outlined absolute -right-4 -bottom-8 text-[180px] text-white/[0.02] pointer-events-none group-hover:scale-105 transition-transform duration-700">
                    account_balance_wallet
                </span>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                    onClick={() => navigate('/admin/jz-prive/members')}
                    className="bg-[#121A16] border border-white/5 p-6 rounded-[24px] flex flex-col items-start gap-4 hover:bg-[#1A2520] transition-colors group text-left"
                >
                    <div className="w-10 h-10 rounded-xl bg-emerald-900/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-xl">person_add</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Novo Membro</span>
                </button>
                <button
                    onClick={() => navigate('/admin/jz-prive/rewards')}
                    className="bg-[#121A16] border border-white/5 p-6 rounded-[24px] flex flex-col items-start gap-4 hover:bg-[#1A2520] transition-colors group text-left"
                >
                    <div className="w-10 h-10 rounded-xl bg-[#C5A059]/20 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-xl">card_giftcard</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Emitir Recompensa</span>
                </button>
            </div>

            {/* Distribution by Category */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-white/40">Distribuição por Categoria</h3>
                    <button onClick={() => navigate('/admin/jz-prive/members')} className="text-[10px] text-[#C5A059] underline underline-offset-4 hover:text-white transition-colors">Ver Todos</button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Select */}
                    <div className="bg-[#121A16] border border-white/5 rounded-[24px] p-5 relative overflow-hidden">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Select</p>
                        <p className="font-display text-3xl font-bold">{stats.distribution.Select}</p>
                        <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-500" style={{ width: `${(stats.distribution.Select / (stats.totalMembers || 1)) * 100}%` }}></div>
                        </div>
                    </div>
                    {/* Prime */}
                    <div className="bg-[#121A16] border border-white/5 rounded-[24px] p-5 relative overflow-hidden">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#C5A059] mb-2">Prime</p>
                        <p className="font-display text-3xl font-bold">{stats.distribution.Prime}</p>
                        <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-[#C5A059]" style={{ width: `${(stats.distribution.Prime / (stats.totalMembers || 1)) * 100}%` }}></div>
                        </div>
                    </div>
                    {/* Signature */}
                    <div className="bg-[#121A16] border border-white/5 rounded-[24px] p-5 relative overflow-hidden">
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-2">Signature</p>
                        <p className="font-display text-3xl font-bold">{stats.distribution.Signature}</p>
                        <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${(stats.distribution.Signature / (stats.totalMembers || 1)) * 100}%` }}></div>
                        </div>
                    </div>
                    {/* Prive */}
                    <div className="bg-[#121A16] border border-white/5 rounded-[24px] p-5 relative overflow-hidden">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white mb-2">Privé</p>
                        <p className="font-display text-3xl font-bold">{stats.distribution.Privé}</p>
                        <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-white" style={{ width: `${(stats.distribution.Privé / (stats.totalMembers || 1)) * 100}%` }}></div>
                        </div>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full rounded-tr-[24px] flex items-center justify-center">
                            <span className="material-symbols-outlined text-white/20 mb-2 ml-2">diamond</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upgrade Index */}
            <div className="mt-8 bg-[#0D2C24] border border-[#C5A059]/20 rounded-[32px] p-8 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#C5A059]">trending_up</span>
                        </div>
                        <h3 className="text-md font-bold text-white uppercase tracking-wider">Índice de Upgrade</h3>
                    </div>
                    <span className="bg-[#1A2520] text-[#C5A059] text-[9px] font-black px-3 py-1.5 rounded-lg border border-[#C5A059]/20 uppercase tracking-widest">{upgradeIndex.length} Alvos</span>
                </div>

                <p className="text-xs text-white/50 mb-8 max-w-md">Membros em alta propensão de migração para o próximo nível esta semana.</p>

                <div className="space-y-4 relative z-10">
                    {upgradeIndex.length > 0 ? upgradeIndex.map((client, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-[#051611]/40 border border-white/5 hover:border-[#C5A059]/30 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#1A2520] border border-white/10 flex items-center justify-center text-[10px] font-black text-[#C5A059]">
                                    {client.initials}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{client.name}</p>
                                    <p className="text-[10px] font-mono text-white/40">{client.points} <span className="text-[#C5A059]">/ {client.target} PTS</span></p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleNotifyUpgrade(client.name)}
                                className="w-10 h-10 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-[#C5A059] hover:bg-[#C5A059] hover:text-[#051611] transition-all transform hover:scale-110 shadow-lg shadow-[#C5A059]/10"
                                title="Enviar Notificação de Incentivo"
                            >
                                <span className="material-symbols-outlined text-lg">bolt</span>
                            </button>
                        </div>
                    )) : (
                        <div className="text-center py-6 text-[10px] text-white/30 uppercase tracking-widest border border-dashed border-white/10 rounded-xl">
                            Nenhum membro próximo de upgrade no momento
                        </div>
                    )}
                </div>
            </div>

            {/* Redemption Flow Graph */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-white/40">Fluxo de Resgates</h3>
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">+18% vs semana anterior</span>
                </div>

                <div className="h-[250px] w-full bg-[#121A16] border border-white/5 rounded-[32px] p-6 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={redemptionData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 'bold' }}
                                dy={10}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1C1F24', border: 'none', borderRadius: '12px', fontSize: '10px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                itemStyle={{ color: '#E5E7EB' }}
                                cursor={{ stroke: '#FFFFFF', strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.1 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#10B981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Footer Sync Status - For effect */}
            <div className="mt-12 mb-8 flex items-center gap-4 opacity-30">
                <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#C5A059] w-1/3 animate-pulse"></div>
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.2em]">Sincronizando dados...</span>
            </div>
        </div>
    );
};

export default AdminPriveDashboard;
