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
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                const isMasterUser = ['MASTER_ADMIN', 'PROFESSIONAL_ADMIN', 'ADMIN'].includes(profile?.role) ||
                    user.email?.toLowerCase() === 'admin@juliazenaro.com';
                setIsMaster(isMasterUser);
            }
        };
        checkRole();
    }, []);

    const navItems = [
        { label: 'STATUS', icon: 'grid_view', path: '/admin' },
        { label: 'AGENDA', icon: 'calendar_today', path: '/admin/agenda' },
        { label: 'CLIENTES', icon: 'groups', path: '/admin/clients', masterOnly: true },
        { label: 'EQUIPE', icon: 'clinical_notes', path: '/admin/professionals', masterOnly: true },
        { label: 'FINANCEIRO', icon: 'payments', path: '/admin/finance' },
    ];

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[430px] z-[100]">
            <nav className="premium-blur-dark rounded-[32px] border border-white/10 shadow-hugest px-6 py-4 flex justify-around items-center bg-[#121417]/90 transition-all duration-700">
                {navItems.map((item) => {
                    if (item.masterOnly && !isMaster) return null;
                    const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.includes(item.path));
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center gap-1.5 transition-all group ${isActive ? 'text-accent-gold' : 'text-white/20 hover:text-white/60'}`}
                        >
                            <span className={`material-symbols-outlined !text-[24px] group-active:scale-90 transition-transform ${isActive ? 'fill-icon' : ''}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                {item.icon}
                            </span>
                            <span className="text-[7px] font-black uppercase tracking-[0.3em]">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default AdminBottomNav;
