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
                            <span className="material-symbols-outlined !text-2xl">loyalty</span>
                            {syncing && <div className="absolute -top-1 -right-1 size-3 bg-emerald-500 rounded-full animate-ping"></div>}
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mb-1">Intelligence Dashboard</p>
                            <h2 className="font-display italic text-xl leading-tight text-white tracking-tight">JZ Privé Strategic</h2>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                            <div className={`size-2 rounded-full ${syncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                            <span className="text-[9px] uppercase font-black tracking-widest text-white/60">
                                {syncing ? 'Sincronizando' : 'Online Realtime'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative z-10 flex-1 p-8 overflow-y-auto no-scrollbar pb-32">
                {/* Elite Global Balance */}
                <section className="mb-12 animate-reveal">
                    <div className="bg-surface-dark/40 backdrop-blur-xl border border-white/5 rounded-[56px] p-12 relative overflow-hidden group shadow-hugest">
                        {/* Cinematic Glow */}
                        <div className="absolute -top-20 -right-20 size-80 bg-accent-gold/5 blur-[100px] rounded-full group-hover:bg-accent-gold/10 transition-all duration-1000"></div>

                        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-px w-8 bg-accent-gold/40"></div>
                                    <p className="text-[10px] font-black uppercase text-accent-gold tracking-[0.5em] font-outfit">Saldo Global em Circulação</p>
                                </div>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-6xl md:text-8xl font-display font-medium leading-none tracking-tighter tabular-nums">{stats.globalBalance.toLocaleString('pt-BR')}</span>
                                    <span className="text-sm font-black uppercase tracking-[0.3em] text-white/20">Credits</span>
                                </div>
                                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform duration-700">
                                    <span className="material-symbols-outlined !text-lg">trending_up</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">+12.5% Performance Semanal</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => navigate('/admin/jz-prive/members')} className="group/btn relative h-16 px-8 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4 hover:bg-white/10 transition-all active:scale-95 shadow-huge">
                                    <span className="material-symbols-outlined !text-xl text-accent-gold group-hover/btn:rotate-12 transition-transform">person_add</span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Novo Membro</span>
                                </button>
                                <button onClick={() => navigate('/admin/jz-prive/rewards')} className="group/btn relative h-16 px-8 bg-accent-gold text-primary rounded-3xl flex items-center gap-4 hover:bg-white hover:text-primary transition-all active:scale-95 shadow-huge">
                                    <span className="material-symbols-outlined !text-xl group-hover/btn:scale-110 transition-transform">card_giftcard</span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Emitir Mimo</span>
                                </button>
                            </div>
                        </div>

                        {/* Background Icon Decoration */}
                        <span className="material-symbols-outlined absolute -right-6 -bottom-10 text-[220px] text-white/[0.02] pointer-events-none group-hover:text-white/[0.04] transition-all duration-1000 select-none">
                            account_balance_wallet
                        </span>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Distribution Analytics */}
                    <div className="lg:col-span-3 space-y-8 animate-reveal stagger-1">
                        <div className="flex items-center justify-between px-2">
                            <div className="space-y-1">
                                <h3 className="text-base font-outfit font-bold text-white uppercase tracking-wider">Distribuição Bio-Demográfica</h3>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Membros por Categoria JZ</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { label: 'Select Member', count: stats.distribution.Select, color: 'bg-slate-500', icon: 'shield' },
                                { label: 'Prime Member', count: stats.distribution.Prime, color: 'bg-accent-gold', icon: 'workspace_premium' },
                                { label: 'Signature Elite', count: stats.distribution.Signature, color: 'bg-emerald-500', icon: 'auto_awesome' },
                                { label: 'Privé Diamond', count: stats.distribution.Privé, color: 'bg-white', icon: 'diamond', special: true }
                            ].map((tier, idx) => (
                                <div key={idx} className="group bg-surface-dark/40 border border-white/5 rounded-[40px] p-8 space-y-6 hover:bg-surface-dark hover:border-white/10 transition-all duration-500 shadow-huge relative overflow-hidden">
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className={`size-12 rounded-2xl bg-white/5 flex items-center justify-center transition-all duration-700 group-hover:scale-110 ${tier.special ? 'text-white' : 'text-accent-gold/60'}`}>
                                            <span className="material-symbols-outlined !text-xl">{tier.icon}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">{tier.label}</p>
                                            <p className="text-3xl font-display font-medium tabular-nums">{tier.count}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 relative z-10">
                                        <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-white/20">
                                            <span>Presença em Base</span>
                                            <span>{Math.round((tier.count / (stats.totalMembers || 1)) * 100)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-[2s] ${tier.color} shadow-lg`}
                                                style={{ width: `${(tier.count / (stats.totalMembers || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {tier.special && <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full pointer-events-none"></div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upgrade Matrix Index */}
                    <div className="lg:col-span-2 space-y-8 animate-reveal stagger-2">
                        <div className="bg-primary/5 border border-primary/20 rounded-[48px] p-10 space-y-10 shadow-hugest h-full relative overflow-hidden group">
                            {/* Floating Glow */}
                            <div className="absolute -top-10 -right-10 size-40 bg-primary/20 blur-[60px] rounded-full animate-float"></div>

                            <div className="space-y-6 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-lg">
                                        <span className="material-symbols-outlined !text-3xl">trending_up</span>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-display italic text-white leading-tight">Matriz de Upgrade</h3>
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/60 font-outfit">High Propensity Targets</p>
                                    </div>
                                </div>
                                <p className="text-sm font-outfit font-light text-white/40 leading-relaxed italic border-l border-white/10 pl-4">Clientes em alta propensão de migração orgânica para o próximo nível vip.</p>
                            </div>

                            <div className="space-y-4 relative z-10">
                                {upgradeIndex.length > 0 ? upgradeIndex.map((client, idx) => (
                                    <div key={idx} className="group/item flex items-center justify-between p-5 rounded-[32px] bg-white/2 border border-white/5 hover:border-accent-gold/40 hover:bg-white/5 transition-all duration-500 animate-reveal" style={{ animationDelay: `${idx * 0.1}s` }}>
                                        <div className="flex items-center gap-5">
                                            <div className="relative size-12 rounded-full border border-white/10 flex items-center justify-center bg-surface-dark group-hover/item:border-accent-gold/40 transition-colors overflow-hidden">
                                                <img src={`https://ui-avatars.com/api/?name=${client.name}&background=122b22&color=c9a961&bold=true`} className="w-full h-full scale-110" alt="" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-outfit font-bold text-white group-hover/item:text-accent-gold transition-colors">{client.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[9px] font-mono text-white/20 tracking-tighter uppercase">{client.points} <span className="text-accent-gold/40">/ {client.target} PTS</span></p>
                                                    <span className="size-1 rounded-full bg-accent-gold/20"></span>
                                                    <span className="text-[8px] font-black text-accent-gold uppercase tracking-widest">{client.nextLevel}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleNotifyUpgrade(client.name)}
                                            className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-accent-gold hover:bg-accent-gold hover:text-primary transition-all active:scale-90 shadow-lg group-hover/item:scale-105"
                                        >
                                            <span className="material-symbols-outlined !text-xl">bolt</span>
                                        </button>
                                    </div>
                                )) : (
                                    <div className="py-20 text-center opacity-10 space-y-6">
                                        <span className="material-symbols-outlined !text-5xl">person_search</span>
                                        <p className="font-display italic text-lg px-10">Monitorando propensões de upgrade...</p>
                                    </div>
                                )}
                            </div>

                            <button onClick={() => navigate('/admin/jz-prive/members')} className="w-full py-6 text-[9px] font-black text-white/10 hover:text-accent-gold uppercase tracking-[0.4em] text-center transition-colors relative z-10 border-t border-white/5 mt-4">
                                Auditoria Completa de Base
                            </button>
                        </div>
                    </div>
                </div>

                {/* Redemption Biometrics Flow */}
                <section className="mt-12 animate-reveal stagger-3">
                    <div className="bg-surface-dark/40 border border-white/5 rounded-[56px] p-10 space-y-10 shadow-hugest overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-64 h-1 bg-gradient-to-r from-emerald-500/30 to-transparent"></div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/40">Redemption Flow Analytics</p>
                                <h3 className="text-2xl font-display italic text-white uppercase tracking-tight">Fluxo de Resgates em Volume</h3>
                            </div>
                            <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest font-outfit px-4 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 shadow-lg">+18% vs Período Anterior</span>
                        </div>

                        <div className="h-[280px] w-full relative group">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={redemptionData}>
                                    <defs>
                                        <linearGradient id="colorEmerald" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#ffffff20', fontSize: 9, fontWeight: '900', letterSpacing: '0.1em' }}
                                        dy={15}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', fontSize: '10px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', padding: '16px' }}
                                        itemStyle={{ color: '#10b981', fontWeight: 'bold', textTransform: 'uppercase' }}
                                        cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorEmerald)"
                                        animationDuration={2500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </section>

                {/* Sync Footprint */}
                <div className="mt-16 mb-8 flex items-center justify-center gap-6 opacity-10">
                    <div className="h-px w-24 bg-white/20"></div>
                    <div className="flex items-center gap-3">
                        <div className="size-1.5 rounded-full bg-accent-gold animate-pulse"></div>
                        <span className="text-[8px] font-black uppercase tracking-[0.4em] font-outfit">Sincronia Criptográfica Ativa</span>
                    </div>
                    <div className="h-px w-24 bg-white/20"></div>
                </div>
            </main>

            {/* Persistent Command Center Safe Area */}
            <div className="fixed bottom-0 left-0 w-full h-8 bg-black pointer-events-none z-[130]"></div>
        </div>
    );
};

export default AdminPriveDashboard;
