
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import JZReferralCard from '../components/JZReferralCard';

interface ActivatedBenefit {
    id: string;
    activated_at: string;
    expires_at: string;
    reward: {
        title: string;
        image_url: string;
    };
}

const PriveSelection: React.FC = () => {
    const navigate = useNavigate();
    const [benefits, setBenefits] = useState<ActivatedBenefit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBenefits = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('activated_benefits')
                    .select(`
                        id,
                        activated_at,
                        expires_at,
                        reward:loyalty_rewards (title, image_url)
                    `)
                    .eq('user_id', user.id)
                    .is('used_at', null)
                    .gt('expires_at', new Date().toISOString())
                    .order('expires_at', { ascending: true });

                if (error) throw error;
                // @ts-ignore
                setBenefits(data || []);
            } catch (error) {
                console.error('Error fetching activated benefits:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBenefits();
    }, []);

    const calculateDaysLeft = (expiry: string) => {
        const diff = new Date(expiry).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050d0a] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-[#C9A961] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050d0a] text-white font-sans antialiased pb-32 relative overflow-hidden">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 px-6 py-8 flex items-center justify-between bg-[#050d0a]/80 backdrop-blur-xl border-b border-white/5">
                <button onClick={() => navigate('/prive')} className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-[#C9A961]">
                    <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
                </button>
                <h1 className="font-serif italic text-xl tracking-tight text-[#C9A961]">JZ Privé Club</h1>
                <div className="size-10"></div>
            </header>

            <main className="pt-40 px-8 max-w-md mx-auto relative z-10">
                <section className="mb-12">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-[#C9A961] font-black mb-3 text-center">Your Active Privileges</p>
                    <h2 className="font-display text-4xl font-bold leading-tight mb-4 text-center">Seleção Privé</h2>
                    <p className="text-white/40 text-sm font-medium leading-relaxed text-center">Uma seleção especial preparada para você. Aproveite seus benefícios antes que expirem.</p>
                </section>

                <div className="space-y-6 mb-20">
                    {benefits.length > 0 ? benefits.map((benefit) => (
                        <div key={benefit.id} className="bg-[#0a1611] rounded-[48px] p-2 border border-white/5 flex flex-col shadow-2xl relative overflow-hidden group">
                            <div className="relative aspect-[16/10] rounded-[42px] overflow-hidden">
                                <img alt={benefit.reward.title} src={benefit.reward.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                <div className="absolute top-6 right-6 px-4 py-2 bg-[#C9A961] text-[#050d0a] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                                    {calculateDaysLeft(benefit.expires_at)} Dias restantes
                                </div>
                            </div>

                            <div className="p-8 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold mb-1">{benefit.reward.title}</h3>
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-none mt-1">Benefício Ativo</p>
                                </div>
                                <button
                                    onClick={() => {
                                        alert('Para utilizar este benefício, informe seu JZ ID no momento do atendimento.');
                                    }}
                                    className="size-14 bg-white text-zinc-950 rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 transition-transform active:scale-95"
                                >
                                    <span className="material-symbols-outlined !text-3xl">qr_code_2</span>
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="py-20 text-center space-y-6 opacity-30">
                            <div className="size-24 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
                                <span className="material-symbols-outlined !text-5xl font-light">auto_awesome_motion</span>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-black uppercase tracking-[0.3em]">Sua seleção está vazia</p>
                                <p className="text-[10px] font-medium max-w-[200px] mx-auto">Ative benefícios no catálogo para vê-los aqui.</p>
                            </div>
                            <button onClick={() => navigate('/prive/rewards')} className="px-8 py-4 rounded-xl border border-[#C9A961]/30 text-[#C9A961] text-[9px] font-black uppercase tracking-widest group-hover:bg-[#C9A961]/10 transition-colors">
                                Ir para o Catálogo
                            </button>
                        </div>
                    )}
                </div>

                <JZReferralCard />

                <div className="mt-20 text-center opacity-10">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em]">JZ Privé Club Excellence</p>
                </div>
            </main>

            {/* Background Glows */}
            <div className="fixed top-[-10%] right-[-10%] w-[80%] h-[80%] bg-[#C9A961]/5 rounded-full blur-[150px] pointer-events-none z-0"></div>
            <div className="fixed bottom-[-5%] left-[-5%] w-[60%] h-[60%] bg-[#0f3e29]/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
        </div>
    );
};

export default PriveSelection;
