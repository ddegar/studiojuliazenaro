import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const AdminShellPrive: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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

    const handleNavigation = (path: string) => {
        navigate(path);
        setIsMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-[#0a0c0a] text-white font-sans relative">

            {/* Mobile/Desktop Header Trigger */}
            <header className="fixed top-0 left-0 right-0 h-20 bg-[#0a0c0a]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 z-40">
                <div className="flex items-center gap-8">
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined text-3xl">menu</span>
                    </button>
                    <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-[#C5A059] text-xl opacity-40">diamond</span>
                        <span className="font-display font-medium text-lg tracking-tight text-white">JZ Privé Admin</span>
                    </div>
                </div>
            </header>

            {/* Overlay Backdrop */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity duration-300"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Drawer Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 w-[280px] bg-[#0e110e] border-r border-white/5 z-[60] transform transition-transform duration-300 ease-in-out flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Drawer Header */}
                <div className="p-6 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gold-dark flex items-center justify-center text-slate-900">
                            <span className="material-symbols-outlined mb-0.5">diamond</span>
                        </div>
                        <div>
                            <h1 className="font-display text-lg leading-none">JZ Privé</h1>
                            <p className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-black">Admin Club</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsMenuOpen(false)}
                        className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 no-scrollbar">
                    <p className="px-4 text-[10px] uppercase tracking-widest text-white/20 font-black mb-4">Menu Principal</p>
                    {menuItems.map(item => (
                        <button
                            key={item.path}
                            onClick={() => handleNavigation(item.path)}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${isActive(item.path) ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                        >
                            <span className={`material-symbols-outlined ${isActive(item.path) ? 'text-gold-light' : ''}`}>{item.icon}</span>
                            <span className="text-sm font-bold tracking-wide">{item.label}</span>
                        </button>
                    ))}

                    <div className="mt-8 pt-8 border-t border-white/5">
                        <button onClick={() => navigate('/admin')} className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-white/40 hover:bg-white/5 hover:text-white transition-all">
                            <span className="material-symbols-outlined">arrow_back</span>
                            <span className="text-sm font-bold tracking-wide">Voltar ao Admin</span>
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="pt-20 px-6 md:px-10 pb-10 min-h-screen relative overflow-hidden">
                {/* Decorative background blurs */}
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-gold-dark/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

                <div className="relative z-10 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminShellPrive;
