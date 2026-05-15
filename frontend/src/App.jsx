import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { Toaster } from './components/ui/Sonner';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingScreen from './components/common/LoadingScreen';

/* ─── Layouts ─── */
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const CashierLayout = lazy(() => import('./layouts/CashierLayout'));
const SuperAdminLayout = lazy(() => import('./layouts/SuperAdminLayout'));

/* ─── Auth ─── */
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));

/* ─── Admin Pages ─── */
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const ProductsPage = lazy(() => import('./pages/admin/ProductsPage'));
const BillingPage = lazy(() => import('./pages/admin/BillingPage'));
const PaymentsDuePage = lazy(() => import('./pages/admin/PaymentsDuePage'));
const SuppliersPage = lazy(() => import('./pages/admin/SuppliersPage'));
const CustomersPage = lazy(() => import('./pages/admin/CustomersPage'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const SessionsPage = lazy(() => import('./pages/admin/SessionsPage'));
const OffersPage = lazy(() => import('./pages/admin/OffersPage'));
const SettingsPage = lazy(() => import('./pages/admin/settings/SettingsPage'));

/* ─── Cashier Pages ─── */
const CashierDashboardPage = lazy(() => import('./pages/cashier/CashierDashboardPage'));
const CashierBillingPage = lazy(() => import('./pages/cashier/CashierBillingPage'));
const CashierPaymentsDuePage = lazy(() => import('./pages/cashier/CashierPaymentsDuePage'));

/* ─── Super Admin Pages ─── */
const SuperDashboard = lazy(() => import('./pages/superadmin/SuperDashboard.jsx'));
const ActivityLogs = lazy(() => import('./pages/superadmin/ActivityLogs.jsx'));
const SuperUserManagement = lazy(() => import('./pages/superadmin/UserManagement.jsx'));

function AppRoutes() {
  const { isAuthenticated, role, businessType } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      document.title = businessType === 'pharma' ? 'Vendharaa Pharma Care' : 'Vendharaa Agro Store';
    } else {
      document.title = 'Vendharaa Billing';
    }
  }, [isAuthenticated, businessType]);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* ─── Login ─── */}
        <Route
          path="/"
          element={
            isAuthenticated
              ? <Navigate to={role === 'SuperAdmin' ? '/superadmin' : role === 'Cashier' ? '/cashier' : '/admin'} replace />
              : <LoginPage />
          }
        />

        {/* ─── Admin Routes ─── */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="payments" element={<PaymentsDuePage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="offers" element={<OffersPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* ─── Cashier Routes ─── */}
        <Route
          path="/cashier"
          element={
            <ProtectedRoute requiredRole="cashier">
              <CashierLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CashierDashboardPage />} />
          <Route path="billing" element={<CashierBillingPage />} />
          <Route path="payments" element={<CashierPaymentsDuePage />} />
        </Route>

        {/* ─── Super Admin Routes ─── */}
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute requiredRole="superadmin">
              <SuperAdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SuperDashboard />} />
          <Route path="logs" element={<ActivityLogs />} />
          <Route path="users" element={<SuperUserManagement />} />
        </Route>

        {/* ─── Catch-all ─── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Toaster />
        <AppRoutes />
      </AppProvider>
    </AuthProvider>
  );
}
