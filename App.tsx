
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Services from './pages/Services';
import Booking from './pages/Booking';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import History from './pages/History';
import Feed from './pages/Feed';
import Notifications from './pages/Notifications';
import FinancialControl from './pages/FinancialControl';
import Stories from './pages/Stories';
import AestheticProfile from './pages/AestheticProfile';
import AdminAgenda from './pages/AdminAgenda';
import AdminTimeline from './pages/AdminTimeline';
import AdminBookingForm from './pages/AdminBookingForm';
import ServiceManagement from './pages/ServiceManagement';
import ForgotPassword from './pages/ForgotPassword';
import ServiceDetails from './pages/ServiceDetails';
import LashPoints from './pages/LashPoints';
import AdminClients from './pages/AdminClients';
import ClientDetailsAdmin from './pages/ClientDetailsAdmin';
import ProfessionalDetailsAdmin from './pages/ProfessionalDetailsAdmin';
import AdminNotifications from './pages/AdminNotifications';
import AdminContentCreator from './pages/AdminContentCreator';
import AdminRoute from './components/AdminRoute';
// FinancialControl imported once above
import AdminSettings from './pages/AdminSettings';
import AdminProfessionals from './pages/AdminProfessionals';

import AdminFAQManagement from './pages/AdminFAQManagement';
import AdminTipsManagement from './pages/AdminTipsManagement';
import AdminLoyaltySettings from './pages/AdminLoyaltySettings';
import AdminStudioDetails from './pages/AdminStudioDetails';
import AdminWorkingHours from './pages/AdminWorkingHours';
import AdminMyProfile from './pages/AdminMyProfile';
import AdminLoyaltyClients from './pages/AdminLoyaltyClients';
import AdminLoyaltyRewards from './pages/AdminLoyaltyRewards';


import BookingConfirmed from './pages/BookingConfirmed';
import ReferFriend from './pages/ReferFriend';
import PostCare from './pages/PostCare';
import PreCare from './pages/PreCare';
import Testimonials from './pages/Testimonials';
import FidelityLevels from './pages/FidelityLevels';
import FAQ from './pages/FAQ';
import Coupons from './pages/Coupons';
import CheckIn from './pages/CheckIn';
import CheckInFilter from './pages/CheckInFilter';
import CheckInShare from './pages/CheckInShare';
import CheckInSuccess from './pages/CheckInSuccess';
import Evaluation from './pages/Evaluation';
import AppointmentDetails from './pages/AppointmentDetails';
import PriveDashboard from './pages/PriveDashboard';
import PriveJourney from './pages/PriveJourney';
import PriveRewards from './pages/PriveRewards';
import PriveRewardDetail from './pages/PriveRewardDetail';
import PriveHowToEarn from './pages/PriveHowToEarn';
import PriveHistory from './pages/PriveHistory';
import PriveSelection from './pages/PriveSelection';
import AdminPriveDashboard from './pages/AdminPriveDashboard';
import AdminPriveMembers from './pages/AdminPriveMembers';
import AdminPriveLevels from './pages/AdminPriveLevels';
import AdminPriveRewards from './pages/AdminPriveRewards';
import AdminPriveCampaigns from './pages/AdminPriveCampaigns';
import AdminPriveBalanceRules from './pages/AdminPriveBalanceRules';
import AdminPriveSettings from './pages/AdminPriveSettings';
import AdminShellPrive from './pages/AdminShellPrive';
import AdminTestimonials from './pages/AdminTestimonials';

// Container for client-facing pages (mobile-first, 430px max width)
const AppContainerClient: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex justify-center min-h-screen bg-gray-100 dark:bg-stone-950">
    <div className="relative w-full max-w-[430px] bg-background-light dark:bg-background-dark min-h-screen shadow-hugest flex flex-col overflow-x-hidden border-x border-primary/5">
      {children}
    </div>
  </div>
);

