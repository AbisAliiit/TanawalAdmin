'use client';

import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from '@/lib/msal-config';
import { AuthProvider } from '@/components/auth/auth-provider';
import { AdminGuard } from '@/components/auth/admin-guard';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { usePathname } from 'next/navigation';

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isLoginRoute = pathname === '/login';
  return (
    <MsalProvider instance={msalInstance}>
      <AuthProvider>
        {isLoginRoute ? (
          <main className="min-h-screen">{children}</main>
        ) : (
          <AdminGuard>
            <div className="flex h-screen bg-gray-50">
              <Sidebar />
              <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">{children}</main>
              </div>
            </div>
          </AdminGuard>
        )}
      </AuthProvider>
    </MsalProvider>
  );
}
