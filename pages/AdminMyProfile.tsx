
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import AdminBottomNav from '../components/AdminBottomNav';

type ProfileTab = 'BASIC' | 'SCHEDULE' | 'TIPS' | 'SECURITY';

const AdminMyProfile: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<ProfileTab>('BASIC');
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [professional, setProfessional] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        avatar_url: '',
        start_hour: '08:00',
        end_hour: '22:00',
        closed_days: '[]'
    });

    const [passwordData, setPasswordData] = useState({
        new: '',
        confirm: ''
    });

    const [myTips, setMyTips] = useState<any[]>([]);
    const [editingTip, setEditingTip] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                navigate('/login');
                return;
            }

            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
            const { data: proData } = await supabase.from('professionals').select('*').eq('email', authUser.email).single();

            if (profileData) {
                setProfile(profileData);
                setProfessional(proData);
                setFormData({
                    name: profileData.name || '',
                    phone: profileData.phone || '',
                    avatar_url: profileData.avatar_url || proData?.image_url || '',
                    start_hour: proData?.start_hour || '08:00',
                    end_hour: proData?.end_hour || '22:00',
                    closed_days: proData?.closed_days || '[]'
                });

                // Fetch tips linked to her services
                if (proData) {
                    const { data: services } = await supabase.from('services').select('id').contains('professional_ids', [proData.id]);
                    const serviceIds = services?.map(s => s.id) || [];

                    if (serviceIds.length > 0) {
                        const { data: tipsData } = await supabase.from('tips').select('*').contains('service_ids', serviceIds);
                        setMyTips(tipsData || []);
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching own profile:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveBasic = async () => {
        setIsSaving(true);
        try {
            await supabase.from('profiles').update({
                name: formData.name,
                phone: formData.phone,
                avatar_url: formData.avatar_url
            }).eq('id', profile.id);

            if (professional) {
                await supabase.from('professionals').update({
                    name: formData.name,
                    phone: formData.phone,
                    image_url: formData.avatar_url,
                    start_hour: formData.start_hour,
                    end_hour: formData.end_hour,
                    closed_days: formData.closed_days
                }).eq('id', professional.id);
            }
            alert('Perfil atualizado com sucesso! ✨');
            fetchData();
        } catch (e: any) {
            alert('Erro ao salvar: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            alert('As senhas não coincidem.');
            return;
        }
        try {
            const { error } = await supabase.auth.updateUser({ password: passwordData.new });
            if (error) throw error;
            alert('Senha alterada com sucesso!');
            setPasswordData({ new: '', confirm: '' });
        } catch (e: any) {
            alert('Erro: ' + e.message);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-background-dark"><div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="flex flex-col h-full bg-background-dark text-white pb-32">
            <header className="p-6 border-b border-white/5 flex flex-col gap-6 glass-nav !bg-background-dark/90 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin')} className="material-symbols-outlined text-accent-gold">arrow_back_ios_new</button>
                    <div>
                        <h1 className="text-xl font-display font-bold">Meu Perfil Profissional</h1>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Gestão de Carreira & Agenda</p>
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {[
                        { id: 'BASIC', label: 'Dados', icon: 'person' },
                        { id: 'SCHEDULE', label: 'Horários', icon: 'schedule' },
                        { id: 'TIPS', label: 'Dicas Próprias', icon: 'lightbulb' },
                        { id: 'SECURITY', label: 'Segurança', icon: 'lock' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as ProfileTab)}
                            className={`px-5 h-10 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${activeTab === tab.id ? 'bg-primary border-primary text-white shadow-xl' : 'bg-white/5 border-white/10 text-gray-500'}`}
                        >
                            <span className="material-symbols-outlined !text-lg">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            <main className="p-6 space-y-6 overflow-y-auto no-scrollbar">
                {activeTab === 'BASIC' && (
                    <div className="bg-card-dark p-8 rounded-[40px] border border-white/5 space-y-6 animate-fade-in shadow-2xl">
                        <div className="flex flex-col items-center gap-4 mb-4">
                            <div className="size-24 rounded-[32px] border-2 border-accent-gold p-1 overflow-hidden bg-white/5">
                                <img src={formData.avatar_url || `https://ui-avatars.com/api/?name=${formData.name}`} className="w-full h-full rounded-[24px] object-cover" />
                            </div>
                            <p className="text-[10px] font-black text-accent-gold uppercase tracking-[0.3em]">Arte & Estilo</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest pl-1">Nome de Exibição</label>
                                <input className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest pl-1">WhatsApp / Contato</label>
                                <input className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest pl-1">Link da Foto de Perfil</label>
                                <input className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm opacity-50 italic" value={formData.avatar_url} onChange={e => setFormData({ ...formData, avatar_url: e.target.value })} />
                            </div>
                        </div>

                        <button onClick={handleSaveBasic} disabled={isSaving} className="w-full h-16 bg-primary text-white rounded-3xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-primary/20 mt-4">
                            {isSaving ? 'SALVANDO...' : 'ATUALIZAR MEUS DADOS'}
                        </button>
                    </div>
                )}

                {activeTab === 'SCHEDULE' && (
                    <div className="bg-card-dark p-8 rounded-[40px] border border-white/5 space-y-8 animate-fade-in shadow-2xl">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <span className="material-symbols-outlined">schedule</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-base">Meus Horários</h3>
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-0.5">Disponibilidade de Agenda</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1">Início do Dia</label>
                                <input type="time" className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-bold" value={formData.start_hour} onChange={e => setFormData({ ...formData, start_hour: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1">Fim do Dia</label>
                                <input type="time" className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm font-bold" value={formData.end_hour} onChange={e => setFormData({ ...formData, end_hour: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1">Minhas Folgas Semanais</label>
                            <div className="flex flex-wrap gap-2">
                                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((day, idx) => {
                                    const closedDays = JSON.parse(formData.closed_days || '[]');
                                    const isClosed = closedDays.includes(idx);
                                    return (
                                        <button
                                            key={day}
                                            onClick={() => {
                                                const newClosed = isClosed ? closedDays.filter((d: number) => d !== idx) : [...closedDays, idx].sort();
                                                setFormData({ ...formData, closed_days: JSON.stringify(newClosed) });
                                            }}
                                            className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${isClosed ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 shadow-lg' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                        >{day}</button>
                                    );
                                })}
                            </div>
                        </div>

                        <button onClick={handleSaveBasic} className="w-full h-16 bg-primary text-white rounded-3xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-primary/20">SALVAR HORÁRIOS DE ATENDIMENTO</button>
                    </div>
                )}

                {activeTab === 'TIPS' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center px-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Minhas Recomendações</p>
                            <button onClick={() => setEditingTip({ type: 'PRE_CARE', title: '', content: '', service_ids: [] })} className="text-[10px] font-black text-accent-gold uppercase underline">Nova Dica</button>
                        </div>

                        {myTips.map(tip => (
                            <div key={tip.id} className="bg-card-dark p-6 rounded-[32px] border border-white/5 space-y-3 relative group">
                                <div className="flex justify-between items-start">
                                    <span className={`text-[8px] font-black px-2 py-1 rounded-full border ${tip.type === 'PRE_CARE' ? 'border-primary/20 text-primary bg-primary/5' : 'border-accent-gold/20 text-accent-gold bg-accent-gold/5'}`}>
                                        {tip.type === 'PRE_CARE' ? 'PRÉ' : 'PÓS'}
                                    </span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingTip(tip)} className="material-symbols-outlined !text-sm text-gray-500">edit</button>
                                    </div>
                                </div>
                                <h4 className="font-bold text-sm text-white">{tip.title}</h4>
                                <p className="text-[10px] text-gray-500 leading-relaxed italic">{tip.content}</p>
                            </div>
                        ))}

                        {myTips.length === 0 && (
                            <div className="bg-white/5 border border-dashed border-white/10 rounded-[40px] p-12 text-center space-y-4">
                                <span className="material-symbols-outlined !text-4xl text-gray-700">lightbulb</span>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed italic">Você ainda não criou dicas personalizadas para seus serviços.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'SECURITY' && (
                    <div className="bg-card-dark p-8 rounded-[40px] border border-white/5 space-y-6 animate-fade-in shadow-2xl">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                <span className="material-symbols-outlined">lock</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-base">Alterar Senha</h3>
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-0.5">Segurança da Conta</p>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1">Nova Senha</label>
                                <input type="password" required className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm" value={passwordData.new} onChange={e => setPasswordData({ ...passwordData, new: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest pl-1">Confirmar Senha</label>
                                <input type="password" required className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm" value={passwordData.confirm} onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full h-16 bg-white text-primary rounded-3xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl mt-4">ATUALIZAR SENHA AGORA</button>
                        </form>
                    </div>
                )}
            </main>

            {editingTip && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-end justify-center backdrop-blur-xl transition-all">
                    <div className="bg-card-dark w-full max-w-[430px] rounded-t-[48px] p-10 space-y-8 animate-slide-up border-t border-white/10 max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-display font-bold">Gerenciar Dica</h2>
                            <button onClick={() => setEditingTip(null)} className="material-symbols-outlined text-gray-500">close</button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest px-2">Título da Orientação</label>
                                <input className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold" value={editingTip.title} onChange={e => setEditingTip({ ...editingTip, title: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-gray-600 tracking-widest px-2">Conteúdo Detalhado</label>
                                <textarea className="w-full h-32 bg-white/5 border border-white/10 rounded-3xl p-6 text-sm italic" value={editingTip.content} onChange={e => setEditingTip({ ...editingTip, content: e.target.value })} />
                            </div>

                            <div className="flex bg-white/5 p-1 rounded-2xl">
                                <button onClick={() => setEditingTip({ ...editingTip, type: 'PRE_CARE' })} className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editingTip.type === 'PRE_CARE' ? 'bg-primary text-white shadow-lg' : 'text-gray-500'}`}>Pré-Procedimento</button>
                                <button onClick={() => setEditingTip({ ...editingTip, type: 'POST_CARE' })} className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editingTip.type === 'POST_CARE' ? 'bg-accent-gold text-primary shadow-lg' : 'text-gray-500'}`}>Pós-Procedimento</button>
                            </div>

                            <button onClick={async () => {
                                try {
                                    // Logic to save tip linked to her services
                                    const { data: services } = await supabase.from('services').select('id').contains('professional_ids', [professional.id]);
                                    const sIds = services?.map(s => s.id) || [];

                                    const payload = {
                                        title: editingTip.title,
                                        content: editingTip.content,
                                        type: editingTip.type,
                                        service_ids: sIds, // Auto-link to all her services for now
                                        active: true
                                    };

                                    if (editingTip.id) {
                                        await supabase.from('tips').update(payload).eq('id', editingTip.id);
                                    } else {
                                        await supabase.from('tips').insert(payload);
                                    }

                                    setEditingTip(null);
                                    fetchData();
                                } catch (e: any) { alert(e.message); }
                            }} className="w-full h-18 bg-primary text-white rounded-3xl font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl shadow-primary/30 active:scale-95">SALVAR DICA PERSONALIZADA</button>
                        </div>
                    </div>
                </div>
            )}

            <AdminBottomNav />
        </div>
    );
};

export default AdminMyProfile;
