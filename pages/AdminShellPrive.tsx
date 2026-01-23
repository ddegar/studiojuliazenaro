import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const AdminShellPrive: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { path: '/admin/jz-prive', icon: 'dashboard', label: 'Painel' },
        { path: '/admin/jz-prive/members', icon: 'group', label: 'Membros' },
        { path: '/admin/jz-prive/levels', icon: 'military_tech', label: 'Níveis' },
        { path: '/admin/jz-prive/rewards', icon: 'card_giftcard', label: 'Mimos' },
        { path: '/admin/jz-prive/campaigns', icon: 'campaign', label: 'Campanhas' },
        { path: '/admin/jz-prive/balance-rules', icon: 'rules', label: 'Regras' },
        { path: '/admin/jz-prive/settings', icon: 'settings', label: 'Ajustes' },
    ];

    const isActive = (path: string) => {
        if (path === '/admin/jz-prive' && location.pathname === '/admin/jz-prive') return true;
        if (path !== '/admin/jz-prive' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="min-h-screen bg-[#0a0c0a] text-white font-sans relative flex flex-col">

            {/* Header com Navegação Horizontal (Tabs) */}
            <header className="sticky top-0 z-30 bg-[#0a0c0a]/90 backdrop-blur-xl border-b border-white/5 pt-8 px-6 md:px-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gold-dark flex items-center justify-center text-slate-900 shadow-lg shadow-gold-dark/20">
                            <span className="material-symbols-outlined text-2xl">diamond</span>
                        </div>
                        <div>
                            <h1 className="font-display font-bold text-2xl leading-none text-white tracking-tight">JZ Privé</h1>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-gold-light font-black mt-1">Clube de Vantagens</p>
                        </div>
                    </div>
                    {/* Actions if needed */}
                </div>

                <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0">
                    {menuItems.map(item => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl border-b-2 transition-all whitespace-nowrap ${isActive(item.path)
                                ? 'border-gold-light bg-white/5 text-white'
                                : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span className={`material-symbols-outlined !text-lg ${isActive(item.path) ? 'text-gold-light' : ''}`}>{item.icon}</span>
                            <span className="text-xs font-bold tracking-wide uppercase">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-6 md:px-10 py-8 relative overflow-hidden">
                {/* Decorative background blurs */}
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-gold-dark/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

                <div className="relative z-10 max-w-6xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminShellPrive;
