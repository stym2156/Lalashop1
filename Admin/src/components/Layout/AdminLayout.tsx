import React, { ReactNode } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import { AdminAlertsProvider } from '@/contexts/AdminAlertsContext';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <AdminAlertsProvider>
      <div className="flex h-screen bg-white text-black font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white">
            <div className="container mx-auto px-6 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminAlertsProvider>
  );
};

export default AdminLayout;
