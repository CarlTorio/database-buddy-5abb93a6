import { useNavigate } from "react-router-dom";
import { Menu, X, RefreshCw, LogOut } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, EyeOff } from "lucide-react";
import UserBadge from "@/components/UserBadge";
import { useAuth, validatePassword } from "@/contexts/AuthContext";
import logoImage from "@/assets/logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  
  const { isAuthenticated, logout, login } = useAuth();
  const navigate = useNavigate();
  
  // Triple-click detection for quick menu when logged in
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = () => {
    // If not authenticated, show admin login modal
    if (!isAuthenticated) {
      setIsAdminModalOpen(true);
      setPassword("");
      setError("");
      return;
    }
    
    // If authenticated, use triple-click for quick menu
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

  const handleAdminLogin = () => {
    if (validatePassword("admin", password)) {
      login("admin", password, rememberMe);
      toast.success(`Welcome, ${password.toUpperCase()}!`);
      setIsAdminModalOpen(false);
      navigate("/compensation", { replace: true });
    } else {
      setError("Incorrect password. Please try again.");
      setPassword("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdminLogin();
    }
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
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Click for Admin Login when not authenticated */}
            <div className="flex items-center gap-2">
              <button 
                className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                onClick={handleLogoClick}
              >
                <img src={logoImage} alt="LogiCode Management" className="h-10 w-auto" />
              </button>

              {/* Quick Menu (Triple-click activated when logged in) */}
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

      {/* Admin Login Modal */}
      <Dialog open={isAdminModalOpen} onOpenChange={setIsAdminModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Login</DialogTitle>
            <DialogDescription>
              Enter your admin password to access the Compensation Portal
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                onKeyDown={handleKeyDown}
                className={error ? "border-destructive pr-10" : "pr-10"}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-sm text-destructive animate-in fade-in duration-200">{error}</p>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="admin-remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <label
                htmlFor="admin-remember"
                className="text-sm text-muted-foreground cursor-pointer select-none"
                title="Stay logged in for 30 days"
              >
                Remember Me
              </label>
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsAdminModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdminLogin} disabled={!password}>
              Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navbar;
