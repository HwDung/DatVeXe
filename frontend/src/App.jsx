import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminRoute, GuestRoute, ProtectedRoute } from './components/auth/RouteGuards';
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
import './styles/auth.css';

function MainLayout() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route
            path="/booking/seats"
            element={(
              <ProtectedRoute>
                <SeatSelectionPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/booking/passenger"
            element={(
              <ProtectedRoute>
                <PassengerInfoPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/booking/payment"
            element={(
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            )}
          />
          <Route path="/lookup" element={<BookingLookupPage />} />
          <Route
            path="/login"
            element={(
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            )}
          />
          <Route
            path="/register"
            element={(
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            )}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
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
      <AdminRoute>
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
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </AdminLayout>
      </AdminRoute>
    );
  }

  return <MainLayout />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
