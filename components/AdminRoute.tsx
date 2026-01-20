import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../services/supabase';

const AdminRoute: React.FC = () => {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsAdmin(false);
                return;
            }

            const { data } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (data && (['MASTER_ADMIN', 'PROFESSIONAL_ADMIN', 'ADMIN', 'PROFESSIONAL'].includes(data.role) || user.email === 'admin@juliazenaro.com')) {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        };
        checkAdmin();
    }, []);

    if (isAdmin === null) {
        return <div className="flex h-screen items-center justify-center bg-background-dark text-accent-gold">Verificando...</div>;
    }

    return isAdmin ? <Outlet /> : <Navigate to="/login" replace />;
};

export default AdminRoute;
