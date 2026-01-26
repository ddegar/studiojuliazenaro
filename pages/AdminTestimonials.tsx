
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import AdminBottomNav from '../components/AdminBottomNav';

const AdminTestimonials: React.FC = () => {
    const navigate = useNavigate();
    const [testimonials, setTestimonials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
    const [allowSubmission, setAllowSubmission] = useState(false);

    useEffect(() => {
        fetchTestimonials();
        fetchConfig();
    }, [filter]);

    const fetchConfig = async () => {
        const { data } = await supabase.from('studio_config').select('value').eq('key', 'allow_public_testimonials').maybeSingle();
        if (data) setAllowSubmission(data.value === 'true');
    };

    const toggleSubmission = async () => {
        const newValue = !allowSubmission;
        setAllowSubmission(newValue);
        await supabase.from('studio_config').upsert({ key: 'allow_public_testimonials', value: String(newValue) }, { onConflict: 'key' });
    };

    const fetchTestimonials = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('testimonials')
                .select('*, profiles(name), professionals(name)')
                .order('created_at', { ascending: false });

            if (filter === 'PENDING') query = query.eq('status', 'pending');
            if (filter === 'APPROVED') query = query.eq('status', 'approved');

            const { data, error } = await query;
            if (error) throw error;
            setTestimonials(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este depoimento?')) return;
        try {
            const { error } = await supabase.from('testimonials').delete().eq('id', id);
            if (error) throw error;
            setTestimonials(testimonials.filter(t => t.id !== id));
        } catch (err: any) {
            alert('Erro ao excluir: ' + err.message);
        }
    };

    const handleToggleStatus = async (item: any) => {
        const newStatus = item.status === 'approved' ? 'pending' : 'approved';
        try {
            const { error } = await supabase
                .from('testimonials')
                .update({ status: newStatus })
                .eq('id', item.id);
            if (error) throw error;
            setTestimonials(testimonials.map(t => t.id === item.id ? { ...t, status: newStatus } : t));
        } catch (err: any) {
            alert('Erro ao atualizar status: ' + err.message);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background-dark text-white overflow-hidden selection:bg-accent-gold/20 relative">
            {/* Dynamic Background Engine */}
            <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
                <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/30 blur-[100px] animate-float"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-10 mix-blend-overlay"></div>
            </div>

            <header className="sticky top-0 z-[100] premium-nav-dark px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 bg-background-dark/95 backdrop-blur-xl">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/admin/settings')}
                        className="size-11 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-accent-gold hover:bg-white/10 active:scale-90 transition-all shadow-huge"
                    >
                        <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
                    </button>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mb-1">Elite Control Suite</p>
                        <h1 className="text-xl font-display italic text-white tracking-tight">Depoimentos & Feedback</h1>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Submission Toggle */}
                    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Submissão Pública</span>
                        <button
                            onClick={toggleSubmission}
                            className={`w-12 h-6 rounded-full p-1 transition-all duration-500 ${allowSubmission ? 'bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-white/10'}`}
                        >
                            <div className={`size-4 rounded-full shadow-md transition-all duration-500 ${allowSubmission ? 'bg-emerald-500 translate-x-6' : 'bg-white/20 translate-x-0'}`}></div>
                        </button>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${allowSubmission ? 'text-emerald-500' : 'text-white/20'}`}>
                            {allowSubmission ? 'Aberta' : 'Fechada'}
                        </span>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 shadow-hugest self-start md:self-center">
                        {[
                            { id: 'ALL', label: 'Todos' },
                            { id: 'PENDING', label: 'Pendentes' },
                            { id: 'APPROVED', label: 'Aprovados' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id as any)}
                                className={`px-6 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${filter === f.id ? 'bg-primary text-white shadow-lg' : 'text-white/20 hover:text-white/40'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="relative z-10 flex-1 p-8 overflow-y-auto no-scrollbar pb-32">
                {loading ? (
                    <div className="py-32 flex flex-col items-center gap-6 animate-pulse">
                        <div className="relative size-16 flex items-center justify-center">
                            <div className="absolute inset-0 border-2 border-white/5 rounded-full"></div>
                            <div className="absolute inset-0 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
                            <span className="material-symbols-outlined text-accent-gold scale-75">rate_review</span>
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20">Sincronizando Prova Social</p>
                    </div>
                ) : testimonials.length === 0 ? (
                    <div className="py-32 text-center opacity-20 space-y-6">
                        <span className="material-symbols-outlined !text-6xl">chat_bubble_outline</span>
                        <p className="text-[10px] uppercase tracking-[0.4em] font-black">Nenhum registro encontrado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {testimonials.map((item, idx) => (
                            <div
                                key={item.id}
                                className="group relative bg-surface-dark/40 rounded-[40px] border border-white/5 p-8 flex flex-col gap-6 animate-reveal hover:border-accent-gold/20 hover:bg-surface-dark transition-all duration-700 shadow-huge overflow-hidden"
                                style={{ animationDelay: `${idx * 0.05}s` }}
                            >
                                <div className="absolute inset-0 bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex gap-1 text-accent-gold">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i} className="material-symbols-outlined !text-[10px]" style={{ fontVariationSettings: i < item.rating ? "'FILL' 1" : "'FILL' 0" }}>
                                                star
                                            </span>
                                        ))}
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-xl text-[7px] font-black uppercase tracking-[0.2em] border ${item.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                        {item.status === 'approved' ? 'Visível' : 'Em Análise'}
                                    </div>
                                </div>

                                {item.photo_url && (
                                    <div className="aspect-video w-full rounded-3xl overflow-hidden bg-black/40 border border-white/5 shadow-inner relative group-hover:scale-[1.02] transition-transform duration-700">
                                        <img src={item.photo_url} alt="Feedback" className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-accent-gold/5 mix-blend-overlay"></div>
                                    </div>
                                )}

                                <div className="flex-1 relative z-10">
                                    <blockquote className="text-sm text-white/60 font-display italic leading-relaxed line-clamp-4 group-hover:text-white/90 transition-colors">
                                        "{item.message}"
                                    </blockquote>
                                </div>

                                <div className="pt-6 border-t border-white/5 flex flex-col gap-6 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="size-11 rounded-2xl bg-primary flex items-center justify-center text-[11px] font-bold text-accent-gold shadow-huge border border-white/5">
                                            {item.profiles?.name?.[0] || 'C'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white truncate">{item.profiles?.name || 'Membro do Clube'}</p>
                                            <p className="text-[8px] text-white/20 uppercase tracking-widest font-bold mt-0.5">Atendida por {item.professionals?.name || 'Corpo Docente'}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleToggleStatus(item)}
                                            className={`flex-1 h-12 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 active:scale-95 ${item.status === 'approved' ? 'bg-white/5 text-white/40 hover:bg-amber-500/10 hover:text-amber-500 border border-white/5' : 'bg-accent-gold text-primary shadow-huge'}`}
                                        >
                                            {item.status === 'approved' ? 'Ocultar' : 'Aprovar Visualização'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="size-12 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-all active:scale-95 border border-red-500/10"
                                        >
                                            <span className="material-symbols-outlined !text-xl">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <AdminBottomNav />

            {/* Visual Safe Area Inset */}
            <div className="fixed bottom-0 left-0 w-full h-8 bg-black pointer-events-none z-[90]"></div>
        </div>
    );
};

export default AdminTestimonials;
