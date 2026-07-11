import React, { createContext, useState, useEffect, ReactNode } from "react";
import authApi, { LoginInput, RegisterInput } from "../api/auth.api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  businessId: string;
  isActive: boolean;
  permissions: string[];
}

export interface Business {
  id: string;
  name: string;
  gstNumber?: string;
  phone?: string;
  address?: string;
  workerSeatLimit?: number;
}

interface AuthContextType {
  user: User | null;
  business: Business | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<any>;
  register: (data: RegisterInput) => Promise<any>;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSession = async () => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    try {
      setToken(storedToken);
      const res = await authApi.getMe();
      if (res.success && res.data) {
        setUser({
          id: res.data.user.id,
          name: res.data.user.name,
          email: res.data.user.email,
          role: res.data.user.role,
          businessId: res.data.user.businessId,
          isActive: res.data.user.isActive,
          permissions: res.data.permissions || [],
        });
        setBusiness(res.data.business);
      }
    } catch (err) {
      console.error("Failed to load user session on refresh:", err);
      // Clean stale session
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      setBusiness(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(data);
      if (res.success && res.data) {
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
        setUser({
          id: res.data.user.id,
          name: res.data.user.name,
          email: res.data.user.email,
          role: res.data.user.role,
          businessId: res.data.user.businessId,
          isActive: res.data.user.isActive,
          permissions: res.data.permissions || [],
        });
        setBusiness(res.data.business);
        return res.data;
      }
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      if (res.success && res.data) {
        localStorage.setItem("token", res.data.token);
        setToken(res.data.token);
        setUser({
          id: res.data.user.id,
          name: res.data.user.name,
          email: res.data.user.email,
          role: res.data.user.role,
          businessId: res.data.user.businessId,
          isActive: res.data.user.isActive,
          permissions: res.data.permissions || [],
        });
        setBusiness(res.data.business);
        return res.data;
      }
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setBusiness(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export default AuthContext;
