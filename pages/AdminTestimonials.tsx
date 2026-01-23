import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

const AdminTestimonials: React.FC = () => {
    const navigate = useNavigate();
    const [testimonials, setTestimonials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');

    useEffect(() => {
        fetchTestimonials();
    }, [filter]);

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
        <div className="flex flex-col min-h-screen bg-[#0a0c0a] text-white font-sans">
            <header className="sticky top-0 z-50 bg-[#0a0c0a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/admin')}
                            className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-2xl font-display font-medium text-white tracking-tight">Depoimentos & Avaliações</h1>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059] font-bold mt-1">Gestão de Prova Social</p>
                        </div>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                        {[
                            { id: 'ALL', label: 'Todos' },
                            { id: 'PENDING', label: 'Pendentes' },
                            { id: 'APPROVED', label: 'Aprovados' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id as any)}
                                className={`px-6 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f.id ? 'bg-[#C5A059] text-black shadow-lg' : 'text-white/30 hover:text-white'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12">
                {loading ? (
                    <div className="py-20 flex flex-col items-center gap-4 opacity-50">
                        <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] uppercase tracking-widest font-bold">Carregando depoimentos...</p>
                    </div>
                ) : testimonials.length === 0 ? (
                    <div className="py-20 text-center opacity-30 italic">
                        <span className="material-symbols-outlined text-4xl mb-4 block">rate_review</span>
                        <p className="text-sm">Nenhum depoimento encontrado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {testimonials.map(item => (
                            <div key={item.id} className="bg-[#141814] rounded-[32px] border border-white/5 p-8 flex flex-col gap-6 relative group border-transparent hover:border-[#C5A059]/30 transition-all">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-0.5 text-[#C5A059]">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i} className="material-symbols-outlined !text-sm" style={{ fontVariationSettings: i < item.rating ? "'FILL' 1" : "'FILL' 0" }}>
                                                star
                                            </span>
                                        ))}
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${item.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                        {item.status === 'approved' ? 'Visível' : 'Oculto'}
                                    </div>
                                </div>

                                {item.photo_url && (
                                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black/40 border border-white/5">
                                        <img src={item.photo_url} alt="Feedback" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <div className="flex-1">
                                    <p className="text-sm text-white/70 italic leading-relaxed">"{item.message}"</p>
                                </div>

                                <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-[#C5A059]">
                                            {item.profiles?.name?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white">{item.profiles?.name || 'Cliente'}</p>
                                            <p className="text-[9px] text-white/30">Atendida por {item.professionals?.name || 'Equipe'}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleToggleStatus(item)}
                                            className="flex-1 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest text-white/60 transition-all"
                                        >
                                            {item.status === 'approved' ? 'Ocultar' : 'Aprovar'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-all"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminTestimonials;
