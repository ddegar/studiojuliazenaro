
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

const AdminLoyaltyClients: React.FC = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [adjustmentModal, setAdjustmentModal] = useState<{ open: boolean, userId: string, userName: string, currentPoints: number }>({ open: false, userId: '', userName: '', currentPoints: 0 });
    const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
    const [adjustmentReason, setAdjustmentReason] = useState('');

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, email, lash_points, phone, profile_pic')
                .eq('role', 'CLIENT')
                .order('name');

            if (error) throw error;
            setClients(data || []);
        } catch (err) {
            console.error('Error fetching clients:', err);
        } finally {
            setLoading(false);
        }
    };

    const getTier = (points: number) => {
        if (points >= 3000) return { name: 'Privé', color: 'text-purple-400 bg-purple-400/10' };
        if (points >= 1500) return { name: 'Signature', color: 'text-primary bg-primary/10' };
        if (points >= 500) return { name: 'Prime', color: 'text-accent-gold bg-accent-gold/10' };
        return { name: 'Select', color: 'text-slate-400 bg-slate-400/10' };
    };

    const handleAdjustment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (adjustmentAmount === 0) return;

        try {
            const newPoints = (adjustmentModal.currentPoints || 0) + adjustmentAmount;
            if (newPoints < 0) {
                alert('O saldo não pode ficar negativo.');
                return;
            }

            // Update Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ lash_points: newPoints })
                .eq('id', adjustmentModal.userId);

            if (profileError) throw profileError;

            // Log Transaction
            const { error: txError } = await supabase
                .from('point_transactions')
                .insert({
                    user_id: adjustmentModal.userId,
                    amount: adjustmentAmount,
                    source: 'MANUAL_ADJUSTMENT',
                    description: adjustmentReason || 'Ajuste Manual pelo Admin'
                });

            if (txError) throw txError;

            alert('Saldo ajustado com sucesso!');
            setAdjustmentModal({ open: false, userId: '', userName: '', currentPoints: 0 });
            setAdjustmentAmount(0);
            setAdjustmentReason('');
            fetchClients(); // Refresh list
        } catch (err: any) {
            alert('Erro ao ajustar: ' + err.message);
        }
    };

    const filteredClients = clients.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#121417] text-white p-6 font-sans pb-24">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/loyalty')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-gray-400">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-2xl font-display font-bold">Gestão de Clientes</h1>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Saldos e Níveis</p>
                    </div>
                </div>
            </header>

            <div className="mb-6 relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">search</span>
                <input
                    className="w-full bg-[#1c1f24] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:border-accent-gold/50"
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="size-8 border-4 border-accent-gold border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
                <div className="bg-[#1c1f24] rounded-3xl border border-white/5 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <tr>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Nível</th>
                                <th className="p-4 text-right">Saldo Atual</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredClients.map(client => {
                                const tier = getTier(client.lash_points || 0);
                                return (
                                    <tr key={client.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-white/5 overflow-hidden">
                                                <img src={client.profile_pic || `https://ui-avatars.com/api/?name=${client.name}`} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-white">{client.name}</p>
                                                <p className="text-xs text-gray-500">{client.email}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${tier.color}`}>
                                                {tier.name}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono font-bold text-accent-gold">
                                            {client.lash_points || 0} pts
                                        </td>
                                        <td className="p-4 flex justify-center">
                                            <button
                                                onClick={() => setAdjustmentModal({ open: true, userId: client.id, userName: client.name, currentPoints: client.lash_points || 0 })}
                                                className="text-gray-500 hover:text-white transition-colors"
                                                title="Ajustar Saldo"
                                            >
                                                <span className="material-symbols-outlined">tune</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredClients.length === 0 && (
                        <div className="p-8 text-center text-gray-500 text-sm">Nenhum cliente encontrado.</div>
                    )}
                </div>
            )}

            {adjustmentModal.open && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <form onSubmit={handleAdjustment} className="bg-[#1c1f24] w-full max-w-sm p-6 rounded-3xl border border-white/10 shadow-2xl space-y-6">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-white mb-1">Ajuste Manual</h3>
                            <p className="text-xs text-gray-500">Cliente: <span className="text-white font-bold">{adjustmentModal.userName}</span></p>
                            <p className="text-xs text-gray-500">Saldo Atual: <span className="text-accent-gold font-bold">{adjustmentModal.currentPoints} pts</span></p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Valor do Ajuste (+/-)</label>
                                <input
                                    type="number"
                                    required
                                    autoFocus
                                    className="w-full bg-[#121417] border border-white/10 rounded-xl px-4 py-3 text-lg font-mono font-bold text-center focus:border-accent-gold/50 outline-none"
                                    placeholder="0"
                                    value={adjustmentAmount}
                                    onChange={e => setAdjustmentAmount(parseInt(e.target.value))}
                                />
                                <p className="text-[10px] text-gray-500 text-center">Use valores negativos para debitar.</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Motivo</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-[#121417] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-accent-gold/50 outline-none"
                                    placeholder="Ex: Bônus campanha ou Correção"
                                    value={adjustmentReason}
                                    onChange={e => setAdjustmentReason(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button type="button" onClick={() => setAdjustmentModal({ open: false, userId: '', userName: '', currentPoints: 0 })} className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 font-bold text-xs uppercase tracking-widest hover:bg-white/10">Cancelar</button>
                            <button type="submit" className="flex-[2] py-3 rounded-xl bg-accent-gold text-[#121417] font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors">Confirmar</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AdminLoyaltyClients;
