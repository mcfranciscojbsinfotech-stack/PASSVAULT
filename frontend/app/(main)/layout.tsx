'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex min-h-[calc(100vh-4rem)]">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50">{children}</div>
    </div>
  );
}
