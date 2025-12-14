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
import Trips from './pages/Trips';
import Dispatcher from './pages/Dispatcher';
import Customers from './pages/Customers';
import Profile from './pages/Profile';
import MyTrips from './pages/driver/MyTrips';
import { Settings } from './pages/Placeholders';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  
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
            <Route path="trips" element={<Trips />} />
            <Route path="dispatcher" element={<Dispatcher />} />
            <Route path="customers" element={<Customers />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="my-trips" element={<MyTrips />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;