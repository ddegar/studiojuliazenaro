
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

// Tipo de dados da tabela
interface Reward {
    id: string;
    title: string;
    description: string;
    category: string;
    points_cost: number;
    image_url: string;
    is_active: boolean;
    stock: number;
    rules: string[];
}

const AdminLoyaltyRewards: React.FC = () => {
    const navigate = useNavigate();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [form, setForm] = useState<Partial<Reward>>({
        title: '',
        category: 'Aesthetic Treatment',
        points_cost: 0,
        image_url: '',
        description: '',
        stock: 100,
        rules: []
    });
    const [ruleInput, setRuleInput] = useState('');

    useEffect(() => {
        fetchRewards();
    }, []);

    const fetchRewards = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('loyalty_rewards')
                .select('*')
                .order('points_cost', { ascending: true });

            if (error) throw error;
            setRewards(data || []);
        } catch (error) {
            console.error('Error fetching rewards:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (form.id) {
                // Update
                const { error } = await supabase.from('loyalty_rewards').update(form).eq('id', form.id);
                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase.from('loyalty_rewards').insert([form]);
                if (error) throw error;
            }
            alert('Recompensa salva com sucesso!');
            setIsEditing(false);
            setForm({ title: '', category: 'Product', points_cost: 0, image_url: '', description: '', stock: 100, rules: [] });
            fetchRewards();
        } catch (error: any) {
            alert('Erro ao salvar: ' + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja remover esta recompensa?')) return;
        try {
            const { error } = await supabase.from('loyalty_rewards').delete().eq('id', id);
            if (error) throw error;
            fetchRewards();
        } catch (error: any) {
            alert('Erro ao deletar: ' + error.message);
        }
    };

    const addRule = () => {
        if (!ruleInput.trim()) return;
        setForm(prev => ({ ...prev, rules: [...(prev.rules || []), ruleInput] }));
        setRuleInput('');
    };

    const removeRule = (index: number) => {
        setForm(prev => ({ ...prev, rules: prev.rules?.filter((_, i) => i !== index) }));
    };

    return (
        <div className="min-h-screen bg-background-dark text-white font-outfit antialiased selection:bg-accent-gold/20 selection:text-white pb-32">
            {/* Elite Narrative Header */}
            <header className="h-24 px-8 flex items-center justify-between border-b border-white/5 bg-background-dark/80 backdrop-blur-xl sticky top-0 z-[60]">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-accent-gold hover:bg-white/10 active:scale-90 transition-all">
                        <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
                    </button>
                    <div className="flex flex-col">
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mb-1">Elite Reward Engine</p>
                        <h1 className="font-display italic text-2xl text-white">Catálogo de Prêmios</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => { setIsEditing(true); setForm({ rules: [], category: 'Product', stock: 100 }); }}
                        className="group h-12 bg-accent-gold text-primary px-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-accent-gold/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined !text-lg group-hover:rotate-90 transition-transform duration-500">add_circle</span>
                        Nova Recompensa
                    </button>
                </div>
            </header>

            <main className="relative z-10 p-8 lg:p-12 space-y-12 w-full max-w-screen-2xl mx-auto">
                {/* Status Indicator */}
                <div className="flex items-center justify-between px-2 animate-reveal">
                    <div className="flex items-center gap-3">
                        <span className="h-px w-8 bg-accent-gold/30"></span>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">Gerenciamento de Ativos</p>
                    </div>
                    <p className="text-[10px] font-black text-accent-gold uppercase tracking-widest">{rewards.length} Intens Disponíveis</p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-6">
                        <div className="relative size-16 flex items-center justify-center">
                            <div className="absolute inset-0 border-2 border-primary/5 rounded-full"></div>
                            <div className="absolute inset-0 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
                            <span className="material-symbols-outlined text-accent-gold scale-75">card_giftcard</span>
                        </div>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Sincronizando Mimos</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-reveal">
                        {rewards.map((reward, idx) => (
                            <div
                                key={reward.id}
                                className="group bg-surface-dark/40 backdrop-blur-sm rounded-[48px] border border-white/5 overflow-hidden hover:bg-surface-dark hover:border-accent-gold/20 hover:translate-y-[-4px] transition-all duration-500 shadow-huge"
                                style={{ animationDelay: `${idx * 0.05}s` }}
                            >
                                <div className="h-48 w-full relative overflow-hidden">
                                    <img src={reward.image_url || 'https://images.unsplash.com/photo-1512290923902-8a9f81dc2069?q=80&w=2070&auto=format&fit=crop'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0" alt={reward.title} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-60"></div>

                                    {/* Action Overlays */}
                                    <div className="absolute inset-0 bg-background-dark/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                                        <button onClick={() => { setForm(reward); setIsEditing(true); }} className="size-12 rounded-2xl bg-white text-primary flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"><span className="material-symbols-outlined">edit_note</span></button>
                                        <button onClick={() => handleDelete(reward.id)} className="size-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center hover:bg-rose-500 hover:text-white active:scale-95 transition-all shadow-xl"><span className="material-symbols-outlined">delete</span></button>
                                    </div>

                                    {/* Score Badge */}
                                    <div className="absolute top-4 right-4 bg-accent-gold text-primary px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl">
                                        {reward.points_cost} Pts
                                    </div>

                                    {/* Status Badge */}
                                    <div className="absolute bottom-4 left-6">
                                        <span className={`text-[8px] px-2 py-1 rounded-lg border backdrop-blur-md uppercase tracking-[0.2em] font-black ${reward.is_active ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-rose-500/40 text-rose-400 bg-rose-500/10'}`}>
                                            {reward.is_active ? 'Ativo' : 'Pausado'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-accent-gold/40 uppercase tracking-[0.3em]">{reward.category}</p>
                                        <h3 className="font-display text-xl text-white leading-tight">{reward.title}</h3>
                                    </div>

                                    <p className="text-xs text-white/40 leading-relaxed font-light line-clamp-2 italic">{reward.description}</p>

                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex gap-2 text-[9px] font-black text-white/30 uppercase tracking-widest">
                                            <span className="material-symbols-outlined !text-xs">inventory_2</span>
                                            <span>Estoque: {reward.stock}</span>
                                        </div>
                                        <span className="material-symbols-outlined text-accent-gold/20 !text-sm group-hover:text-accent-gold transition-colors">east</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Elite Management Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-[100] bg-background-dark/95 backdrop-blur-2xl flex items-center justify-center p-4 lg:p-8 animate-fade-in">
                    <form onSubmit={handleSubmit} className="bg-surface-dark border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[56px] shadow-hugest p-10 lg:p-12 space-y-10 no-scrollbar relative">
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-accent-gold uppercase tracking-[0.4em]">Editor de Experiências</p>
                                <h2 className="text-3xl font-display font-bold text-white">{form.id ? 'Editar' : 'Nova'} Recompensa</h2>
                            </div>
                            <button type="button" onClick={() => setIsEditing(false)} className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] px-4">Título do Mimo</label>
                                <input required className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold text-white focus:border-accent-gold/50 outline-none transition-all placeholder:text-white/10"
                                    value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Botox Day" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] px-4">Categoria</label>
                                <select className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold text-white/80 focus:border-accent-gold/50 outline-none transition-all appearance-none cursor-pointer"
                                    value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                    <option value="Aesthetic Treatment">Tratamento Estético</option>
                                    <option value="Product">Produto / Skincare</option>
                                    <option value="Experience">Experiência</option>
                                    <option value="Discount">Voucher de Desconto</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] px-4">Custo (Pontos)</label>
                                <input type="number" required className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold text-white focus:border-accent-gold/50 outline-none transition-all"
                                    value={form.points_cost} onChange={e => setForm({ ...form, points_cost: parseInt(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] px-4">Estoque Virtual</label>
                                <input type="number" className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold text-white focus:border-accent-gold/50 outline-none transition-all"
                                    value={form.stock} onChange={e => setForm({ ...form, stock: parseInt(e.target.value) })} />
                            </div>
                            <div className="space-y-2 col-span-full">
                                <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] px-4">URL da Imagem Curada</label>
                                <input required className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-xs font-mono text-accent-gold/60 focus:border-accent-gold/50 outline-none transition-all"
                                    value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://images.unsplash.com/..." />
                            </div>
                            <div className="space-y-2 col-span-full">
                                <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] px-4">Narrativa da Experiência</label>
                                <textarea className="w-full h-32 bg-white/5 border border-white/10 rounded-[32px] p-6 text-sm italic text-white/60 focus:border-accent-gold/50 outline-none resize-none transition-all"
                                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descreva o valor desta recompensa..." />
                            </div>
                        </div>

                        {/* Elite Rules Management */}
                        <div className="space-y-4 pt-6 border-t border-white/5">
                            <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] px-4">Diretrizes de Resgate</label>
                            <div className="flex gap-4">
                                <input className="flex-1 h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm outline-none focus:border-accent-gold/30 transition-all text-white/70"
                                    value={ruleInput} onChange={e => setRuleInput(e.target.value)} placeholder="Ex: Válido apenas em dias de semana..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRule())} />
                                <button type="button" onClick={addRule} className="h-14 px-8 rounded-2xl bg-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/20 active:scale-95 transition-all">Vincular</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {form.rules?.map((rule, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-white/5 border border-white/10 pl-4 pr-2 py-2 rounded-xl text-[10px] font-bold text-white/60 group/rule">
                                        <span>{rule}</span>
                                        <button type="button" onClick={() => removeRule(idx)} className="size-6 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center group-hover/rule:bg-rose-500 group-hover/rule:text-white transition-all">
                                            <span className="material-symbols-outlined !text-sm">close</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8 flex flex-col md:flex-row gap-4">
                            <button type="button" onClick={() => setIsEditing(false)} className="h-16 flex-1 rounded-3xl bg-white/5 text-white/40 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white/10 transition-all">Cancelar</button>
                            <button type="submit" className="h-16 flex-[2] rounded-3xl bg-accent-gold text-primary font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-accent-gold/20 hover:scale-[1.02] active:scale-95 transition-all">Sincronizar Recompensa</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Decorative Gradients */}
            <div className="fixed top-0 right-0 w-[40vw] h-[40vh] bg-accent-gold/5 blur-[120px] pointer-events-none z-0"></div>
            <div className="fixed bottom-0 left-0 w-[30vw] h-[30vh] bg-primary/20 blur-[100px] pointer-events-none z-0 opacity-40"></div>
        </div>
    );
};

export default AdminLoyaltyRewards;
