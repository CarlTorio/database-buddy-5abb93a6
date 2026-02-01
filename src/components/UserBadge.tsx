import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth, UserRole } from "@/contexts/AuthContext";

const ROLE_LABELS: Record<UserRole, string> = {
  developer: "Developer",
  salesAgent: "Sales Agent",
  admin: "Admin",
};

const ROLE_COLORS: Record<UserRole, string> = {
  developer: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  salesAgent: "bg-green-500/20 text-green-400 border-green-500/30",
  admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const UserBadge = () => {
  const { userName, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = () => {
    clickCountRef.current++;
    
    if (clickCountRef.current === 3) {
      setShowMenu(true);
      clickCountRef.current = 0;
    }
    
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 500);
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  const handleSwitchRole = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (!userName || !userRole) return null;

  return (
    <div className="flex items-center gap-3">
      {/* Triple-click menu trigger (hidden - activated via logo) */}
      <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
        <DropdownMenuTrigger asChild>
          <div className="hidden" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleSwitchRole}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Switch Role
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Info Display */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground hidden sm:inline">Logged in as:</span>
          <span className="font-medium text-foreground">{userName}</span>
        </div>
        <Badge variant="outline" className={ROLE_COLORS[userRole]}>
          {ROLE_LABELS[userRole]}
        </Badge>
      </div>

      {/* Logout Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="text-muted-foreground hover:text-destructive"
      >
        <LogOut className="w-4 h-4" />
        <span className="ml-2 hidden sm:inline">Logout</span>
      </Button>
    </div>
  );
};

// Export the logo click handler for use in Navbar
export const useLogoTripleClick = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const handleLogoClick = () => {
    clickCountRef.current++;
    
    if (clickCountRef.current === 3) {
      setShowQuickMenu(true);
      clickCountRef.current = 0;
    }
    
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 500);
  };

  const handleSwitchRole = () => {
    logout();
    navigate("/login", { replace: true });
    setShowQuickMenu(false);
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
    setShowQuickMenu(false);
  };

  return { handleLogoClick, showQuickMenu, setShowQuickMenu, handleSwitchRole, handleLogout };
};

export default UserBadge;
