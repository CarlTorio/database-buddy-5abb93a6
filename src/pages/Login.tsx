import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Code, Users, Shield, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth, validatePassword, UserRole } from "@/contexts/AuthContext";

const ROLE_ROUTES: Record<UserRole, string> = {
  developer: "/dashboard",
  salesAgent: "/crm",
  admin: "/compensation",
};

const ROLE_TITLES: Record<UserRole, string> = {
  developer: "Developer Login",
  salesAgent: "Sales Agent Login",
  admin: "Admin Login",
};

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, userRole, checkSession } = useAuth();
  
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showAdminButton, setShowAdminButton] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const adminButtonTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if already logged in
  useEffect(() => {
    if (checkSession() && userRole) {
      navigate(ROLE_ROUTES[userRole], { replace: true });
    }
  }, [checkSession, userRole, navigate]);

  const handleLogoClick = () => {
    clickCountRef.current++;
    
    if (clickCountRef.current === 3) {
      setShowAdminButton(true);
      clickCountRef.current = 0;
      
      // Hide admin button after 5 seconds
      if (adminButtonTimerRef.current) {
        clearTimeout(adminButtonTimerRef.current);
      }
      adminButtonTimerRef.current = setTimeout(() => {
        setShowAdminButton(false);
      }, 5000);
    }
    
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 500);
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setPassword("");
    setError("");
    setIsModalOpen(true);
  };

  const handleLogin = () => {
    if (!selectedRole) return;
    
    if (validatePassword(selectedRole, password)) {
      login(selectedRole, password, rememberMe);
      toast.success(`Welcome, ${password.toUpperCase()}!`);
      navigate(ROLE_ROUTES[selectedRole], { replace: true });
    } else {
      setError("Incorrect password. Please try again.");
      setPassword("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRole(null);
    setPassword("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Header with Logo */}
      <div className="text-center mb-12">
        <button
          onClick={handleLogoClick}
          className="text-4xl md:text-5xl font-bold text-primary hover:opacity-90 transition-opacity cursor-pointer select-none"
        >
          LogiCode.PH
        </button>
        <p className="text-muted-foreground mt-2 text-lg">Internal Management System</p>
      </div>

      {/* Role Selection */}
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Welcome to LogiCode
          </h1>
          <p className="text-muted-foreground">Select your role to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Developer Button */}
          <Button
            variant="outline"
            className="h-32 flex flex-col gap-3 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-300"
            onClick={() => handleRoleSelect("developer")}
          >
            <Code className="w-10 h-10 text-blue-500" />
            <span className="text-lg font-semibold text-foreground">I'm a Developer</span>
          </Button>

          {/* Sales Agent Button */}
          <Button
            variant="outline"
            className="h-32 flex flex-col gap-3 bg-green-500/10 border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50 transition-all duration-300"
            onClick={() => handleRoleSelect("salesAgent")}
          >
            <Users className="w-10 h-10 text-green-500" />
            <span className="text-lg font-semibold text-foreground">I'm a Sales Agent</span>
          </Button>
        </div>

        {/* Admin Button (Hidden by default) */}
        {showAdminButton && (
          <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Button
              variant="outline"
              className="h-20 w-full md:w-1/2 flex flex-col gap-2 bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all duration-300"
              onClick={() => handleRoleSelect("admin")}
            >
              <Shield className="w-8 h-8 text-purple-500" />
              <span className="text-base font-semibold text-foreground">Admin Login</span>
            </Button>
          </div>
        )}
      </div>

      {/* Password Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedRole && ROLE_TITLES[selectedRole]}</DialogTitle>
            <DialogDescription>
              Enter your password to continue
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
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
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <label
                htmlFor="remember"
                className="text-sm text-muted-foreground cursor-pointer select-none"
                title="Stay logged in for 30 days"
              >
                Remember Me
              </label>
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleLogin} disabled={!password}>
              Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
