
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

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

interface Category {
    id: string;
    name: string;
    slug: string;
}

const AdminPriveRewards: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [isEditing, setIsEditing] = useState(false);
    const [isManagingCategories, setIsManagingCategories] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [form, setForm] = useState<Partial<Reward>>({
        title: '',
        category: '',
        points_cost: 0,
        image_url: '',
        description: '',
        stock: 100,
        rules: [],
        is_active: true
    });
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data: catData } = await supabase.from('loyalty_categories').select('*').order('name');
        const { data: rewData } = await supabase.from('loyalty_rewards').select('*').order('points_cost');

        if (catData) {
            setCategories(catData);
            if (!form.category && catData.length > 0) setForm(prev => ({ ...prev, category: catData[0].name }));
        }
        if (rewData) setRewards(rewData);
        setLoading(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `rewards/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('loyalty-rewards')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('loyalty-rewards')
                .getPublicUrl(filePath);

            setForm(prev => ({ ...prev, image_url: publicUrl }));
        } catch (error: any) {
            alert('Erro no upload: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (form.id) {
                const { error } = await supabase.from('loyalty_rewards').update(form).eq('id', form.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('loyalty_rewards').insert([form]);
                if (error) throw error;
            }
            setIsEditing(false);
            fetchData();
        } catch (err: any) {
            alert('Erro ao salvar: ' + err.message);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        const slug = newCategoryName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
        const { error } = await supabase.from('loyalty_categories').insert([{ name: newCategoryName, slug }]);
        if (error) alert(error.message);
        else {
            setNewCategoryName('');
            fetchData();
        }
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        if (!window.confirm(`Excluir a categoria "${name}"? Isso não removerá os mimos, mas eles podem perder o filtro.`)) return;
        const { error } = await supabase.from('loyalty_categories').delete().eq('id', id);
        if (error) alert(error.message);
        else fetchData();
    };

    const toggleStatus = async (reward: Reward) => {
        const { error } = await supabase.from('loyalty_rewards').update({ is_active: !reward.is_active }).eq('id', reward.id);
        if (error) alert(error.message);
        else fetchData();
    };

    const filteredRewards = rewards.filter(r => activeFilter === 'Todos' || r.category === activeFilter);

    return (
        <div className="animate-fade-in space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-2xl font-display">Gerenciar Recompensas</h1>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black">Catálogo de Mimos e Serviços</p>
                </div>
                <button onClick={() => { setForm({ rules: [], category: categories[0]?.name, stock: 100, is_active: true }); setIsEditing(true); }} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-colors self-start md:self-auto">
                    <span className="material-symbols-outlined !text-sm">add</span>
                    Novo Mimo
                </button>
            </header>

            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                <button
                    onClick={() => setActiveFilter('Todos')}
                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeFilter === 'Todos' ? 'bg-gold-dark text-white border-gold-dark shadow-lg shadow-gold-dark/20' : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'}`}
                >Todos</button>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveFilter(cat.name)}
                        className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeFilter === cat.name ? 'bg-gold-dark text-white border-gold-dark shadow-lg shadow-gold-dark/20' : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'}`}
                    >{cat.name}</button>
                ))}
                <button onClick={() => setIsManagingCategories(true)} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 hover:bg-white/10 transition-colors" title="Gerenciar Categorias">
                    <span className="material-symbols-outlined text-sm">settings</span>
                </button>
            </div>

            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 flex justify-center"><div className="w-8 h-8 border-2 border-gold-dark border-t-transparent rounded-full animate-spin"></div></div>
                ) : filteredRewards.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-white/30 text-sm">Nenhum mimo encontrado nesta categoria.</div>
                ) : (
                    filteredRewards.map(reward => (
                        <div key={reward.id} className="bg-[#0e110e] border border-white/5 rounded-[40px] overflow-hidden group hover:border-white/10 transition-all hover:scale-[1.01]">
                            <div className="relative h-64 w-full">
                                <img src={reward.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={reward.title} />
                                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-black text-gold-light border border-white/10 uppercase tracking-widest">
                                    {reward.points_cost} Pts
                                </div>
                                <div className={`absolute top-4 right-4 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border backdrop-blur-md ${reward.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                                    {reward.is_active ? 'Ativo' : 'Inativo'}
                                </div>
                            </div>
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-2xl font-display mb-1 leading-tight">{reward.title}</h3>
                                        <p className="text-sm text-white/40 font-light line-clamp-2 min-h-[2.5em]">{reward.description}</p>
                                    </div>
                                </div>

                                <div className="flex gap-10 mb-8 border-t border-white/5 pt-6">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-white/30 font-black mb-1">Estoque</p>
                                        <p className="font-display text-xl">{reward.stock}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-white/30 font-black mb-1">Nível</p>
                                        <p className="font-display text-xl text-gold-light">Todos</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => { setForm(reward); setIsEditing(true); }} className="flex-1 py-5 rounded-2xl bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                                        Editar
                                    </button>
                                    <button onClick={() => toggleStatus(reward)} className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group/btn flex-shrink-0 hover:bg-white/10 transition-colors">
                                        <span className={`material-symbols-outlined ${reward.is_active ? 'text-emerald-500' : 'text-rose-500'} group-hover/btn:scale-110 transition-transform`}>
                                            {reward.is_active ? 'visibility' : 'visibility_off'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* Reward Form Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
                    <form onSubmit={handleSubmit} className="bg-[#141814] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-10 rounded-[48px] border border-white/10 space-y-8 no-scrollbar animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-3xl font-display">{form.id ? 'Editar' : 'Novo'} Mimo</h2>
                            <button type="button" onClick={() => setIsEditing(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"><span className="material-symbols-outlined text-sm">close</span></button>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-2">Título do Mimo</label>
                                <input required className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-5 text-sm outline-none focus:border-gold-dark/40 transition-colors"
                                    value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Botox Day" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-2">Categoria</label>
                                <select required className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-5 text-sm outline-none focus:border-gold-dark/40 appearance-none transition-colors"
                                    value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                    {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-2">Custo (Pontos)</label>
                                <input type="number" required className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-5 text-sm outline-none focus:border-gold-dark/40 transition-colors"
                                    value={form.points_cost} onChange={e => setForm({ ...form, points_cost: parseInt(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-2">Estoque Virtual</label>
                                <input type="number" className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-5 text-sm outline-none focus:border-gold-dark/40 transition-colors"
                                    value={form.stock} onChange={e => setForm({ ...form, stock: parseInt(e.target.value) })} />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-2">Imagem do Mimo</label>
                                <div className="flex gap-4">
                                    <div onClick={() => fileInputRef.current?.click()} className="flex-1 bg-black/40 border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-gold-dark/40 transition-colors group relative overflow-hidden h-40">
                                        {form.image_url ? (
                                            <img src={form.image_url} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                                        ) : null}
                                        <div className="relative z-10 flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined text-gold-dark text-3xl group-hover:scale-110 transition-transform">{uploading ? 'sync' : 'upload'}</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">{uploading ? 'Enviando...' : 'Clique para enviar'}</span>
                                        </div>
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                                    <div className="w-32 flex flex-col gap-2">
                                        <label className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Ou URL direta</label>
                                        <input className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-4 text-[10px] outline-none h-full focus:border-gold-dark/40 transition-colors"
                                            value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-2">Descrição Curta</label>
                                <textarea className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-5 text-sm outline-none focus:border-gold-dark/40 h-32 resize-none transition-colors"
                                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                        </div>

                        <div className="pt-8 flex gap-4">
                            <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-6 rounded-[24px] bg-white/5 text-white/40 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors">Cancelar</button>
                            <button type="submit" className="flex-[2] py-6 rounded-[24px] bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-emerald-900/40 hover:bg-emerald-500 transition-colors">Salvar Recompensa</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Categories Management Modal */}
            {isManagingCategories && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
                    <div className="bg-[#141814] w-full max-w-md p-10 rounded-[48px] border border-white/10 space-y-8 animate-fade-in-up">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-display">Categorias</h2>
                            <button onClick={() => setIsManagingCategories(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"><span className="material-symbols-outlined text-sm">close</span></button>
                        </div>

                        <div className="flex gap-2">
                            <input className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm outline-none focus:border-gold-dark/40 transition-colors"
                                placeholder="Nova categoria..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
                            <button onClick={handleAddCategory} className="px-6 rounded-2xl bg-gold-dark text-slate-900 font-bold text-xs uppercase tracking-widest hover:bg-gold-light transition-colors">Add</button>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                            {categories.map(cat => (
                                <div key={cat.id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                                    <span className="text-sm font-bold">{cat.name}</span>
                                    <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="w-8 h-8 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-500/10 transition-colors">
                                        <span className="material-symbols-outlined !text-sm">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPriveRewards;
