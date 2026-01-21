
import React, { useState } from 'react';

const AdminPriveBalanceRules: React.FC = () => {
    const [rules, setRules] = useState([
        { id: 1, name: 'Agendamento Realizado', type: 'Serviço', points: 10, currency: 'Por R$ 100', status: 'Ativo', icon: 'calendar_month' },
        { id: 2, name: 'Indicação de Amigo', type: 'Indicação', points: 200, currency: 'Fixo', status: 'Ativo', icon: 'person_add' },
        { id: 3, name: 'Stories no Instagram', type: 'Social', points: 50, currency: 'Fixo', status: 'Ativo', icon: 'photo_camera' },
        { id: 4, name: 'Compra de Produto', type: 'Produto', points: 5, currency: 'Por R$ 100', status: 'Inativo', icon: 'shopping_bag' },
    ]);

    return (
        <div className="animate-fade-in space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-2xl font-display">Regras de Pontuação</h1>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black">Configuração do JZ Privé Balance</p>
                </div>
                <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-colors self-start md:self-auto">
                    <span className="material-symbols-outlined !text-sm">add</span>
                    Nova Regra
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rules.map(rule => (
                    <div key={rule.id} className="bg-[#0e110e] border border-white/5 rounded-[32px] p-6 flex items-center justify-between group hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${rule.status === 'Ativo' ? 'bg-white/5 text-white' : 'bg-white/5 text-white/20'}`}>
                                <span className="material-symbols-outlined text-2xl">{rule.icon}</span>
                            </div>
                            <div>
                                <h3 className={`text-lg font-display mb-1 ${rule.status === 'Ativo' ? 'text-white' : 'text-white/40'}`}>{rule.name}</h3>
                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black">
                                    <span className="text-gold-light">{rule.points} pts</span>
                                    <span className="text-white/20">•</span>
                                    <span className="text-white/40">{rule.currency}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button className="w-12 h-12 rounded-full border border-white/5 hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">edit</span>
                            </button>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={rule.status === 'Ativo'} onChange={() => { }} />
                                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gold-dark"></div>
                            </label>
                        </div>
                    </div>
                ))}

                {/* Add New Placeholder Card */}
                <div className="bg-[#0e110e] border border-dashed border-white/10 rounded-[32px] p-6 flex flex-col items-center justify-center gap-2 text-white/20 hover:text-white/40 hover:border-white/20 transition-colors cursor-pointer min-h-[100px]">
                    <span className="material-symbols-outlined text-3xl">add_circle</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Criar Regra Customizada</span>
                </div>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/10 rounded-[24px] p-6 flex gap-4 mt-8">
                <span className="material-symbols-outlined text-blue-400">info</span>
                <div>
                    <h4 className="text-sm font-bold text-blue-400 mb-1">Sobre o Acúmulo</h4>
                    <p className="text-xs text-blue-200/60 leading-relaxed">
                        Regras baseadas em valor monetário (ex: "Por R$ 100") são calculadas automaticamente no checkout.
                        Regras fixas (ex: "Indicação") requerem aprovação manual ou ação específica no sistema.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminPriveBalanceRules;
