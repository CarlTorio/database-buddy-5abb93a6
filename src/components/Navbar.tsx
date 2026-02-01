import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Download, Upload, RefreshCw, LogOut } from "lucide-react";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserBadge from "@/components/UserBadge";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Query all tables directly from the client
      const [categoriesRes, contactsRes, templatesRes, userEmailsRes] = await Promise.all([
        supabase.from('contact_categories').select('*'),
        supabase.from('contacts').select('*'),
        supabase.from('email_templates').select('*'),
        supabase.from('user_emails').select('*')
      ]);
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        tables: {
          contact_categories: categoriesRes.data || [],
          contacts: contactsRes.data || [],
          email_templates: templatesRes.data || [],
          user_emails: userEmailsRes.data || []
        }
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Database exported successfully!');
      setIsPopoverOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export database');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      if (!importData.tables) {
        throw new Error('Invalid backup file format');
      }

      // Import categories first (contacts depend on them)
      if (importData.tables.contact_categories?.length > 0) {
        for (const item of importData.tables.contact_categories) {
          await supabase.from('contact_categories').upsert(item, {
            onConflict: 'id'
          });
        }
      }

      // Import contacts
      if (importData.tables.contacts?.length > 0) {
        for (const item of importData.tables.contacts) {
          await supabase.from('contacts').upsert(item, {
            onConflict: 'id'
          });
        }
      }

      // Import email templates
      if (importData.tables.email_templates?.length > 0) {
        for (const item of importData.tables.email_templates) {
          await supabase.from('email_templates').upsert(item, {
            onConflict: 'id'
          });
        }
      }

      // Import user emails
      if (importData.tables.user_emails?.length > 0) {
        for (const item of importData.tables.user_emails) {
          await supabase.from('user_emails').upsert(item, {
            onConflict: 'id'
          });
        }
      }
      toast.success('Database imported successfully!');
      setIsPopoverOpen(false);

      // Reload the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import database');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo with Data Management Popover and Triple-Click */}
          <div className="flex items-center gap-2">
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <button 
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                  onClick={handleLogoClick}
                >
                  <span className="text-xl font-bold text-foreground">LogiCodeManagement</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4" align="start">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-foreground">Data Management</h4>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleExport} disabled={isExporting}>
                      <Download className="w-4 h-4 mr-2" />
                      {isExporting ? 'Exporting...' : 'Backup Data'}
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                      <Upload className="w-4 h-4 mr-2" />
                      {isImporting ? 'Importing...' : 'Restore Data'}
                    </Button>
                    <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

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
