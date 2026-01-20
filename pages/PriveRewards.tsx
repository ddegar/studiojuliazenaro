
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const PriveRewards: React.FC = () => {
    const navigate = useNavigate();
    const [allRewards, setAllRewards] = useState<any[]>([]);
    const [filteredRewards, setFilteredRewards] = useState<any[]>([]);
    const [points, setPoints] = useState(0);
    const [activeCategory, setActiveCategory] = useState('Tratamentos');

    const categories = [
        { id: 'Tratamentos', label: 'Tratamentos' },
        { id: 'Produtos', label: 'Produtos' },
        { id: 'Experiências', label: 'Experiências' },
        { id: 'Parceiros', label: 'Parceiros' }
    ];

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (allRewards.length > 0) {
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

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 font-sans antialiased pb-12">
            <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
                <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-card-dark shadow-sm">
                    <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
                </button>
                <h1 className="font-display italic text-xl tracking-tight text-primary dark:text-gold-light">JZ Privé Club</h1>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-card-dark rounded-full shadow-sm border border-slate-100 dark:border-slate-800">
                    <span className="material-symbols-outlined text-accent-gold text-sm">stars</span>
                    <span className="text-sm font-semibold text-accent-gold">{points.toLocaleString()}</span>
                </div>
            </header>

            <main className="pt-20 px-6 max-w-md mx-auto">
                <section className="mt-8 mb-10">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-accent-gold font-bold mb-2">Catálogo Exclusivo</p>
                    <h2 className="font-display text-4xl leading-tight">Mimos & Experiências</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 font-light leading-relaxed">Transforme seus pontos em momentos de beleza e autocuidado de luxo.</p>
                </section>

                <div className="flex items-center gap-8 border-b border-slate-200 dark:border-white/5 mb-10 overflow-x-auto no-scrollbar">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeCategory === cat.id ? 'text-gold-dark dark:text-gold-light' : 'text-slate-400 dark:text-slate-600'}`}
                        >
                            {cat.label}
                            {activeCategory === cat.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-dark dark:bg-gold-light"></div>}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                    {filteredRewards.length > 0 ? (
                        filteredRewards.map((reward) => (
                            <button
                                key={reward.id}
                                className={`flex flex-col group text-left ${reward.stock <= 0 ? 'opacity-60' : ''}`}
                                onClick={() => reward.stock > 0 && navigate(`/prive/rewards/${reward.id}`)}
                                disabled={reward.stock <= 0}
                            >
                                <div className="relative aspect-[4/5] rounded-[24px] overflow-hidden mb-4 bg-slate-100 dark:bg-zinc-900 w-full shadow-sm">
                                    <img alt={reward.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" src={reward.image_url} />
                                    {reward.points_cost <= points && reward.stock > 0 && (
                                        <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 dark:bg-gold-dark/80 backdrop-blur rounded-lg shadow-sm">
                                            <span className="text-[8px] font-black tracking-widest text-gold-dark dark:text-white uppercase italic">Disponível</span>
                                        </div>
                                    )}
                                    {reward.stock <= 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest border border-white px-3 py-1">Esgotado</span>
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-display text-xl leading-tight mb-1">{reward.title}</h3>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 italic">{reward.category}</p>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-bold text-gold-dark dark:text-gold-light">{reward.points_cost.toLocaleString()}</span>
                                    <span className="text-[10px] text-gold-dark/60 dark:text-gold-light/60 font-black tracking-widest uppercase">pts</span>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="col-span-2 py-20 text-center opacity-40">
                            <span className="material-symbols-outlined text-4xl mb-3">card_giftcard</span>
                            <p className="text-sm italic">Nenhum mimo nesta categoria no momento.</p>
                        </div>
                    )}
                </div>

                <div className="mt-16 p-8 rounded-[32px] bg-emerald-900 dark:bg-emerald-950 text-white relative overflow-hidden shadow-2xl">
                    <div className="relative z-10">
                        <h4 className="font-display text-2xl mb-2">Indique e Ganhe</h4>
                        <p className="text-sm text-emerald-100/80 mb-8 max-w-[220px] font-light leading-relaxed">Sua jornada de beleza fica melhor com amigas. Ganhe 200 pontos por nova indicação.</p>
                        <button onClick={() => navigate('/profile/refer')} className="bg-gold-dark text-white px-8 py-3.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg shadow-black/20 hover:scale-105 transition-transform active:scale-95">
                            Indicar Agora
                        </button>
                    </div>
                    <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-white/5 text-[180px] rotate-12 select-none group-hover:scale-110 transition-transform duration-1000">card_giftcard</span>
                </div>
            </main>
        </div>
    );
};

export default PriveRewards;
