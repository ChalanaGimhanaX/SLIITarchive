import { createContext, type PropsWithChildren, useContext, useEffect, useState } from "react";

import { apiRequest } from "@/src/api/client";
import type { AuthTokens, User } from "@/src/api/types";

interface AuthContextValue {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchCurrentUser() {
  return apiRequest<User>("auth/session/me/");
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const currentUser = await fetchCurrentUser();
        if (!cancelled) {
          setUser(currentUser);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  async function login(email: string, password: string) {
    await apiRequest<User>("auth/session/login/", {
      method: "POST",
      body: { email, password },
    });

    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }

  async function googleLogin(idToken: string) {
    await apiRequest<User>("auth/session/google/login/", {
      method: "POST",
      body: { id_token: idToken },
    });

    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }

  async function logout() {
    try {
      await apiRequest("auth/session/logout/", {
        method: "POST",
      });
    } catch {
      // Client state is cleared even when the API logout request fails.
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens: null,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        googleLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
