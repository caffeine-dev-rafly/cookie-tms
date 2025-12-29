import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveMap from './pages/LiveMap';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import RoutesPage from './pages/Routes';
import Origins from './pages/Origins';
import Trips from './pages/Trips';
import Dispatcher from './pages/Dispatcher';
import Customers from './pages/Customers';
import Profile from './pages/Profile';
import MyTrips from './pages/driver/MyTrips';
import TripHistory from './pages/driver/TripHistory';
import OrganizationList from './pages/admin/OrganizationList';
import GlobalMap from './pages/admin/GlobalMap';
import SystemLogs from './pages/admin/SystemLogs';
import Infrastructure from './pages/Infrastructure';
import Users from './pages/Users';
import FinanceDashboard from './pages/finance/Dashboard';
import Invoices from './pages/finance/Invoices';
import { Settings } from './pages/Placeholders';
import AccountDisabled from './pages/AccountDisabled';

const ProtectedRoute = ({ children }) => {
  const { token, loading, user } = useAuth();
  const disabledReason = sessionStorage.getItem('accountDisabledReason');

  if (disabledReason) {
    return <Navigate to="/disabled" replace />;
  }

  if (user && (user.organization_status === 'expired' || user.organization_status === 'suspended')) {
    const reason = user.disabled_reason || (user.organization_status === 'expired' ? 'Subscription expired.' : 'Account suspended.');
    sessionStorage.setItem('accountDisabledReason', reason);
    return <Navigate to="/disabled" replace />;
  }
  
  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-500">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/disabled" element={<AccountDisabled />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="map" element={<LiveMap />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="routes" element={<RoutesPage />} />
            <Route path="origins" element={<Origins />} />
            <Route path="trips" element={<Trips />} />
            <Route path="dispatcher" element={<Dispatcher />} />
            <Route path="customers" element={<Customers />} />
            <Route path="admin/organizations" element={<OrganizationList />} />
            <Route path="admin/global-map" element={<GlobalMap />} />
            <Route path="admin/logs" element={<SystemLogs />} />
            <Route path="infrastructure" element={<Infrastructure />} />
            <Route path="users" element={<Users />} />
            <Route path="finance" element={<FinanceDashboard />} />
            <Route path="finance/invoices" element={<Invoices />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="my-trips" element={<MyTrips />} />
            <Route path="trip-history" element={<TripHistory />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
