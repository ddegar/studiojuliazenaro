
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import JZReferralCard from '../components/JZReferralCard';

const PriveRewards: React.FC = () => {
    const navigate = useNavigate();
    const [allRewards, setAllRewards] = useState<any[]>([]);
    const [filteredRewards, setFilteredRewards] = useState<any[]>([]);
    const [points, setPoints] = useState(0);
    const [categories, setCategories] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState<string | null>(null);
    const [selectedReward, setSelectedReward] = useState<any | null>(null);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchData(), fetchCategories()]);
            setLoading(false);
        };
        init();
    }, []);

    const fetchCategories = async () => {
        const { data } = await supabase
            .from('loyalty_categories')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (data && data.length > 0) {
            setCategories(data);
            setActiveCategory(data[0].name);
        }
    };

    useEffect(() => {
        if (allRewards.length > 0 && activeCategory) {
            const filtered = allRewards.filter(r => r.category === activeCategory);
            setFilteredRewards(filtered);
        }
    }, [activeCategory, allRewards]);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        const [profileRes, configRes] = await Promise.all([
            user ? supabase.from('profiles').select('lash_points').eq('id', user.id).maybeSingle() : Promise.resolve({ data: null }),
            supabase.from('studio_config').select('value').eq('key', 'prive_enabled').maybeSingle()
        ]);

        if (configRes.data?.value === 'false') {
            navigate('/prive');
            return;
        }

        if (profileRes.data) {
            setPoints(profileRes.data.lash_points || 0);
        }

        const { data: rewardsData } = await supabase
            .from('loyalty_rewards')
            .select('*')
            .eq('is_active', true)
            .order('points_cost');

        if (rewardsData) {
            setAllRewards(rewardsData);
        }
    };

    const handleActivate = async (reward: any) => {
        if (points < reward.points_cost) {
            alert('Saldo insuficiente para ativar este benefício.');
            return;
        }

        setActivating(reward.id);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. CHECK IF ALREADY ACTIVATED (BEFORE any point deduction)
            const { data: existingBenefit } = await supabase
                .from('activated_benefits')
                .select('id')
                .eq('user_id', user.id)
                .eq('reward_id', reward.id)
                .is('used_at', null) // Only check active (unused) benefits
                .single();

            if (existingBenefit) {
                alert('Você já possui este benefício ativo! Acesse sua Seleção Privé para utilizá-lo.');
                setActivating(null);
                return;
            }

            // 2. Check current points again to be safe
            const { data: profile } = await supabase.from('profiles').select('lash_points').eq('id', user.id).single();
            if (!profile || profile.lash_points < reward.points_cost) {
                alert('Saldo insuficiente.');
                setActivating(null);
                return;
            }

            // 3. Insert into activated_benefits
            const { error: activateError } = await supabase
                .from('activated_benefits')
                .insert({
                    user_id: user.id,
                    reward_id: reward.id,
                    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });

            if (activateError) throw activateError;

            // 3. Subtract points
            const newPoints = profile.lash_points - reward.points_cost;
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ lash_points: newPoints })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // 4. Log transaction
            await supabase.from('lash_points').insert({
                client_id: user.id,
                points: -reward.points_cost,
                source: `Resgate: ${reward.title}`,
                reference_id: reward.id
            });

            setPoints(newPoints);
            alert('Benefício ativado com sucesso! Ele já está disponível na sua Seleção Privé.');
            navigate('/prive/selection');
        } catch (error) {
            console.error('Error activating benefit:', error);
            alert('Ocorreu um erro ao ativar o benefício. Tente novamente.');
        } finally {
            setActivating(null);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050d0a] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-[#C9A961] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#C9A961] font-display font-medium animate-pulse text-xs uppercase tracking-widest text-center">Abrindo Catálogo de Luxo...</p>
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
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mb-1">Elite Rewards Catalog</p>
                        <h2 className="font-display italic text-xl leading-tight text-white tracking-tight">Seleção Privé</h2>
                    </div>
                    <div className="flex items-center gap-2 px-4 h-10 bg-white/5 rounded-full border border-accent-gold/20 shadow-lg">
                        <span className="material-symbols-outlined text-accent-gold !text-sm">stars</span>
                        <span className="text-sm font-bold text-accent-gold font-outfit">{points.toLocaleString()}</span>
                    </div>
                </div>

                {/* Premium Category Filter */}
                <div className="flex items-center justify-between px-2 overflow-x-auto no-scrollbar scroll-smooth gap-8">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.name)}
                            className={`pb-3 text-[10px] font-black uppercase tracking-[0.3em] font-outfit transition-all relative whitespace-nowrap ${activeCategory === cat.name ? 'text-accent-gold' : 'text-white/20 hover:text-white/40'}`}
                        >
                            {cat.name}
                            {activeCategory === cat.name && (
                                <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-accent-gold shadow-[0_0_10px_#C9A961]"></div>
                            )}
                        </button>
                    ))}
                </div>
            </header>

            <main className="relative z-10 flex-1 p-8 overflow-y-auto no-scrollbar pb-40">
                <div className="text-center space-y-4 mb-16 animate-reveal">
                    <div className="flex items-center justify-center gap-4 mb-2">
                        <span className="h-px w-8 bg-accent-gold/40"></span>
                        <p className="text-[10px] font-black uppercase text-accent-gold tracking-[0.5em] font-outfit">Exclusive Collection</p>
                        <span className="h-px w-8 bg-accent-gold/40"></span>
                    </div>
                    <h1 className="text-4xl font-display font-bold leading-none tracking-tighter">
                        Experiências <br /><span className="italic text-accent-gold font-light">Especialmente para Você</span>.
                    </h1>
                </div>

                {/* Rewards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredRewards.length > 0 ? (
                        filteredRewards.map((reward, idx) => (
                            <div key={reward.id} className="group animate-reveal" style={{ animationDelay: `${idx * 0.1}s` }}>
                                <div className="relative aspect-[4/5] sm:aspect-auto sm:h-[420px] rounded-[48px] overflow-hidden bg-surface-dark border border-white/5 shadow-hugest group-hover:border-accent-gold/30 transition-all duration-700">
                                    <img alt={reward.title} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" src={reward.image_url} />

                                    {/* Availability Overlays */}
                                    {reward.stock <= 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-background-dark/80 backdrop-blur-md">
                                            <div className="text-center space-y-2">
                                                <span className="material-symbols-outlined !text-4xl text-white/20">lock_clock</span>
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Breve em Estoque</p>
                                            </div>
                                        </div>
                                    )}

                                    {activating === reward.id && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-background-dark/60 backdrop-blur-xl">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="size-12 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
                                                <p className="text-[10px] font-black text-accent-gold uppercase tracking-widest animate-pulse">Ativando Privilégio...</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Content Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/40 to-transparent flex flex-col justify-end p-8">
                                        <div className="space-y-6">
                                            <div className="space-y-1.5">
                                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-accent-gold font-outfit italic opacity-60">Elite Reward</p>
                                                <h3 className="text-2xl font-display font-medium text-white group-hover:text-accent-gold transition-colors line-clamp-2 leading-tight">{reward.title}</h3>

                                                <button
                                                    onClick={() => setSelectedReward(reward)}
                                                    className="flex items-center gap-2 text-[10px] font-black text-accent-gold/60 uppercase tracking-widest pt-1 hover:text-white transition-colors"
                                                >
                                                    Ver Detalhes <span className="material-symbols-outlined !text-sm">open_in_new</span>
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl font-outfit font-black text-white">{reward.points_cost.toLocaleString()}</span>
                                                    <span className="text-[9px] text-white/40 font-black tracking-widest uppercase font-outfit">JZ Balance</span>
                                                </div>

                                                <button
                                                    onClick={() => handleActivate(reward)}
                                                    disabled={reward.stock <= 0 || !!activating || points < reward.points_cost}
                                                    className={`size-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-huge shrink-0 ${points >= reward.points_cost && reward.stock > 0
                                                        ? 'bg-accent-gold text-primary hover:bg-white active:scale-90'
                                                        : 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed'
                                                        }`}
                                                >
                                                    <span className="material-symbols-outlined !text-xl">
                                                        {points >= reward.points_cost ? 'bolt' : 'lock'}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-32 text-center opacity-10 space-y-6">
                            <span className="material-symbols-outlined !text-6xl font-light">shopping_bag</span>
                            <p className="text-xl font-display italic tracking-[0.2em] uppercase">O catálogo está sendo<br />curado para você.</p>
                        </div>
                    )}
                </div>

                <div className="mt-20">
                    <JZReferralCard variant="dark" />
                </div>
            </main>

            {/* Details Modal */}
            {selectedReward && (
                <div className="fixed inset-0 z-[200] bg-background-dark/80 backdrop-blur-xl flex items-center justify-center p-6 animate-reveal" onClick={() => setSelectedReward(null)}>
                    <div className="bg-surface-dark w-full max-w-lg border border-white/10 rounded-[56px] overflow-hidden relative shadow-hugest max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        {/* Preview Image in Modal */}
                        <div className="relative h-64 shrink-0">
                            <img src={selectedReward.image_url} className="w-full h-full object-cover" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-surface-dark to-transparent"></div>
                            <button
                                onClick={() => setSelectedReward(null)}
                                className="absolute top-6 right-6 size-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/60 hover:text-white transition-all"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-10 space-y-8 overflow-y-auto no-scrollbar">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-px w-6 bg-accent-gold/40"></div>
                                    <p className="text-[10px] font-black uppercase text-accent-gold tracking-[0.4em] font-outfit italic">Details Dossier</p>
                                </div>
                                <h2 className="text-4xl font-display font-medium text-white tracking-tight leading-tight">{selectedReward.title}</h2>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm font-outfit font-light text-white/60 leading-relaxed italic">
                                    {selectedReward.description || 'Mimo exclusivo Julia Zenaro Studio. Uma experiência pensada para elevar sua jornada Privé.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-[32px] bg-white/5 border border-white/5">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">Requisito</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-display text-white">{selectedReward.points_cost.toLocaleString()}</span>
                                        <span className="text-[8px] font-black text-accent-gold uppercase tracking-[0.2em]">JZ Balance</span>
                                    </div>
                                </div>
                                <div className="p-6 rounded-[32px] bg-white/5 border border-white/5">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">Status</p>
                                    <div className="flex items-center gap-2">
                                        <div className={`size-1.5 rounded-full ${selectedReward.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${selectedReward.stock > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {selectedReward.stock > 0 ? 'Disponível' : 'Esgotado'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    handleActivate(selectedReward);
                                    setSelectedReward(null);
                                }}
                                disabled={selectedReward.stock <= 0 || !!activating || points < selectedReward.points_cost}
                                className="w-full h-20 bg-accent-gold text-primary rounded-[32px] font-black text-[10px] uppercase tracking-[0.4em] shadow-huge hover:bg-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4"
                            >
                                <span className="material-symbols-outlined !text-2xl">bolt</span>
                                Ativar Experiência Privé
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fixed Visual Safe Area */}
            <div className="fixed bottom-0 left-0 w-full h-12 bg-black/40 backdrop-blur-3xl border-t border-white/5 pointer-events-none z-[130]"></div>
        </div>
    );
};

export default PriveRewards;
