
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
        <div className="flex flex-col h-full bg-background-dark text-white overflow-hidden selection:bg-accent-gold/20 relative">
            {/* Dynamic Background Elements */}
            <div className="fixed inset-0 pointer-events-none opacity-15 overflow-hidden">
                <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/20 blur-[120px] animate-float"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/20 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <header className="sticky top-0 z-[100] premium-nav-dark p-6 border-b border-white/5 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate('/home')} className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-accent-gold hover:bg-white/10 active:scale-90 transition-all">
                        <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
                    </button>
                    <div className="text-center">
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mb-1">Loyalty & Excellence</p>
                        <h2 className="font-display italic text-xl leading-tight text-white tracking-tight">JZ Privé Club</h2>
                    </div>
                    <button onClick={() => navigate('/profile')} className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-accent-gold hover:bg-white/10 active:scale-90 transition-all overflow-hidden ring-1 ring-white/10">
                        <img src={`https://ui-avatars.com/api/?name=${userName}&background=122b22&color=c9a961`} className="w-full h-full scale-110" alt="" />
                    </button>
                </div>
            </header>

            <main className="relative z-10 flex-1 p-8 overflow-y-auto no-scrollbar pb-32">
                <div className="space-y-1 mb-10 px-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-px w-6 bg-accent-gold/40"></div>
                        <p className="text-[10px] font-black uppercase text-accent-gold tracking-[0.5em] font-outfit">Member Status</p>
                    </div>
                    <h1 className="text-5xl font-display font-bold leading-none tracking-tighter">
                        Olá, <br /> <span className="italic text-accent-gold font-light">{userName}</span>.
                    </h1>
                </div>

                {/* Prestige Balance Card */}
                <section className="mb-12 animate-reveal">
                    <div className={`relative rounded-[48px] p-10 shadow-hugest overflow-hidden border border-white/5 group ${tierStyle.bg.includes('zinc-950') ? 'bg-zinc-950 border-white/10' : tierStyle.bg}`}>
                        {/* Decorative Elements inside card */}
                        <div className="absolute top-0 right-0 p-8 opacity-10 blur-sm group-hover:blur-none transition-all duration-[2s]">
                            <span className="material-symbols-outlined !text-7xl text-white">loyalty</span>
                        </div>

                        <div className="flex justify-between items-start mb-10 relative z-10">
                            <div className="space-y-1">
                                <p className={`text-[10px] font-black uppercase tracking-[0.3em] font-outfit opacity-40 ${tierStyle.bg.includes('C9A961') ? 'text-zinc-950/60' : 'text-white'}`}>Seu Saldo Ativo</p>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-6xl font-display font-medium leading-none tracking-tighter ${tierStyle.bg.includes('C9A961') ? 'text-zinc-950' : 'text-white'}`}>{points.toLocaleString()}</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest opacity-40 ${tierStyle.bg.includes('C9A961') ? 'text-zinc-950/60' : 'text-white'}`}>Credits</span>
                                </div>
                            </div>
                            <div className={`px-5 h-10 rounded-2xl flex items-center justify-center border font-outfit text-[9px] font-black uppercase tracking-[0.2em] shadow-lg ${tierStyle.bg.includes('C9A961') ? 'bg-zinc-950 text-white border-zinc-950' : 'bg-white/10 border-white/10 text-white backdrop-blur-md'}`}>
                                {tierStyle.label}
                            </div>
                        </div>

                        <div className="flex justify-between items-end relative z-10">
                            <div className="space-y-1">
                                <p className={`text-[9px] font-black uppercase tracking-widest font-outfit opacity-40 ${tierStyle.bg.includes('C9A961') ? 'text-zinc-950/60' : 'text-white'}`}>Membro Desde</p>
                                <p className={`text-base font-display italic ${tierStyle.bg.includes('C9A961') ? 'text-zinc-950' : 'text-white'}`}>{memberSince || '---'}</p>
                            </div>
                            <div className="text-right space-y-1">
                                <p className={`text-[9px] font-black uppercase tracking-widest font-outfit opacity-40 ${tierStyle.bg.includes('C9A961') ? 'text-zinc-950/60' : 'text-white'}`}>Protocolo</p>
                                <p className={`text-base font-outfit font-black ${tierStyle.bg.includes('C9A961') ? 'text-zinc-950' : 'text-white'}`}>#{userName.slice(0, 1).toUpperCase()}{points}</p>
                            </div>
                        </div>

                        {/* Background Aura */}
                        <div className="absolute -bottom-20 -left-20 size-64 bg-white/10 blur-[80px] rounded-full pointer-events-none"></div>
                    </div>
                </section>

                {/* Glowing Journey Track */}
                <section className="bg-surface-dark/40 border border-white/5 rounded-[48px] p-10 mb-12 shadow-hugest animate-reveal stagger-1">
                    <div onClick={() => navigate('/prive/journey')} className="flex justify-between items-center mb-10 group cursor-pointer px-2">
                        <div className="space-y-1">
                            <h3 className="text-xl font-display italic text-white group-hover:text-accent-gold transition-colors">Jornada de Excelência</h3>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] font-outfit text-white/20">The Evolution of Care</p>
                        </div>
                        <button className="size-12 rounded-full border border-white/10 flex items-center justify-center text-accent-gold group-hover:scale-110 group-hover:bg-accent-gold/10 transition-all">
                            <span className="material-symbols-outlined !text-xl group-hover:translate-x-1 transition-transform">east</span>
                        </button>
                    </div>

                    <div className="relative pt-6 px-1 mb-6">
                        {/* High-End Glass Track */}
                        <div className="absolute top-[30px] left-0 right-0 h-[2px] bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary via-accent-gold to-white shadow-[0_0_20px_#C9A961] transition-all duration-[2s] cubic-bezier(0.4, 0, 0.2, 1)"
                                style={{
                                    width: points >= 3000 ? '100%' :
                                        points >= 1500 ? '75%' :
                                            points >= 500 ? '45%' : '15%'
                                }}
                            />
                        </div>

                        <div className="flex justify-between relative z-10">
                            {['Select', 'Prime', 'Signature', 'Privé'].map((name, i) => {
                                const nodePoints = [0, 500, 1500, 3000][i];
                                const isAchieved = points >= nodePoints;
                                const isCurrent = currentLevel?.name.toUpperCase().includes(name.toUpperCase());

                                return (
                                    <div key={i} className="flex flex-col items-center gap-6 group/node">
                                        <div className={`size-6 rounded-full border transition-all duration-1000 flex items-center justify-center ${isAchieved
                                            ? 'bg-accent-gold border-accent-gold shadow-[0_0_20px_#C9A961]'
                                            : 'bg-background-dark border-white/10'
                                            } ${isCurrent ? 'ring-8 ring-accent-gold/20 scale-125' : ''}`}>
                                            {isAchieved && (
                                                <span className="material-symbols-outlined !text-[12px] text-primary font-black">check</span>
                                            )}
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest font-outfit transition-colors duration-700 ${isAchieved ? 'text-white group-hover/node:text-accent-gold' : 'text-white/10'
                                            }`}>{name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {nextLevel && (
                        <div className="bg-white/2 border border-white/5 p-6 rounded-3xl text-center space-y-2">
                            <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] font-outfit">Progresso de Categoria</p>
                            <p className="text-sm font-display italic text-white/80">
                                Oculte <span className="text-accent-gold font-bold">{Math.max(0, nextLevel.min_points - points)} credits</span> para despertar o nível <span className="text-white font-bold">{nextLevel.name}</span>
                            </p>
                        </div>
                    )}
                </section>

                {/* Elite Actions Grid */}
                <section className="grid grid-cols-2 gap-6 mb-12 animate-reveal stagger-2">
                    {[
                        { id: 'selection', label: 'Seleção Privé', sub: 'Serviços Elite', icon: 'auto_awesome_motion', path: '/prive/selection' },
                        { id: 'birthday', label: 'Ritual Birthday', sub: 'Seu Presente', icon: 'featured_seasonal_and_gifts', path: '/prive/journey' }
                    ].map(action => (
                        <button
                            key={action.id}
                            onClick={() => navigate(action.path)}
                            className="group bg-surface-dark/40 border border-white/5 p-8 rounded-[48px] text-left space-y-5 hover:border-accent-gold/20 transition-all duration-500 shadow-huge active:scale-95"
                        >
                            <div className="size-14 bg-white/5 group-hover:bg-accent-gold/10 border border-white/10 group-hover:border-accent-gold/20 rounded-[20px] flex items-center justify-center text-accent-gold transition-all duration-500 group-hover:rotate-12">
                                <span className="material-symbols-outlined !text-2xl">{action.icon}</span>
                            </div>
                            <div>
                                <p className="text-base font-display italic text-white group-hover:text-accent-gold transition-colors">{action.label}</p>
                                <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.22em] font-outfit italic">{action.sub}</p>
                            </div>
                        </button>
                    ))}
                </section>

                {/* Experiences Narrative */}
                <section className="mb-16 animate-reveal stagger-3">
                    <div className="flex justify-between items-baseline mb-8 px-2">
                        <div className="space-y-1">
                            <h3 className="text-3xl font-display font-bold leading-tight">Experiências Privé</h3>
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 font-outfit">Exclusive High-End Rewards</p>
                        </div>
                        <button onClick={() => navigate('/prive/rewards')} className="text-[10px] font-black text-accent-gold uppercase tracking-[0.3em] border-b border-accent-gold/20 pb-1 hover:text-white transition-colors">Ver Catálogo</button>
                    </div>

                    <div className="flex overflow-x-auto gap-8 px-2 pb-10 no-scrollbar snap-x">
                        {[
                            {
                                id: 1,
                                name: 'Botox Aesthetic',
                                tier: 'Exclusive',
                                img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
                            },
                            {
                                id: 2,
                                name: 'Limpeza de Pele Deep',
                                tier: 'Signature',
                                img: 'https://images.unsplash.com/photo-1560624052-449f5ddf0c31?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
                            }
                        ].map(reward => (
                            <div key={reward.id} onClick={() => navigate('/prive/rewards')} className="flex-shrink-0 w-[280px] snap-center group cursor-pointer">
                                <div className="relative rounded-[56px] overflow-hidden aspect-[4/5] shadow-hugest border border-white/5">
                                    <img alt="Reward" className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110" src={reward.img} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/20 to-transparent"></div>
                                    <div className="absolute bottom-10 left-10 right-10 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-px w-4 bg-accent-gold/60"></div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-accent-gold font-outfit">{reward.tier}</p>
                                        </div>
                                        <h4 className="text-2xl font-display italic text-white leading-tight group-hover:text-accent-gold transition-colors">{reward.name}</h4>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Journal of Points */}
                <section className="animate-reveal stagger-4">
                    <button
                        onClick={() => navigate('/prive/history')}
                        className="group relative w-full h-24 rounded-[40px] bg-white/2 border border-white/5 flex items-center justify-center gap-5 transition-all duration-500 hover:border-accent-gold/20 hover:bg-white/5 active:scale-95"
                    >
                        <div className="size-14 rounded-[22px] bg-white/5 border border-white/10 flex items-center justify-center text-accent-gold group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined !text-2xl">list_alt</span>
                        </div>
                        <div className="text-left">
                            <p className="text-base font-display italic text-white group-hover:text-accent-gold transition-colors">Extrato de Credits</p>
                            <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em] font-outfit">Journal of Performance</p>
                        </div>
                        <div className="absolute right-8 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500">
                            <span className="material-symbols-outlined text-accent-gold !text-xl">chevron_right</span>
                        </div>
                    </button>
                </section>

                {/* Integrated Referral */}
                <div className="mt-16 animate-reveal stagger-5">
                    <JZReferralCard />
                </div>
            </main>

            {/* Fixed Visual Safe Area */}
            <div className="fixed bottom-0 left-0 w-full h-12 bg-black/40 backdrop-blur-3xl border-t border-white/5 pointer-events-none z-[130]"></div>
        </div>
    );
};

export default PriveDashboard;
