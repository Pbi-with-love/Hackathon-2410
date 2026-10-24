import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { apiFetch } from '../lib/api';

export type UserRole = 'participant' | 'mentor';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthResponse {
  user: AuthUser;
  tokens: { accessToken: string; refreshToken: string };
}

function loadStoredAuth(): { user: AuthUser | null; accessToken: string | null } {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const userJson = localStorage.getItem('authUser');
    if (accessToken && userJson) {
      const user = JSON.parse(userJson) as AuthUser;
      return { user, accessToken };
    }
  } catch {
    // ignore parse errors
  }
  return { user: null, accessToken: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = loadStoredAuth();
  const [user, setUser] = useState<AuthUser | null>(stored.user);
  const [accessToken, setAccessToken] = useState<string | null>(stored.accessToken);

  function storeSession(authUser: AuthUser, tokens: { accessToken: string; refreshToken: string }) {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('authUser', JSON.stringify(authUser));
    setUser(authUser);
    setAccessToken(tokens.accessToken);
  }

  function clearSession() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authUser');
    setUser(null);
    setAccessToken(null);
  }

  const login = useCallback(async (email: string, password: string, role: UserRole) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error: string };
      throw new Error(data.error ?? 'Login failed');
    }

    const data = (await res.json()) as AuthResponse;
    storeSession(data.user, data.tokens);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, role: UserRole) => {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error: string };
        throw new Error(data.error ?? 'Registration failed');
      }

      const data = (await res.json()) as AuthResponse;
      storeSession(data.user, data.tokens);
    },
    []
  );

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await apiFetch('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // best-effort logout
      }
    }
    clearSession();
  }, []);

  const refreshTokens = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      clearSession();
      return;
    }

    const res = await apiFetch('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearSession();
      return;
    }

    const data = (await res.json()) as { tokens: { accessToken: string; refreshToken: string } };
    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);
    setAccessToken(data.tokens.accessToken);
  }, []);

  // Keep accessToken state in sync with localStorage (updated by apiFetch on auto-refresh)
  useEffect(() => {
    const syncToken = () => {
      const stored = localStorage.getItem('accessToken');
      if (stored !== accessToken) setAccessToken(stored);
    };
    window.addEventListener('storage', syncToken);
    return () => window.removeEventListener('storage', syncToken);
  }, [accessToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: user !== null && accessToken !== null,
        login,
        register,
        logout,
        refreshTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
