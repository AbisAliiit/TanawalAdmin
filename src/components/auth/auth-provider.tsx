'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AccountInfo,
  AuthenticationResult,
  InteractionRequiredAuthError,
  InteractionStatus,
} from '@azure/msal-browser';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { msalConfig, loginRequest, passwordResetAuthority } from '../../lib/msal-config';
import { setTokenProviders } from '../../common/axios-config';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AccountInfo | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  getIdToken: () => Promise<string | null>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [user, setUser] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Handle account state changes
  useEffect(() => {
    if (inProgress === InteractionStatus.None) {
      setUser(accounts.length > 0 ? accounts[0] : null);
      setIsLoading(false);
    }
  }, [accounts, inProgress]);

  // ✅ Set token providers globally for axios
  useEffect(() => {
    const setup = async () => {
      setTokenProviders({
        getAccessToken,
        getIdToken,
      });
    };
    setup();
  }, [user]);

  // 🔑 Login logic
  const login = async () => {
    try {
      setIsLoading(true);
      const response = await instance.loginPopup(loginRequest);
      setUser(response.account);
    } catch (error: any) {
      console.error('Login error:', error);

      if (error.errorCode === 'AADB2C90118') {
        try {
          await instance.loginPopup({
            ...loginRequest,
            authority: passwordResetAuthority,
          });
        } catch (resetError) {
          console.error('Password reset error:', resetError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 🔐 Logout logic
  const logout = async () => {
    try {
      setIsLoading(true);
      await instance.logoutPopup({
        account: user || undefined,
        postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri,
      });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎟️ Access Token (for most APIs)
  const getAccessToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      const response = await instance.acquireTokenSilent({ ...loginRequest, account: user });
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        const popupResponse = await instance.acquireTokenPopup({ ...loginRequest, account: user });
        return popupResponse.accessToken;
      }
      console.error('Access token error:', error);
      return null;
    }
  };

  // 🧩 ID Token (for APIM user microservice)
  const getIdToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      const response = await instance.acquireTokenSilent({ ...loginRequest, account: user });
      return response.idToken;
    } catch (error) {
      console.error('ID token error:', error);
      return null;
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    getAccessToken,
    getIdToken,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
