import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const ROLE_ROUTES: Record<UserRole, string> = {
  developer: "/dashboard",
  salesAgent: "/crm",
  admin: "/compensation",
};

const RouteGuard: React.FC<RouteGuardProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, userRole, checkSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isValid = checkSession();
    
    if (!isValid) {
      navigate("/login", { replace: true });
      return;
    }

    if (userRole && !allowedRoles.includes(userRole)) {
      // Redirect to their designated page
      navigate(ROLE_ROUTES[userRole], { replace: true });
    }
  }, [isAuthenticated, userRole, allowedRoles, navigate, checkSession, location.pathname]);

  if (!isAuthenticated || !userRole || !allowedRoles.includes(userRole)) {
    return null;
  }

  return <>{children}</>;
};

export default RouteGuard;
