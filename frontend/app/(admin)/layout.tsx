'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/Sidebar';
import { ShieldAlert } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, loading, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-500">
        Verifying administrator permissions...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="p-6 rounded-2xl bg-white border border-rose-200 text-center max-w-md shadow-lg">
          <ShieldAlert className="h-10 w-10 text-rose-600 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">Administrator Privileges Required</h2>
          <p className="text-xs text-slate-500 mt-1">
            Access to administrative modules is restricted to authorized accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-[calc(100vh-4rem)]">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50">{children}</div>
    </div>
  );
}
