
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Professional } from '../types';
import AdminBottomNav from '../components/AdminBottomNav';

const AdminWorkingHours: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [professionals, setProfessionals] = useState<Professional[]>([]);

    useEffect(() => {
        fetchProfessionals();
    }, []);

    const fetchProfessionals = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('professionals')
                .select('*')
                .eq('active', true)
                .order('name');

            if (error) throw error;
            setProfessionals(data || []);
        } catch (err) {
            console.error('Error fetching professionals:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col h-screen bg-background-dark items-center justify-center">
                <div className="relative size-16 flex items-center justify-center">
                    <div className="absolute inset-0 border-2 border-white/5 rounded-full"></div>
                    <div className="absolute inset-0 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
                    <span className="material-symbols-outlined text-accent-gold scale-75">schedule</span>
                </div>
                <p className="mt-6 text-accent-gold/40 font-black uppercase text-[8px] tracking-[0.5em] animate-pulse">Sincronizando Escala</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background-dark text-white overflow-hidden selection:bg-accent-gold/20 relative">
            {/* Dynamic Background Engine */}
            <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
                <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/30 blur-[100px] animate-float"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-10 mix-blend-overlay"></div>
            </div>

            <header className="sticky top-0 z-[100] premium-nav-dark px-8 py-6 flex items-center justify-between border-b border-white/5 bg-background-dark/95 backdrop-blur-xl">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/admin/settings')} className="size-11 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-accent-gold hover:bg-white/10 active:scale-90 transition-all shadow-huge">
                        <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
                    </button>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mb-1">Elite Control Suite</p>
                        <h1 className="text-xl font-display italic text-white tracking-tight">Gestão de Horários</h1>
                    </div>
                </div>
                <div className="size-10"></div>
            </header>

            <main className="relative z-10 flex-1 p-8 space-y-12 overflow-y-auto no-scrollbar pb-32 animate-reveal">
                <div className="space-y-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-px w-6 bg-accent-gold/20"></div>
                        <p className="text-[10px] font-black font-outfit uppercase tracking-[0.4em] text-white/30">Disponibilidade da Equipe</p>
                        <div className="h-px w-6 bg-accent-gold/20"></div>
                    </div>
                    <h2 className="text-4xl font-display italic text-white leading-tight">Jornada de Trabalho</h2>
                    <p className="text-sm font-outfit font-light text-white/40 italic max-w-[320px] mx-auto">Configure a dedicação individual e protocolos de tempo de nossas especialistas.</p>
                </div>

                <div className="space-y-6">
                    {professionals.map((pro, idx) => (
                        <button
                            key={pro.id}
                            onClick={() => navigate(`/admin/professional/${pro.id}?tab=SCHEDULE`)}
                            className="group relative w-full bg-surface-dark/40 border border-white/5 p-8 rounded-[48px] flex items-center gap-8 transition-all duration-700 hover:border-accent-gold/20 hover:bg-surface-dark active:scale-[0.98] animate-reveal shadow-huge overflow-hidden"
                            style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                            <div className="absolute inset-0 bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                            <div className="size-20 rounded-[32px] overflow-hidden border-2 border-white/5 shadow-huge group-hover:scale-110 transition-transform duration-[1.5s] relative z-10">
                                <img
                                    src={pro.image_url || `https://ui-avatars.com/api/?name=${pro.name}&background=122b22&color=c9a961`}
                                    className="w-full h-full object-cover transition-transform duration-[2000ms]"
                                    alt={pro.name}
                                />
                                <div className="absolute inset-0 bg-accent-gold/5 mix-blend-overlay"></div>
                            </div>

                            <div className="flex-1 text-left space-y-3 relative z-10">
                                <h4 className="font-display text-2xl text-white italic group-hover:text-accent-gold transition-colors duration-500">{pro.name}</h4>
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl shadow-inner">
                                        <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[9px] text-emerald-500 font-black font-outfit uppercase tracking-widest leading-none">
                                            {(pro as any).working_hours ? 'Padrão Flexível' : `${(pro as any).start_hour || '08:00'} — ${(pro as any).end_hour || '22:00'}`}
                                        </span>
                                    </div>
                                    <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-2xl">
                                        <span className="text-[9px] text-white/30 font-black font-outfit uppercase tracking-widest leading-none">
                                            {((pro as any).working_hours ? Object.values((pro as any).working_hours).filter((h: any) => h.closed).length : JSON.parse((pro as any).closed_days || '[0]').length)} Ausências
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-white/5 group-hover:text-accent-gold group-hover:translate-x-2 transition-all duration-500 relative z-10">east</span>
                        </button>
                    ))}
                </div>

                <div className="bg-primary/5 p-8 rounded-[48px] border border-primary/10 flex gap-8 items-start relative overflow-hidden group">
                    <div className="absolute inset-0 bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                    <div className="size-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shrink-0 shadow-huge relative z-10">
                        <span className="material-symbols-outlined !text-3xl">info</span>
                    </div>
                    <div className="space-y-1 relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary font-outfit">Sincronização de Elite</p>
                        <p className="text-[13px] text-white/30 leading-relaxed italic font-light pt-2">
                            As janelas de dedicação definidas aqui refletem imediatamente na curadoria de horários para membros do JZ Privé Club.
                        </p>
                    </div>
                </div>
            </main>

            <AdminBottomNav />

            {/* Visual Safe Area Inset */}
            <div className="fixed bottom-0 left-0 w-full h-8 bg-black pointer-events-none z-[90]"></div>
        </div>
    );
};

export default AdminWorkingHours;
