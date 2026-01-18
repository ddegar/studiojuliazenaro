
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

import BookingConfirmed from './pages/BookingConfirmed';
import ReferFriend from './pages/ReferFriend';
import PostCare from './pages/PostCare';
import PreCare from './pages/PreCare';
import Testimonials from './pages/Testimonials';
import FidelityLevels from './pages/FidelityLevels';
import FAQ from './pages/FAQ';
import Coupons from './pages/Coupons';
import CheckIn from './pages/CheckIn';
import CheckInSuccess from './pages/CheckInSuccess';
import Evaluation from './pages/Evaluation';
import AppointmentDetails from './pages/AppointmentDetails';

const AppContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex justify-center min-h-screen bg-gray-200 dark:bg-zinc-950">
    <div className="relative w-full max-w-[430px] bg-background-light dark:bg-background-dark min-h-screen shadow-2xl flex flex-col overflow-x-hidden">
      {children}
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <AppContainer>
        <Routes>
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
          <Route path="/profile/points" element={<LashPoints />} />
          <Route path="/profile/levels" element={<FidelityLevels />} />
          <Route path="/profile/refer" element={<ReferFriend />} />
          <Route path="/profile/coupons" element={<Coupons />} />

          {/* Cliente Cuidado & Ajuda */}
          <Route path="/care/pre" element={<PreCare />} />
          <Route path="/care/post" element={<PostCare />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/notifications" element={<Notifications />} />

          {/* Fluxo de Presença */}
          <Route path="/checkin" element={<CheckIn />} />
          <Route path="/checkin/success" element={<CheckInSuccess />} />
          <Route path="/evaluation" element={<Evaluation />} />

          {/* Administrativo */}
          {/* Rotas Protegidas de Admin */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/content" element={<AdminContentCreator />} />
            <Route path="/admin/finance" element={<FinancialControl />} />
          </Route>
          <Route path="/admin/agenda" element={<AdminAgenda />} />
          <Route path="/admin/agenda/day/:date" element={<AdminTimeline />} />
          <Route path="/admin/agenda/new" element={<AdminBookingForm />} />
          <Route path="/admin/services" element={<ServiceManagement />} />
          <Route path="/admin/clients" element={<AdminClients />} />
          <Route path="/admin/client/:id" element={<ClientDetailsAdmin />} />
          <Route path="/admin/professional/:id" element={<ProfessionalDetailsAdmin />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/professionals" element={<AdminProfessionals />} />
          <Route path="/admin/faq" element={<AdminFAQManagement />} />
          <Route path="/admin/tips" element={<AdminTipsManagement />} />
          <Route path="/admin/loyalty" element={<AdminLoyaltySettings />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppContainer>
    </Router>
  );
};

export default App;
