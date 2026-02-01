import { Link, useNavigate } from "react-router-dom";
import { Menu, X, RefreshCw, LogOut } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserBadge from "@/components/UserBadge";
import { useAuth } from "@/contexts/AuthContext";
import logoImage from "@/assets/logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  // Triple-click detection
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = () => {
    if (!isAuthenticated) return;
    
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo with Triple-Click for quick menu */}
          <div className="flex items-center gap-2">
            <button 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
              onClick={handleLogoClick}
            >
              <img src={logoImage} alt="LogiCode Management" className="h-10 w-auto" />
            </button>

            {/* Quick Menu (Triple-click activated) */}
            <DropdownMenu open={showQuickMenu} onOpenChange={setShowQuickMenu}>
              <DropdownMenuTrigger asChild>
                <div className="hidden" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
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
          </div>

          {/* Desktop: User Badge */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && <UserBadge />}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-foreground" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4 animate-fade-in">
            {isAuthenticated && (
              <div className="pb-4 border-b border-border">
                <UserBadge />
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
