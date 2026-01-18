import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { supabase } from '../services/supabase';
import { UserRole } from '../types';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    clients: 0,
    appointmentsToday: 0,
    revenue: 0,
    professionals: 0,
    user: { name: '', role: 'PROFESSIONAL' as UserRole, avatar: '', id: '' }
  });
  const [chartData, setChartData] = useState<any[]>([]);

  const isMaster = stats.user.role === 'MASTER_ADMIN';

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
      if (error) throw error;

      // Refresh data
      setPendingRequests(prev => prev.filter(r => r.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));

      alert(`Agendamento ${newStatus === 'confirmed' ? 'confirmado' : 'cancelado'} com sucesso.`);
    } catch (err: any) {
      alert('Erro ao atualizar: ' + err.message);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name, role, avatar_url')
          .eq('id', user.id)
          .single();

        if (profile) {
          const today = new Date().toISOString().split('T')[0];

          // 1. Fetch unread notifications & pending appointments
          const pendingCountQuery = supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'pending');
          const pendingDataQuery = supabase.from('appointments').select(`
            *,
            profiles (name, avatar_url),
            services (name)
          `).eq('status', 'pending').order('date').order('time').limit(5);

          if (profile.role !== 'MASTER_ADMIN') {
            pendingCountQuery.eq('professional_id', profile.id);
            pendingDataQuery.eq('professional_id', profile.id);
          }

          const results = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'CLIENT'),
            supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', today).neq('status', 'cancelled'),
            supabase.from('professionals').select('*', { count: 'exact', head: true }),
            supabase.from('transactions').select('amount, type, date').gte('date',
              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            ),
            pendingCountQuery,
            pendingDataQuery
          ]);

          const [clientsRes, apptsRes, prosRes, transRes, pendingCountRes, pendingDataRes] = results;

          setUnreadCount(pendingCountRes.count || 0);
          setPendingRequests(pendingDataRes.data || []);

          // Calculate revenue
          const totalRevenue = transRes.data?.reduce((acc, curr) => {
            return curr.type === 'INCOME' ? acc + curr.amount : acc - curr.amount;
          }, 0) || 0;

          // Process chart data
          const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split('T')[0];
          });

          const processedChart = last7Days.map(date => {
            const dayTrans = transRes.data?.filter(t => t.date === date) || [];
            const dayTotal = dayTrans.reduce((acc, curr) => curr.type === 'INCOME' ? acc + curr.amount : acc - curr.amount, 0);
            return {
              date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
              value: Math.max(0, dayTotal)
            };
          });

          setChartData(processedChart);
          setStats({
            clients: clientsRes.count || 0,
            appointmentsToday: apptsRes.count || 0,
            revenue: totalRevenue,
            professionals: prosRes.count || 0,
            user: {
              name: profile.name || 'Admin',
              role: profile.role as UserRole,
              avatar: profile.avatar_url || '',
              id: profile.id
            }
          });
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [navigate]);

  const MENU_ITEMS = [
    { label: 'Dashboard', icon: 'grid_view', path: '/admin' },
    { label: 'Agenda', icon: 'calendar_month', path: '/admin/agenda' },
    { label: 'Clientes', icon: 'groups', path: '/admin/clients' },
    { label: 'Profissionais / Equipe', icon: 'badge', path: '/admin/professionals', masterOnly: true },
    { label: 'Serviços / Catálogo', icon: 'category', path: '/admin/services' },
    { label: 'Financeiro', icon: 'payments', path: '/admin/finance' },
    { label: 'Conteúdo (Feed / Stories)', icon: 'history_toggle_off', path: '/admin/content' },
    { label: 'Notificações', icon: 'notifications', path: '/admin/notifications' },
    { label: 'Ajustes do Estúdio', icon: 'settings', path: '/admin/settings', masterOnly: true },
    { label: 'Recursos Extra', subheader: true },
    { label: 'Dicas (Pré/Pós)', icon: 'lightbulb', path: '/admin/tips' },
    { label: 'FAQ (Dúvidas)', icon: 'help', path: '/admin/faq' },
    { label: 'Depoimentos', icon: 'reviews', path: '/admin/testimonials' },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-dark">
        <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background-dark text-white overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-[70] w-80 bg-card-dark border-r border-white/10 flex flex-col transition-transform duration-300 ease-out shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-accent-gold flex items-center justify-center text-primary font-bold text-lg shadow-lg shadow-accent-gold/20">JZ</div>
            <div>
              <h1 className="font-display font-bold text-lg leading-none">Studio Admin</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Gestão Completa</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="size-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined !text-lg">close</span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar py-6 px-4 space-y-1">
          {MENU_ITEMS.map((item, idx) => {
            if (item.masterOnly && !isMaster) return null;
            if (item.subheader) return <div key={idx} className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] px-4 py-4 mt-2">{item.label}</div>;

            return (
              <button
                key={idx}
                onClick={() => {
                  navigate(item.path!);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all relative ${location.pathname === item.path ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
              >
                <span className={`material-symbols-outlined ${location.pathname === item.path ? '' : 'text-gray-500'}`}>{item.icon}</span>
                <span className="text-sm font-bold tracking-wide">{item.label}</span>
                {item.path === '/admin/agenda' && unreadCount > 0 && (
                  <span className="absolute right-4 size-5 rounded-full bg-accent-gold text-primary text-[10px] font-black flex items-center justify-center shadow-lg animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3 border border-white/5">
            <img src={stats.user.avatar || `https://ui-avatars.com/api/?name=${stats.user.name}`} className="size-10 rounded-full border border-white/10" alt="Admin" />
            <div className="flex-1">
              <p className="text-xs font-bold text-white max-w-[120px] truncate">{stats.user.name}</p>
              <p className="text-[9px] text-accent-gold uppercase font-bold tracking-wider">{isMaster ? 'Master' : 'Pro'}</p>
            </div>
            <button onClick={() => navigate('/login')} className="size-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 hover:bg-rose-500/20">
              <span className="material-symbols-outlined !text-sm">logout</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-dark">
        <header className="h-20 px-6 md:px-10 flex items-center justify-between border-b border-white/5 bg-background-dark/80 backdrop-blur-xl shrink-0 z-40 sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="size-10 -ml-2 flex items-center justify-center text-white hover:bg-white/5 rounded-full transition-colors">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-sm md:text-lg font-bold uppercase tracking-widest hidden md:block">Visão Geral</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-bold text-white max-w-[150px] truncate leading-none">{stats.user.name}</span>
              <span className="text-[9px] text-accent-gold uppercase font-bold tracking-wider mt-1">{isMaster ? 'Master Admin' : 'Profissional'}</span>
            </div>
            <div className="size-10 rounded-full bg-accent-gold p-0.5">
              <img src={stats.user.avatar || `https://ui-avatars.com/api/?name=${stats.user.name}`} className="w-full h-full rounded-full object-cover" alt="Profile" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-accent-gold text-xs font-bold uppercase tracking-widest mb-1">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white leading-tight">
                Olá, {stats.user.name.split(' ')[0]}
              </h1>
              <p className="text-gray-400 text-sm mt-1">Aqui está o resumo do seu estúdio hoje.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate('/admin/agenda')} className="h-10 px-6 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
                <span className="material-symbols-outlined !text-lg">add</span>
                Novo Agendamento
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div onClick={() => navigate('/admin/finance')} className="bg-card-dark p-6 rounded-[24px] border border-white/5 relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <span className="material-symbols-outlined !text-2xl">payments</span>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Faturamento {isMaster ? 'Total' : 'Pessoal'}</p>
                <h3 className="text-4xl font-display font-bold text-white">R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              </div>
            </div>

            {isMaster && (
              <div onClick={() => navigate('/admin/professionals')} className="bg-card-dark p-6 rounded-[24px] border border-white/5 relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined !text-2xl">badge</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Equipe / Staff</p>
                  <h3 className="text-4xl font-display font-bold text-white">{stats.professionals} Ativos</h3>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div onClick={() => navigate('/admin/agenda')} className="bg-card-dark p-5 rounded-[24px] border border-white/5 active:scale-[0.98] transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <span className="material-symbols-outlined !text-xl">calendar_today</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-white mb-1">{stats.appointmentsToday}</h3>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Agendamentos</p>
                </div>
              </div>

              <div onClick={() => navigate('/admin/clients')} className="bg-card-dark p-5 rounded-[24px] border border-white/5 active:scale-[0.98] transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-3">
                  <div className="size-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <span className="material-symbols-outlined !text-xl">groups</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-white mb-1">{stats.clients}</h3>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Clientes</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {pendingRequests.length > 0 && (
              <div className="bg-card-dark p-6 rounded-[24px] border border-accent-gold/20 shadow-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-accent-gold">notification_important</span>
                    Solicitações Pendentes
                  </h3>
                  <button onClick={() => navigate('/admin/agenda')} className="text-[10px] font-black uppercase text-accent-gold hover:underline">Ver Todas</button>
                </div>
                <div className="space-y-4">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <img src={req.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${req.profiles?.name || 'C'}`} className="size-10 rounded-full" alt="" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{req.profiles?.name || 'Cliente'}</p>
                        <p className="text-[9px] text-accent-gold uppercase font-bold tracking-widest truncate">{req.services?.name}</p>
                        <p className="text-[9px] text-gray-500 font-medium">{new Date(req.date).toLocaleDateString('pt-BR')} às {req.time.slice(0, 5)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleStatusUpdate(req.id, 'confirmed')} className="size-8 rounded-full bg-emerald-500 text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                          <span className="material-symbols-outlined !text-base">done</span>
                        </button>
                        <button onClick={() => handleStatusUpdate(req.id, 'cancelled')} className="size-8 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white active:scale-95 transition-all">
                          <span className="material-symbols-outlined !text-base">close</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-card-dark p-6 rounded-[24px] border border-white/5 h-[300px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-accent-gold">show_chart</span>
                  Desempenho (Receita)
                </h3>
              </div>
              <div className="flex-1 w-full min-h-0 -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E4C78F" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#E4C78F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#4a4a4a" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1e1f', border: '1px solid #333', borderRadius: '12px' }}
                      itemStyle={{ color: '#E4C78F', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#E4C78F" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
