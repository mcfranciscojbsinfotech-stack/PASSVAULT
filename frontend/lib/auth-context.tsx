'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, ROLES } from '@passvault/shared';
import { apiRequest } from './api-client';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isPrimaryAdmin: boolean;
  login: (
    email: string,
    password: string,
    portalRole?: 'USER' | 'ADMIN'
  ) => Promise<{ mfaRequired?: boolean; tempToken?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await apiRequest<{ user: UserProfile }>('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string, portalRole?: 'USER' | 'ADMIN') => {
    const data = await apiRequest<{
      mfaRequired?: boolean;
      tempToken?: string;
      user?: UserProfile;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, portalRole }),
    });

    if (data.user) {
      setUser(data.user);
    }
    return data;
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  };

  const isAdmin = user?.role === ROLES.ADMIN || user?.role === ROLES.SUB_ADMIN;
  const isPrimaryAdmin = user?.role === ROLES.ADMIN;

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin, isPrimaryAdmin, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
