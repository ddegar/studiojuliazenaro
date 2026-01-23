
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
        if (user) {
            const { data } = await supabase.from('profiles').select('lash_points').eq('id', user.id).single();
            if (data) setPoints(data.lash_points || 0);
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
        <div className="min-h-screen bg-[#050d0a] text-white font-sans antialiased pb-32 relative overflow-hidden">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 px-6 py-8 flex items-center justify-between bg-[#050d0a]/80 backdrop-blur-xl border-b border-white/5">
                <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#C9A961] shadow-lg">
                    <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
                </button>

                <h1 className="font-serif italic text-xl tracking-tight text-[#C9A961]">JZ Privé Club</h1>

                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-[#C9A961]/20 shadow-inner">
                    <span className="material-symbols-outlined text-[#C9A961] !text-sm">stars</span>
                    <span className="text-sm font-bold text-[#C9A961]">{points.toLocaleString()}</span>
                </div>
            </header>

            <main className="pt-40 px-8 max-w-md mx-auto relative z-10">
                <section className="mb-12">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-[#C9A961] font-black mb-3 text-center">Standardized Collection</p>
                    <h2 className="font-display text-4xl font-bold leading-tight mb-4 text-center">Experiências Privé</h2>
                    <p className="text-white/40 text-sm font-medium leading-relaxed text-center">Seu privilégio traduzido em experiências de luxo e bem-estar.</p>
                </section>

                {/* Categories centered */}
                <div className="flex items-center justify-center gap-8 border-b border-white/5 mb-14 overflow-x-auto no-scrollbar scroll-smooth">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.name)}
                            className={`pb-5 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative whitespace-nowrap ${activeCategory === cat.name ? 'text-[#C9A961]' : 'text-white/20'}`}
                        >
                            {cat.name}
                            {activeCategory === cat.name && (
                                <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#C9A961] shadow-[0_0_10px_#C9A961]"></div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Rewards Grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-12 mb-20">
                    {filteredRewards.length > 0 ? (
                        filteredRewards.map((reward) => (
                            <div key={reward.id} className="flex flex-col group">
                                <div className="relative aspect-[4/5] rounded-[24px] overflow-hidden mb-6 bg-white/5 w-full shadow-2xl group-hover:shadow-[#C9A961]/5 transition-all">
                                    <img alt={reward.title} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" src={reward.image_url} />
                                    {reward.stock <= 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-[2px]">
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest border border-white/30 px-4 py-2 rounded-lg text-center">Coming Soon</span>
                                        </div>
                                    )}
                                    {activating === reward.id && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[4px]">
                                            <div className="size-8 border-2 border-[#C9A961] border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold leading-none mb-2">{reward.title}</h3>
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-3">Special Selection</p>

                                <div className="flex items-center gap-2 mb-6">
                                    <span className="text-sm font-black text-[#C9A961]">{reward.points_cost.toLocaleString()}</span>
                                    <span className="text-[9px] text-white/20 font-black tracking-widest uppercase">pontos</span>
                                </div>

                                <button
                                    onClick={() => handleActivate(reward)}
                                    disabled={reward.stock <= 0 || !!activating || points < reward.points_cost}
                                    className={`w-full py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${points >= reward.points_cost && reward.stock > 0
                                        ? 'bg-white text-zinc-950 shadow-xl active:scale-95 hover:bg-[#C9A961]'
                                        : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                                        }`}
                                >
                                    {points >= reward.points_cost ? 'Ativar Benefício' : 'Saldo Insuficiente'}
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-2 py-32 text-center opacity-30">
                            <span className="material-symbols-outlined text-4xl mb-6 font-light">shopping_bag</span>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Nenhum item disponível</p>
                        </div>
                    )}
                </div>

                {/* Shared Referral Card at the end */}
                <JZReferralCard />
            </main>

            {/* Ambient Background */}
            <div className="fixed top-0 left-0 w-full h-full bg-[#050d0a] z-[-2]"></div>
            <div className="fixed top-[-20%] left-[-20%] w-[80%] h-[80%] bg-[#C9A961]/5 rounded-full blur-[150px] pointer-events-none z-[-1]"></div>
        </div>
    );
};

export default PriveRewards;
