'use client';

import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from '@/lib/msal-config';
import { AuthProvider } from '@/components/auth/auth-provider';
import { AdminGuard } from '@/components/auth/admin-guard';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isLoginRoute = pathname === '/login';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <MsalProvider instance={msalInstance}>
      <AuthProvider>
        {isLoginRoute ? (
          <main className="min-h-screen">{children}</main>
        ) : (
          <AdminGuard>
            <div className="flex h-screen bg-gray-50">
              {/* Mobile sidebar overlay */}
              {sidebarOpen && (
                <div 
                  className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
              )}
              
              {/* Sidebar */}
              <div className={`
                fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
              `}>
                <Sidebar onClose={() => setSidebarOpen(false)} />
              </div>
              
              {/* Main content */}
              <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
              </div>
            </div>
          </AdminGuard>
        )}
      </AuthProvider>
    </MsalProvider>
  );
}
