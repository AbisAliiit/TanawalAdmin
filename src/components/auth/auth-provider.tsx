"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AccountInfo,
  AuthenticationResult,
  InteractionRequiredAuthError,
  InteractionStatus,
} from "@azure/msal-browser";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { msalConfig, loginRequest, passwordResetAuthority, apiScopes } from "../../lib/msal-config";
import { setTokenProviders } from "../../common/axios-config";

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
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const [user, setUser] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1) Process redirect responses ONCE, then sync account state
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Important for redirect flow: processes the hash when returning from B2C
        await instance.handleRedirectPromise();
      } catch (e) {
        // swallow; we'll still allow manual login
        console.error("MSAL handleRedirectPromise error:", e);
      } finally {
        if (!mounted) return;
        setUser(accounts.length > 0 ? accounts[0] : null);
        setIsLoading(inProgress !== InteractionStatus.None);
      }
    })();
    return () => {
      mounted = false;
    };
    // We want this to run once on mount; MSAL stores results in cache
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance]);

  // 2) Keep user/loading in sync when MSAL interaction state changes
  useEffect(() => {
    if (inProgress === InteractionStatus.None) {
      setUser(accounts.length > 0 ? accounts[0] : null);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [accounts, inProgress]);

  // 3) Provide tokens to axios globally
  useEffect(() => {
    setTokenProviders({
      getAccessToken,
      getIdToken,
    });
    // safe to re-run when user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- Redirect-only auth API ---

  const login = async () => {
    // Start interactive login via redirect (no popup blockers)
    await instance.loginRedirect(loginRequest);
    // after this call, the page navigates to B2C and then back; no code below runs now
  };

  const logout = async () => {
    await instance.logoutRedirect({
      account: user ?? undefined,
      postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri,
    });
  };

  const getAccessToken = async (): Promise<string | null> => {
    const acc = user ?? instance.getActiveAccount() ?? instance.getAllAccounts()[0];
    if (!acc) return null;
    try {
      const res = await instance.acquireTokenSilent({ ...loginRequest, account: acc });
      return res.accessToken;
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        // Fallback to redirect (no popup)
        await instance.acquireTokenRedirect({ scopes: apiScopes, account: acc });
        return null; // will redirect away; control won't continue here
      }
      console.error("Access token error:", err);
      return null;
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    const acc = user ?? instance.getActiveAccount() ?? instance.getAllAccounts()[0];
    if (!acc) return null;
    try {
      const res = await instance.acquireTokenSilent({ ...loginRequest, account: acc });
      return res.idToken;
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        await instance.acquireTokenRedirect({ scopes: apiScopes, account: acc });
        return null;
      }
      console.error("ID token error:", err);
      return null;
    }
  };

  const value: AuthContextType = useMemo(
    () => ({
      isAuthenticated,
      user,
      login,
      logout,
      getAccessToken,
      getIdToken,
      isLoading,
    }),
    [isAuthenticated, user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
