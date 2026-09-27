'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { IUser, IOrganization, UserRole } from '../types';
import { api } from '../lib/api';

interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  role: UserRole;
}

interface AuthContextType {
  user: IUser | null;
  activeOrg: IOrganization | null;
  organizations: OrgSummary[];
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, organizationName?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [activeOrg, setActiveOrg] = useState<IOrganization | null>(null);
  const [organizations, setOrganizations] = useState<OrgSummary[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('docintel_token');
    if (!savedToken) {
      setUser(null);
      setActiveOrg(null);
      setOrganizations([]);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      setToken(savedToken);
      const res: any = await api.get('/auth/me');
      setUser(res.user);
      setActiveOrg(res.activeOrganization);
      setOrganizations(res.organizations || []);

      if (res.activeOrganization?.id) {
        localStorage.setItem('docintel_org_id', res.activeOrganization.id);
      }
    } catch (err) {
      console.warn('Authentication refresh error:', err);
      localStorage.removeItem('docintel_token');
      localStorage.removeItem('docintel_org_id');
      setUser(null);
      setActiveOrg(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res: any = await api.post('/auth/login', { email, password });
      localStorage.setItem('docintel_token', res.token);
      setToken(res.token);

      if (res.organization?.id) {
        localStorage.setItem('docintel_org_id', res.organization.id);
      }

      await refreshUser();
      router.push('/dashboard');
    } catch (err) {
      // Re-throw so the calling component (login page) can handle it
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, organizationName?: string) => {
    setIsLoading(true);
    try {
      const res: any = await api.post('/auth/register', { name, email, password, organizationName });
      localStorage.setItem('docintel_token', res.token);
      setToken(res.token);

      if (res.organization?.id) {
        localStorage.setItem('docintel_org_id', res.organization.id);
      }

      await refreshUser();
      router.push('/dashboard');
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('docintel_token');
      localStorage.removeItem('docintel_org_id');
      setUser(null);
      setActiveOrg(null);
      setOrganizations([]);
      setToken(null);
      router.push('/login');
    }
  };

  const switchOrganization = async (organizationId: string) => {
    setIsLoading(true);
    try {
      const res: any = await api.post('/auth/switch-org', { organizationId });
      localStorage.setItem('docintel_token', res.token);
      localStorage.setItem('docintel_org_id', organizationId);
      setToken(res.token);
      await refreshUser();
      window.location.reload();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeOrg,
        organizations,
        token,
        isLoading,
        login,
        register,
        logout,
        switchOrganization,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
