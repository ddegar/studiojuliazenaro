
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
            navigate('/prive/rewards');
        } catch (error: any) {
            alert('Erro ao resgatar: ' + error.message);
        } finally {
            setRedeeming(false);
        }
    };

    if (!reward) return <div className="p-8 text-center">Recompensa não encontrada</div>;

    const progress = Math.min(100, (points / reward.points) * 100);
    const canRedeem = points >= reward.points;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 font-sans pb-24">
            {/* Hero Image */}
            <div className="relative h-96 w-full">
                <img src={reward.image} alt={reward.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <button onClick={() => navigate(-1)} className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white">
                    <span className="material-symbols-outlined">arrow_back_ios_new</span>
                </button>
                <div className="absolute top-6 left-1/2 -translate-x-1/2">
                    <h1 className="font-display italic text-xl tracking-tight text-white drop-shadow-md">JZ Privé Club</h1>
                </div>
            </div>

            <main className="-mt-12 relative z-10 bg-background-light dark:bg-background-dark rounded-t-[32px] p-8 space-y-8">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-accent-gold">{reward.category}</span>
                        <div className="flex items-center gap-1 bg-accent-gold/10 px-3 py-1 rounded-full">
                            <span className="material-symbols-outlined text-accent-gold text-sm">stars</span>
                            <span className="text-sm font-bold text-accent-gold">{reward.points} pts</span>
                        </div>
                    </div>
                    <h1 className="font-display text-3xl font-bold leading-tight">{reward.title}</h1>
                </div>

                {/* Progress Bar if not enough points */}
                {!canRedeem && (
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800">
                        <div className="flex justify-between text-xs mb-2 font-medium text-gray-400">
                            <span>Sua caminhada</span>
                            <span>{Math.floor(progress)}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-accent-gold transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-[10px] text-center mt-2 text-gray-400">Faltam {reward.points - points} pontos para resgatar</p>
                    </div>
                )}

                <div className="space-y-4">
                    <h3 className="font-display text-lg font-bold">Sobre a experiência</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-light">
                        {reward.description}
                    </p>
                </div>

                <div className="space-y-4">
                    <h3 className="font-display text-lg font-bold">Regras de Uso</h3>
                    <ul className="space-y-3">
                        {reward.rules.map((rule: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-gray-500 dark:text-gray-400 font-light">
                                <span className="material-symbols-outlined text-accent-gold text-lg shrink-0">check_circle</span>
                                {rule}
                            </li>
                        ))}
                    </ul>
                </div>
            </main>

            {/* Bottom Action */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-gray-100 dark:border-zinc-800 z-50 max-w-[430px] mx-auto">
                <button
                    onClick={handleRedeem}
                    disabled={!canRedeem || redeeming}
                    className={`w-full h-14 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 transition-all
                        ${canRedeem
                            ? 'bg-primary text-white shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                    {redeeming ? 'Processando...' : canRedeem ? 'Resgatar Agora' : 'Saldo Insuficiente'}
                    {!redeeming && canRedeem && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
                </button>
            </div>
        </div>
    );
};

export default PriveRewardDetail;
