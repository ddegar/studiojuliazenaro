
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';

// Mock data matching PriveRewards
const REWARDS_DATA: Record<string, any> = {
    '1': {
        id: '1',
        title: 'Aplicação de Botox',
        category: 'Aesthetic Treatment',
        points: 800,
        image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        description: 'Suavize linhas de expressão e renove seu olhar com nossa aplicação de toxina botulínica premium. Procedimento realizado por biomédica esteta especializada.',
        rules: [
            'Agendamento prévio obrigatório.',
            'Válido para 1 região (testa, glabelas ou pés de galinha).',
            'Cancelamento com 24h de antecedência.'
        ]
    },
    '2': {
        id: '2',
        title: 'Limpeza de Pele Deep',
        category: 'Facial Health',
        points: 450,
        image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        description: 'Protocolo completo de higienização profunda, extração, alta frequência e máscara calmante. Ideal para renovar o viço e saúde da pele.',
        rules: [
            'Tempo de procedimento: 1h30.',
            'Evitar exposição solar intensa após o procedimento.',
        ]
    },
    '3': {
        id: '3',
        title: 'Massagem Relaxante',
        category: 'Body & Soul',
        points: 600,
        image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        description: 'Técnicas manuais suaves para alívio de tensão e estresse. Ambiente climatizado com aromaterapia para experiência sensorial completa.',
        rules: [
            'Duração: 60 minutos.',
            'Chegar com 10 minutos de antecedência.',
        ]
    },
    '4': {
        id: '4',
        title: 'Micropigmentação',
        category: 'Signature Looks',
        points: 1500,
        image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
        description: 'Realce suas sobrancelhas com naturalidade. Técnica fio a fio ou shadow, personalizada para o seu rosto.',
        rules: [
            'Inclui retoque de 30 dias.',
            'Avaliação prévia inclusa.',
        ]
    }
};

const PriveRewardDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [points, setPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [redeeming, setRedeeming] = useState(false);

    const reward = id ? REWARDS_DATA[id] : null;

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('lash_points').eq('id', user.id).single();
            if (data) setPoints(data.lash_points || 0);
        }
        setLoading(false);
    };

    const handleRedeem = async () => {
        if (!reward) return;

        if (points < reward.points) {
            alert("Saldo insuficiente para este resgate.");
            return;
        }

        if (!window.confirm(`Confirmar resgate de "${reward.title}" por ${reward.points} pontos?`)) return;

        setRedeeming(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const newPoints = points - reward.points;
            const { error } = await supabase.from('profiles').update({ lash_points: newPoints }).eq('id', user.id);

            if (error) throw error;

            await supabase.from('point_transactions').insert({
                user_id: user.id,
                amount: -reward.points,
                source: 'REDEMPTION',
                description: `Resgate: ${reward.title}`
            });

            setPoints(newPoints);
            alert(`Resgate confirmado! ✨ Um voucher foi gerado para você.`);
            navigate('/history');
        } catch (error: any) {
            alert('Erro ao resgatar: ' + error.message);
        } finally {
            setRedeeming(false);
        }
    };

    if (!reward) return <div className="p-8 text-center bg-background-light min-h-screen flex items-center justify-center font-display italic text-primary text-xl">Recompensa não encontrada</div>;

    const progress = Math.min(100, (points / reward.points) * 100);
    const canRedeem = points >= reward.points;

    return (
        <div className="min-h-screen bg-background-light text-primary font-outfit pb-40 relative overflow-x-hidden animate-reveal">
            {/* Dynamic Background Engine */}
            <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/40 blur-[100px] animate-float"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/20 blur-[80px] animate-float" style={{ animationDelay: '1.5s' }}></div>
            </div>

            {/* Cinematic Hero */}
            <div className="relative h-[50vh] w-full overflow-hidden">
                <img src={reward.image} alt={reward.title} className="w-full h-full object-cover animate-reveal scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-background-light via-transparent to-black/30"></div>

                <header className="absolute top-0 left-0 right-0 p-8 pt-12 flex justify-between items-center z-[50]">
                    <button onClick={() => navigate(-1)} className="size-11 rounded-full premium-blur border border-white/40 flex items-center justify-center text-white shadow-xl active:scale-90 transition-all">
                        <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
                    </button>
                    <div className="premium-blur px-5 py-2 rounded-2xl border border-white/40 shadow-xl">
                        <h1 className="font-display italic text-sm tracking-[0.1em] text-white">Privé Rewards</h1>
                    </div>
                </header>

                <div className="absolute bottom-20 left-8 z-20">
                    <div className="flex items-center gap-3">
                        <div className="size-1 h-12 bg-accent-gold rounded-full"></div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.4em] leading-none">Vantagem Exclusiva</p>
                            <p className="text-xl font-display italic text-white leading-none">Catálogo de Privilégios</p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="-mt-16 relative z-10 bg-background-light/80 backdrop-blur-xl rounded-t-[56px] px-8 pt-14 space-y-12 min-h-[50vh] border-t border-white shadow-hugest selection:bg-accent-gold/20">
                <div className="max-w-xl mx-auto space-y-8">
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <span className="text-[9px] font-black tracking-[0.4em] uppercase text-accent-gold">{reward.category}</span>
                            <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-2xl border border-primary/5">
                                <span className="material-symbols-outlined text-accent-gold !text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                                <span className="text-sm font-black text-primary uppercase tracking-widest">{reward.points} pontos</span>
                            </div>
                        </div>
                        <h2 className="font-display text-4xl font-bold leading-tight italic text-primary">{reward.title}</h2>
                    </div>

                    {/* Elite Progress Journey */}
                    {!canRedeem && (
                        <div className="bg-white/40 rounded-[32px] p-8 border border-white shadow-sm space-y-6 relative overflow-hidden group">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/30">Progresso de Conquista</p>
                                    <p className="text-lg font-display italic text-primary">{Math.floor(progress)}% Concluído</p>
                                </div>
                                <p className="text-[10px] font-black text-accent-gold uppercase tracking-widest">Faltam {reward.points - points} pts</p>
                            </div>
                            <div className="h-3 w-full bg-primary/5 rounded-full overflow-hidden p-[2px] border border-primary/5">
                                <div className="h-full bg-accent-gold rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(201,169,97,0.4)]" style={{ width: `${progress}%` }}></div>
                            </div>
                            <div className="absolute top-0 right-[-20%] w-[40%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] animate-shimmer"></div>
                        </div>
                    )}

                    <div className="space-y-12">
                        <section className="space-y-4">
                            <div className="flex items-center gap-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/30">Narrativa</h3>
                                <div className="h-px w-full bg-gradient-to-r from-primary/10 to-transparent"></div>
                            </div>
                            <p className="text-base text-primary/60 leading-relaxed font-outfit font-light italic px-2">
                                {reward.description}
                            </p>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/30 text-nowrap">Protocolo de Uso</h3>
                                <div className="h-px w-full bg-gradient-to-r from-primary/10 to-transparent"></div>
                            </div>
                            <ul className="space-y-4 px-2">
                                {reward.rules.map((rule: string, i: number) => (
                                    <li key={i} className="flex items-center gap-5 group">
                                        <div className="size-10 rounded-xl bg-accent-gold/5 flex items-center justify-center text-accent-gold shrink-0 border border-accent-gold/10 group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined !text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                                        </div>
                                        <p className="text-[13px] text-primary/50 font-medium tracking-wide leading-snug">{rule}</p>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>
                </div>
            </main>

            {/* Elite Action Bar */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[450px] z-[100]">
                <div className="premium-blur-light rounded-[32px] border border-white shadow-hugest px-8 py-5 flex items-center justify-between gap-10">
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/30 leading-none mb-1">Seu Saldo</p>
                        <p className="text-2xl font-display font-bold text-accent-gold leading-none">{points} <span className="text-[10px] text-primary/40 not-italic uppercase tracking-widest ml-1">pts</span></p>
                    </div>
                    <button
                        onClick={handleRedeem}
                        disabled={!canRedeem || redeeming}
                        className={`group relative h-16 px-10 rounded-[24px] overflow-hidden shadow-2xl active:scale-95 transition-all
                            ${canRedeem
                                ? 'bg-primary text-white'
                                : 'bg-primary/10 text-primary/20 pointer-events-none'}`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s]"></div>
                        <span className={`relative z-10 text-[11px] font-black uppercase tracking-[0.4em] transition-colors flex items-center gap-3
                            ${canRedeem ? 'text-accent-gold group-hover:text-white' : 'text-primary/20'}`}>
                            {redeeming ? 'Processando...' : canRedeem ? 'Resgatar' : 'Bloqueado'}
                            <span className="material-symbols-outlined !text-lg">diamond</span>
                        </span>
                    </button>
                </div>
            </div>

            {/* Visual Safe Area Inset */}
            <div className="fixed bottom-0 left-0 w-full h-8 bg-background-light pointer-events-none z-[90]"></div>
        </div>
    );
};

export default PriveRewardDetail;
