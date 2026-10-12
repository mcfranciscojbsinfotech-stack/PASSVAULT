'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { VaultItemDecrypted, STORAGE_MODES } from '@passvault/shared';
import { VaultService } from './vault-service';
import { validateRecoveryCode } from '@passvault/crypto';

interface VaultContextType {
  isUnlocked: boolean;
  recoveryCode: string | null;
  credentials: VaultItemDecrypted[];
  isolatedCredentials: VaultItemDecrypted[];
  loading: boolean;
  unlockModalOpen: boolean;
  openUnlockModal: () => void;
  closeUnlockModal: () => void;
  unlockVault: (code: string) => Promise<boolean>;
  lockVault: () => void;
  refreshVault: () => Promise<void>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<VaultItemDecrypted[]>([]);
  const [isolatedCredentials, setIsolatedCredentials] = useState<VaultItemDecrypted[]>([]);
  const [loading, setLoading] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);

  const openUnlockModal = () => setUnlockModalOpen(true);
  const closeUnlockModal = () => setUnlockModalOpen(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetInactivityTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isUnlocked) {
      timerRef.current = setTimeout(() => {
        lockVault();
      }, INACTIVITY_TIMEOUT_MS);
    }
  };

  useEffect(() => {
    const handleActivity = () => {
      resetInactivityTimer();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isUnlocked]);

  const refreshVault = async () => {
    if (!recoveryCode) return;
    setLoading(true);
    try {
      const [synced, isolated] = await Promise.all([
        VaultService.getCredentialsByMode(STORAGE_MODES.SYNCHRONIZED, recoveryCode),
        VaultService.getCredentialsByMode(STORAGE_MODES.ISOLATED, recoveryCode),
      ]);
      setCredentials(synced);
      setIsolatedCredentials(isolated);
    } catch (err) {
      console.error('Error refreshing vault:', err);
    } finally {
      setLoading(false);
    }
  };

  const unlockVault = async (code: string): Promise<boolean> => {
    if (!validateRecoveryCode(code)) {
      return false;
    }

    setLoading(true);
    try {
      const [synced, isolated] = await Promise.all([
        VaultService.getCredentialsByMode(STORAGE_MODES.SYNCHRONIZED, code),
        VaultService.getCredentialsByMode(STORAGE_MODES.ISOLATED, code),
      ]);
      setRecoveryCode(code);
      setIsUnlocked(true);
      setUnlockModalOpen(false);
      setCredentials(synced);
      setIsolatedCredentials(isolated);
      resetInactivityTimer();
      return true;
    } catch (err) {
      console.error('Failed to unlock vault:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const lockVault = () => {
    setIsUnlocked(false);
    setRecoveryCode(null);
    setCredentials([]);
    setIsolatedCredentials([]);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <VaultContext.Provider
      value={{
        isUnlocked,
        recoveryCode,
        credentials,
        isolatedCredentials,
        loading,
        unlockModalOpen,
        openUnlockModal,
        closeUnlockModal,
        unlockVault,
        lockVault,
        refreshVault,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}
