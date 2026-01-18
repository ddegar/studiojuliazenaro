
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { supabase } from '../services/supabase';

const GROWTH_DATA = [
  { date: '01 Abr', master: 0, p1: 0, p2: 0 },
  { date: 'Hoje', master: 0, p1: 0, p2: 0 },
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    clients: 0,
    appointmentsToday: 0,
    revenue: 0,
    user: { name: 'Admin', role: 'MASTER_ADMIN', avatar: '' }
  });

  const isMaster = true;

  useEffect(() => {
    const fetchStats = async () => {
      // Mock fetch logic same as before...
      const { count: clientsCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'CLIENT');
      const today = new Date().toISOString().split('T')[0];
      const { count: apptsCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', today);
      const { data: transactions } = await supabase.from('transactions').select('amount, type');
      const totalRevenue = transactions?.reduce((acc, curr) => {
        return curr.type === 'INCOME' ? acc + curr.amount : acc - curr.amount;
      }, 0) || 0;

      setStats({
        clients: clientsCount || 0,
        appointmentsToday: apptsCount || 0,
        revenue: totalRevenue,
        user: { name: 'Julia Zenaro', role: 'MASTER_ADMIN', avatar: '' }
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const MENU_ITEMS = [
    { label: 'Painel', icon: 'grid_view', path: '/admin' },
    { label: 'Agenda', icon: 'calendar_month', path: '/admin/agenda' },
    { label: 'Clientes', icon: 'groups', path: '/admin/clients' },
    { label: 'Catálogo', icon: 'category', path: '/admin/services' },
    { label: 'Profissionais', icon: 'badge', path: '/admin/professionals', masterOnly: true },
    { label: 'Financeiro', icon: 'payments', path: '/admin/finance' },
    { label: 'Conteúdo', subheader: true },
    { label: 'Dicas (Pré/Pós)', icon: 'lightbulb', path: '/admin/tips' },
    { label: 'FAQ (Dúvidas)', icon: 'help', path: '/admin/faq' },
    { label: 'Stories', icon: 'history_toggle_off', path: '/admin/stories' },
    { label: 'Depoimentos', icon: 'reviews', path: '/admin/testimonials' },
  ];

  return (
    <div className="flex h-screen bg-background-dark text-white overflow-hidden">

      {/* Overlay Backdrop (Mobile & Desktop when open) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation (Always Off-Canvas style) */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-80 bg-card-dark border-r border-white/10 flex flex-col transition-transform duration-300 ease-out shadow-2xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
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
                  if (!item.disabled) {
                    navigate(item.path!);
                    setSidebarOpen(false);
                  }
                }}
                disabled={item.disabled}
                className={`
                        w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all
                        ${item.disabled ? 'opacity-30 cursor-not-allowed' : location.pathname === item.path ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-white/5 text-gray-400 hover:text-white'}
                    `}
              >
                <span className={`material-symbols-outlined ${location.pathname === item.path ? '' : 'text-gray-500'}`}>{item.icon}</span>
                <span className="text-sm font-bold tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3 border border-white/5">
            <img src={stats.user.avatar || "https://picsum.photos/100/100?sig=admin"} className="size-10 rounded-full border border-white/10" alt="Admin" />
            <div className="flex-1">
              <p className="text-xs font-bold text-white">{stats.user.name}</p>
              <p className="text-[9px] text-accent-gold uppercase font-bold tracking-wider">{isMaster ? 'Master' : 'Pro'}</p>
            </div>
            <button onClick={() => navigate('/login')} className="size-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 hover:bg-rose-500/20">
              <span className="material-symbols-outlined !text-sm">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-dark">
        {/* Unified Header */}
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
              <img src={stats.user.avatar || "https://picsum.photos/100/100?sig=admin"} className="w-full h-full rounded-full object-cover" alt="Profile" />
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Content */}
        <main className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-10 space-y-8">

          {/* Welcome & Date Section */}
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


          {/* Quick Stats Grid - Mobile Optimized */}
          <div className="grid grid-cols-1 gap-4">
            {/* Total Revenue */}
            <div onClick={() => navigate('/admin/finance')} className="bg-card-dark p-6 rounded-[24px] border border-white/5 relative overflow-hidden active:scale-[0.98] transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <span className="material-symbols-outlined !text-2xl">payments</span>
                </div>
                <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined !text-sm">trending_up</span> +12%
                </span>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Faturamento Mensal</p>
                <h3 className="text-4xl font-display font-bold text-white">R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Appointments */}
              <div onClick={() => navigate('/admin/agenda')} className="bg-card-dark p-5 rounded-[24px] border border-white/5 active:scale-[0.98] transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <span className="material-symbols-outlined !text-xl">calendar_today</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-white mb-1">{stats.appointmentsToday}</h3>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Hoje</p>
                </div>
              </div>

              {/* Active Clients */}
              <div onClick={() => navigate('/admin/clients')} className="bg-card-dark p-5 rounded-[24px] border border-white/5 active:scale-[0.98] transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="size-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <span className="material-symbols-outlined !text-xl">groups</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-white mb-1">{stats.clients}</h3>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Total</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Quick Actions List */}
            <div className="bg-card-dark p-6 rounded-[24px] border border-white/5">
              <h3 className="text-sm font-bold text-white mb-4">Ações Rápidas</h3>
              <div className="space-y-3">
                <button onClick={() => navigate('/admin/content')} className="w-full p-4 rounded-xl bg-white/5 active:bg-white/10 border border-white/5 flex items-center gap-4 transition-colors text-left">
                  <div className="size-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
                    <span className="material-symbols-outlined">post_add</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Novo Post/Dica</p>
                    <p className="text-[10px] text-gray-400">Conteúdo do app</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-500 ml-auto">chevron_right</span>
                </button>

                <button onClick={() => navigate('/admin/clients')} className="w-full p-4 rounded-xl bg-white/5 active:bg-white/10 border border-white/5 flex items-center gap-4 transition-colors text-left">
                  <div className="size-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <span className="material-symbols-outlined">person_add</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Novo Cliente</p>
                    <p className="text-[10px] text-gray-400">Cadastro manual</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-500 ml-auto">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Main Chart - Simplified for Mobile */}
            <div className="bg-card-dark p-6 rounded-[24px] border border-white/5 h-[300px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-accent-gold">show_chart</span>
                  Financeiro
                </h3>
                <div className="bg-white/5 rounded-lg px-2 py-1 text-[10px] text-white font-bold border border-white/10">30 dias</div>
              </div>
              <div className="flex-1 w-full min-h-0 -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={GROWTH_DATA}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E4C78F" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#E4C78F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey={isMaster ? "master" : "p1"} stroke="#E4C78F" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card-dark p-6 rounded-[24px] border border-white/5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Atividade Recente</h3>
              <div className="space-y-4">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex items-start gap-4 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                    <div className="size-2 mt-2 rounded-full bg-accent-gold shrink-0"></div>
                    <div>
                      <p className="text-sm text-gray-300 leading-snug"><span className="font-bold text-white">Maria Silva</span> agendou <span className="text-accent-gold">Lash Lifting</span>.</p>
                      <p className="text-[10px] text-gray-500 mt-1">Há 2 horas</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

    </div>
  );
};

export default AdminDashboard;
