
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

    return (
        <div className="animate-fade-in pb-32 max-w-4xl mx-auto">
            {/* Header */}
            <header className="flex items-center justify-between mb-12 sticky top-0 z-30 py-4 bg-[#0a0c0a]/80 backdrop-blur-md px-4 md:px-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/jz-prive')} className="material-symbols-outlined text-white/40 hover:text-white transition-colors">arrow_back</button>
                    <div>
                        <h1 className="text-xl font-display font-medium">JZ Privé Balance</h1>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Regras de Geração</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setIsCreatingRule(true)}
                        className="text-[#059669] text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                    >
                        + Nova Regra
                    </button>
                    <button className="text-[#C5A059] text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">
                        Salvar
                    </button>
                </div>
            </header>

            {/* Config Sections */}
            <div className="space-y-16">
                {/* Regras de Geração */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-[17px] font-display font-medium">Regras de Geração</h2>
                            <p className="text-[10px] uppercase tracking-widest text-white/20 font-black">Configuração do Motor de Pontos</p>
                        </div>
                        <span className="material-symbols-outlined text-white/10">tune</span>
                    </div>

                    <div className="bg-[#141814] rounded-[40px] border border-white/5 overflow-hidden">
                        {loading ? (
                            <div className="p-20 flex justify-center"><div className="w-6 h-6 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div></div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {rules.map(rule => (
                                    <div key={rule.id} className="p-8 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-[#0a0c0a] border border-white/5 flex items-center justify-center text-[#C5A059] group-hover:scale-110 transition-transform">
                                                <span className="material-symbols-outlined text-2xl">
                                                    {rule.code === 'BASE_GENERATION' ? 'payments' :
                                                        rule.code === 'BIRTHDAY' ? 'card_giftcard' :
                                                            rule.code === 'REFERRAL' ? 'person_add' :
                                                                rule.code === 'CHECKIN' ? 'location_on' : 'camera_alt'}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="text-sm font-bold text-white tracking-wide">{rule.description}</h3>
                                                    <button
                                                        onClick={() => handleToggleRule(rule)}
                                                        className={`w-8 h-4 rounded-full relative transition-colors ${rule.is_active ? 'bg-[#059669]' : 'bg-white/10'}`}
                                                    >
                                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${rule.is_active ? 'left-4.5' : 'left-0.5'}`}></div>
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-white/40 font-medium">
                                                    {rule.code === 'BASE_GENERATION' ? `1 pt a cada R$ ${10 / rule.points_reward} em serviços` :
                                                        `Bônus fixo de ${rule.points_reward} pts`}
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => setEditingRule(rule)} className="text-white/20 hover:text-[#C5A059] transition-colors">
                                            <span className="material-symbols-outlined text-xl">edit</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Performance de Campanhas */}
                <section>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-[17px] font-display font-medium text-white">Performance de Campanhas</h2>
                            <p className="text-[10px] uppercase tracking-widest text-white/20 font-black">Gestão de Promoções Ativas</p>
                        </div>
                        <button onClick={() => navigate('/admin/jz-prive/campaigns')} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full transition-all group">
                            <span className="material-symbols-outlined text-xs text-[#059669]">add</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/60 group-hover:text-white">Nova</span>
                        </button>
                    </div>

                    <div className="space-y-6">
                        {campaigns.length === 0 ? (
                            <div className="p-12 border border-dashed border-white/5 rounded-[40px] text-center opacity-20 italic text-xs">
                                Nenhuma campanha ativa no momento
                            </div>
                        ) : campaigns.map(camp => (
                            <div key={camp.id} className="relative bg-[#141814] rounded-[40px] border border-white/5 p-10 overflow-hidden group hover:border-[#C5A059]/20 transition-all">
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-display font-medium text-white leading-tight max-w-[200px]">
                                            {camp.internal_name}
                                        </h3>
                                        <p className="text-xs text-white/40 leading-relaxed max-w-[250px]">
                                            {camp.external_body}
                                        </p>
                                    </div>
                                    <div className="bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-full px-3 py-1 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse"></div>
                                        <span className="text-[8px] font-black uppercase text-[#C5A059] tracking-widest">Ativa</span>
                                    </div>
                                </div>

                                <div className="mt-12 flex items-end justify-between relative z-10">
                                    <div className="flex flex-col">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-5xl font-display font-bold text-[#C5A059] italic">{camp.multiplier}x</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059]/60">Boost</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-4 text-white/20">
                                            <span className="material-symbols-outlined text-xs">calendar_today</span>
                                            <span className="text-[9px] font-bold uppercase tracking-widest">12 Out - 14 Out</span>
                                        </div>
                                    </div>
                                    <button className="pb-1 border-b border-[#C5A059] text-[9px] font-black uppercase tracking-[0.2em] text-[#C5A059]">
                                        Status
                                    </button>
                                </div>

                                {/* Abstract Glow Effect */}
                                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#C5A059]/5 blur-[80px] rounded-full group-hover:bg-[#C5A059]/10 transition-all duration-1000"></div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="text-center pt-8">
                    <button className="text-[9px] font-black uppercase tracking-[0.3em] text-[#C5A059] border-b border-[#C5A059]/30 pb-1">
                        Histórico de Performance
                    </button>
                </div>
            </div>

            {/* Bottom Tab Navigation (Floating Concept) */}
            {/* Bottom Tab Navigation (Floating Concept) */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#141814]/90 backdrop-blur-xl border border-white/5 p-1.5 rounded-full flex gap-1 shadow-2xl z-40 w-max max-w-[95vw]">
                {[
                    { id: 'SALDO', label: 'Saldo', icon: 'payments' },
                    { id: 'REGRAS', label: 'Regras', icon: 'tune' },
                    { id: 'CAMPANHAS', label: 'Campanhas', icon: 'campaign' },
                    { id: 'ADMIN', label: 'Admin', icon: 'admin_panel_settings' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-4 md:px-6 py-2.5 rounded-full transition-all ${activeTab === tab.id ? 'bg-[#C5A059] text-[#0a0c0a]' : 'text-white/40 hover:text-white'}`}
                    >
                        <span className="material-symbols-outlined text-base md:text-lg">{tab.icon}</span>
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </nav>

            {/* Editing Modal */}
            {editingRule && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="bg-[#141814] w-full max-w-md rounded-[40px] border border-white/10 p-10 space-y-8 animate-scale-in">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-display font-medium text-white">Editar Regra</h2>
                            <button onClick={() => setEditingRule(null)} className="material-symbols-outlined text-white/20 hover:text-white">close</button>
                        </div>
                        <div className="space-y-6">
                            <div className="group">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/20 block mb-3">Descrição</label>
                                <input
                                    value={editingRule.description}
                                    onChange={e => setEditingRule({ ...editingRule, description: e.target.value })}
                                    className="w-full bg-[#0a0c0a] border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:border-[#C5A059]/30 outline-none"
                                />
                            </div>
                            <div className="group">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/20 block mb-3">Valor da Recompensa (Pontos)</label>
                                <input
                                    type="number"
                                    value={editingRule.points_reward}
                                    onChange={e => setEditingRule({ ...editingRule, points_reward: e.target.value })}
                                    className="w-full bg-[#0a0c0a] border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:border-[#C5A059]/30 outline-none"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleUpdateRule}
                            className="w-full bg-[#C5A059] text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] transition-all"
                        >
                            Confirmar Alteração
                        </button>
                    </div>
                </div>
            )}

            {/* Creating Modal */}
            {isCreatingRule && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="bg-[#141814] w-full max-w-md rounded-[40px] border border-white/10 p-10 space-y-8 animate-scale-in">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-display font-medium text-white">Nova Regra</h2>
                            <button onClick={() => setIsCreatingRule(false)} className="material-symbols-outlined text-white/20 hover:text-white">close</button>
                        </div>
                        <div className="space-y-6">
                            <div className="group">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/20 block mb-3">Código (Snake Case)</label>
                                <input
                                    placeholder="EX: CHECKIN_DOMINGO"
                                    value={newRule.code}
                                    onChange={e => setNewRule({ ...newRule, code: e.target.value })}
                                    className="w-full bg-[#0a0c0a] border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:border-[#C5A059]/30 outline-none"
                                />
                            </div>
                            <div className="group">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/20 block mb-3">Descrição</label>
                                <input
                                    placeholder="Check-in especial aos domingos"
                                    value={newRule.description}
                                    onChange={e => setNewRule({ ...newRule, description: e.target.value })}
                                    className="w-full bg-[#0a0c0a] border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:border-[#C5A059]/30 outline-none"
                                />
                            </div>
                            <div className="group">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/20 block mb-3">Pontos</label>
                                <input
                                    type="number"
                                    value={newRule.points_reward}
                                    onChange={e => setNewRule({ ...newRule, points_reward: Number(e.target.value) })}
                                    className="w-full bg-[#0a0c0a] border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:border-[#C5A059]/30 outline-none"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleCreateRule}
                            className="w-full bg-[#059669] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] transition-all"
                        >
                            Criar Regra
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPriveBalanceRules;

