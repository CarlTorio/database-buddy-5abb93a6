import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Eye, EyeOff, Code, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CreateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: "developer" | "salesAgent";
  onAccountCreated: () => void;
}

const ROLE_CONFIG = {
  developer: {
    title: "Create Developer Account",
    description: "Create a new developer account for the Dev Team portal",
    icon: Code,
    color: "text-blue-500",
  },
  salesAgent: {
    title: "Create Sales Account",
    description: "Create a new sales agent account for the CRM portal",
    icon: Users,
    color: "text-green-500",
  },
};

const CreateAccountDialog = ({
  open,
  onOpenChange,
  role,
  onAccountCreated,
}: CreateAccountDialogProps) => {
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const config = ROLE_CONFIG[role];
  const Icon = config.icon;

  const handleCreate = async () => {
    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }
    if (!password.trim()) {
      setError("Password is required");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Check if password already exists
      const { data: existing } = await supabase
        .from("user_accounts")
        .select("id")
        .eq("password", password.toUpperCase())
        .maybeSingle();

      if (existing) {
        setError("This password is already in use. Please choose a different one.");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from("user_accounts").insert({
        full_name: fullName.trim(),
        password: password.toUpperCase(),
        role,
      });

      if (insertError) throw insertError;

      const firstName = fullName.trim().split(" ")[0];
      toast.success(`Account created for ${firstName}!`);
      onAccountCreated();
      handleClose();
    } catch (err: any) {
      console.error("Error creating account:", err);
      setError("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFullName("");
    setPassword("");
    setError("");
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleCreate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${config.color}`} />
            {config.title}
          </DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="e.g., Shian Guiterrez"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              First name will be used as display name (e.g., "Shian")
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                onKeyDown={handleKeyDown}
                className={error ? "border-destructive pr-10" : "pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              This password will be used to login
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive animate-in fade-in duration-200">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || !fullName || !password}>
            {loading ? "Creating..." : "Create Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAccountDialog;
