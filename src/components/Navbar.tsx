import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Download, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-data');
      
      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
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

      const { data, error } = await supabase.functions.invoke('import-data', {
        body: importData
      });

      if (error) throw error;

      toast.success('Database imported successfully!');
      console.log('Import results:', data);
      setIsPopoverOpen(false);
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

  return <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
                <span className="text-xl font-bold text-foreground">LogiCode</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" align="start">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-foreground">Data Management</h4>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={handleExport}
                    disabled={isExporting}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Backup Data'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isImporting ? 'Importing...' : 'Restore Data'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <a href="#tools" className="text-muted-foreground hover:text-foreground transition-colors">
              Tools
            </a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
          </div>

          <div className="hidden md:block">
            <Button asChild className="glow-effect">
              <Link to="/dashboard">Get Started</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-foreground" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && <div className="md:hidden py-4 space-y-4 animate-fade-in">
            <Link to="/" className="block text-muted-foreground hover:text-foreground transition-colors" onClick={() => setIsOpen(false)}>
              Home
            </Link>
            <Link to="/dashboard" className="block text-muted-foreground hover:text-foreground transition-colors" onClick={() => setIsOpen(false)}>
              Dashboard
            </Link>
            <a href="#tools" className="block text-muted-foreground hover:text-foreground transition-colors" onClick={() => setIsOpen(false)}>
              Tools
            </a>
            <a href="#about" className="block text-muted-foreground hover:text-foreground transition-colors" onClick={() => setIsOpen(false)}>
              About
            </a>
            <Button asChild className="w-full glow-effect">
              <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                Get Started
              </Link>
            </Button>
          </div>}
      </div>
    </nav>;
};
export default Navbar;