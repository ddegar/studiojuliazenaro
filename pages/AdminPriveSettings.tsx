
import React, { useState } from 'react';

const AdminPriveSettings: React.FC = () => {
    // Mock settings - in a real app these would come from a 'loyalty_settings' table or 'studio_config'
    const [settings, setSettings] = useState({
        module_enabled: true,
        currency_name: 'JZ Privé Balance',
        currency_abbr: 'PTS',
        expiry_days: 365,
        auto_downgrade: false,
        notification_channels: {
            app: true,
            email: true,
            whatsapp: false
        }
    });

    const handleSave = () => {
        // Logic to save settings to Supabase
        alert('Configurações salvas com sucesso! (Simulação)');
    };

    return (
        <div className="flex flex-col h-full bg-background-dark text-white overflow-hidden selection:bg-accent-gold/20 relative">
            {/* Dynamic Background Elements */}
            <div className="fixed inset-0 pointer-events-none opacity-15 overflow-hidden">
                <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/20 blur-[120px] animate-float"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/20 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <header className="sticky top-0 z-[100] premium-nav-dark p-6 border-b border-white/5 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-surface-dark border border-white/10 flex items-center justify-center text-accent-gold relative shadow-huge">
                            <span className="material-symbols-outlined !text-2xl">settings_suggest</span>
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mb-1">Ecosystem Governance</p>
                            <h2 className="font-display italic text-xl leading-tight text-white tracking-tight">Configurações Privé</h2>
                        </div>
                    </div>

                    <button onClick={handleSave} className="h-14 px-8 bg-accent-gold text-primary rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] font-outfit shadow-huge hover:bg-white transition-all active:scale-95 flex items-center gap-3">
                        <span className="material-symbols-outlined !text-xl group-hover:rotate-12">save</span>
                        Salvar Diretrizes
                    </button>
                </div>
            </header>

            <main className="relative z-10 flex-1 p-8 overflow-y-auto no-scrollbar pb-40">
                <div className="max-w-4xl mx-auto space-y-10 animate-reveal">

                    {/* Module Control Shell */}
                    <section className="bg-surface-dark/40 border border-white/5 rounded-[48px] p-10 space-y-8 shadow-hugest">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-accent-gold/10 flex items-center justify-center text-accent-gold shadow-huge">
                                <span className="material-symbols-outlined !text-xl">power_settings_new</span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-display font-medium text-white tracking-tight uppercase">Estado do Módulo</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Operational Status</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-8 bg-background-dark/40 rounded-[32px] border border-white/5 hover:border-accent-gold/20 transition-all duration-500 group">
                            <div>
                                <span className="text-base font-outfit font-bold text-white block mb-1">Ecossistema JZ Privé Habilitado</span>
                                <span className="text-[11px] font-outfit text-white/40 italic">Ao desativar, o clube de fidelidade e todas as suas interfaces ficarão invisíveis para os clientes.</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={settings.module_enabled} onChange={(e) => setSettings({ ...settings, module_enabled: e.target.checked })} />
                                <div className="w-16 h-9 bg-white/5 border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-accent-gold shadow-huge"></div>
                            </label>
                        </div>
                    </section>

                    {/* Economic Architecture */}
                    <section className="bg-surface-dark/40 border border-white/5 rounded-[48px] p-10 space-y-10 shadow-hugest group">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-accent-gold/10 flex items-center justify-center text-accent-gold shadow-huge">
                                <span className="material-symbols-outlined !text-xl">account_balance</span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-display font-medium text-white tracking-tight uppercase">Arquitetura Econômica</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Tokenomics & Validation</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-accent-gold/40 uppercase tracking-[0.3em] px-4 font-outfit">Identidade da Moeda</label>
                                <input
                                    type="text"
                                    className="w-full h-16 bg-background-dark/40 border border-white/5 rounded-[20px] px-6 text-sm font-medium outline-none focus:border-accent-gold/40 focus:bg-background-dark transition-all placeholder:text-white/10"
                                    value={settings.currency_name}
                                    onChange={e => setSettings({ ...settings, currency_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-accent-gold/40 uppercase tracking-[0.3em] px-4 font-outfit">Símbolo/Abreviação</label>
                                <input
                                    type="text"
                                    className="w-full h-16 bg-background-dark/40 border border-white/5 rounded-[20px] px-6 text-sm font-medium outline-none focus:border-accent-gold/40 focus:bg-background-dark transition-all placeholder:text-white/10"
                                    value={settings.currency_abbr}
                                    onChange={e => setSettings({ ...settings, currency_abbr: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-accent-gold/40 uppercase tracking-[0.3em] px-4 font-outfit">Cripton-Ciclo (Expiração em Dias)</label>
                                <input
                                    type="number"
                                    className="w-full h-16 bg-background-dark/40 border border-white/5 rounded-[20px] px-6 text-sm font-medium outline-none focus:border-accent-gold/40 focus:bg-background-dark transition-all placeholder:text-white/10"
                                    value={settings.expiry_days}
                                    onChange={e => setSettings({ ...settings, expiry_days: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Communication Intelligence */}
                    <section className="bg-surface-dark/40 border border-white/5 rounded-[48px] p-10 space-y-10 shadow-hugest">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-accent-gold/10 flex items-center justify-center text-accent-gold shadow-huge">
                                <span className="material-symbols-outlined !text-xl">campaign</span>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-display font-medium text-white tracking-tight uppercase"> Canais de Engajamento</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Notification Logic</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {Object.entries(settings.notification_channels).map(([channel, isActive]) => (
                                <button
                                    key={channel}
                                    onClick={() => setSettings({
                                        ...settings,
                                        notification_channels: {
                                            ...settings.notification_channels,
                                            [channel as keyof typeof settings.notification_channels]: !isActive
                                        }
                                    })}
                                    className={`group relative h-32 rounded-[32px] border transition-all duration-500 overflow-hidden text-left p-6 shadow-huge ${isActive ? 'bg-accent-gold border-accent-gold' : 'bg-background-dark/40 border-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <div className="flex flex-col h-full justify-between">
                                        <span className={`material-symbols-outlined !text-2xl ${isActive ? 'text-primary' : 'text-accent-gold/40'}`}>
                                            {channel === 'app' ? 'smartphone' : channel === 'email' ? 'alternate_email' : 'chat_bubble'}
                                        </span>
                                        <div>
                                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] font-outfit ${isActive ? 'text-primary' : 'text-white'}`}>{channel}</p>
                                            <p className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-primary/60' : 'text-white/20'}`}>
                                                {isActive ? 'Ativo' : 'Desabilitado'}
                                            </p>
                                        </div>
                                    </div>

                                    {isActive && <div className="absolute -top-10 -right-10 size-24 bg-white/10 blur-[30px] rounded-full"></div>}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default AdminPriveSettings;
