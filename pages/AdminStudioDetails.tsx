
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const AdminStudioDetails: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [configs, setConfigs] = useState<{ [key: string]: any }>({});

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('studio_config').select('*');
            if (error) throw error;

            const configMap = (data || []).reduce((acc: any, item: any) => {
                acc[item.key] = item.value;
                return acc;
            }, {});

            setConfigs(configMap);
        } catch (err) {
            console.error('Error fetching configs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            const updates = Object.entries(configs).map(([key, value]) => ({
                key,
                value,
                updated_at: new Date().toISOString()
            }));

            for (const update of updates) {
                await supabase
                    .from('studio_config')
                    .update({ value: update.value, updated_at: update.updated_at })
                    .eq('key', update.key);
            }

            alert('Configurações salvas com sucesso! ✨');
            navigate('/admin/settings');
        } catch (err: any) {
            alert('Erro ao salvar: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-dark">
                <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background-dark text-white">
            <header className="p-4 border-b border-white/5 flex items-center justify-between glass-nav !bg-background-dark/80 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
                    <h1 className="text-lg font-bold">Dados do Estúdio</h1>
                </div>
            </header>

            <main className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar pb-32">
                <div className="space-y-6">
                    <div className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">contact_support</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-base">Contato Central</h3>
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-0.5">WhatsApp Principal</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1">Número do WhatsApp (com DDD)</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-bold">+55</span>
                                    <input
                                        type="tel"
                                        placeholder="14 99999-9999"
                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-14 pr-5 text-sm focus:ring-1 focus:ring-accent-gold outline-none font-bold"
                                        value={configs.whatsapp_central?.replace('55', '') || ''}
                                        onChange={e => setConfigs({ ...configs, whatsapp_central: '55' + e.target.value.replace(/\D/g, '') })}
                                    />
                                </div>
                                <p className="text-[9px] text-gray-600 italic px-1 leading-relaxed">
                                    Este número será usado nos botões de suporte, FAQ e dúvidas por todo o aplicativo.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="size-12 rounded-2xl bg-accent-gold/10 flex items-center justify-center text-accent-gold">
                                <span className="material-symbols-outlined">chat</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-base">Templates de WhatsApp</h3>
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-0.5">Personalização de Mensagens</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1">Mensagem de Confirmação (Timeline)</label>
                                <textarea
                                    className="w-full min-h-[100px] bg-white/5 border border-white/10 rounded-2xl p-5 text-sm focus:ring-1 focus:ring-accent-gold outline-none leading-relaxed resize-none"
                                    value={configs.whatsapp_msg_template || ''}
                                    onChange={e => setConfigs({ ...configs, whatsapp_msg_template: e.target.value })}
                                    placeholder="Use {cliente}, {servico} e {hora} para preenchimento dinâmico."
                                />
                                <p className="text-[9px] text-gray-600 italic px-1">
                                    Dica: Use <b>{"{cliente}"}</b>, <b>{"{servico}"}</b> e <b>{"{hora}"}</b> como etiquetas dinâmicas.
                                </p>
                            </div>

                            <div className="space-y-2 opacity-60">
                                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1 flex items-center gap-2">
                                    Lembrete Automático 24h
                                    <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded italic">Em Breve</span>
                                </label>
                                <textarea
                                    className="w-full min-h-[80px] bg-white/5 border border-white/10 rounded-2xl p-5 text-sm outline-none leading-relaxed resize-none cursor-not-allowed"
                                    value={configs.whatsapp_reminder_24h || ''}
                                    onChange={e => setConfigs({ ...configs, whatsapp_reminder_24h: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary/5 p-8 rounded-[40px] border border-primary/10 space-y-4 shadow-inner">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">info</span>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Gestão de Horários</h3>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-relaxed italic pr-4">
                            Os horários de funcionamento agora são configurados individualmente para cada profissional em seus perfis.
                            Isso permite maior flexibilidade para sua equipe.
                        </p>
                        <button
                            onClick={() => navigate('/admin/working-hours')}
                            className="bg-primary/20 text-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/30 transition-all border border-primary/20"
                        >
                            Ver Horários da Equipe
                        </button>
                    </div>
                </div>
            </main>

            <div className="p-6 fixed bottom-0 inset-x-0 glass-nav !bg-background-dark/90 border-t border-white/5 z-50">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full h-16 bg-primary text-white rounded-2xl font-bold text-xs uppercase tracking-[0.3em] shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transition-all"
                >
                    {saving ? <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'SALVAR ALTERAÇÕES'}
                </button>
            </div>
        </div>
    );
};

export default AdminStudioDetails;
