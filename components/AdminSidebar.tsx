
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import Logo from './Logo';

interface AdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMaster, setIsMaster] = useState(false);

    useEffect(() => {
        checkRole();
    }, []);

    const checkRole = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('role, email').eq('id', user.id).single();
            if (data) {
                const master = ['MASTER_ADMIN', 'ADMIN', 'PROFESSIONAL_ADMIN'].includes(data.role) || data.email === 'admin@juliazenaro.com';
                setIsMaster(master);
            }
        }
    };

    const MENU_ITEMS = [
        { label: 'Dashboard', icon: 'grid_view', path: '/admin' },
        { label: 'Minha Agenda', icon: 'calendar_month', path: '/admin/agenda' },
        { label: 'Clientes', icon: 'groups', path: '/admin/clients', masterOnly: true },
        { label: 'Equipe / Staff', icon: 'badge', path: '/admin/professionals', masterOnly: true },
        { label: 'Catálogo / Serviços', icon: 'category', path: '/admin/services' },
        { label: 'Club JZ Privé', icon: 'diamond', path: '/admin/jz-prive', masterOnly: true },
        { label: 'Financeiro', icon: 'payments', path: '/admin/finance' },
        { label: 'Conteúdo (Feed)', icon: 'history_toggle_off', path: '/admin/content' },
        { label: 'Notificações', icon: 'notifications', path: '/admin/notifications', masterOnly: true },
        { label: 'Meu Perfil', icon: 'person', path: '/admin/profile' },
        { label: 'Ajustes do Estúdio', icon: 'settings', path: '/admin/settings', masterOnly: true },
        { label: 'Recursos Extra', subheader: true, masterOnly: true },
        { label: 'Dicas (Pré/Pós)', icon: 'lightbulb', path: '/admin/tips' },
        { label: 'FAQ (Dúvidas)', icon: 'help', path: '/admin/faq', masterOnly: true },
        { label: 'Depoimentos', icon: 'reviews', path: '/admin/testimonials', masterOnly: true },
    ];

    return (
        <aside className={`fixed lg:static inset-y-0 left-0 z-[70] w-72 bg-[#1c1f24] border-r border-white/5 flex flex-col transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-6 flex items-center justify-between border-b border-white/5">
                <Logo size="sm" forceLight={true} />
                <button onClick={onClose} className="lg:hidden"><span className="material-symbols-outlined text-white">close</span></button>
            </div>
            <nav className="p-4 space-y-1 overflow-y-auto no-scrollbar flex-1">
                {MENU_ITEMS.map((item, idx) => {
                    if (item.masterOnly && !isMaster) return null;
                    if (item.subheader) return (
                        <div key={idx} className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-4 pt-6 pb-2">
                            {item.label}
                        </div>
                    );

                    const isActive = item.path ? location.pathname === item.path : false;
                    return (
                        <button
                            key={idx}
                            onClick={() => { if (item.path) { navigate(item.path); onClose(); } }}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${isActive ? 'bg-accent-gold/10 text-accent-gold' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <span className={`material-symbols-outlined !text-xl ${isActive ? 'fill-1' : 'group-hover:scale-110 transition-transform'}`}>
                                {item.icon}
                            </span>
                            <span className="text-sm font-bold tracking-tight">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
            <div className="mt-auto p-4 border-t border-white/5">
                <button
                    onClick={async () => {
                        if (window.confirm('Deseja realmente sair?')) {
                            await supabase.auth.signOut();
                            navigate('/login');
                        }
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all font-bold"
                >
                    <span className="material-symbols-outlined">logout</span>
                    <span className="text-sm tracking-tight">Sair do Painel</span>
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
