import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const MainLayout = () => {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
         <main className="flex-1 overflow-auto relative p-0">
            <Outlet />
         </main>
      </div>
    </div>
  );
};

export default MainLayout;
