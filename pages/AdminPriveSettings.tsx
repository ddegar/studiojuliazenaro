
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
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            <header>
                <h1 className="text-2xl font-display">Ajustes Gerais</h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black">Configurações do Ecossistema Privé</p>
            </header>

            <div className="space-y-6">
                {/* Module Control */}
                <div className="bg-[#0e110e] border border-white/5 rounded-[32px] p-8">
                    <h3 className="font-display text-lg mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-gold-light">toggle_on</span>
                        Controle do Módulo
                    </h3>

                    <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                        <div>
                            <span className="text-sm font-bold text-white block">Módulo JZ Privé Ativo</span>
                            <span className="text-xs text-white/40">Desativar ocultará o clube para todos os clientes</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={settings.module_enabled} onChange={(e) => setSettings({ ...settings, module_enabled: e.target.checked })} />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>
                </div>

                {/* Economic Rules */}
                <div className="bg-[#0e110e] border border-white/5 rounded-[32px] p-8">
                    <h3 className="font-display text-lg mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-gold-light">account_balance_wallet</span>
                        Economia do Token
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-2">Nome da Moeda</label>
                            <input type="text" className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm outline-none focus:border-gold-dark/40"
                                value={settings.currency_name} onChange={e => setSettings({ ...settings, currency_name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-2">Abreviação</label>
                            <input type="text" className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm outline-none focus:border-gold-dark/40"
                                value={settings.currency_abbr} onChange={e => setSettings({ ...settings, currency_abbr: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-2">Validade dos Pontos (Dias)</label>
                            <input type="number" className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm outline-none focus:border-gold-dark/40"
                                value={settings.expiry_days} onChange={e => setSettings({ ...settings, expiry_days: parseInt(e.target.value) })} />
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-[#0e110e] border border-white/5 rounded-[32px] p-8">
                    <h3 className="font-display text-lg mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-gold-light">notifications_active</span>
                        Canais de Notificação
                    </h3>

                    <div className="space-y-4">
                        {Object.entries(settings.notification_channels).map(([channel, isActive]) => (
                            <label key={channel} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
                                <span className="text-sm font-bold text-white capitalize">{channel}</span>
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${isActive ? 'bg-gold-dark border-gold-dark' : 'border-white/20'}`}>
                                    {isActive && <span className="material-symbols-outlined text-black text-xs">check</span>}
                                </div>
                                <input type="checkbox" className="hidden" checked={isActive}
                                    onChange={() => setSettings({
                                        ...settings,
                                        notification_channels: {
                                            ...settings.notification_channels,
                                            [channel as keyof typeof settings.notification_channels]: !isActive
                                        }
                                    })}
                                />
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-8">
                <button onClick={handleSave} className="px-8 py-4 bg-gold-dark text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gold-light transition-colors shadow-lg shadow-gold-dark/10">
                    Salvar Alterações
                </button>
            </div>
        </div>
    );
};

export default AdminPriveSettings;
