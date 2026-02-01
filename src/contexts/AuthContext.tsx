import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "developer" | "salesAgent" | "admin";

interface AuthContextType {
  userRole: UserRole | null;
  userName: string | null;
  isAuthenticated: boolean;
  login: (role: UserRole, password: string, rememberMe: boolean, displayName?: string) => void;
  logout: () => void;
  checkSession: () => boolean;
  validateCredentials: (role: UserRole, password: string) => Promise<{ valid: boolean; displayName: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin passwords are still hardcoded
const ADMIN_PASSWORDS = ["ADMIN123"];

export const validatePassword = async (role: UserRole, password: string): Promise<{ valid: boolean; displayName: string | null }> => {
  const upperPassword = password.toUpperCase();
  
  // Admin check - hardcoded passwords
  if (role === "admin") {
    if (ADMIN_PASSWORDS.includes(upperPassword)) {
      return { valid: true, displayName: upperPassword };
    }
    return { valid: false, displayName: null };
  }
  
  // Developer and Sales Agent - check database
  try {
    const { data, error } = await supabase
      .from("user_accounts")
      .select("full_name, role")
      .eq("password", upperPassword)
      .eq("role", role)
      .maybeSingle();

    if (error || !data) {
      return { valid: false, displayName: null };
    }

    // Get first name
    const firstName = data.full_name.split(" ")[0];
    return { valid: true, displayName: firstName };
  } catch {
    return { valid: false, displayName: null };
  }
};

export const getRoleFromPassword = async (password: string): Promise<{ role: UserRole; valid: boolean; displayName: string } | null> => {
  const upperPassword = password.toUpperCase();
  
  // Check admin first
  if (ADMIN_PASSWORDS.includes(upperPassword)) {
    return { role: "admin", valid: true, displayName: upperPassword };
  }
  
  // Check database for dev/sales
  try {
    const { data, error } = await supabase
      .from("user_accounts")
      .select("full_name, role")
      .eq("password", upperPassword)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const firstName = data.full_name.split(" ")[0];
    return { role: data.role as UserRole, valid: true, displayName: firstName };
  } catch {
    return null;
  }
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

  const login = (role: UserRole, password: string, rememberMe: boolean, displayName?: string) => {
    const nameToStore = displayName || password.toUpperCase();
    
    localStorage.setItem("userRole", role);
    localStorage.setItem("userName", nameToStore);
    
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
    setUserName(nameToStore);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.clear();
    setUserRole(null);
    setUserName(null);
    setIsAuthenticated(false);
  };

  const validateCredentials = async (role: UserRole, password: string) => {
    return validatePassword(role, password);
  };

  return (
    <AuthContext.Provider value={{ userRole, userName, isAuthenticated, login, logout, checkSession, validateCredentials }}>
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
