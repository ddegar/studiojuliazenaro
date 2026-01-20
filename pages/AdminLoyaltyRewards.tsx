
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
        <div className="min-h-screen bg-[#121417] text-white p-6 font-sans pb-24">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/loyalty')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-gray-400">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-display font-bold">Gerenciar Recompensas</h1>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Catálogo de Mimos e Serviços</p>
                    </div>
                </div>
                <button onClick={() => { setIsEditing(true); setForm({ rules: [], category: 'Product', stock: 100 }); }} className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined !text-sm">add</span>
                    Nova Recompensa
                </button>
            </header>

            {loading ? (
                <div className="flex justify-center py-20"><div className="size-8 border-4 border-accent-gold border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rewards.map(reward => (
                        <div key={reward.id} className="bg-[#1c1f24] rounded-2xl border border-white/5 overflow-hidden group">
                            <div className="h-40 w-full relative">
                                <img src={reward.image_url || 'https://via.placeholder.com/300'} className="w-full h-full object-cover" alt={reward.title} />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button onClick={() => { setForm(reward); setIsEditing(true); }} className="size-8 rounded-full bg-white text-black flex items-center justify-center"><span className="material-symbols-outlined !text-sm">edit</span></button>
                                    <button onClick={() => handleDelete(reward.id)} className="size-8 rounded-full bg-rose-500 text-white flex items-center justify-center"><span className="material-symbols-outlined !text-sm">delete</span></button>
                                </div>
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-accent-gold">
                                    {reward.points_cost} Pts
                                </div>
                            </div>
                            <div className="p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-white leading-tight">{reward.title}</h3>
                                    <span className={`text-[8px] px-2 py-0.5 rounded border ${reward.is_active ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'} uppercase tracking-wider`}>
                                        {reward.is_active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2">{reward.description}</p>
                                <div className="pt-2 flex gap-2 text-xs text-gray-600">
                                    <span className="bg-white/5 px-2 py-1 rounded">{reward.category}</span>
                                    <span className="bg-white/5 px-2 py-1 rounded">Estoque: {reward.stock}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isEditing && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <form onSubmit={handleSubmit} className="bg-[#1c1f24] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl border border-white/10 shadow-2xl space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-display font-bold">{form.id ? 'Editar' : 'Nova'} Recompensa</h2>
                            <button type="button" onClick={() => setIsEditing(false)} className="size-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Título do Mimo</label>
                                <input required className="w-full bg-[#121417] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-gold/50 outline-none"
                                    value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Botox Day" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Categoria</label>
                                <select className="w-full bg-[#121417] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-gold/50 outline-none text-gray-300"
                                    value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                    <option value="Aesthetic Treatment">Tratamento Estético</option>
                                    <option value="Product">Produto / Skincare</option>
                                    <option value="Experience">Experiência</option>
                                    <option value="Discount">Voucher de Desconto</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Custo (Pontos)</label>
                                <input type="number" required className="w-full bg-[#121417] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-gold/50 outline-none"
                                    value={form.points_cost} onChange={e => setForm({ ...form, points_cost: parseInt(e.target.value) })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Estoque Virtual</label>
                                <input type="number" className="w-full bg-[#121417] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-gold/50 outline-none"
                                    value={form.stock} onChange={e => setForm({ ...form, stock: parseInt(e.target.value) })} />
                            </div>
                            <div className="space-y-1 col-span-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">URL da Imagem</label>
                                <input required className="w-full bg-[#121417] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-gold/50 outline-none"
                                    value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
                            </div>
                            <div className="space-y-1 col-span-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Descrição Curta</label>
                                <textarea className="w-full bg-[#121417] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-gold/50 outline-none resize-none h-20"
                                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                        </div>

                        {/* Rules Management */}
                        <div className="space-y-2 pt-2 border-t border-white/5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Regras de Uso</label>
                            <div className="flex gap-2">
                                <input className="flex-1 bg-[#121417] border border-white/10 rounded-xl px-4 py-2 text-sm outline-none"
                                    value={ruleInput} onChange={e => setRuleInput(e.target.value)} placeholder="Ex: Válido até 30/12..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addRule())} />
                                <button type="button" onClick={addRule} className="bg-white/10 px-4 rounded-xl text-white font-bold text-xs hover:bg-white/20">ADD</button>
                            </div>
                            <ul className="space-y-1">
                                {form.rules?.map((rule, idx) => (
                                    <li key={idx} className="flex justify-between items-center bg-[#121417] px-3 py-2 rounded-lg text-xs text-gray-400">
                                        <span>• {rule}</span>
                                        <button type="button" onClick={() => removeRule(idx)} className="text-rose-500 hover:text-rose-400">
                                            <span className="material-symbols-outlined !text-sm">delete</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 font-bold text-xs uppercase tracking-widest hover:bg-white/10">Cancelar</button>
                            <button type="submit" className="flex-[2] py-3 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 font-bold text-xs uppercase tracking-widest hover:bg-emerald-600/30">Salvar Recompensa</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AdminLoyaltyRewards;
