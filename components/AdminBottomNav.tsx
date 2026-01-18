import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';

const AdminBottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMaster, setIsMaster] = useState(false);

    useEffect(() => {
        const checkRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                if (data?.role === 'MASTER_ADMIN') setIsMaster(true);
            }
        };
        checkRole();
    }, []);

    const navItems = [
        { label: 'Painel', icon: 'grid_view', path: '/admin' },
        { label: 'Agenda', icon: 'calendar_today', path: '/admin/agenda' },
        { label: 'Clientes', icon: 'groups', path: '/admin/clients' },
        { label: 'Equipe', icon: 'badge', path: '/admin/professionals', masterOnly: true },
        { label: 'Caixa', icon: 'payments', path: '/admin/finance' },
    ];

    return (
        <nav className="fixed bottom-0 inset-x-0 bg-background-dark/95 backdrop-blur-xl border-t border-white/10 px-2 py-4 flex justify-around items-center z-50 rounded-t-[32px] max-w-[430px] left-1/2 -translate-x-1/2">
            {navItems.map((item) => {
                if (item.masterOnly && !isMaster) return null;
                const isActive = location.pathname === item.path;
                return (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`flex flex-col items-center gap-1.5 transition-all ${isActive ? 'text-accent-gold' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <span className={`material-symbols-outlined !text-2xl ${isActive ? 'fill-icon' : ''}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                            {item.icon}
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
};

export default AdminBottomNav;
