
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Professional } from '../types';

const AdminWorkingHours: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [professionals, setProfessionals] = useState<Professional[]>([]);

    useEffect(() => {
        fetchProfessionals();
    }, []);

    const fetchProfessionals = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('professionals')
                .select('*')
                .eq('active', true)
                .order('name');

            if (error) throw error;
            setProfessionals(data || []);
        } catch (err) {
            console.error('Error fetching professionals:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-dark">
                <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background-dark text-white">
            <header className="p-4 border-b border-white/5 flex items-center justify-between glass-nav !bg-background-dark/80">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/settings')} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
                    <h1 className="text-lg font-bold">Gestão de Horários</h1>
                </div>
            </header>

            <main className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar pb-32">
                <div className="space-y-2">
                    <h2 className="text-2xl font-display font-bold">Horários da Equipe</h2>
                    <p className="text-xs text-gray-500 italic">Configure a jornada de trabalho individual de cada profissional.</p>
                </div>

                <div className="space-y-4">
                    {professionals.map(pro => (
                        <button
                            key={pro.id}
                            onClick={() => navigate(`/admin/professional/${pro.id}?tab=SCHEDULE`)}
                            className="w-full bg-card-dark p-6 rounded-[32px] border border-white/5 flex items-center gap-5 group active:scale-[0.98] transition-all"
                        >
                            <div className="size-16 rounded-2xl overflow-hidden border border-white/10">
                                <img
                                    src={pro.image_url || `https://ui-avatars.com/api/?name=${pro.name}&background=random`}
                                    className="w-full h-full object-cover"
                                    alt={pro.name}
                                />
                            </div>
                            <div className="flex-1 text-left">
                                <h4 className="font-bold text-base group-hover:text-accent-gold transition-colors">{pro.name}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                        {(pro as any).start_hour || '08:00'} - {(pro as any).end_hour || '22:00'}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-medium">
                                        {JSON.parse((pro as any).closed_days || '[0]').length} folgas/sem
                                    </span>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-gray-600 transition-transform group-hover:translate-x-1">chevron_right</span>
                        </button>
                    ))}
                </div>

                <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/10 flex gap-4">
                    <span className="material-symbols-outlined text-primary">info</span>
                    <p className="text-[10px] text-gray-400 leading-relaxed italic">
                        Os horários configurados aqui afetam diretamente a disponibilidade das profissionais no site de agendamento das clientes.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default AdminWorkingHours;
