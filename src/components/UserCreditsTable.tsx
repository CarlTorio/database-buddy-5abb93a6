import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Check, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserData {
  id: string;
  no: number;
  email: string;
  status: "Activated" | "Errors";
  credits: number;
  monthlyCredits: number;
  maxMonthlyCredits: number;
}

const StatusSelect = ({ 
  status, 
  onStatusChange 
}: { 
  status: UserData["status"]; 
  onStatusChange: (status: UserData["status"]) => void;
}) => {
  return (
    <Select value={status} onValueChange={onStatusChange}>
      <SelectTrigger className="w-[120px] h-8">
        <SelectValue>
          <span className={status === "Activated" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
            {status}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-background border border-border z-50">
        <SelectItem value="Activated">
          <span className="text-green-600 font-medium">Activated</span>
        </SelectItem>
        <SelectItem value="Errors">
          <span className="text-red-600 font-medium">Errors</span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

const getTimeUntil8AMPHT = (): { hours: number; minutes: number; seconds: number; totalMs: number } => {
  const now = new Date();
  
  // Get current time in PHT (UTC+8)
  const phtOffset = 8 * 60; // PHT is UTC+8
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const phtTime = new Date(utcTime + (phtOffset * 60000));
  
  // Create target 8:00 AM PHT
  let target8AM = new Date(phtTime);
  target8AM.setHours(8, 0, 0, 0);
  
  // If current PHT time is past 8:00 AM, target is tomorrow's 8:00 AM
  if (phtTime >= target8AM) {
    target8AM.setDate(target8AM.getDate() + 1);
  }
  
  const diffMs = target8AM.getTime() - phtTime.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds, totalMs: diffMs };
};

const CopyButton = ({ email, onCopy, isCopied }: { email: string; onCopy: () => void; isCopied: boolean }) => {
  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    if (isCopied) {
      const interval = setInterval(() => {
        const time = getTimeUntil8AMPHT();
        setCountdown({ hours: time.hours, minutes: time.minutes, seconds: time.seconds });
        
        // Reset when countdown reaches 0
        if (time.totalMs <= 0) {
          clearInterval(interval);
          setCountdown(null);
        }
      }, 1000);
      
      // Initial countdown
      const time = getTimeUntil8AMPHT();
      setCountdown({ hours: time.hours, minutes: time.minutes, seconds: time.seconds });
      
      return () => clearInterval(interval);
    }
  }, [isCopied]);

  const handleCopy = async () => {
    if (isCopied) return; // Prevent copying if already in countdown
    await navigator.clipboard.writeText(email);
    setShowCheck(true);
    onCopy();
    setTimeout(() => setShowCheck(false), 1000);
  };

  if (isCopied && countdown) {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return (
      <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
        {pad(countdown.hours)}:{pad(countdown.minutes)}:{pad(countdown.seconds)}
      </span>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      onClick={handleCopy}
    >
      {showCheck ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4 text-muted-foreground" />
      )}
    </Button>
  );
};

const generateEmailVariations = (email: string): string[] => {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return [email];

  const variations: string[] = [email];
  
  // Generate variations by inserting dots progressively from the end
  for (let i = localPart.length - 1; i > 0; i--) {
    let modifiedLocal = "";
    for (let j = 0; j < localPart.length; j++) {
      modifiedLocal += localPart[j];
      if (j >= i - 1 && j < localPart.length - 1) {
        modifiedLocal += ".";
      }
    }
    variations.push(`${modifiedLocal}@${domain}`);
  }

  return variations;
};

