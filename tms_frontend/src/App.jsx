import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import SidebarLayout from './layouts/SidebarLayout';

// Pages
import Dashboard from './pages/Dashboard';
import LiveMap from './pages/LiveMap';
import HistoryPlayback from './pages/HistoryPlayback';
import TripCreate from './pages/finance/TripCreate';
import TripSettlement from './pages/finance/TripSettlement';
import Maintenance from './pages/mechanic/Maintenance';
import CustomerList from './pages/admin/CustomerList';
import RouteList from './pages/admin/RouteList';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SidebarLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="map" element={<LiveMap />} />
            <Route path="history" element={<HistoryPlayback />} />
            
            <Route path="finance/create-trip" element={<TripCreate />} />
            <Route path="finance/settlement" element={<TripSettlement />} />
            
            <Route path="mechanic/maintenance" element={<Maintenance />} />
            
            {/* Admin / Master Data */}
            <Route path="admin/customers" element={<CustomerList />} />
            <Route path="admin/routes" element={<RouteList />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
