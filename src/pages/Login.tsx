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
import { Code, Users, Shield, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth, validatePassword, UserRole } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";


import Footer from "@/components/Footer";
import backgroundImage from "@/assets/background.png";
import logoImage from "@/assets/logo.png";

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
  const { login, userRole, checkSession } = useAuth();
  
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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section with Login */}
      <section 
        className="min-h-screen flex items-center justify-center pt-16 relative overflow-hidden"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-background/40" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center space-y-8">
            {/* Logo - Triple Click for Admin */}
            <button
              onClick={handleLogoClick}
              className="cursor-pointer select-none mx-auto block"
            >
              <img src={logoImage} alt="LogiCode.PH" className="h-20 w-auto mx-auto hover:opacity-90 transition-opacity" />
            </button>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Data & Account  
              <span className="block text-gradient bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent pb-[8px]">
                Management Hub
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Private workspace for our team to manage data, track credits, and access internal tools.
            </p>

            {/* Role Selection Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Button 
                size="lg" 
                className="glow-effect group w-[220px] justify-center bg-blue-600 hover:bg-blue-700"
                onClick={() => handleRoleSelect("developer")}
              >
                <Code className="w-4 h-4 mr-2" />
                I'm a Developer
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                className="group w-[220px] justify-center bg-green-600 hover:bg-green-700"
                onClick={() => handleRoleSelect("salesAgent")}
              >
                <Users className="w-4 h-4 mr-2" />
                I'm a Sales Agent
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              {/* Admin Button (Hidden by default) */}
              {showAdminButton && (
                <Button 
                  size="lg" 
                  className="group w-[220px] justify-center bg-purple-600 hover:bg-purple-700 animate-in fade-in slide-in-from-bottom-4 duration-300"
                  onClick={() => handleRoleSelect("admin")}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Login
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />

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
