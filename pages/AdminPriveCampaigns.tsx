
import React, { useState } from 'react';

const AdminPriveCampaigns: React.FC = () => {
    const [campaigns, setCampaigns] = useState([
        { id: 1, title: 'Semana do Cliente', status: 'Ativa', multiplier: '2x', type: 'Pontos Extras', audience: 'Todos', startDate: '2024-03-10', endDate: '2024-03-17' },
        { id: 2, title: 'Aniversariantes Março', status: 'Agendada', multiplier: '1.5x', type: 'Pontos Extras', audience: 'Aniversariantes', startDate: '2024-03-01', endDate: '2024-03-31' },
    ]);

    return (
        <div className="animate-fade-in space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-2xl font-display">Campanhas & Notificações</h1>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black">Engajamento e Aceleradores</p>
                </div>
                <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-colors self-start md:self-auto">
                    <span className="material-symbols-outlined !text-sm">add_alert</span>
                    Nova Campanha
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#0e110e] border border-white/5 rounded-[32px] p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-purple-500">campaign</span>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 font-black">Ativas Agora</p>
                            <p className="text-2xl font-display">01</p>
                        </div>
                    </div>
                    <div className="bg-[#0e110e] border border-white/5 rounded-[32px] p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-500">event_upcoming</span>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 font-black">Agendadas</p>
                            <p className="text-2xl font-display">01</p>
                        </div>
                    </div>
                    <div className="bg-[#0e110e] border border-white/5 rounded-[32px] p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40 font-black">Concluídas</p>
                            <p className="text-2xl font-display">14</p>
                        </div>
                    </div>
                </div>

                {/* Campaign List */}
                <div className="lg:col-span-2 space-y-4">
                    {campaigns.map(camp => (
                        <div key={camp.id} className="bg-[#0e110e] border border-white/5 rounded-[32px] p-6 hover:border-white/10 transition-colors group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${camp.status === 'Ativa' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                            {camp.status}
                                        </span>
                                        <span className="text-[10px] text-white/40 font-mono">{camp.startDate} - {camp.endDate}</span>
                                    </div>
                                    <h3 className="text-xl font-display">{camp.title}</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase tracking-widest text-white/40 font-black">Multiplicador</p>
                                    <p className="text-xl font-display text-gold-light">{camp.multiplier}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex gap-4">
                                    <div>
                                        <p className="text-[8px] uppercase tracking-widest text-white/20 font-black mb-1">Tipo</p>
                                        <p className="text-xs font-bold">{camp.type}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] uppercase tracking-widest text-white/20 font-black mb-1">Público</p>
                                        <p className="text-xs font-bold">{camp.audience}</p>
                                    </div>
                                </div>
                                <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white/40 hover:text-white">
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Automation Rules / Quick Actions */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#141814] border border-white/5 rounded-[32px] p-8">
                        <h3 className="text-lg font-display mb-4">Automações Rápidas</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                                <div>
                                    <p className="text-sm font-bold">Aniversário</p>
                                    <p className="text-[10px] text-white/40">2x pontos no mês</p>
                                </div>
                                <div className="w-12 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center px-1 justify-end cursor-pointer">
                                    <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-lg"></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                                <div>
                                    <p className="text-sm font-bold">Resgate Ausente</p>
                                    <p className="text-[10px] text-white/40">Notificar após 30 dias</p>
                                </div>
                                <div className="w-12 h-6 rounded-full bg-white/5 border border-white/10 flex items-center px-1 justify-start cursor-pointer">
                                    <div className="w-4 h-4 rounded-full bg-white/20 shadow-lg"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPriveCampaigns;
