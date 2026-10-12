import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { VaultProvider } from '@/lib/vault-context';
import { Navbar } from '@/components/layout/Navbar';
import { UnlockModal } from '@/components/vault/UnlockModal';

export const metadata: Metadata = {
  title: 'PassVault — Web Password Manager with Isolated Local Storage',
  description:
    'Academic Web-Based Password Manager featuring zero-knowledge AES-256-GCM encryption, Isolate Mode local partitioning, and selective cloud synchronization.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
        <AuthProvider>
          <VaultProvider>
            <Navbar />
            <UnlockModal />
            <main className="flex-1 flex flex-col">{children}</main>
          </VaultProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
