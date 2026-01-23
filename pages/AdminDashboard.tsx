
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';
import { supabase } from '../services/supabase';
import { UserRole } from '../types';
import Logo from '../components/Logo';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);

  const [stats, setStats] = useState<any>({
    clients: 0,
    appointmentsToday: 0,
    revenue: 0,
    professionals: 0,
    topServices: [],
    proRevenue: [],
    user: { name: '', role: 'PROFESSIONAL' as UserRole, avatar: '', id: '' }
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const isMaster = ['MASTER_ADMIN', 'ADMIN', 'PROFESSIONAL_ADMIN'].includes(stats.user.role) ||
    stats.user.email?.toLowerCase() === 'admin@juliazenaro.com' ||
    userEmail?.toLowerCase() === 'admin@juliazenaro.com';

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
          .select('id, name, role')
          .eq('id', user.id)
          .single();

        if (!profile) {
          console.warn('Profile not found for user', user.id);
          navigate('/login');
          return;
        }

        const isPrivileged = ['MASTER_ADMIN', 'ADMIN', 'PROFESSIONAL_ADMIN'].includes(profile.role);
        const isReallyMaster = isPrivileged || user.email === 'admin@juliazenaro.com';

        if (user) {
          setUserEmail(user.email || null);
          const today = new Date().toISOString().split('T')[0];
          const nowISO = new Date().toISOString();

          const upcomingQuery = supabase.from('appointments').select(`
              *,
              profiles:profiles!user_id (name, profile_pic),
              services (name)
            `)
            .eq('status', 'scheduled')
            .gte('start_time', nowISO)
            .order('start_time')
            .limit(3);

          if (!isReallyMaster) {
            const { data: matchingPro } = await supabase
              .from('professionals')
              .select('id')
              .ilike('name', `%${profile.name?.split(' ')[0] || ''}%`)
              .single();

            if (matchingPro) {
              upcomingQuery.eq('professional_id', matchingPro.id);
            }
          }

          const results = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'CLIENT'),
            supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', today).neq('status', 'cancelled'),
            supabase.from('professionals').select('*', { count: 'exact', head: true }),
            supabase.from('transactions').select('amount, type, date, user_id').gte('date',
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            ),
            upcomingQuery,
            isReallyMaster ? supabase.from('appointments').select('service_name, status').gte('date',
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            ) : Promise.resolve({ data: [] }),
            isReallyMaster ? supabase.from('professionals').select('id, name, profile_id') : Promise.resolve({ data: [] })
          ]);

          const [clientsRes, apptsRes, prosRes, transRes, upcomingRes, allApptsRes, allProsRes] = results;

          setUpcomingAppointments(upcomingRes.data || []);

          // Revenue Logic: If Master -> Total. If Pro -> Only their own transactions
          let relevantTransactions = transRes.data || [];
          if (!isReallyMaster) {
            relevantTransactions = relevantTransactions.filter(t => t.user_id === user.id);
          }

          const totalRevenue = relevantTransactions.reduce((acc, curr) => curr.type === 'INCOME' ? acc + curr.amount : acc - curr.amount, 0) || 0;

          const last30Days = Array.from({ length: 30 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i));
            return d.toISOString().split('T')[0];
          });

          const processedChart = last30Days.map(date => {
            const dayTrans = relevantTransactions.filter(t => t.date === date);
            const dayTotal = dayTrans.reduce((acc, curr) => curr.type === 'INCOME' ? acc + curr.amount : acc - curr.amount, 0);
            return {
              date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
              value: Math.max(0, dayTotal)
            };
          });

          setChartData(processedChart);

          let topServices: any[] = [];
          let proRevenue: any[] = [];

          if (isReallyMaster) {
            const serviceCounts = (allApptsRes.data || []).reduce((acc: any, curr: any) => {
              const name = curr.service_name || 'Outro';
              acc[name] = (acc[name] || 0) + 1;
              return acc;
            }, {});
            topServices = Object.entries(serviceCounts)
              .map(([name, count]) => ({ name, count }))
              .sort((a: any, b: any) => b.count - a.count)
              .slice(0, 3);

            proRevenue = (allProsRes.data || []).map((pro: any) => {
              const proTrans = transRes.data?.filter(t => t.user_id === (pro.profile_id || pro.id)) || [];
              const total = proTrans.reduce((acc, curr) => curr.type === 'INCOME' ? acc + curr.amount : acc - curr.amount, 0);
              return { name: pro.name, revenue: total };
            }).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 2);
          }

          setStats({
            clients: clientsRes.count || 0,
            appointmentsToday: apptsRes.count || 0,
            revenue: totalRevenue,
            professionals: prosRes.count || 0,
            topServices,
            proRevenue,
            user: {
              name: profile?.name || 'Admin',
              role: (profile?.role as UserRole) || 'PROFESSIONAL',
              avatar: (profile as any)?.avatar_url || (profile as any)?.image_url || '',
              id: user.id,
              email: user.email
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

    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#121417]">
        <div className="size-12 border-4 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();

  return (
    <div className="min-h-screen bg-[#121417] text-white font-sans flex overflow-x-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - Persistent on lg+ screens */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-[70] w-72 bg-[#1c1f24] border-r border-white/5 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <Logo size="sm" forceLight={true} />
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><span className="material-symbols-outlined">close</span></button>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto no-scrollbar">
          {MENU_ITEMS.map((item, idx) => {
            if (item.masterOnly && !isMaster) return null;
            if (item.subheader) return (
              <div key={idx} className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-4 pt-6 pb-2">
                {item.label}
              </div>
            );

            const isActive = location.pathname === item.path;
            return (
              <button
                key={idx}
                onClick={() => { navigate(item.path!); setSidebarOpen(false); }}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header */}
        <header className="h-20 px-6 flex items-center justify-between border-b border-white/5 bg-[#121417] sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-400 lg:hidden"><span className="material-symbols-outlined">menu</span></button>
            <h1 className="text-xs font-black uppercase tracking-widest text-white">Visão Geral</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] md:text-xs font-bold text-white truncate max-w-[100px] md:max-w-[200px]">{stats.user.name}</p>
              <p className="text-[8px] font-black tracking-widest text-accent-gold">{isMaster ? 'MASTER' : 'PRO'}</p>
            </div>
            <div className="size-10 rounded-full bg-[#1c1f24] border border-accent-gold/20 flex items-center justify-center overflow-hidden">
              <img src={stats.user.avatar || `https://ui-avatars.com/api/?name=${stats.user.name}`} className="w-full h-full object-cover" alt="User" />
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-10 xl:p-12 space-y-8 pb-32 lg:pb-12 w-full">
          {/* Welcome Section */}
          <div className="space-y-1">
            <p className="text-[10px] font-black text-accent-gold/80 tracking-widest">{currentDate}</p>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-tight">Olá,<br className="md:hidden" />{stats.user.name.split(' ')[0]}</h2>
                <p className="text-xs md:text-sm text-gray-500 font-medium tracking-tight">Resumo do seu estúdio hoje.</p>
              </div>
              <button
                onClick={() => navigate('/admin/agenda')}
                className="bg-[#1c2e28] text-emerald-400 border border-emerald-900/50 px-5 py-3 rounded-full flex items-center gap-2 hover:bg-emerald-900/30 transition-colors shadow-lg w-fit"
              >
                <span className="material-symbols-outlined !text-sm">add</span>
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Novo Agendamento</span>
              </button>
            </div>
          </div>

          {/* Stats Grid - Responsive 2x2 -> 4 cols on lg */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Faturamento (30d)', value: `R$ ${stats.revenue.toLocaleString('pt-BR')}`, icon: 'payments', color: 'bg-emerald-400/10 text-emerald-400', path: '/admin/finance' },
              { label: 'Equipe / Staff', value: `${stats.professionals} Ativos`, icon: 'badge', color: 'bg-orange-400/10 text-orange-400', path: '/admin/professionals', hide: !isMaster },
              { label: 'Agendamentos', value: stats.appointmentsToday, icon: 'calendar_today', color: 'bg-blue-400/10 text-blue-400', path: '/admin/agenda' },
              { label: 'Clientes', value: stats.clients, icon: 'groups', color: 'bg-purple-400/10 text-purple-400', path: '/admin/clients' }
            ].map((stat, idx) => {
              if (stat.hide) return null;
              return (
                <button key={idx} onClick={() => navigate(stat.path)} className="bg-[#1c1f24] p-5 lg:p-6 rounded-3xl border border-white/5 flex flex-col gap-4 text-left hover:border-white/10 hover:scale-[1.02] transition-all shadow-xl">
                  <div className={`size-10 lg:size-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <span className="material-symbols-outlined !text-xl lg:!text-2xl">{stat.icon}</span>
                  </div>
                  <div>
                    <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-lg lg:text-xl font-bold text-white">{stat.value}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Two-column layout on lg for Upcoming + Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Section */}
            <div className="bg-[#1c1f24] rounded-[32px] border border-white/5 p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-accent-gold !text-xl">schedule</span>
                  <h3 className="text-sm font-bold text-white">Próximos Agendamentos</h3>
                </div>
                <button onClick={() => navigate('/admin/agenda')} className="text-[10px] font-black uppercase text-accent-gold tracking-widest">Ver Agenda</button>
              </div>
              <div className="space-y-3">
                {upcomingAppointments.length > 0 ? upcomingAppointments.map((appt, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[#121417]/50 border border-white/5 hover:bg-[#121417]">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-full bg-[#1c1f24] flex items-center justify-center text-accent-gold font-bold text-xs ring-1 ring-white/10">
                        {appt.profiles?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '??'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{appt.profiles?.name || 'Cliente'}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-accent-gold mt-0.5">{appt.services?.name || 'Serviço'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-500">{new Date(appt.start_time).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} • {new Date(appt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-gray-600 text-[10px] font-black uppercase tracking-widest border border-dashed border-white/10 rounded-2xl italic">Livre por enquanto</div>
                )}
              </div>
            </div>

            {/* Financial BI Section */}
            <div className="bg-[#1c1f24] rounded-[32px] border border-white/5 p-6 space-y-8 shadow-xl">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent-gold">trending_up</span>
                <h3 className="text-sm font-bold text-white">Faturamento (30 dias)</h3>
              </div>

              <div className="h-[140px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs><linearGradient id="chartGold" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#d4af37" stopOpacity={0.2} /><stop offset="95%" stopColor="#d4af37" stopOpacity={0} /></linearGradient></defs>
                    <XAxis dataKey="date" hide />
                    <Tooltip contentStyle={{ backgroundColor: '#1c1f24', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="value" stroke="#d4af37" fill="url(#chartGold)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {isMaster && (
                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
                  {/* Services Ranking */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-400 !text-sm">grid_view</span>
                      <h4 className="text-[8px] font-black uppercase tracking-widest text-white">Serviços Mais Agendados</h4>
                    </div>
                    <div className="space-y-4">
                      {stats.topServices.map((s: any, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-2 overflow-hidden">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[9px] font-black text-gray-600">#{i + 1}</span>
                            <p className="text-[9px] font-bold text-gray-300 truncate tracking-tight">{s.name}</p>
                          </div>
                          <span className="text-[10px] font-black text-emerald-400 shrink-0">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Professionals Ranking */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-accent-gold !text-sm">account_balance_wallet</span>
                      <h4 className="text-[8px] font-black uppercase tracking-widest text-white">Faturamento por Profissional</h4>
                    </div>
                    <div className="space-y-4">
                      {stats.proRevenue.map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-1 overflow-hidden">
                          <p className="text-[9px] font-bold text-gray-300 truncate tracking-tight">{p.name}</p>
                          <span className="text-[10px] font-black text-emerald-500 shrink-0">R$ {p.revenue.toLocaleString('pt-BR')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Bottom Nav - Hidden on lg (sidebar visible) */}
        <nav className="fixed bottom-0 left-0 right-0 bg-[#121417] border-t border-white/5 flex items-center justify-around h-20 px-4 z-50 lg:hidden">
          {[
            { label: 'PAINEL', icon: 'grid_view', path: '/admin', active: location.pathname === '/admin' },
            { label: 'AGENDA', icon: 'calendar_month', path: '/admin/agenda', active: location.pathname.includes('agenda') },
            { label: 'EQUIPE', icon: 'person', path: '/admin/professionals', active: location.pathname.includes('professionals') },
            { label: 'AJUSTES', icon: 'settings', path: isMaster ? '/admin/settings' : '/admin/my-profile', active: location.pathname.includes('profile') || location.pathname.includes('settings') }
          ].map((item, idx) => (
            <button key={idx} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-1 transition-all ${item.active ? 'text-emerald-400' : 'text-gray-500'}`}>
              <span className={`material-symbols-outlined !text-[24px]`}>{item.icon}</span>
              <span className="text-[8px] font-black tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default AdminDashboard;
