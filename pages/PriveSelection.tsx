
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
        <div className="flex flex-col h-full bg-background-dark text-white overflow-hidden selection:bg-accent-gold/20 relative">
            {/* Dynamic Background Elements */}
            <div className="fixed inset-0 pointer-events-none opacity-15 overflow-hidden">
                <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/20 blur-[120px] animate-float"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/20 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <header className="sticky top-0 z-[100] premium-nav-dark p-6 border-b border-white/5 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate('/prive')} className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-accent-gold hover:bg-white/10 active:scale-90 transition-all">
                        <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
                    </button>
                    <div className="text-center">
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mb-1">Active Entitlements</p>
                        <h2 className="font-display italic text-xl leading-tight text-white tracking-tight">Seleção Privé</h2>
                    </div>
                    <div className="size-10"></div>
                </div>
            </header>

            <main className="relative z-10 flex-1 p-8 overflow-y-auto no-scrollbar pb-40">
                <div className="text-center space-y-4 mb-16 animate-reveal">
                    <div className="flex items-center justify-center gap-4 mb-2">
                        <span className="h-px w-8 bg-accent-gold/40"></span>
                        <p className="text-[10px] font-black uppercase text-accent-gold tracking-[0.5em] font-outfit">Your Dossier</p>
                        <span className="h-px w-8 bg-accent-gold/40"></span>
                    </div>
                    <h1 className="text-4xl font-display font-bold leading-none tracking-tighter">
                        Mimos <span className="italic text-accent-gold font-light">Especialmente Selecionados</span>.
                    </h1>
                </div>

                <div className="space-y-10 max-w-lg mx-auto">
                    {benefits.length > 0 ? benefits.map((benefit, idx) => (
                        <div key={benefit.id} className="group animate-reveal" style={{ animationDelay: `${idx * 0.1}s` }}>
                            <div className="relative bg-surface-dark border border-white/5 rounded-[56px] p-2 overflow-hidden shadow-hugest group-hover:border-accent-gold/20 transition-all duration-700">
                                <div className="relative aspect-[16/10] rounded-[50px] overflow-hidden">
                                    <img alt={benefit.reward.title} src={benefit.reward.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/20 to-transparent"></div>

                                    {/* Expiry Badge */}
                                    <div className="absolute top-8 right-8 px-6 py-2.5 bg-accent-gold text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-huge flex items-center gap-2">
                                        <span className="material-symbols-outlined !text-sm">alarm</span>
                                        {calculateDaysLeft(benefit.expires_at)} Dias restantes
                                    </div>
                                </div>

                                <div className="p-10 flex items-center justify-between">
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-accent-gold italic">Privilégio Ativo</p>
                                        <h3 className="text-3xl font-display font-medium text-white tracking-tight">{benefit.reward.title}</h3>
                                    </div>

                                    <button
                                        onClick={() => {
                                            alert('Para utilizar este benefício, informe seu JZ ID no momento do atendimento.');
                                        }}
                                        className="size-16 bg-white text-primary rounded-[24px] flex items-center justify-center shadow-huge hover:bg-accent-gold transition-all active:scale-95 group/btn"
                                    >
                                        <span className="material-symbols-outlined !text-3xl group-hover/btn:rotate-12 transition-transform">qr_code_2</span>
                                    </button>
                                </div>

                                {/* Background Aura */}
                                <div className="absolute -bottom-20 -right-20 size-64 bg-accent-gold/5 blur-[80px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-[1.5s]"></div>
                            </div>
                        </div>
                    )) : (
                        <div className="py-32 text-center space-y-8 animate-reveal">
                            <div className="size-24 rounded-[32px] bg-white/2 border border-white/5 flex items-center justify-center mx-auto shadow-inner text-white/5">
                                <span className="material-symbols-outlined !text-5xl font-light">auto_awesome_motion</span>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-2xl font-display italic text-white/40 tracking-[0.2em] uppercase">Sua seleção está vazia</h3>
                                <p className="text-sm font-outfit font-light text-white/20 max-w-[240px] mx-auto italic">Explore nosso catálogo e transforme seus créditos em experiências inesquecíveis.</p>
                            </div>
                            <button onClick={() => navigate('/prive/rewards')} className="h-16 px-10 rounded-2xl border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-widest hover:bg-accent-gold/10 transition-all active:scale-95 shadow-huge">
                                Explorar Catálogo de Luxo
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-20">
                    <JZReferralCard />
                </div>
            </main>

            {/* Fixed Visual Safe Area */}
            <div className="fixed bottom-0 left-0 w-full h-12 bg-black/40 backdrop-blur-3xl border-t border-white/5 pointer-events-none z-[130]"></div>
        </div>
    );
};

export default PriveSelection;
