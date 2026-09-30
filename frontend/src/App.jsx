import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import PassengerInfoPage from './pages/PassengerInfoPage';
import PaymentPage from './pages/PaymentPage';
import BookingLookupPage from './pages/BookingLookupPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTrips from './pages/admin/AdminTrips';
import AdminRoutes from './pages/admin/AdminRoutes';
import AdminCompanies from './pages/admin/AdminCompanies';
import AdminBookings from './pages/admin/AdminBookings';
import AdminPromotions from './pages/admin/AdminPromotions';
import AdminNews from './pages/admin/AdminNews';
import AdminUsers from './pages/admin/AdminUsers';
import './styles/global.css';
import './styles/admin.css';

function MainLayout() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/booking/seats" element={<SeatSelectionPage />} />
          <Route path="/booking/passenger" element={<PassengerInfoPage />} />
          <Route path="/booking/payment" element={<PaymentPage />} />
          <Route path="/lookup" element={<BookingLookupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

function AppContent() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <AdminLayout>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/trips" element={<AdminTrips />} />
          <Route path="/admin/routes" element={<AdminRoutes />} />
          <Route path="/admin/companies" element={<AdminCompanies />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />
          <Route path="/admin/promotions" element={<AdminPromotions />} />
          <Route path="/admin/news" element={<AdminNews />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Routes>
      </AdminLayout>
    );
  }

  return <MainLayout />;
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
