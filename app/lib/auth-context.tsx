'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from './api-client';
import { Agent } from './types';

interface Tenant {
  id: string;
  name: string;
  apiKey: string;
}

interface AuthContextType {
  apiKey: string | null;
  tenant: Tenant | null;
  isLoading: boolean;
  login: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load API key from localStorage on mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem('vocalbridge_api_key');
    const storedTenant = localStorage.getItem('vocalbridge_tenant');

    if (storedApiKey && storedTenant) {
      setApiKey(storedApiKey);
      setTenant(JSON.parse(storedTenant));
      apiClient.setApiKey(storedApiKey);
    }

    setIsLoading(false);
  }, []);

  const login = async (newApiKey: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate API key by fetching agents (tenant-scoped endpoint)
      apiClient.setApiKey(newApiKey);
      const response = await apiClient.get<Agent[]>('/agents');

      if (response.error) {
        apiClient.clearApiKey();
        return { success: false, error: response.error };
      }

      // API key is valid, store it
      localStorage.setItem('vocalbridge_api_key', newApiKey);
      
      // Create a minimal tenant object (we don't have a direct tenant endpoint)
      const tenantData: Tenant = {
        id: 'tenant-id', // This would come from a proper tenant endpoint
        name: 'Tenant',
        apiKey: newApiKey,
      };
      
      localStorage.setItem('vocalbridge_tenant', JSON.stringify(tenantData));
      
      setApiKey(newApiKey);
      setTenant(tenantData);

      return { success: true };
    } catch (error) {
      apiClient.clearApiKey();
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('vocalbridge_api_key');
    localStorage.removeItem('vocalbridge_tenant');
    apiClient.clearApiKey();
    setApiKey(null);
    setTenant(null);
  };

  return (
    <AuthContext.Provider value={{ apiKey, tenant, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