const UserCreditsTable = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [copiedRows, setCopiedRows] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [savedEmails, setSavedEmails] = useState<string[]>([]);

  // Check if a row should still show countdown (copied today and before next 8AM PHT)
  const shouldShowCountdown = (lastCopiedAt: string | null): boolean => {
    if (!lastCopiedAt) return false;
    
    const copiedTime = new Date(lastCopiedAt);
    const now = new Date();
    
    // Get current PHT time
    const phtOffset = 8 * 60;
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const phtTime = new Date(utcTime + (phtOffset * 60000));
    
    // Get the copied time in PHT
    const copiedUtcTime = copiedTime.getTime() + (copiedTime.getTimezoneOffset() * 60000);
    const copiedPhtTime = new Date(copiedUtcTime + (phtOffset * 60000));
    
    // Find the next 8AM PHT after the copy time
    let next8AM = new Date(copiedPhtTime);
    next8AM.setHours(8, 0, 0, 0);
    if (copiedPhtTime >= next8AM) {
      next8AM.setDate(next8AM.getDate() + 1);
    }
    
    // If current PHT time is still before the next 8AM after copy, show countdown
    return phtTime < next8AM;
  };

  // Load saved emails from database on mount - get unique base emails (shortest email per pattern)
  useEffect(() => {
    const fetchSavedEmails = async () => {
      const { data, error } = await supabase
        .from('user_emails')
        .select('email')
        .order('email', { ascending: true });
      
      if (!error && data) {
        // Extract base emails (emails without dots in local part, or shortest versions)
        const baseEmails = new Set<string>();
        data.forEach(row => {
          const [localPart, domain] = row.email.split('@');
          // Check if this is a base email (no dots or minimal dots)
          const withoutDots = localPart.replace(/\./g, '');
          // Find if we already have this base
          let isBase = true;
          baseEmails.forEach(existing => {
            const [existingLocal] = existing.split('@');
            if (existingLocal.replace(/\./g, '') === withoutDots) {
              isBase = false;
            }
          });
          if (isBase) {
            // Add the shortest version (no dots)
            const baseEmail = `${withoutDots}@${domain}`;
            if (data.some(d => d.email === baseEmail)) {
              baseEmails.add(baseEmail);
            } else {
              baseEmails.add(row.email);
            }
          }
        });
        setSavedEmails(Array.from(baseEmails));
      }
      setLoading(false);
    };
    fetchSavedEmails();
  }, []);

  // Fetch emails from database when dashboard is shown
  useEffect(() => {
    if (showDashboard && selectedEmail) {
      initializeEmailVariations();
    }
  }, [showDashboard, selectedEmail]);

  const initializeEmailVariations = async () => {
    setDashboardLoading(true);
    setUsers([]); // Clear old data immediately
    setCopiedRows(new Set());
    
    // Generate variations for the selected email
    const variations = generateEmailVariations(selectedEmail);
    
    // Check which variations already exist in the database
    const { data: existingData, error: fetchError } = await supabase
      .from('user_emails')
      .select('email')
      .in('email', variations);

    if (fetchError) {
      console.error('Error checking existing emails:', fetchError);
      return;
    }

    const existingEmails = new Set((existingData || []).map(row => row.email));
    const newVariations = variations.filter(email => !existingEmails.has(email));

    // Insert new variations if any
    if (newVariations.length > 0) {
      const newRows = newVariations.map((email) => ({
        email,
        status: 'Activated',
        credits: 5,
        monthly_credits: 0,
        max_monthly_credits: 30,
      }));

      const { error: insertError } = await supabase
        .from('user_emails')
        .insert(newRows);

      if (insertError) {
        console.error('Error inserting email variations:', insertError);
      }
    }

    // Fetch only the variations for this selected email
    fetchEmailsForSelected(variations);
  };

  const fetchEmailsForSelected = async (variations: string[]) => {
    const { data, error } = await supabase
      .from('user_emails')
      .select('*')
      .in('email', variations)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching emails:', error);
      return;
    }

    // Sort by email length (shortest first)
    const sortedData = (data || []).sort((a, b) => a.email.length - b.email.length);

    const formattedUsers: UserData[] = sortedData.map((row, index) => ({
      id: row.id,
      no: index + 1,
      email: row.email,
      status: row.status as "Activated" | "Errors",
      credits: row.credits,
      monthlyCredits: row.monthly_credits,
      maxMonthlyCredits: row.max_monthly_credits,
    }));

    // Restore copied rows state from last_copied_at timestamps
    const restoredCopiedRows = new Set<number>();
    sortedData.forEach((row, index) => {
      if (shouldShowCountdown(row.last_copied_at)) {
        restoredCopiedRows.add(index + 1);
      }
    });
    setCopiedRows(restoredCopiedRows);

    setUsers(formattedUsers);
    setDashboardLoading(false);
  };

  const handleAddEmail = async () => {
    if (newEmail.trim()) {
      const variations = generateEmailVariations(newEmail.trim());
      
      const newRows = variations.map((email) => ({
        email,
        status: 'Activated',
        credits: 5,
        monthly_credits: 0,
        max_monthly_credits: 30,
      }));
      
      const { error } = await supabase
        .from('user_emails')
        .insert(newRows);

      if (error) {
        console.error('Error adding emails:', error);
        return;
      }

      setNewEmail("");
      // Refresh emails for the selected email
      const selectedVariations = generateEmailVariations(selectedEmail);
      fetchEmailsForSelected(selectedVariations);
    }
  };

  const handleStatusChange = async (id: string, newStatus: UserData["status"]) => {
    const { error } = await supabase
      .from('user_emails')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
      return;
    }

    setUsers(users.map(user => 
      user.id === id ? { ...user, status: newStatus } : user
    ));
  };

  const handleCopyRow = async (no: number, id: string) => {
    // Find the current user to get their monthly credits
    const user = users.find(u => u.id === id);
    if (!user) return;

    const newMonthlyCredits = Math.min(user.monthlyCredits + 5, user.maxMonthlyCredits);

    // Save the copy timestamp and increment monthly credits in the database
    const { error } = await supabase
      .from('user_emails')
      .update({ 
        last_copied_at: new Date().toISOString(),
        monthly_credits: newMonthlyCredits
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating copy data:', error);
      return;
    }

    // Update local state
    setUsers(users.map(u => 
      u.id === id ? { ...u, monthlyCredits: newMonthlyCredits } : u
    ));

    setCopiedRows(prev => new Set(prev).add(no));
  };

  const handleSaveEmail = async () => {
    if (newEmail.trim() && !savedEmails.includes(newEmail.trim())) {
      // Generate variations and insert into database
      const variations = generateEmailVariations(newEmail.trim());
      
      const newRows = variations.map((email) => ({
        email,
        status: 'Activated',
        credits: 5,
        monthly_credits: 0,
        max_monthly_credits: 30,
      }));
      
      const { error } = await supabase
        .from('user_emails')
        .insert(newRows);
      
      if (!error) {
        setSavedEmails([...savedEmails, newEmail.trim()]);
        setNewEmail("");
      }
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newEmails = [...savedEmails];
    const draggedEmail = newEmails[draggedIndex];
    newEmails.splice(draggedIndex, 1);
    newEmails.splice(index, 0, draggedEmail);
    
    setSavedEmails(newEmails);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSelectEmail = (email: string) => {
    setUsers([]); // Clear immediately
    setCopiedRows(new Set());
    setSelectedEmail(email);
    setShowDashboard(true);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  if (!showDashboard) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12 space-y-6">
        <div className="flex gap-2 w-full max-w-md">
          <Input
            type="email"
            placeholder="Enter email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveEmail()}
            className="flex-1"
          />
          <Button 
            onClick={handleSaveEmail}
            disabled={!newEmail.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
        
        {savedEmails.length > 0 && (
          <div className="flex flex-col gap-2 w-full max-w-md">
            <span className="text-sm text-muted-foreground">Saved emails (drag to reorder):</span>
            {savedEmails.map((email, index) => (
              <Button 
                key={email}
                variant="outline"
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => handleSelectEmail(email)}
                className={`w-full justify-between cursor-grab active:cursor-grabbing ${
                  draggedIndex === index ? 'opacity-50 border-primary' : ''
                }`}
              >
                <span>{email}</span>
                <span className="text-xs text-muted-foreground ml-2">#{index + 1}</span>
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => {
            setShowDashboard(false);
            setNewEmail("");
          }}
        >
          ← Back
        </Button>
        <span className="text-sm text-muted-foreground">
          Logged in as: <span className="font-medium text-foreground">{selectedEmail}</span>
        </span>
      </div>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter email address"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
          className="max-w-md"
        />
        <Button onClick={handleAddEmail}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>
      
      <div className="overflow-hidden rounded-lg border border-table-border shadow-2xl">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header border-none">
              <TableHead className="text-table-header-foreground font-bold text-center border-r border-table-border">
                No.
              </TableHead>
              <TableHead className="text-table-header-foreground font-bold border-r border-table-border">
                Email
              </TableHead>
              <TableHead className="text-table-header-foreground font-bold text-center w-24 border-r border-table-border">
                Copy
              </TableHead>
              <TableHead className="text-table-header-foreground font-bold text-center border-r border-table-border">
                Status
              </TableHead>
              <TableHead className="text-table-header-foreground font-bold text-center">
                Monthly Free Credits
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dashboardLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Loading emails...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No emails added yet. Add an email above to get started.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className={`border-table-border transition-colors ${
                    copiedRows.has(user.no) 
                      ? "bg-primary/10" 
                      : "hover:bg-table-row-hover"
                  }`}
                >
                  <TableCell className="text-center font-medium text-foreground border-r border-table-border">
                    {user.no}
                  </TableCell>
                  <TableCell className="text-foreground border-r border-table-border">
                    {user.email}
                  </TableCell>
                  <TableCell className="text-center border-r border-table-border">
                    <CopyButton 
                      email={user.email} 
                      onCopy={() => handleCopyRow(user.no, user.id)} 
                      isCopied={copiedRows.has(user.no)} 
                    />
                  </TableCell>
                  <TableCell className="text-center border-r border-table-border">
                    <div className="flex justify-center">
                      <StatusSelect 
                        status={user.status} 
                        onStatusChange={(newStatus) => handleStatusChange(user.id, newStatus)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-foreground font-medium">
                    {user.monthlyCredits}/{user.maxMonthlyCredits}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserCreditsTable;
