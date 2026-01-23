
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import JZReferralCard from '../components/JZReferralCard';

const PriveDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [points, setPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('Membro');
    const [memberSince, setMemberSince] = useState('');
    const [levels, setLevels] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const [profileRes, levelsRes] = await Promise.all([
                user ? supabase.from('profiles').select('name, lash_points, created_at').eq('id', user.id).single() : Promise.resolve({ data: null, error: null }),
                supabase.from('loyalty_tiers').select('*').order('min_points', { ascending: true })
            ]);

            if (levelsRes.data) {
                setLevels(levelsRes.data);
            }

            if (profileRes.data) {
                setPoints(profileRes.data.lash_points || 0);
                if (profileRes.data.name) {
                    setUserName(profileRes.data.name.split(' ')[0]);
                }
                if (profileRes.data.created_at) {
                    const date = new Date(profileRes.data.created_at);
                    const month = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
                    setMemberSince(`${month} ${date.getFullYear()}`);
                }

                // Proactive Evaluation Notification Check (50 Points Milestone)
                const currentPts = profileRes.data.lash_points || 0;
                if (currentPts >= 50 && user) {
                    const [{ data: evaluationNotif }, { data: existingTestimonial }] = await Promise.all([
                        supabase.from('notifications').select('id').eq('user_id', user.id).eq('type', 'evaluation').limit(1).single(),
                        supabase.from('testimonials').select('id').eq('user_id', user.id).limit(1).single()
                    ]);

                    if (!evaluationNotif && !existingTestimonial) {
                        await supabase.from('notifications').insert({
                            user_id: user.id,
                            title: 'Sua Experiência ✨',
                            message: 'Você atingiu seus primeiros 50 pontos! Que tal nos contar o que está achando e ganhar ainda mais mimos?',
                            link: '/evaluation',
                            icon: 'auto_awesome',
                            type: 'evaluation'
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Correct Logic: Use min_points property
    const sortedLevels = [...levels].sort((a, b) => a.min_points - b.min_points);
    const currentTierIdx = sortedLevels.findIndex((t, i) => points >= t.min_points && (i === sortedLevels.length - 1 || points < sortedLevels[i + 1].min_points));

    // Ensure we handle the "not found" or "below first tier" case properly
    const safeTierIdx = currentTierIdx === -1 ? 0 : currentTierIdx;
    const currentLevel = sortedLevels[safeTierIdx] || sortedLevels[0];
    const nextLevel = sortedLevels[safeTierIdx + 1];

    const getTierStyle = (tierName: string) => {
        const name = tierName?.toUpperCase() || '';
        if (name.includes('PRIV')) return { bg: 'bg-zinc-950', accent: 'text-[#C9A961]', label: 'Privé Member' };
        if (name.includes('SIGNATURE')) return { bg: 'bg-[#0a2e1f]', accent: 'text-[#4ade80]', label: 'Signature Member' };
        if (name.includes('PRIME')) return { bg: 'bg-[#C9A961]', accent: 'text-zinc-950', label: 'Prime Member' };
        return { bg: 'bg-gradient-to-br from-zinc-300 to-zinc-400', accent: 'text-zinc-950', label: 'Select Member' };
    };

    const tierStyle = getTierStyle(currentLevel?.name);

    if (loading) return (
        <div className="min-h-screen bg-[#050d0a] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#C9A961] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050d0a] text-white font-sans selection:bg-[#C9A961]/30 pb-32 relative overflow-hidden">
            {/* Header */}
            <header className="px-6 py-8 flex justify-between items-center relative z-10">
                <button onClick={() => navigate('/home')} className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#C9A961]">
                    <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
                </button>
                <h2 className="font-serif italic text-xl tracking-tight text-[#C9A961]">JZ Privé Club</h2>
                <button onClick={() => navigate('/profile')} className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#C9A961]">
                    <span className="material-symbols-outlined !text-xl">person</span>
                </button>
            </header>

            <div className="px-6 pt-2 pb-6 space-y-1 relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Loyalty & Excellence</p>
                <h1 className="text-3xl font-display font-bold leading-none">Olá, {userName}</h1>
            </div>

            {/* Decreased Balance Card */}
            <section className="px-6 mb-10 relative z-10">
                <div className={`${tierStyle.bg} rounded-[40px] px-8 py-8 shadow-2xl relative overflow-hidden border border-white/5`}>
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-0.5">
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${tierStyle.bg === 'bg-white' || tierStyle.bg === 'bg-[#C9A961]' ? 'text-zinc-950/40' : 'text-white/30'}`}>Seu Saldo</p>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-4xl font-display font-bold ${tierStyle.bg === 'bg-white' || tierStyle.bg === 'bg-[#C9A961]' ? 'text-zinc-950' : 'text-white'}`}>{points.toLocaleString()}</span>
                                <span className={`text-sm font-bold opacity-60`}>PTS</span>
                            </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg border ${tierStyle.bg === 'bg-white' || tierStyle.bg === 'bg-[#C9A961]' ? 'bg-zinc-950/5 border-zinc-950/10 text-zinc-950' : 'bg-white/5 border-white/10 text-[#C9A961]'} text-[8px] font-black uppercase tracking-widest`}>
                            {tierStyle.label}
                        </div>
                    </div>

                    <div className="flex justify-between items-end relative z-10">
                        <div className="space-y-0.5">
                            <p className={`text-[9px] font-black uppercase tracking-widest ${tierStyle.bg === 'bg-white' || tierStyle.bg === 'bg-[#C9A961]' ? 'text-zinc-950/40' : 'text-white/30'}`}>Membro Desde</p>
                            <p className={`text-xs font-bold ${tierStyle.bg === 'bg-white' || tierStyle.bg === 'bg-[#C9A961]' ? 'text-zinc-950' : 'text-white'}`}>{memberSince || '---'}</p>
                        </div>
                        <div className="text-right">
                            <p className={`text-[9px] font-black uppercase tracking-widest ${tierStyle.bg === 'bg-white' || tierStyle.bg === 'bg-[#C9A961]' ? 'text-zinc-950/40' : 'text-white/30'}`}>JZ ID</p>
                            <p className={`text-xs font-bold leading-none ${tierStyle.bg === 'bg-white' || tierStyle.bg === 'bg-[#C9A961]' ? 'text-zinc-950' : 'text-white'}`}>#{userName.split('')[0]}{points}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Glowing Journey Progress Line */}
            <section className="px-8 mb-12 relative z-10">
                <div onClick={() => navigate('/prive/journey')} className="flex justify-between items-center mb-6 py-2 border-b border-white/5 group cursor-pointer">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C9A961]">Sua Jornada Elite</h3>
                    <span className="material-symbols-outlined text-white/20 group-hover:text-[#C9A961] transition-transform group-hover:translate-x-1">arrow_forward</span>
                </div>

                <div className="relative pt-6 px-1">
                    {/* Glowing Track */}
                    <div className="absolute top-[30px] left-0 right-0 h-[3px] bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#C9A961]/40 to-[#C9A961] shadow-[0_0_15px_#C9A961]"
                            style={{
                                width: points >= 3000 ? '100%' :
                                    points >= 1500 ? '75%' :
                                        points >= 500 ? '45%' : '15%'
                            }}
                        />
                    </div>

                    {/* Nodes */}
                    <div className="flex justify-between relative z-10">
                        {['Select', 'Prime', 'Signature', 'Privé'].map((name, i) => {
                            const nodePoints = [0, 500, 1500, 3000][i];
                            const isAchieved = points >= nodePoints;
                            const isCurrent = currentLevel?.name.toUpperCase().includes(name.toUpperCase());

                            return (
                                <div key={i} className="flex flex-col items-center gap-6">
                                    <div className={`size-5 rounded-full border-2 transition-all duration-700 flex items-center justify-center ${isAchieved
                                        ? 'bg-[#C9A961] border-[#C9A961] shadow-[0_0_15px_#C9A961]'
                                        : 'bg-[#050d0a] border-white/20'
                                        } ${isCurrent ? 'ring-4 ring-[#C9A961]/20 scale-125' : ''}`}>
                                    </div>
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${isAchieved ? 'text-white' : 'text-white/20'
                                        }`}>{name}</span>
                                </div>
                            );
                        })}
                    </div>

                    {nextLevel && (
                        <div className="mt-8 text-center">
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">
                                Faltam <span className="text-[#C9A961]">{Math.max(0, nextLevel.min_points - points)} pontos</span> para o nível <span className="text-white">{nextLevel.name}</span>
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* Quick Actions Grid */}
            <section className="px-6 mb-12 grid grid-cols-2 gap-4 relative z-10">
                <button
                    onClick={() => navigate('/prive/selection')}
                    className="bg-[#0a1611] border border-white/5 p-6 rounded-[32px] text-left space-y-3 group active:scale-95 transition-all"
                >
                    <div className="size-12 bg-white/5 group-hover:bg-[#C9A961]/10 rounded-2xl flex items-center justify-center text-[#C9A961] transition-colors">
                        <span className="material-symbols-outlined !text-2xl">auto_awesome_motion</span>
                    </div>
                    <div>
                        <p className="text-[13px] font-bold">Seleção Privé</p>
                        <p className="text-[9px] text-white/40 font-black uppercase tracking-widest">Meus Ativados</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate('/prive/journey')}
                    className="bg-[#0a1611] border border-white/5 p-6 rounded-[32px] text-left space-y-3 group active:scale-95 transition-all"
                >
                    <div className="size-12 bg-white/5 group-hover:bg-[#C9A961]/10 rounded-2xl flex items-center justify-center text-[#C9A961] transition-colors">
                        <span className="material-symbols-outlined !text-2xl">featured_seasonal_and_gifts</span>
                    </div>
                    <div>
                        <p className="text-[13px] font-bold">Mimo Birthday</p>
                        <p className="text-[9px] text-white/40 font-black uppercase tracking-widest">Seu Presente</p>
                    </div>
                </button>
            </section>

            {/* Experiences Carousel - RENAMED */}
            <section className="mb-14 relative z-10">
                <div className="px-8 flex justify-between items-baseline mb-8">
                    <h3 className="text-2xl font-display font-bold">Experiências Privé</h3>
                    <button onClick={() => navigate('/prive/rewards')} className="text-[10px] font-black text-[#C9A961] uppercase tracking-[0.3em] border-b border-[#C9A961]/20">Ver Todas</button>
                </div>

                <div className="flex overflow-x-auto gap-6 px-8 pb-8 no-scrollbar snap-x">
                    <div onClick={() => navigate('/prive/rewards')} className="flex-shrink-0 w-[240px] snap-center group cursor-pointer">
                        <div className="relative rounded-[40px] overflow-hidden aspect-[4/5] shadow-2xl border border-white/5">
                            <img alt="Reward" className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                            <div className="absolute bottom-8 left-8 right-8">
                                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#C9A961] mb-2">Exclusive</p>
                                <h4 className="text-xl font-display font-bold text-white leading-tight">Botox Aesthetic</h4>
                            </div>
                        </div>
                    </div>

                    <div onClick={() => navigate('/prive/rewards')} className="flex-shrink-0 w-[240px] snap-center group cursor-pointer">
                        <div className="relative rounded-[40px] overflow-hidden aspect-[4/5] shadow-2xl border border-white/5">
                            <img alt="Reward" className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" src="https://images.unsplash.com/photo-1560624052-449f5ddf0c31?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                            <div className="absolute bottom-8 left-8 right-8">
                                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#C9A961] mb-2">Signature</p>
                                <h4 className="text-xl font-display font-bold text-white leading-tight">Limpeza de Pele</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Extrato Button */}
            <section className="px-6 mb-4 relative z-10">
                <button
                    onClick={() => navigate('/prive/history')}
                    className="w-full py-6 rounded-[32px] bg-[#0a1611] border border-white/5 text-[10px] font-black text-white/40 uppercase tracking-[0.4em] flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                >
                    <span className="material-symbols-outlined !text-lg text-[#C9A961]">list_alt</span>
                    Extrato de Pontos
                </button>
            </section>

            {/* Shared Referral Card at the end */}
            <JZReferralCard />

            {/* Background Effects */}
            <div className="fixed top-[-10%] right-[-10%] w-[80%] h-[80%] bg-[#C9A961]/5 rounded-full blur-[150px] pointer-events-none z-[-1]"></div>
            <div className="fixed bottom-[-5%] left-[-5%] w-[60%] h-[60%] bg-[#0f3e29]/10 rounded-full blur-[120px] pointer-events-none z-[-1]"></div>
        </div>
    );
};

export default PriveDashboard;
