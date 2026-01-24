
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import AdminBottomNav from '../components/AdminBottomNav';

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
        if (points >= 3000) return { name: 'Privé Diamond', color: 'text-white border-white/20 bg-white/10' };
        if (points >= 1500) return { name: 'Signature Elite', color: 'text-emerald-400 border-emerald-400/20 bg-emerald-500/10' };
        if (points >= 500) return { name: 'Prime Member', color: 'text-accent-gold border-accent-gold/20 bg-accent-gold/10' };
        return { name: 'Select Participant', color: 'text-white/40 border-white/10 bg-white/5' };
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

            const { error: profileError } = await supabase
                .from('profiles')
                .update({ lash_points: newPoints })
                .eq('id', adjustmentModal.userId);

            if (profileError) throw profileError;

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
            fetchClients();
        } catch (err: any) {
            alert('Erro ao ajustar: ' + err.message);
        }
    };

    const filteredClients = clients.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-background-dark text-white overflow-hidden selection:bg-accent-gold/20 relative">
            {/* Dynamic Background Engine */}
            <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
                <div className="absolute top-[-5%] right-[-15%] w-[60%] aspect-square organic-shape-1 bg-accent-gold/30 blur-[100px] animate-float"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square organic-shape-2 bg-primary/10 blur-[80px] animate-float" style={{ animationDelay: '2s' }}></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')] opacity-10 mix-blend-overlay"></div>
            </div>

            <header className="sticky top-0 z-[100] premium-nav-dark px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 bg-background-dark/95 backdrop-blur-xl">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/admin/loyalty')} className="size-11 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-accent-gold hover:bg-white/10 active:scale-90 transition-all shadow-huge">
                        <span className="material-symbols-outlined !text-xl">arrow_back_ios_new</span>
                    </button>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mb-1">Elite Control Hub</p>
                        <h1 className="text-xl font-display italic text-white tracking-tight">Gestão de Altíssima Fidelidade</h1>
                    </div>
                </div>

                <div className="relative flex-1 max-w-md w-full">
                    <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-white/20">search</span>
                    <input
                        className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-16 pr-6 text-sm outline-none focus:border-accent-gold/40 focus:bg-white/10 transition-all placeholder:text-white/10"
                        placeholder="Pesquisar por nome ou credencial digital..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <main className="relative z-10 flex-1 p-8 overflow-y-auto no-scrollbar pb-32">
                {loading ? (
                    <div className="py-32 flex flex-col items-center gap-6 animate-pulse">
                        <div className="relative size-16 flex items-center justify-center">
                            <div className="absolute inset-0 border-2 border-white/5 rounded-full"></div>
                            <div className="absolute inset-0 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
                            <span className="material-symbols-outlined text-accent-gold scale-75">groups_2</span>
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20">Auditando Base JZ Privé</p>
                    </div>
                ) : (
                    <div className="bg-surface-dark/40 rounded-[48px] border border-white/5 overflow-hidden shadow-hugest backdrop-blur-sm animate-reveal">
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/5 border-b border-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
                                    <tr>
                                        <th className="p-8">Membro do Clube</th>
                                        <th className="p-8">Status Hierárquico</th>
                                        <th className="p-8 text-right">Saldo de Créditos</th>
                                        <th className="p-8 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredClients.map((client, idx) => {
                                        const tier = getTier(client.lash_points || 0);
                                        return (
                                            <tr key={client.id} className="hover:bg-white/5 transition-colors group animate-reveal" style={{ animationDelay: `${idx * 0.02}s` }}>
                                                <td className="p-8">
                                                    <div className="flex items-center gap-5">
                                                        <div className="size-14 rounded-2xl bg-white/5 border border-white/5 overflow-hidden shadow-huge">
                                                            <img src={client.profile_pic || `https://ui-avatars.com/api/?name=${client.name}&background=122b22&color=c9a961&bold=true`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-outfit font-bold text-base text-white group-hover:text-accent-gold transition-colors">{client.name}</p>
                                                            <p className="text-[10px] text-white/20 uppercase tracking-widest mt-0.5">{client.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-8">
                                                    <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] border shadow-inner ${tier.color}`}>
                                                        {tier.name}
                                                    </span>
                                                </td>
                                                <td className="p-8 text-right font-display italic text-2xl text-accent-gold tabular-nums">
                                                    {client.lash_points || 0}
                                                </td>
                                                <td className="p-8">
                                                    <div className="flex justify-center">
                                                        <button
                                                            onClick={() => setAdjustmentModal({ open: true, userId: client.id, userName: client.name, currentPoints: client.lash_points || 0 })}
                                                            className="size-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 hover:text-accent-gold hover:bg-white/10 active:scale-95 transition-all shadow-lg"
                                                            title="Ajustar Saldo"
                                                        >
                                                            <span className="material-symbols-outlined !text-xl">tune</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {filteredClients.length === 0 && (
                            <div className="py-32 text-center opacity-10 space-y-6">
                                <span className="material-symbols-outlined !text-6xl">person_search</span>
                                <p className="font-display italic text-xl">Nenhum membro encontrado na base.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Adjust Modal with Cinematic Backdrop */}
            {adjustmentModal.open && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 animate-reveal">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md"></div>
                    <form onSubmit={handleAdjustment} className="relative z-10 bg-surface-dark border border-white/10 w-full max-w-sm p-12 rounded-[56px] shadow-hugest space-y-10 overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-accent-gold/20"></div>
                        <div className="text-center space-y-2">
                            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40">Protocolo de Ajuste</p>
                            <h3 className="text-2xl font-display italic text-white leading-tight">{adjustmentModal.userName}</h3>
                            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/20">
                                Saldo Atual: <span className="text-accent-gold ml-1">{adjustmentModal.currentPoints} PTS</span>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest px-2">Montante do Ajuste (+/-)</label>
                                <input
                                    type="number"
                                    required
                                    autoFocus
                                    className="w-full h-20 bg-white/5 border border-white/5 rounded-3xl px-8 text-4xl font-display italic text-center focus:border-accent-gold/40 focus:bg-white/10 outline-none transition-all text-accent-gold"
                                    placeholder="0"
                                    value={adjustmentAmount}
                                    onChange={e => setAdjustmentAmount(parseInt(e.target.value))}
                                />
                                <p className="text-[8px] text-white/10 uppercase tracking-widest text-center px-6">Use valores negativos para débitos extraordinários.</p>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest px-2">Justificativa Narrativa</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 text-sm focus:border-accent-gold/40 focus:bg-white/10 outline-none transition-all placeholder:text-white/10 italic"
                                    placeholder="Ex: Bonificação por Ritual Premium..."
                                    value={adjustmentReason}
                                    onChange={e => setAdjustmentReason(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button type="button" onClick={() => setAdjustmentModal({ open: false, userId: '', userName: '', currentPoints: 0 })} className="flex-1 py-4 rounded-2xl bg-white/5 text-white/40 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Cancelar</button>
                            <button type="submit" className="flex-2 px-10 py-4 rounded-2xl bg-accent-gold text-primary font-black text-[10px] uppercase tracking-widest shadow-huge active:scale-95 transition-all">Sincronizar Saldo</button>
                        </div>
                    </form>
                </div>
            )}

            <AdminBottomNav />

            {/* Visual Safe Area Inset */}
            <div className="fixed bottom-0 left-0 w-full h-8 bg-black pointer-events-none z-[90]"></div>
        </div>
    );
};

export default AdminLoyaltyClients;
