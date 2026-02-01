import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

export type UserRole = "developer" | "salesAgent" | "admin";

interface AuthContextType {
  userRole: UserRole | null;
  userName: string | null;
  isAuthenticated: boolean;
  login: (role: UserRole, password: string, rememberMe: boolean) => void;
  logout: () => void;
  checkSession: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PASSWORDS: Record<UserRole, string[]> = {
  developer: ["DEVTORIO", "DEVRONA"],
  salesAgent: ["SALESALVIN", "SALESSHIAN"],
  admin: ["ADMIN123"],
};

export const validatePassword = (role: UserRole, password: string): boolean => {
  return PASSWORDS[role].includes(password.toUpperCase());
};

export const getRoleFromPassword = (password: string): { role: UserRole; valid: boolean } | null => {
  const upperPassword = password.toUpperCase();
  for (const [role, passwords] of Object.entries(PASSWORDS)) {
    if (passwords.includes(upperPassword)) {
      return { role: role as UserRole, valid: true };
    }
  }
  return null;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkSession = useCallback((): boolean => {
    const storedRole = localStorage.getItem("userRole") as UserRole | null;
    const storedName = localStorage.getItem("userName");
    const sessionExpiry = localStorage.getItem("sessionExpiry");

    if (!storedRole || !storedName) {
      return false;
    }

    // Check if session expired
    if (sessionExpiry && Date.now() > parseInt(sessionExpiry)) {
      localStorage.clear();
      setUserRole(null);
      setUserName(null);
      setIsAuthenticated(false);
      return false;
    }

    setUserRole(storedRole);
    setUserName(storedName);
    setIsAuthenticated(true);
    return true;
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = (role: UserRole, password: string, rememberMe: boolean) => {
    localStorage.setItem("userRole", role);
    localStorage.setItem("userName", password.toUpperCase());
    
    if (rememberMe) {
      // Set expiry to 30 days from now
      const expiryDate = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem("sessionExpiry", expiryDate.toString());
      localStorage.setItem("rememberMe", "true");
    } else {
      // Session expires when browser closes (no expiry stored)
      localStorage.removeItem("sessionExpiry");
      localStorage.removeItem("rememberMe");
    }

    setUserRole(role);
    setUserName(password.toUpperCase());
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.clear();
    setUserRole(null);
    setUserName(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ userRole, userName, isAuthenticated, login, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
