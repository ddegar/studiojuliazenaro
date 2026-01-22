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
        <div className="flex flex-col min-h-screen bg-[#0a0c0a] text-white font-sans overflow-x-hidden pb-24">

            {/* Title Section */}
            <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/admin/jz-prive')}
                        className="size-12 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-white leading-tight">Regras de<br />Saldo</h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059] font-black mt-1">JZ PRIVÉ CLUB</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreatingRule(true)}
                    className="bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-[#C5A059] px-6 py-3 rounded-full hover:bg-white/10 transition-all"
                >
                    + NOVA REGRA
                </button>
            </div>

            <main className="flex-1 px-6 py-8 space-y-12">
                {/* Generation Rules Section */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-[2px] w-12 bg-gradient-to-r from-[#C5A059] to-transparent rounded-full font-black"></div>
                        <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em]">Configuração de Pontos</h2>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center gap-4 opacity-50">
                                <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-[10px] uppercase tracking-widest font-bold">Carregando...</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {rules.map(rule => (
                                    <div
                                        key={rule.id}
                                        className="bg-[#141814]/40 rounded-[32px] border border-white/5 p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-5 group hover:border-[#C5A059]/20 transition-all"
                                    >
                                        {/* Icon & Title Group */}
                                        <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
                                            <div className="size-14 md:size-16 rounded-full bg-black/40 border border-white/5 flex items-center justify-center text-[#C5A059] shrink-0">
                                                <span className="material-symbols-outlined text-xl md:text-2xl">
                                                    {getIconByCode(rule.code)}
                                                </span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base md:text-lg font-display font-medium text-white mb-0.5 leading-tight truncate">
                                                    {rule.description}
                                                </h3>
                                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider leading-relaxed">
                                                    {rule.code === 'BASE_GENERATION'
                                                        ? <span className="flex flex-wrap items-center gap-1">Gera <span className="text-[#C5A059]">1 pt</span> a cada <span className="text-white">R$ {10 / (rule.points_reward || 1)}</span> pagos</span>
                                                        : <span className="flex flex-wrap items-center gap-1">Recompensa fixa de <span className="text-[#C5A059]">{rule.points_reward} pts</span></span>}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                                            <button
                                                onClick={() => handleToggleRule(rule)}
                                                className={`w-11 h-6 rounded-full relative transition-all duration-500 ${rule.is_active ? 'bg-emerald-500' : 'bg-white/10'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-500 ${rule.is_active ? 'left-6 shadow-lg shadow-emerald-900/40' : 'left-1'}`}></div>
                                            </button>

                                            <button
                                                onClick={() => setEditingRule(rule)}
                                                className="size-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:bg-[#C5A059] hover:text-black transition-all"
                                            >
                                                <span className="material-symbols-outlined !text-sm">edit</span>
                                            </button>
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
                                <h3 className="text-lg font-display font-medium text-white mb-2 leading-tight truncate">{camp.internal_name}</h3>
                                <p className="text-[11px] text-white/40 line-clamp-2 mb-6 h-8">{camp.external_body}</p>
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
