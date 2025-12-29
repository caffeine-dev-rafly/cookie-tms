import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import SubscriptionBanner from '../components/SubscriptionBanner';
import NotificationBell from '../components/NotificationBell';

const MainLayout = () => {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
         <SubscriptionBanner />
         <div className="flex justify-end items-center px-4 py-2 border-b border-slate-200 bg-white">
           <NotificationBell />
         </div>
         <main className="flex-1 overflow-auto relative p-0">
            <Outlet />
         </main>
      </div>
    </div>
  );
};

export default MainLayout;