// Container for admin pages (full width for desktop/tablet but with Sidebar)
const AppContainerAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background-dark overflow-hidden font-outfit">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden relative">
        {/* Mobile Header Trigger */}
        <div className="lg:hidden p-5 flex items-center gap-4 bg-surface-dark border-b border-primary/5 sticky top-0 z-40">
          <button onClick={() => setSidebarOpen(true)} className="text-white hover:text-accent-gold transition-colors">
            <span className="material-symbols-outlined">menu_open</span>
          </button>
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Gestão Administrativa</span>
        </div>

        <main className="flex-1 overflow-y-auto no-scrollbar w-full max-w-[1920px] mx-auto bg-background-dark">
          {children}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Client-facing routes with mobile container */}
        <Route element={<AppContainerClient><Outlet /></AppContainerClient>}>
          {/* Autenticação */}
          <Route path="/" element={<Onboarding />} />
          <Route path="/login" element={<Login onAuth={() => { }} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Cliente Core */}
          <Route path="/home" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/service/:id" element={<ServiceDetails />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/booking/confirmed" element={<BookingConfirmed />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/details/:id" element={<AppointmentDetails />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/stories" element={<Stories />} />

          {/* Cliente Perfil & Relacionamento */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/aesthetic" element={<AestheticProfile />} />
          <Route path="/profile/levels" element={<FidelityLevels />} />
          <Route path="/profile/refer" element={<ReferFriend />} />
          <Route path="/profile/coupons" element={<Coupons />} />

          {/* JZ Privé Club */}
          <Route path="/prive" element={<PriveDashboard />} />
          <Route path="/prive/journey" element={<PriveJourney />} />
          <Route path="/prive/rewards" element={<PriveRewards />} />
          <Route path="/prive/rewards/:id" element={<PriveRewardDetail />} />
          <Route path="/prive/earn" element={<PriveHowToEarn />} />
          <Route path="/prive/history" element={<PriveHistory />} />
          <Route path="/prive/selection" element={<PriveSelection />} />

          {/* Cliente Cuidado & Ajuda */}
          <Route path="/care/pre" element={<PreCare />} />
          <Route path="/care/post" element={<PostCare />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/notifications" element={<Notifications />} />

          {/* Fluxo de Presença */}
          <Route path="/checkin" element={<CheckIn />} />
          <Route path="/checkin/filter" element={<CheckInFilter />} />
          <Route path="/checkin/share" element={<CheckInShare />} />
          <Route path="/checkin/success" element={<CheckInSuccess />} />
          <Route path="/evaluation" element={<Evaluation />} />
        </Route>

        {/* Admin routes with full-width container */}
        <Route element={<AppContainerAdmin><Outlet /></AppContainerAdmin>}>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/content" element={<AdminContentCreator />} />
            <Route path="/admin/finance" element={<FinancialControl />} />
            <Route path="/admin/agenda" element={<AdminAgenda />} />
            <Route path="/admin/agenda/day/:date" element={<AdminTimeline />} />
            <Route path="/admin/agenda/new" element={<AdminBookingForm />} />
            <Route path="/admin/services" element={<ServiceManagement />} />
            <Route path="/admin/clients" element={<AdminClients />} />
            <Route path="/admin/client/:id" element={<ClientDetailsAdmin />} />
            <Route path="/admin/professional/:id" element={<ProfessionalDetailsAdmin />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/profile" element={<AdminMyProfile />} />
            <Route path="/admin/studio-details" element={<AdminStudioDetails />} />
            <Route path="/admin/professionals" element={<AdminProfessionals />} />
            <Route path="/admin/faq" element={<AdminFAQManagement />} />
            <Route path="/admin/tips" element={<AdminTipsManagement />} />
            <Route path="/admin/loyalty" element={<AdminLoyaltySettings />} />
            <Route path="/admin/loyalty/clients" element={<AdminLoyaltyClients />} />
            <Route path="/admin/loyalty/rewards" element={<AdminLoyaltyRewards />} />
            <Route path="/admin/working-hours" element={<AdminWorkingHours />} />
            <Route path="/admin/testimonials" element={<AdminTestimonials />} />
          </Route>

          {/* Novos Módulos JZ Privé Club Admin */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminShellPrive />}>
              <Route path="/admin/jz-prive" element={<AdminPriveDashboard />} />
              <Route path="/admin/jz-prive/members" element={<AdminPriveMembers />} />
              <Route path="/admin/jz-prive/levels" element={<AdminPriveLevels />} />
              <Route path="/admin/jz-prive/rewards" element={<AdminPriveRewards />} />
              <Route path="/admin/jz-prive/campaigns" element={<AdminPriveCampaigns />} />
              <Route path="/admin/jz-prive/balance-rules" element={<AdminPriveBalanceRules />} />
              <Route path="/admin/jz-prive/settings" element={<AdminPriveSettings />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
