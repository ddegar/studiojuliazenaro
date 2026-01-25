
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
          .maybeSingle();

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
              .maybeSingle();

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



  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-dark font-outfit">
        <div className="relative size-16 flex items-center justify-center">
          <div className="absolute inset-0 border-2 border-primary/5 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-accent-gold border-t-transparent rounded-full animate-spin"></div>
          <span className="material-symbols-outlined text-accent-gold scale-75">monitoring</span>
        </div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();

  return (
    <div className="min-h-screen bg-background-dark text-white font-outfit antialiased selection:bg-accent-gold/20 selection:text-white">
      {/* Narrative Header */}
      <header className="h-24 px-8 flex items-center justify-between border-b border-white/5 bg-background-dark/80 backdrop-blur-xl sticky top-0 z-[60]">
        <div className="flex flex-col">
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent-gold/40 leading-none mb-1">Comando Estratégico</p>
          <h1 className="font-display italic text-2xl text-white">Painel do Studio</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:block text-right">
            <p className="text-xs font-bold text-white leading-none">{stats.user.name}</p>
            <p className="text-[9px] font-black tracking-widest text-accent-gold/60 mt-1 uppercase">{isMaster ? 'Curadoria Master' : 'Profissional de Elite'}</p>
          </div>
          <div className="group relative">
            <div className="absolute inset-0 bg-accent-gold/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative size-12 rounded-2xl bg-surface-dark border border-white/10 flex items-center justify-center overflow-hidden shadow-huge">
              <img src={stats.user.avatar || `https://ui-avatars.com/api/?name=${stats.user.name}&background=0f3e29&color=C9A961`} className="w-full h-full object-cover" alt="User" />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 p-8 lg:p-12 space-y-12 pb-40 w-full max-w-screen-2xl mx-auto overflow-x-hidden">
        {/* Elite Welcome & Action */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 animate-reveal">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-accent-gold/40"></span>
              <p className="text-[10px] font-black text-accent-gold tracking-[0.5em]">{currentDate}</p>
            </div>
            <h2 className="text-5xl md:text-7xl font-display font-bold text-white leading-none tracking-tighter">
              Olá, <br /> <span className="italic text-accent-gold font-light">{stats.user.name.split(' ')[0]}</span>.
            </h2>
          </div>

          <button
            onClick={() => navigate('/admin/agenda/new')}
            className="group relative w-full lg:w-fit h-18 bg-accent-gold text-primary p-1 rounded-3xl transition-all active:scale-95 shadow-huge"
          >
            <div className="h-full bg-accent-gold rounded-[22px] flex items-center justify-center gap-4 px-10">
              <span className="material-symbols-outlined !text-xl group-hover:rotate-90 transition-transform duration-500">add_circle</span>
              <span className="text-[11px] font-black uppercase tracking-[0.3em]">Novo Agendamento</span>
            </div>
          </button>
        </div>

        {/* Intelligence Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-reveal stagger-1">
          {[
            { label: 'Faturamento 30d', value: `R$ ${stats.revenue.toLocaleString('pt-BR')}`, icon: 'receipt_long', trend: '+12%', color: 'text-emerald-400', path: '/admin/finance' },
            { label: 'Equipe Especialista', value: `${stats.professionals} Ativos`, icon: 'clinical_notes', trend: 'Global', color: 'text-accent-gold', path: '/admin/professionals', hide: !isMaster },
            { label: 'Agendamentos Hoje', value: stats.appointmentsToday, icon: 'calendar_month', trend: 'Live', color: 'text-sky-400', path: '/admin/agenda' },
            { label: 'Membros Privé', value: stats.clients, icon: 'diamond', trend: 'Premium', color: 'text-indigo-400', path: '/admin/clients' }
          ].map((stat, idx) => {
            if (stat.hide) return null;
            return (
              <button
                key={idx}
                onClick={() => navigate(stat.path)}
                className="group bg-surface-dark/40 backdrop-blur-sm p-8 rounded-[48px] border border-white/5 flex flex-col gap-8 text-left hover:bg-surface-dark hover:border-accent-gold/20 hover:translate-y-[-4px] transition-all duration-500 shadow-huge"
              >
                <div className="flex justify-between items-start">
                  <div className={`size-14 rounded-[24px] bg-white/5 ${stat.color} flex items-center justify-center group-hover:bg-white group-hover:text-primary transition-all duration-700`}>
                    <span className="material-symbols-outlined !text-3xl">{stat.icon}</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/20">{stat.trend}</span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-2">{stat.label}</p>
                  <p className="text-3xl font-display text-white">{stat.value}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Strategic Deep-Dive */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-reveal stagger-2">
          {/* Revenue Intelligence BI */}
          <div className="lg:col-span-3 bg-surface-dark/40 backdrop-blur-sm rounded-[56px] border border-white/5 p-10 space-y-10 shadow-huge overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-1 bg-gradient-to-l from-accent-gold/30 to-transparent"></div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-gold/40">Global Performance</p>
                <h3 className="text-2xl font-display italic text-white">Análise de Faturamento</h3>
              </div>
              <div className="flex gap-2">
                <div className="size-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40">
                  <span className="material-symbols-outlined !text-sm">analytics</span>
                </div>
              </div>
            </div>

            <div className="h-[240px] w-full relative group">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="chartGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A961" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C9A961" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <Tooltip
                    cursor={{ stroke: '#C9A961', strokeWidth: 1, strokeDasharray: '4 4' }}
                    contentStyle={{ backgroundColor: '#1c1f24', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', fontSize: '10px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', padding: '16px' }}
                    itemStyle={{ color: '#C9A961', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#C9A961" fill="url(#chartGold)" strokeWidth={3} animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="absolute bottom-[-10px] left-0 right-0 flex justify-between px-2 text-[9px] font-black uppercase text-white/20 tracking-widest">
                <span>Início do Ciclo</span>
                <span>Projeção JZ</span>
                <span>Status Atual</span>
              </div>
            </div>

            {isMaster && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10 border-t border-white/5">
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="size-8 rounded-lg bg-emerald-400/10 flex items-center justify-center text-emerald-400">
                      <span className="material-symbols-outlined !text-base">auto_awesome</span>
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Serviços Assinatura</h4>
                  </div>
                  <div className="space-y-6">
                    {stats.topServices.map((s: any, i: number) => (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="text-xs font-black text-accent-gold/20">0{i + 1}</span>
                          <p className="text-sm font-light text-white/80 truncate tracking-tight group-hover:text-white transition-colors uppercase">{s.name}</p>
                        </div>
                        <span className="text-xs font-bold text-accent-gold shrink-0">{s.count}x</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="size-8 rounded-lg bg-accent-gold/10 flex items-center justify-center text-accent-gold">
                      <span className="material-symbols-outlined !text-base">workspace_premium</span>
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Profissionais de Elite</h4>
                  </div>
                  <div className="space-y-6">
                    {stats.proRevenue.map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between group">
                        <p className="text-sm font-light text-white/80 truncate tracking-tight uppercase group-hover:text-white transition-colors">{p.name.split(' ')[0]}</p>
                        <span className="text-xs font-bold text-emerald-400 shrink-0">R$ {p.revenue.toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Narrative Feed */}
          <div className="lg:col-span-2 bg-surface-dark/40 backdrop-blur-sm rounded-[56px] border border-white/5 p-10 space-y-10 shadow-huge relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-1 bg-gradient-to-l from-sky-400/30 to-transparent"></div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-sky-400/40">Feed de Recepção</p>
                <h3 className="text-2xl font-display italic text-white">Próximos Atendimentos</h3>
              </div>
              <button onClick={() => navigate('/admin/agenda')} className="size-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                <span className="material-symbols-outlined !text-lg">east</span>
              </button>
            </div>

            <div className="flex-1 space-y-4">
              {upcomingAppointments.length > 0 ? upcomingAppointments.map((appt, i) => (
                <div key={i} className="group relative w-full bg-[#121417]/30 p-6 rounded-[32px] border border-white/5 hover:border-accent-gold/30 hover:bg-[#121417] transition-all duration-500 overflow-hidden">
                  <div className="flex items-center gap-5">
                    <div className="relative size-14 shrink-0 rounded-2xl overflow-hidden border border-white/10 shadow-huge group-hover:scale-105 transition-transform">
                      <img
                        src={appt.profiles?.profile_pic || `https://ui-avatars.com/api/?name=${appt.profiles?.name}&background=0f3e29&color=C9A961`}
                        className="w-full h-full object-cover"
                        alt="Member"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate group-hover:text-accent-gold transition-colors">{appt.profiles?.name || 'Membro do Clube'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="size-1.5 rounded-full bg-accent-gold/40"></span>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 truncate">{appt.services?.name || 'Curadoria VIP'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                      {new Date(appt.start_time).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </p>
                    <div className="flex items-center gap-2 text-accent-gold">
                      <span className="material-symbols-outlined !text-xs">schedule</span>
                      <p className="text-[11px] font-bold">{new Date(appt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 opacity-20 py-20">
                  <span className="material-symbols-outlined !text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-center w-[180px]">Agenda disponível para novas experiências</p>
                </div>
              )}
            </div>

            <button onClick={() => navigate('/admin/agenda')} className="w-full py-4 text-[9px] font-black text-white/20 hover:text-accent-gold uppercase tracking-[0.4em] text-center transition-colors">
              Explorar agenda completa
            </button>
          </div>
        </div>
      </main>

      {/* Persistent Premium Navigation - Visible only on mobile/tablet */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-[500px] z-[120] lg:hidden">
        <div className="premium-blur-dark rounded-[32px] border border-white/10 shadow-hugest px-8 py-4 flex justify-between items-center bg-[#121417]/90">
          {[
            { label: 'STATUS', icon: 'grid_view', path: '/admin', active: location.pathname === '/admin' },
            { label: 'AGENDA', icon: 'calendar_month', path: '/admin/agenda', active: location.pathname.includes('agenda') },
            { label: 'SQUAD', icon: 'clinical_notes', path: '/admin/professionals', active: location.pathname.includes('professionals'), hide: !isMaster },
            { label: 'GESTAO', icon: 'settings_cinematic', path: isMaster ? '/admin/settings' : '/admin/profile', active: location.pathname.includes('profile') || location.pathname.includes('settings') }
          ].map((item, idx) => {
            if (item.hide) return null;
            return (
              <button key={idx} onClick={() => navigate(item.path)} className={`flex flex-col items-center gap-1 group transition-all ${item.active ? 'text-accent-gold' : 'text-white/20 hover:text-white/60'}`}>
                <span className={`material-symbols-outlined !text-[28px] group-active:scale-90 transition-transform ${item.active ? 'fill-current' : ''}`} style={item.active ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
                <span className="text-[8px] font-black tracking-[0.3em] uppercase">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Decorative Elite Gradients */}
      <div className="fixed top-0 right-0 w-[40vw] h-[40vh] bg-accent-gold/5 blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-0 left-0 w-[30vw] h-[30vh] bg-primary/20 blur-[100px] pointer-events-none z-0 opacity-40"></div>
    </div>
  );
};

export default AdminDashboard;
