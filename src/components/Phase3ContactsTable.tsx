import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { FileText, Trash2, ExternalLink, Mail, Phone, GripVertical, AlertTriangle, User, Eye, DollarSign, Send, Link2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmailTemplate {
  subject: string;
  body: string;
}

// Phase 3 sales stages
const PHASE3_SALES_STAGES = ["Deposit Paid", "Fully Paid", "Complete"] as const;
type Phase3SalesStage = typeof PHASE3_SALES_STAGES[number];

// Phase 3 columns - includes sales_stage, deposit, and output_link
type Phase3ColumnKey = "assigned_to" | "business_name" | "contact_name" | "mobile_number" | "email" | "link" | "demo_link" | "output_link" | "sales_stage" | "deposit" | "value" | "notes";

interface Phase3ColumnWidths {
  assigned_to: number;
  business_name: number;
  contact_name: number;
  mobile_number: number;
  email: number;
  link: number;
  demo_link: number;
  output_link: number;
  sales_stage: number;
  deposit: number;
  value: number;
  notes: number;
}

const PHASE3_DEFAULT_WIDTHS: Phase3ColumnWidths = {
  assigned_to: 100,
  business_name: 150,
  contact_name: 130,
  mobile_number: 120,
  email: 150,
  link: 140,
  demo_link: 140,
  output_link: 140,
  sales_stage: 130,
  deposit: 120,
  value: 120,
  notes: 180,
};

const PHASE3_COLUMN_LABELS: Record<Phase3ColumnKey, string> = {
  assigned_to: "Assigned",
  business_name: "Business Name",
  contact_name: "Contact Name",
  mobile_number: "Number",
  email: "Email",
  link: "Link",
  demo_link: "Demo Link",
  output_link: "Output",
  sales_stage: "Sales Stage",
  deposit: "Deposit",
  value: "Price",
  notes: "Notes",
};

const PHASE3_DEFAULT_COLUMN_ORDER: Phase3ColumnKey[] = [
  "assigned_to",
  "business_name",
  "contact_name",
  "mobile_number",
  "email",
  "link",
  "demo_link",
  "output_link",
  "sales_stage",
  "deposit",
  "value",
  "notes",
];

const MIN_WIDTH = 80;

interface Contact {
  id: string;
  category_id: string;
  assigned_to: string | null;
  business_name: string;
  contact_name: string | null;
  email: string | null;
  mobile_number: string | null;
  value: number | null;
  deposit: number | null;
  sales_stage: string;
  link?: string | null;
  demo_link?: string | null;
  output_link?: string | null;
  notes: string | null;
  last_contacted_at: string | null;
  contact_count: number;
  lead_source: string | null;
  priority_level: string | null;
  follow_up_at: string | null;
  created_at: string;
  updated_at: string;
  current_phase: number;
  demo_instructions: string | null;
}

interface Phase3ContactsTableProps {
  categoryId: string;
}

const Phase3ContactsTable = ({ categoryId }: Phase3ContactsTableProps) => {
  const { userName } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [columnWidths, setColumnWidths] = useState<Phase3ColumnWidths>(PHASE3_DEFAULT_WIDTHS);
  const startWidthRef = useRef<number>(0);
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate | null>(null);
  const [columnOrder, setColumnOrder] = useState<Phase3ColumnKey[]>(PHASE3_DEFAULT_COLUMN_ORDER);

  // Details dialog for # of attempts and last update
  const [detailsDialog, setDetailsDialog] = useState<{ open: boolean; contact: Contact | null }>({ open: false, contact: null });

  // Send to web developer dialog
  const [sendToDevDialog, setSendToDevDialog] = useState<{ open: boolean; contact: Contact | null }>({ open: false, contact: null });

  // Load column order from localStorage
  useEffect(() => {
    const storageKey = `contacts-column-order-phase3-${categoryId || 'default'}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const allColumnsPresent = PHASE3_DEFAULT_COLUMN_ORDER.every(col => parsed.includes(col));
          if (allColumnsPresent && parsed.length === PHASE3_DEFAULT_COLUMN_ORDER.length) {
            setColumnOrder(parsed as Phase3ColumnKey[]);
            return;
          }
        }
      } catch (e) {}
    }
    localStorage.removeItem(storageKey);
    setColumnOrder(PHASE3_DEFAULT_COLUMN_ORDER);
  }, [categoryId]);

  useEffect(() => {
    const storageKey = `contacts-column-order-phase3-${categoryId || 'default'}`;
    localStorage.setItem(storageKey, JSON.stringify(columnOrder));
  }, [columnOrder, categoryId]);

  useEffect(() => {
    const storageKey = `contacts-column-widths-phase3-${categoryId || 'default'}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          setColumnWidths({ ...PHASE3_DEFAULT_WIDTHS, ...parsed });
          return;
        }
      } catch (e) {}
    }
    setColumnWidths(PHASE3_DEFAULT_WIDTHS);
  }, [categoryId]);

  useEffect(() => {
    const storageKey = `contacts-column-widths-phase3-${categoryId || 'default'}`;
    localStorage.setItem(storageKey, JSON.stringify(columnWidths));
  }, [columnWidths, categoryId]);

  const [draggedColumn, setDraggedColumn] = useState<Phase3ColumnKey | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Phase3ColumnKey | null>(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      const { data } = await supabase
        .from("email_templates")
        .select("subject, body")
        .eq("name", "Default")
        .single();
      if (data) {
        setEmailTemplate(data);
      }
    };
    fetchTemplate();
  }, []);

  const handleResizeStart = useCallback(
    (key: keyof Phase3ColumnWidths) => (e: React.MouseEvent) => {
      e.preventDefault();
      startWidthRef.current = columnWidths[key];
      const startX = e.clientX;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        setColumnWidths((prev) => ({
          ...prev,
          [key]: Math.max(MIN_WIDTH, startWidthRef.current + delta),
        }));
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [columnWidths]
  );

  const handleDragStart = (e: React.DragEvent, columnKey: Phase3ColumnKey) => {
    setDraggedColumn(columnKey);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", columnKey);
  };

  const handleDragOver = (e: React.DragEvent, columnKey: Phase3ColumnKey) => {
    e.preventDefault();
    if (draggedColumn && draggedColumn !== columnKey) {
      setDragOverColumn(columnKey);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetColumn: Phase3ColumnKey) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetColumn) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    const newOrder = [...columnOrder];
    const draggedIndex = newOrder.indexOf(draggedColumn);
    const targetIndex = newOrder.indexOf(targetColumn);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedColumn);

    setColumnOrder(newOrder);
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  useEffect(() => {
    fetchContacts();
  }, [categoryId]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("category_id", categoryId)
      .eq("current_phase", 3)
      .neq("sales_stage", "Complete") // Exclude completed contacts
      .order("created_at", { ascending: true });

    if (!error && data) {
      setContacts(data);
    }
    setLoading(false);
  };

  const pendingSaveRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const handleUpdate = useCallback(async (id: string, field: string, value: string | number, immediate = false) => {
    let updateValue: string | number | null;
    
    if (field === "contact_count") {
      updateValue = typeof value === "number" ? value : parseInt(value as string) || 0;
    } else if (field === "value" || field === "deposit") {
      const numValue = parseFloat(String(value).replace(/[^\d.]/g, ""));
      updateValue = isNaN(numValue) ? null : numValue;
    } else {
      updateValue = typeof value === "string" ? (value.trim() || null) : value;
    }
    
    // Check if this is a sales_stage change to "Complete" - remove from list
    const isComplete = field === "sales_stage" && value === "Complete";
    
    if (isComplete) {
      setContacts(prev => prev.filter(c => c.id !== id));
    } else {
      setContacts(prev =>
        prev.map((c) =>
          c.id === id ? { ...c, [field]: updateValue, updated_at: new Date().toISOString() } : c
        )
      );
    }

    const saveKey = `${id}-${field}`;
    
    if (pendingSaveRef.current[saveKey]) {
      clearTimeout(pendingSaveRef.current[saveKey]);
    }

    const performSave = async () => {
      const { error } = await supabase
        .from("contacts")
        .update({ [field]: updateValue, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.error("Failed to save:", error);
        toast.error("Failed to save changes");
        if (isComplete) {
          fetchContacts();
        }
      } else if (isComplete) {
        toast.success("Client marked as complete");
      }
      delete pendingSaveRef.current[saveKey];
    };

    if (immediate) {
      await performSave();
    } else {
      pendingSaveRef.current[saveKey] = setTimeout(performSave, 500);
    }
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("contacts").delete().eq("id", id);

    if (!error) {
      setContacts(contacts.filter((c) => c.id !== id));
      toast.success("Contact deleted");
    } else {
      toast.error("Failed to delete contact");
    }
  };

  const startEditing = (id: string, field: string, currentValue: string | null) => {
    setEditingCell({ id, field });
    setEditValue(currentValue || "");
  };

  const handleBlur = (id: string, field: string) => {
    handleUpdate(id, field, editValue, true);
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string, field: string) => {
    if (e.key === "Enter") {
      handleUpdate(id, field, editValue, true);
      setEditingCell(null);
    }
    if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  const handleInputChange = (id: string, field: string, value: string) => {
    setEditValue(value);
    handleUpdate(id, field, value, false);
  };

  const openGmailCompose = async (email: string, contactId: string) => {
    if (!emailTemplate) {
      toast.error("Email template not loaded");
      return;
    }
    const subject = encodeURIComponent(emailTemplate.subject);
    const body = encodeURIComponent(emailTemplate.body);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${subject}&body=${body}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  const handlePhoneCall = async (phone: string) => {
    window.open(`tel:${phone}`, "_self");
  };

  const handleSendToWebDeveloper = (contact: Contact) => {
    // Prepare the information to send
    const info = `
Web Development Request

Business: ${contact.business_name || "N/A"}
Contact Name: ${contact.contact_name || "N/A"}
Email: ${contact.email || "N/A"}
Phone: ${contact.mobile_number || "N/A"}
Link: ${contact.link || "N/A"}
Demo Link: ${contact.demo_link || "N/A"}
Output Link: ${contact.output_link || "N/A"}
Deposit: ${contact.deposit ? `₱${contact.deposit.toLocaleString()}` : "N/A"}
Deal Price: ${contact.value ? `₱${contact.value.toLocaleString()}` : "N/A"}
Sales Stage: ${contact.sales_stage || "N/A"}
Notes: ${contact.notes || "N/A"}
Demo Instructions: ${contact.demo_instructions || "N/A"}
    `.trim();
    
    // Copy to clipboard
    navigator.clipboard.writeText(info).then(() => {
      toast.success("Information copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy information");
    });
    
    setSendToDevDialog({ open: false, contact: null });
  };

  const formatLastContacted = (date: string | null) => {
    if (!date) return "Never";
    return format(new Date(date), "MMM d, yyyy h:mm a");
  };

  const leadSourceColors: Record<string, string> = {
    "Cold Call": "bg-blue-100 text-blue-700 border-blue-300",
    "Messenger": "bg-indigo-100 text-indigo-700 border-indigo-300",
    "Referral": "bg-green-100 text-green-700 border-green-300",
    "Ads": "bg-orange-100 text-orange-700 border-orange-300",
  };

  const findDuplicates = (field: "business_name" | "link" | "email" | "mobile_number", contactId: string, value: string | null) => {
    if (!value || !value.trim()) return [];
    const normalizedValue = value.trim().toLowerCase();
    return contacts.filter(
      (c) => {
        const fieldValue = c[field as keyof Contact];
        return c.id !== contactId && 
          fieldValue && 
          typeof fieldValue === "string" && 
          fieldValue.trim().toLowerCase() === normalizedValue;
      }
    );
  };

  const DuplicateWarning = ({ duplicates, fieldLabel }: { duplicates: Contact[], fieldLabel: string }) => {
    if (duplicates.length === 0) return null;
    const duplicateNames = duplicates.map(d => d.business_name || "Unnamed").join(", ");
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <p className="text-xs">Duplicate {fieldLabel} found in: {duplicateNames}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  const ResizeHandle = ({ columnKey }: { columnKey: keyof Phase3ColumnWidths }) => (
    <div
      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary active:bg-primary transition-colors z-10"
      onMouseDown={handleResizeStart(columnKey)}
    >
      <div className="absolute right-[-1px] top-0 bottom-0 w-[3px] opacity-0 hover:opacity-100 bg-primary/50" />
    </div>
  );

  const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

  const renderCell = (contact: Contact, columnKey: Phase3ColumnKey, isLast: boolean) => {
    const baseClass = isLast ? "flex items-start flex-1" : "border-r border-border shrink-0";
    const style = isLast 
      ? { minWidth: columnWidths[columnKey] } 
      : { width: columnWidths[columnKey] };

    switch (columnKey) {
      case "assigned_to":
        return (
          <div className={baseClass} style={style}>
            <div className="flex items-center gap-2 px-2 py-1.5 w-full">
              <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {editingCell?.id === contact.id && editingCell?.field === "assigned_to" ? (
                <Input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => handleInputChange(contact.id, "assigned_to", e.target.value)}
                  onBlur={() => handleBlur(contact.id, "assigned_to")}
                  onKeyDown={(e) => handleKeyDown(e, contact.id, "assigned_to")}
                  className="h-6 px-1 py-0 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary text-sm"
                />
              ) : (
                <span
                  className="cursor-text flex-1 min-h-[24px] flex items-center hover:bg-muted/50 rounded px-1 text-sm truncate"
                  onClick={() => startEditing(contact.id, "assigned_to", contact.assigned_to)}
                >
                  {contact.assigned_to || <span className="text-muted-foreground/50 text-sm">Empty</span>}
                </span>
              )}
              {/* Eye button for details (# of attempts, last update, lead source) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailsDialog({ open: true, contact });
                    }}
                    className="p-1 hover:bg-muted rounded transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">View Details</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        );

      case "business_name": {
        const duplicates = findDuplicates("business_name", contact.id, contact.business_name);
        return (
          <div className={baseClass} style={style}>
            <div className="flex items-center gap-2 px-2 py-1.5 w-full">
              <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {editingCell?.id === contact.id && editingCell?.field === "business_name" ? (
                <Input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => handleInputChange(contact.id, "business_name", e.target.value)}
                  onBlur={() => handleBlur(contact.id, "business_name")}
                  onKeyDown={(e) => handleKeyDown(e, contact.id, "business_name")}
                  className="h-6 px-1 py-0 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary text-sm"
                />
              ) : (
                <>
                  <span
                    className="cursor-text flex-1 min-h-[24px] flex items-center hover:bg-muted/50 rounded px-1 text-sm truncate"
                    onClick={() => startEditing(contact.id, "business_name", contact.business_name)}
                  >
                    {contact.business_name || <span className="text-muted-foreground/50 text-sm">Empty</span>}
                  </span>
                  <DuplicateWarning duplicates={duplicates} fieldLabel="business name" />
                </>
              )}
            </div>
          </div>
        );
      }

      case "contact_name":
        return (
          <div className={baseClass} style={style}>
            {editingCell?.id === contact.id && editingCell?.field === "contact_name" ? (
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => handleInputChange(contact.id, "contact_name", e.target.value)}
                onBlur={() => handleBlur(contact.id, "contact_name")}
                onKeyDown={(e) => handleKeyDown(e, contact.id, "contact_name")}
                className="h-full px-3 py-1 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-none text-sm"
              />
            ) : (
              <div className="px-3 py-1 min-h-[32px] flex items-center text-sm w-full">
                <span
                  className="cursor-text flex-1 hover:bg-muted/50 rounded px-1 truncate"
                  onClick={() => startEditing(contact.id, "contact_name", contact.contact_name)}
                >
                  {contact.contact_name || <span className="text-muted-foreground/50">Empty</span>}
                </span>
              </div>
            )}
          </div>
        );

      case "mobile_number": {
        const duplicates = findDuplicates("mobile_number", contact.id, contact.mobile_number);
        return (
          <div className={baseClass} style={style}>
            {editingCell?.id === contact.id && editingCell?.field === "mobile_number" ? (
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => handleInputChange(contact.id, "mobile_number", e.target.value)}
                onBlur={() => handleBlur(contact.id, "mobile_number")}
                onKeyDown={(e) => handleKeyDown(e, contact.id, "mobile_number")}
                className="h-full px-3 py-1 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-none text-sm"
              />
            ) : (
              <div className="px-3 py-1 min-h-[32px] flex items-center gap-2 text-sm w-full">
                {contact.mobile_number ? (
                  <>
                    <span
                      className="cursor-text flex-1 hover:bg-muted/50 rounded px-1 truncate"
                      onClick={() => startEditing(contact.id, "mobile_number", contact.mobile_number)}
                    >
                      {contact.mobile_number}
                    </span>
                    <DuplicateWarning duplicates={duplicates} fieldLabel="number" />
                    <Phone
                      className="w-4 h-4 text-muted-foreground shrink-0 cursor-pointer hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePhoneCall(contact.mobile_number!);
                      }}
                    />
                  </>
                ) : (
                  <span
                    className="cursor-text flex-1 hover:bg-muted/50 rounded px-1 text-muted-foreground/50"
                    onClick={() => startEditing(contact.id, "mobile_number", contact.mobile_number)}
                  >
                    Empty
                  </span>
                )}
              </div>
            )}
          </div>
        );
      }

      case "email": {
        const duplicates = findDuplicates("email", contact.id, contact.email);
        return (
          <div className={baseClass} style={style}>
            {editingCell?.id === contact.id && editingCell?.field === "email" ? (
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => handleInputChange(contact.id, "email", e.target.value)}
                onBlur={() => handleBlur(contact.id, "email")}
                onKeyDown={(e) => handleKeyDown(e, contact.id, "email")}
                className="h-full px-3 py-1 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-none text-sm"
              />
            ) : (
              <div className="px-3 py-1 min-h-[32px] flex items-center gap-2 text-sm w-full">
                {contact.email ? (
                  <>
                    <span
                      className="cursor-text flex-1 hover:bg-muted/50 rounded px-1 truncate"
                      onClick={() => startEditing(contact.id, "email", contact.email)}
                    >
                      {contact.email}
                    </span>
                    <DuplicateWarning duplicates={duplicates} fieldLabel="email" />
                    <Mail
                      className="w-4 h-4 text-muted-foreground shrink-0 cursor-pointer hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        openGmailCompose(contact.email!, contact.id);
                      }}
                    />
                  </>
                ) : (
                  <span
                    className="cursor-text flex-1 hover:bg-muted/50 rounded px-1 text-muted-foreground/50"
                    onClick={() => startEditing(contact.id, "email", contact.email)}
                  >
                    Empty
                  </span>
                )}
              </div>
            )}
          </div>
        );
      }

      case "link": {
        const duplicates = findDuplicates("link", contact.id, contact.link || null);
        return (
          <div className={baseClass} style={style}>
            {editingCell?.id === contact.id && editingCell?.field === "link" ? (
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => handleInputChange(contact.id, "link", e.target.value)}
                onBlur={() => handleBlur(contact.id, "link")}
                onKeyDown={(e) => handleKeyDown(e, contact.id, "link")}
                className="h-full px-3 py-1 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-none text-sm"
              />
            ) : (
              <div className="px-3 py-1 min-h-[32px] flex items-center gap-2 text-sm w-full">
                {contact.link ? (
                  <>
                    <span
                      className="cursor-text flex-1 hover:bg-muted/50 rounded px-1 truncate"
                      onClick={() => startEditing(contact.id, "link", contact.link || null)}
                    >
                      {contact.link}
                    </span>
                    <DuplicateWarning duplicates={duplicates} fieldLabel="link" />
                    <ExternalLink
                      className="w-4 h-4 text-muted-foreground shrink-0 cursor-pointer hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        let url = contact.link!;
                        if (!url.startsWith("http://") && !url.startsWith("https://")) {
                          url = "https://" + url;
                        }
                        window.open(url, "_blank", "noopener,noreferrer");
                      }}
                    />
                  </>
                ) : (
                  <span
                    className="cursor-text flex-1 hover:bg-muted/50 rounded px-1 text-muted-foreground/50"
                    onClick={() => startEditing(contact.id, "link", contact.link || null)}
                  >
                    Empty
                  </span>
                )}
              </div>
            )}
          </div>
        );
      }

      case "demo_link":
        return (
          <div className={baseClass} style={style}>
            {editingCell?.id === contact.id && editingCell?.field === "demo_link" ? (
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => handleInputChange(contact.id, "demo_link", e.target.value)}
                onBlur={() => handleBlur(contact.id, "demo_link")}
                onKeyDown={(e) => handleKeyDown(e, contact.id, "demo_link")}
                className="h-full px-3 py-1 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-none text-sm"
              />
            ) : (
              <div className="px-3 py-1 min-h-[32px] flex items-center gap-2 text-sm w-full">
                {contact.demo_link ? (
                  <>
                    <span
                      className="cursor-text flex-1 hover:bg-muted/50 rounded px-1 truncate"
                      onClick={() => startEditing(contact.id, "demo_link", contact.demo_link || null)}
                    >
                      {contact.demo_link}
                    </span>
                    <ExternalLink
                      className="w-4 h-4 text-muted-foreground shrink-0 cursor-pointer hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        let url = contact.demo_link!;
                        if (!url.startsWith("http://") && !url.startsWith("https://")) {
                          url = "https://" + url;
                        }
                        window.open(url, "_blank", "noopener,noreferrer");
                      }}
                    />
                  </>
                ) : (
                  <span
                    className="cursor-text flex-1 hover:bg-muted/50 rounded px-1 text-muted-foreground/50"
                    onClick={() => startEditing(contact.id, "demo_link", contact.demo_link || null)}
                  >
                    Empty
                  </span>
                )}
              </div>
            )}
          </div>
        );

      case "output_link":
        return (
          <div className={baseClass} style={style}>
            {editingCell?.id === contact.id && editingCell?.field === "output_link" ? (
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => handleInputChange(contact.id, "output_link", e.target.value)}
                onBlur={() => handleBlur(contact.id, "output_link")}
                onKeyDown={(e) => handleKeyDown(e, contact.id, "output_link")}
                className="h-full px-3 py-1 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-none text-sm"
              />
            ) : (
              <div className="px-3 py-1 min-h-[32px] flex items-center gap-2 text-sm w-full">
                {contact.output_link ? (
                  <>
                    <span
                      className="cursor-text flex-1 hover:bg-muted/50 rounded px-1 truncate"
                      onClick={() => startEditing(contact.id, "output_link", contact.output_link || null)}
                    >
                      {contact.output_link}
                    </span>
                    <ExternalLink
                      className="w-4 h-4 text-muted-foreground shrink-0 cursor-pointer hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        let url = contact.output_link!;
                        if (!url.startsWith("http://") && !url.startsWith("https://")) {
                          url = "https://" + url;
                        }
                        window.open(url, "_blank", "noopener,noreferrer");
                      }}
                    />
                  </>
                ) : (
                  <span
                    className="cursor-text flex-1 hover:bg-muted/50 rounded px-1 text-muted-foreground/50"
                    onClick={() => startEditing(contact.id, "output_link", contact.output_link || null)}
                  >
                    Empty
                  </span>
                )}
              </div>
            )}
          </div>
        );

      case "sales_stage": {
        const stageStyles: Record<string, string> = {
          "Deposit Paid": "bg-amber-500/20 text-amber-400 border-amber-500/30",
          "Fully Paid": "bg-blue-500/20 text-blue-400 border-blue-500/30",
          "Complete": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        };
        return (
          <div className={baseClass} style={style}>
            <div className="px-2 py-1 min-h-[32px] flex items-center text-sm w-full">
              <Select
                value={contact.sales_stage}
                onValueChange={(value) => handleUpdate(contact.id, "sales_stage", value, true)}
              >
                <SelectTrigger className={`h-7 border rounded-md px-3 text-xs font-medium ${stageStyles[contact.sales_stage] || "bg-muted border-border"} focus:ring-1 focus:ring-primary`}>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {PHASE3_SALES_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage} className="focus:bg-accent">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${stageStyles[stage]}`}>
                        {stage}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      }

      case "deposit":
        return (
          <div className={baseClass} style={style}>
            <div className="flex items-center gap-2 px-2 py-1.5 w-full">
              <DollarSign className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              {editingCell?.id === contact.id && editingCell?.field === "deposit" ? (
                <Input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => handleInputChange(contact.id, "deposit", e.target.value)}
                  onBlur={() => handleBlur(contact.id, "deposit")}
                  onKeyDown={(e) => handleKeyDown(e, contact.id, "deposit")}
                  className="h-6 px-1 py-0 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary text-sm"
                  placeholder="0"
                />
              ) : (
                <span
                  className="cursor-text flex-1 min-h-[24px] flex items-center hover:bg-muted/50 rounded px-1 text-sm truncate font-medium text-amber-600"
                  onClick={() => startEditing(contact.id, "deposit", contact.deposit?.toString() || "")}
                >
                  {contact.deposit ? `₱${contact.deposit.toLocaleString()}` : <span className="text-muted-foreground/50 font-normal">Empty</span>}
                </span>
              )}
            </div>
          </div>
        );

      case "value":
        return (
          <div className={baseClass} style={style}>
            <div className="flex items-center gap-2 px-2 py-1.5 w-full">
              <DollarSign className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {editingCell?.id === contact.id && editingCell?.field === "value" ? (
                <Input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => handleInputChange(contact.id, "value", e.target.value)}
                  onBlur={() => handleBlur(contact.id, "value")}
                  onKeyDown={(e) => handleKeyDown(e, contact.id, "value")}
                  className="h-6 px-1 py-0 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary text-sm"
                  placeholder="0"
                />
              ) : (
                <span
                  className="cursor-text flex-1 min-h-[24px] flex items-center hover:bg-muted/50 rounded px-1 text-sm truncate font-medium text-green-600"
                  onClick={() => startEditing(contact.id, "value", contact.value?.toString() || "")}
                >
                  {contact.value ? `₱${contact.value.toLocaleString()}` : <span className="text-muted-foreground/50 font-normal">Empty</span>}
                </span>
              )}
            </div>
          </div>
        );

      case "notes":
        return (
          <div className={baseClass} style={style}>
            {editingCell?.id === contact.id && editingCell?.field === "notes" ? (
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => handleInputChange(contact.id, "notes", e.target.value)}
                onBlur={() => handleBlur(contact.id, "notes")}
                onKeyDown={(e) => handleKeyDown(e, contact.id, "notes")}
                className="h-full px-3 py-1 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-none text-sm"
              />
            ) : (
              <div className="px-3 py-1 min-h-[32px] flex items-center text-sm w-full">
                <span
                  className="cursor-text flex-1 hover:bg-muted/50 rounded px-1 truncate"
                  onClick={() => startEditing(contact.id, "notes", contact.notes)}
                >
                  {contact.notes || <span className="text-muted-foreground/50">Empty</span>}
                </span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground py-8">Loading...</div>;
  }

  return (
    <>
      <div className="border border-border rounded-lg overflow-x-auto scrollbar-hide">
        {/* Header */}
        <div className="flex bg-slate-900 border-b border-border">
          {columnOrder.map((columnKey, index) => {
            const isLast = index === columnOrder.length - 1;
            return (
              <div
                key={columnKey}
                draggable
                onDragStart={(e) => handleDragStart(e, columnKey)}
                onDragOver={(e) => handleDragOver(e, columnKey)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, columnKey)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "px-3 py-2 text-sm font-medium text-muted-foreground relative group cursor-grab active:cursor-grabbing select-none",
                  isLast ? "flex-1" : "border-r border-border shrink-0",
                  draggedColumn === columnKey && "opacity-50",
                  dragOverColumn === columnKey && "bg-primary/10"
                )}
                style={isLast ? { minWidth: columnWidths[columnKey] } : { width: columnWidths[columnKey] }}
              >
                <div className="flex items-center gap-1">
                  <GripVertical className="w-3 h-3 text-muted-foreground/50" />
                  {PHASE3_COLUMN_LABELS[columnKey]}
                </div>
                <ResizeHandle columnKey={columnKey} />
              </div>
            );
          })}
        </div>

        {/* Rows */}
        {contacts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No contacts in Phase 3 yet. Approve deals from Phase 2 to move contacts here.
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex border-b border-border hover:bg-muted/30 group"
            >
              {columnOrder.map((columnKey, index) => {
                const isLast = index === columnOrder.length - 1;
                return (
                  <div key={columnKey} className="contents">
                    {renderCell(contact, columnKey, isLast)}
                  </div>
                );
              })}
              {/* Send to Web Developer button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSendToDevDialog({ open: true, contact })}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-primary/10 rounded transition-opacity shrink-0"
                  >
                    <Send className="w-3.5 h-3.5 text-primary" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Send to Web Developer</p>
                </TooltipContent>
              </Tooltip>
              <button
                onClick={() => handleDelete(contact.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 rounded transition-opacity shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Details Dialog - # of attempts, last update, lead source */}
      <Dialog open={detailsDialog.open} onOpenChange={(open) => setDetailsDialog({ open, contact: open ? detailsDialog.contact : null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {detailsDialog.contact && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">Business: {detailsDialog.contact.business_name || "Unnamed"}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium"># of Attempts:</span>
                      <span className="text-sm">{detailsDialog.contact.contact_count || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Last Update:</span>
                      <span className="text-sm">{formatLastContacted(detailsDialog.contact.last_contacted_at)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Lead Source:</span>
                      {detailsDialog.contact.lead_source ? (
                        <span className={`${leadSourceColors[detailsDialog.contact.lead_source] || "bg-muted text-muted-foreground"} px-3 py-1 rounded text-sm font-medium`}>
                          {detailsDialog.contact.lead_source}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not set</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Deal Price:</span>
                      <span className="text-sm font-medium text-emerald-600">
                        {detailsDialog.contact.value ? `₱${detailsDialog.contact.value.toLocaleString()}` : "Not set"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Send to Web Developer Dialog */}
      <Dialog open={sendToDevDialog.open} onOpenChange={(open) => setSendToDevDialog({ open, contact: open ? sendToDevDialog.contact : null })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send to Web Developer</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {sendToDevDialog.contact && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Send the following information to the web developer:
                </p>
                
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div><span className="font-medium">Business:</span> {sendToDevDialog.contact.business_name || "N/A"}</div>
                  <div><span className="font-medium">Contact:</span> {sendToDevDialog.contact.contact_name || "N/A"}</div>
                  <div><span className="font-medium">Email:</span> {sendToDevDialog.contact.email || "N/A"}</div>
                  <div><span className="font-medium">Phone:</span> {sendToDevDialog.contact.mobile_number || "N/A"}</div>
                  <div><span className="font-medium">Link:</span> {sendToDevDialog.contact.link || "N/A"}</div>
                  <div><span className="font-medium">Demo Link:</span> {sendToDevDialog.contact.demo_link || "N/A"}</div>
                  <div><span className="font-medium">Output Link:</span> {sendToDevDialog.contact.output_link || "N/A"}</div>
                  <div><span className="font-medium">Deal Price:</span> {sendToDevDialog.contact.value ? `₱${sendToDevDialog.contact.value.toLocaleString()}` : "N/A"}</div>
                  <div><span className="font-medium">Sales Stage:</span> {sendToDevDialog.contact.sales_stage || "N/A"}</div>
                  {sendToDevDialog.contact.demo_instructions && (
                    <div><span className="font-medium">Demo Instructions:</span> {sendToDevDialog.contact.demo_instructions}</div>
                  )}
                  {sendToDevDialog.contact.notes && (
                    <div><span className="font-medium">Notes:</span> {sendToDevDialog.contact.notes}</div>
                  )}
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSendToDevDialog({ open: false, contact: null })}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleSendToWebDeveloper(sendToDevDialog.contact!)}
                    className="gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Copy to Clipboard
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Phase3ContactsTable;
