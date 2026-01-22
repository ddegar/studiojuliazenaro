import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

const AdminPriveBalanceRules: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [rules, setRules] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('REGRAS');
    const [editingRule, setEditingRule] = useState<any>(null);
    const [isCreatingRule, setIsCreatingRule] = useState(false);
    const [newRule, setNewRule] = useState({ code: '', description: '', points_reward: 0 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [rulesRes, campaignsRes] = await Promise.all([
                supabase.from('loyalty_actions').select('*').order('description'),
                supabase.from('loyalty_campaigns').select('*').eq('is_active', true).order('created_at', { ascending: false })
            ]);

            if (rulesRes.error) throw rulesRes.error;
            setRules(rulesRes.data || []);
            setCampaigns(campaignsRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleRule = async (rule: any) => {
        try {
            const { error } = await supabase
                .from('loyalty_actions')
                .update({ is_active: !rule.is_active })
                .eq('id', rule.id);

            if (error) throw error;
            fetchData();
        } catch (err: any) {
            alert('Erro ao atualizar regra: ' + err.message);
        }
    };

    const handleUpdateRule = async () => {
        if (!editingRule) return;
        try {
            const { error } = await supabase
                .from('loyalty_actions')
                .update({
                    description: editingRule.description,
                    points_reward: Number(editingRule.points_reward)
                })
                .eq('id', editingRule.id);

            if (error) throw error;
            setEditingRule(null);
            fetchData();
            alert('Regra atualizada com sucesso!');
        } catch (err: any) {
            alert('Erro ao atualizar: ' + err.message);
        }
    };

    const handleCreateRule = async () => {
        if (!newRule.code || !newRule.description) {
            alert('Preencha os campos obrigatórios.');
            return;
        }
        try {
            const { error } = await supabase
                .from('loyalty_actions')
                .insert({
                    code: newRule.code.toUpperCase().replace(/\s+/g, '_'),
                    description: newRule.description,
                    points_reward: Number(newRule.points_reward),
                    is_active: true
                });

            if (error) throw error;
            setIsCreatingRule(false);
            setNewRule({ code: '', description: '', points_reward: 0 });
            fetchData();
            alert('Regra criada com sucesso!');
        } catch (err: any) {
            alert('Erro ao criar: ' + err.message);
        }
    };

    const getIconByCode = (code: string) => {
        switch (code) {
            case 'BASE_GENERATION': return 'payments';
            case 'BIRTHDAY': return 'card_giftcard';
            case 'REFERRAL': return 'person_add';
            case 'CHECKIN': return 'location_on';
            default: return 'stars';
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#0a0c0a] text-white font-sans overflow-x-hidden">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0a0c0a]/80 backdrop-blur-xl border-b border-white/5 px-6 py-6 transition-all">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/admin/jz-prive')}
                            className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-display font-medium text-white tracking-tight">Regras de Saldo</h1>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059] font-bold mt-0.5">JZ PRIVÉ CLUB</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCreatingRule(true)}
                        className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-full border border-emerald-500/20 transition-all"
                    >
                        + Nova Regra
                    </button>
                </div>
            </header>

            <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 space-y-16 animate-fade-in">
                {/* Generation Rules Section */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="size-1 w-12 bg-gradient-to-r from-[#C5A059] to-transparent rounded-full"></div>
                        <h2 className="text-lg font-display text-white/90 uppercase tracking-[0.1em]">Configuração de Pontos</h2>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center gap-4 opacity-50">
                                <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-[10px] uppercase tracking-widest font-bold">Sincronizando regras...</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {rules.map(rule => (
                                    <div
                                        key={rule.id}
                                        className="bg-[#141814] rounded-[32px] border border-white/5 p-6 hover:border-white/10 transition-all group relative overflow-hidden"
                                    >
                                        <div className="flex items-center gap-6 relative z-10">
                                            {/* Icon */}
                                            <div className="w-14 h-14 rounded-2xl bg-[#0a0c0a] border border-white/5 flex items-center justify-center text-[#C5A059] shrink-0 group-hover:scale-110 transition-transform">
                                                <span className="material-symbols-outlined text-2xl">
                                                    {getIconByCode(rule.code)}
                                                </span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-display font-medium text-white mb-1 truncate">
                                                    {rule.description}
                                                </h3>
                                                <p className="text-xs text-white/30 font-medium">
                                                    {rule.code === 'BASE_GENERATION'
                                                        ? `Gera 1 pt a cada R$ ${10 / rule.points_reward} pagos`
                                                        : `Recompensa fixa de ${rule.points_reward} pts`}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <button
                                                    onClick={() => handleToggleRule(rule)}
                                                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${rule.is_active ? 'bg-emerald-500' : 'bg-white/10'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${rule.is_active ? 'left-7' : 'left-1'}`}></div>
                                                </button>

                                                <button
                                                    onClick={() => setEditingRule(rule)}
                                                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-[#C5A059] hover:text-black flex items-center justify-center text-white/30 transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-xl">edit</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Background Decor */}
                                        <div className="absolute top-0 right-0 p-2 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                            <span className="material-symbols-outlined !text-7xl">{getIconByCode(rule.code)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Performance Header */}
                <section className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="size-1 w-12 bg-gradient-to-r from-emerald-500 to-transparent rounded-full"></div>
                            <h2 className="text-lg font-display text-white/90 uppercase tracking-[0.1em]">Campanhas Ativas</h2>
                        </div>
                        <button onClick={() => navigate('/admin/jz-prive/campaigns')} className="text-[#C5A059] text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-2">
                            Ver todas <span className="material-symbols-outlined !text-xs">arrow_forward</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {campaigns.length === 0 ? (
                            <div className="md:col-span-2 p-12 bg-[#141814] border border-dashed border-white/10 rounded-[40px] text-center opacity-40">
                                <span className="material-symbols-outlined text-4xl mb-4 block">new_releases</span>
                                <p className="text-sm italic">Nenhuma campanha de boost ativa no momento</p>
                            </div>
                        ) : campaigns.map(camp => (
                            <div key={camp.id} className="bg-[#141814] rounded-[40px] border border-white/5 p-8 relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-full px-3 py-1 flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-[#C5A059] animate-pulse"></div>
                                        <span className="text-[8px] font-black uppercase text-[#C5A059] tracking-widest">Ativa</span>
                                    </div>
                                    <span className="text-4xl font-display font-bold text-[#C5A059] italic opacity-40 group-hover:opacity-100 transition-opacity">{camp.multiplier}x</span>
                                </div>
                                <h3 className="text-xl font-display font-medium text-white mb-2 leading-tight">{camp.internal_name}</h3>
                                <p className="text-xs text-white/30 line-clamp-2 mb-6">{camp.external_body}</p>
                                <div className="flex items-center gap-2 text-[9px] font-bold text-white/20 uppercase tracking-widest bg-black/20 p-3 rounded-2xl w-max">
                                    <span className="material-symbols-outlined !text-xs">event</span>
                                    Período Vigente
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Editing Modal */}
            {editingRule && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-[#141814] w-full max-w-md rounded-[40px] border border-white/10 p-10 space-y-8 animate-scale-in">
                        <header className="flex justify-between items-center">
                            <h2 className="text-xl font-display font-medium text-white">Configurar Regra</h2>
                            <button onClick={() => setEditingRule(null)} className="size-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </header>
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] px-2">Título da Ação</label>
                                <input
                                    value={editingRule.description}
                                    onChange={e => setEditingRule({ ...editingRule, description: e.target.value })}
                                    className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl px-6 text-sm text-white focus:border-[#C5A059]/30 outline-none"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] px-2">Pontuação base</label>
                                <input
                                    type="number"
                                    value={editingRule.points_reward}
                                    onChange={e => setEditingRule({ ...editingRule, points_reward: e.target.value })}
                                    className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl px-6 text-sm text-white focus:border-[#C5A059]/30 outline-none font-mono"
                                />
                                <p className="text-[9px] text-white/20 text-center italic mt-2">Valores decimais permitidos para regras de faturamento</p>
                            </div>
                        </div>
                        <button
                            onClick={handleUpdateRule}
                            className="w-full bg-[#C5A059] text-black h-16 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-[#C5A059]/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            )}

            {/* Creating Modal (simplified version check list) */}
            {isCreatingRule && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-[#141814] w-full max-w-md rounded-[40px] border border-white/10 p-10 space-y-8 animate-scale-in">
                        <header className="flex justify-between items-center">
                            <h2 className="text-xl font-display font-medium text-white">Nova Ação</h2>
                            <button onClick={() => setIsCreatingRule(false)} className="size-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </header>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] px-2">Código do Evento</label>
                                <input
                                    placeholder="EX: COMPARTI_STORY"
                                    value={newRule.code}
                                    onChange={e => setNewRule({ ...newRule, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                                    className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl px-6 text-sm text-white focus:border-[#C5A059]/30 outline-none"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] px-2">Descrição da Regra</label>
                                <input
                                    placeholder="Ganhe pontos ao postar story..."
                                    value={newRule.description}
                                    onChange={e => setNewRule({ ...newRule, description: e.target.value })}
                                    className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl px-6 text-sm text-white focus:border-[#C5A059]/30 outline-none"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] px-2">Pontuação</label>
                                <input
                                    type="number"
                                    value={newRule.points_reward}
                                    onChange={e => setNewRule({ ...newRule, points_reward: Number(e.target.value) })}
                                    className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl px-6 text-sm text-white focus:border-[#C5A059]/30 outline-none"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleCreateRule}
                            className="w-full bg-emerald-500 text-black h-16 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Criar Nova Regra
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPriveBalanceRules;
