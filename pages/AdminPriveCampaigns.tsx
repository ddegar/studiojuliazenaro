
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

const AdminPriveCampaigns: React.FC = () => {
    const navigate = useNavigate();
    // State for Campaign Attributes
    const [internalName, setInternalName] = useState('');
    const [multiplier, setMultiplier] = useState(2);
    const [targetTiers, setTargetTiers] = useState<string[]>(['SELECT']);
    const [channels, setChannels] = useState<string[]>(['PUSH']);
    const [externalTitle, setExternalTitle] = useState('');
    const [externalBody, setExternalBody] = useState('');
    const [isLaunching, setIsLaunching] = useState(false);

    const multipliers = [2, 3, 5, 10];
    const tiers = ['SELECT', 'PRIME', 'SIGNATURE', 'PRIVÉ'];
    const availableChannels = [
        { id: 'PUSH', name: 'Push Notification Elite', icon: 'notifications_active' },
        { id: 'BANNER', name: 'Banner Hub JZ', icon: 'auto_awesome_motion' },
        { id: 'WHATSAPP', name: 'WhatsApp Concierge Direct', icon: 'chat_bubble' }
    ];

    const toggleTier = (tier: string) => {
        setTargetTiers(prev =>
            prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]
        );
    };

    const toggleChannel = (channel: string) => {
        setChannels(prev =>
            prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]
        );
    };

    const handleLaunch = async () => {
        if (!internalName || !externalTitle || !externalBody) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        try {
            setIsLaunching(true);
            const { error } = await supabase
                .from('loyalty_campaigns')
                .insert({
                    internal_name: internalName,
                    multiplier: multiplier,
                    target_audiences: targetTiers,
                    channels: channels,
                    external_title: externalTitle,
                    external_body: externalBody,
                    status: 'active',
                    is_active: true,
                    title: internalName, // For backward compatibility
                    description: externalBody // For backward compatibility
                });

            if (error) throw error;

            alert('Campanha lançada com sucesso! 🚀');
            navigate('/admin/jz-prive/balance-rules');
        } catch (err: any) {
            console.error(err);
            alert('Erro ao lançar campanha: ' + err.message);
        } finally {
            setIsLaunching(false);
        }
    };

    return (
        <div className="animate-fade-in pb-32 max-w-4xl mx-auto">
            {/* Header */}
            <header className="flex items-center justify-between mb-12 sticky top-0 z-30 py-4 bg-[#0a0c0a]/80 backdrop-blur-md px-4 md:px-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/jz-prive/balance-rules')}
                        className="material-symbols-outlined text-white/40 hover:text-white transition-colors"
                    >
                        close
                    </button>
                    <h1 className="text-xl font-display font-medium">Nova Campanha</h1>
                </div>
                <button
                    onClick={handleLaunch}
                    disabled={isLaunching}
                    className="bg-[#C5A059] text-[#0a0c0a] px-8 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#C5A059]/20 disabled:opacity-50"
                >
                    {isLaunching ? 'Lançando...' : 'Lançar'}
                </button>
            </header>

            <div className="space-y-12">
                {/* Atributos Executivos */}
                <section>
                    <div className="flex items-center gap-2 mb-6 text-[#C5A059]">
                        <span className="material-symbols-outlined text-xl">temp_preferences_custom</span>
                        <h2 className="text-sm font-display font-bold uppercase tracking-widest">Atributos Executivos</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="group">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 block mb-3 group-focus-within:text-[#C5A059] transition-colors">Nome da Campanha</label>
                            <input
                                placeholder="Ex: Grand Cru Tasting Experience"
                                value={internalName}
                                onChange={e => setInternalName(e.target.value)}
                                className="w-full bg-[#141814] border border-white/5 rounded-2xl py-5 px-6 text-sm text-white focus:border-[#C5A059]/30 outline-none transition-all placeholder:text-white/10"
                            />
                        </div>

                        <div>
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 block mb-4">Potencializador de Balance</label>
                            <div className="flex gap-3">
                                {multipliers.map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setMultiplier(m)}
                                        className={`flex-1 py-4 rounded-2xl border text-sm font-display font-bold transition-all ${multiplier === m
                                            ? 'bg-[#C5A059]/10 border-[#C5A059] text-[#C5A059] shadow-inner shadow-[#C5A059]/10'
                                            : 'bg-[#141814] border-white/5 text-white/40 hover:bg-white/5'}`}
                                    >
                                        {m}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Público Alvo */}
                <section>
                    <div className="flex items-center gap-2 mb-6 text-[#C5A059]">
                        <span className="material-symbols-outlined text-xl">verified_user</span>
                        <h2 className="text-sm font-display font-bold uppercase tracking-widest">Público Alvo</h2>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {tiers.map(tier => (
                            <button
                                key={tier}
                                onClick={() => toggleTier(tier)}
                                className={`px-8 py-4 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${targetTiers.includes(tier)
                                    ? 'bg-[#C5A059]/10 border-[#C5A059] text-[#C5A059]'
                                    : 'bg-[#141814] border-white/5 text-white/20'}`}
                            >
                                {tier}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Canais Privé */}
                <section>
                    <div className="flex items-center gap-2 mb-6 text-[#C5A059]">
                        <span className="material-symbols-outlined text-xl">hub</span>
                        <h2 className="text-sm font-display font-bold uppercase tracking-widest">Canais Privé</h2>
                    </div>
                    <div className="space-y-3">
                        {availableChannels.map(channel => (
                            <button
                                key={channel.id}
                                onClick={() => toggleChannel(channel.id)}
                                className={`w-full flex items-center justify-between p-5 rounded-3xl border transition-all ${channels.includes(channel.id)
                                    ? 'bg-[#141814] border-[#059669]/30 text-white'
                                    : 'bg-[#141814] border-white/5 text-white/40 opacity-60'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className={`material-symbols-outlined text-xl ${channels.includes(channel.id) ? 'text-[#C5A059]' : ''}`}>
                                        {channel.icon}
                                    </span>
                                    <span className="text-[11px] font-bold uppercase tracking-wider">{channel.name}</span>
                                </div>
                                <span className={`material-symbols-outlined text-xl ${channels.includes(channel.id) ? 'text-[#059669]' : 'text-white/10'}`}>
                                    {channels.includes(channel.id) ? 'check_circle' : 'radio_button_unchecked'}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Conteúdo da Mensagem */}
                <section>
                    <div className="flex items-center gap-2 mb-6 text-[#C5A059]">
                        <span className="material-symbols-outlined text-xl">edit_document</span>
                        <h2 className="text-sm font-display font-bold uppercase tracking-widest">Conteúdo da Mensagem</h2>
                    </div>
                    <div className="space-y-6">
                        <div className="group">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 block mb-3">Título da Notificação</label>
                            <input
                                placeholder="O privilégio de ser JZ Privé..."
                                value={externalTitle}
                                onChange={e => setExternalTitle(e.target.value)}
                                className="w-full bg-[#141814] border border-white/5 rounded-2xl py-5 px-6 text-sm text-white focus:border-[#C5A059]/30 outline-none transition-all placeholder:text-white/10"
                            />
                        </div>
                        <div className="group">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 block mb-3">Corpo da Mensagem</label>
                            <textarea
                                placeholder="Descreva o benefício aspiracional..."
                                value={externalBody}
                                onChange={e => setExternalBody(e.target.value)}
                                rows={4}
                                className="w-full bg-[#141814] border border-white/5 rounded-3xl py-5 px-6 text-sm text-white focus:border-[#C5A059]/30 outline-none transition-all placeholder:text-white/10 resize-none"
                            />
                        </div>
                    </div>
                </section>

                {/* Simulação do Ecossistema */}
                <section className="pt-12 border-t border-white/5 flex flex-col items-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-3">Simulação do Ecossistema</p>
                    <h3 className="text-xl font-display font-medium mb-12">Pré-visualização do Membro</h3>

                    {/* Phone Mockup */}
                    <div className="relative w-[300px] h-[600px] bg-[#141414] rounded-[50px] border-[8px] border-[#222] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden">
                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#222] rounded-b-2xl z-20"></div>

                        {/* Background Image / Screen content */}
                        <div className="absolute inset-0 bg-[#0a0c0a] flex flex-col p-6 items-center">
                            <div className="mt-20 w-full">
                                {/* Push Notification Preview */}
                                <div className="bg-[#1c1c1e]/90 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/10 animate-fade-in">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 bg-[#C5A059] rounded flex items-center justify-center text-[10px] font-bold text-black">JZ</div>
                                            <span className="text-[10px] uppercase font-black tracking-widest text-white/40">JZ PRIVÉ</span>
                                        </div>
                                        <span className="text-[9px] text-white/20">agora</span>
                                    </div>
                                    <h4 className="text-xs font-bold text-white mb-1 line-clamp-1">{externalTitle || 'Título da Notificação'}</h4>
                                    <p className="text-[11px] text-white/60 leading-snug line-clamp-3">{externalBody || 'O conteúdo da sua mensagem aparecerá aqui para o cliente.'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Bottom indicator */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/20 rounded-full"></div>
                    </div>
                    <p className="text-[8px] italic text-white/10 mt-8 tracking-wide">Representação fidedigna da interface Antigravity no dispositivo real do membro</p>
                </section>
            </div>
        </div>
    );
};

export default AdminPriveCampaigns;

