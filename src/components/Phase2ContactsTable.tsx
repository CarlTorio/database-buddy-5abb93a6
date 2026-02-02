import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FileText, Trash2, ExternalLink, Mail, Phone, Clock, GripVertical, AlertTriangle, User, Hash, Eye } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface EmailTemplate {
  subject: string;
  body: string;
}

// Phase 2 columns (no lead_source in main view, has eye button instead)
type Phase2ColumnKey = "assigned_to" | "business_name" | "contact_name" | "mobile_number" | "email" | "link" | "sales_stage" | "contact_count" | "last_contacted_at" | "notes";

interface Phase2ColumnWidths {
  assigned_to: number;
  business_name: number;
  contact_name: number;
  mobile_number: number;
  email: number;
  link: number;
  sales_stage: number;
  contact_count: number;
  last_contacted_at: number;
  notes: number;
}

const PHASE2_DEFAULT_WIDTHS: Phase2ColumnWidths = {
  assigned_to: 100,
  business_name: 150,
  contact_name: 130,
  mobile_number: 120,
  email: 150,
  link: 140,
  sales_stage: 140,
  contact_count: 80,
  last_contacted_at: 140,
  notes: 180,
};

const PHASE2_COLUMN_LABELS: Record<Phase2ColumnKey, string> = {
  assigned_to: "Assigned",
  business_name: "Business Name",
  contact_name: "Contact Name",
  mobile_number: "Number",
  email: "Email",
  link: "Link",
  sales_stage: "Sales Stage",
  contact_count: "# of Attempts",
  last_contacted_at: "Last Update",
  notes: "Notes",
};

const PHASE2_DEFAULT_COLUMN_ORDER: Phase2ColumnKey[] = [
  "assigned_to",
  "business_name",
  "contact_name",
  "mobile_number",
  "email",
  "link",
  "sales_stage",
  "contact_count",
  "last_contacted_at",
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
  sales_stage: string;
  link?: string | null;
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

interface Phase2ContactsTableProps {
  categoryId: string;
}

const Phase2ContactsTable = ({ categoryId }: Phase2ContactsTableProps) => {
  const { userName } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [columnWidths, setColumnWidths] = useState<Phase2ColumnWidths>(PHASE2_DEFAULT_WIDTHS);
  const startWidthRef = useRef<number>(0);
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate | null>(null);
  const [columnOrder, setColumnOrder] = useState<Phase2ColumnKey[]>(PHASE2_DEFAULT_COLUMN_ORDER);

  // Lead Source dialog
  const [leadSourceDialog, setLeadSourceDialog] = useState<{ open: boolean; contact: Contact | null }>({ open: false, contact: null });
  
  // Request Demo dialog
  const [requestDemoDialog, setRequestDemoDialog] = useState<{ open: boolean; contact: Contact | null }>({ open: false, contact: null });
  const [demoInstructions, setDemoInstructions] = useState("");

  // Load column order from localStorage
  useEffect(() => {
    const storageKey = `contacts-column-order-phase2-${categoryId || 'default'}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === PHASE2_DEFAULT_COLUMN_ORDER.length) {
          setColumnOrder(parsed as Phase2ColumnKey[]);
          return;
        }
      } catch (e) {
        // Invalid JSON, use default
      }
    }
    setColumnOrder(PHASE2_DEFAULT_COLUMN_ORDER);
  }, [categoryId]);

  useEffect(() => {
    const storageKey = `contacts-column-order-phase2-${categoryId || 'default'}`;
    localStorage.setItem(storageKey, JSON.stringify(columnOrder));
  }, [columnOrder, categoryId]);

  useEffect(() => {
    const storageKey = `contacts-column-widths-phase2-${categoryId || 'default'}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          setColumnWidths({ ...PHASE2_DEFAULT_WIDTHS, ...parsed });
          return;
        }
      } catch (e) {}
    }
    setColumnWidths(PHASE2_DEFAULT_WIDTHS);
  }, [categoryId]);

  useEffect(() => {
    const storageKey = `contacts-column-widths-phase2-${categoryId || 'default'}`;
    localStorage.setItem(storageKey, JSON.stringify(columnWidths));
  }, [columnWidths, categoryId]);

  const [draggedColumn, setDraggedColumn] = useState<Phase2ColumnKey | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Phase2ColumnKey | null>(null);

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
    (key: keyof Phase2ColumnWidths) => (e: React.MouseEvent) => {
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

  const handleDragStart = (e: React.DragEvent, columnKey: Phase2ColumnKey) => {
    setDraggedColumn(columnKey);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", columnKey);
  };

  const handleDragOver = (e: React.DragEvent, columnKey: Phase2ColumnKey) => {
    e.preventDefault();
    if (draggedColumn && draggedColumn !== columnKey) {
      setDragOverColumn(columnKey);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetColumn: Phase2ColumnKey) => {
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
      .eq("current_phase", 2)
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
    } else if (field === "value") {
      const numValue = parseFloat(String(value).replace(/[^\d.]/g, ""));
      updateValue = isNaN(numValue) ? null : numValue;
    } else {
      updateValue = typeof value === "string" ? (value.trim() || null) : value;
    }
    
    setContacts(prev =>
      prev.map((c) =>
        c.id === id ? { ...c, [field]: updateValue, updated_at: new Date().toISOString() } : c
      )
    );

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
    await trackContact(contactId);
    const subject = encodeURIComponent(emailTemplate.subject);
    const body = encodeURIComponent(emailTemplate.body);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${subject}&body=${body}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  const handlePhoneCall = async (phone: string, contactId: string) => {
    await trackContact(contactId);
    window.open(`tel:${phone}`, "_self");
  };

  const trackContact = async (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    const now = new Date().toISOString();
    const newCount = (contact.contact_count || 0) + 1;

    const { error } = await supabase
      .from("contacts")
      .update({ 
        last_contacted_at: now, 
        contact_count: newCount,
        updated_at: now 
      })
      .eq("id", contactId);

    if (!error) {
      setContacts(
        contacts.map((c) =>
          c.id === contactId 
            ? { ...c, last_contacted_at: now, contact_count: newCount, updated_at: now } 
            : c
        )
      );
    }
  };

  const handleIncrementAttempts = async (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    const newCount = (contact.contact_count || 0) + 1;
    await handleUpdate(contactId, "contact_count", newCount, true);
  };

  const handleSetLastUpdate = async (contactId: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("contacts")
      .update({ 
        last_contacted_at: now,
        updated_at: now 
      })
      .eq("id", contactId);

    if (!error) {
      setContacts(
        contacts.map((c) =>
          c.id === contactId 
            ? { ...c, last_contacted_at: now, updated_at: now } 
            : c
        )
      );
      toast.success("Last update set to now");
    }
  };

  const formatLastContacted = (date: string | null) => {
    if (!date) return null;
    return format(new Date(date), "MMM d, yyyy h:mm a");
  };

  // Phase 2 sales stage options (no Lead, no Approached)
  const phase2SalesStages = [
    "Request Demo",
    "Demo Created",
    "Decision Pending",
    "Approved",
    "Undecided",
    "Rejected",
  ];

  const salesStageColors: Record<string, string> = {
    "Request Demo": "bg-amber-100 text-amber-700 border-amber-300",
    "Demo Created": "bg-blue-100 text-blue-700 border-blue-300",
    "Decision Pending": "bg-yellow-100 text-yellow-700 border-yellow-300",
    "Approved": "bg-green-100 text-green-700 border-green-300",
    "Undecided": "bg-orange-100 text-orange-700 border-orange-300",
    "Rejected": "bg-red-100 text-red-700 border-red-300",
    // Keep old ones for backwards compatibility
    "Demo Stage": "bg-purple-100 text-purple-700 border-purple-300",
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

  const ResizeHandle = ({ columnKey }: { columnKey: keyof Phase2ColumnWidths }) => (
    <div
      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary active:bg-primary transition-colors z-10"
      onMouseDown={handleResizeStart(columnKey)}
    >
      <div className="absolute right-[-1px] top-0 bottom-0 w-[3px] opacity-0 hover:opacity-100 bg-primary/50" />
    </div>
  );

  const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

  // Handle sales stage change with Request Demo dialog
  const handleSalesStageChange = async (contactId: string, newStage: string) => {
    if (newStage === "Request Demo") {
      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        setDemoInstructions(contact.demo_instructions || "");
        setRequestDemoDialog({ open: true, contact });
      }
    } else {
      await handleUpdate(contactId, "sales_stage", newStage, true);
    }
  };

  // Save demo instructions and update sales stage
  const handleSaveDemoInstructions = async () => {
    if (!requestDemoDialog.contact) return;
    
    const { error } = await supabase
      .from("contacts")
      .update({ 
        sales_stage: "Request Demo",
        demo_instructions: demoInstructions,
        updated_at: new Date().toISOString() 
      })
      .eq("id", requestDemoDialog.contact.id);

    if (!error) {
      setContacts(
        contacts.map((c) =>
          c.id === requestDemoDialog.contact!.id 
            ? { ...c, sales_stage: "Request Demo", demo_instructions: demoInstructions, updated_at: new Date().toISOString() } 
            : c
        )
      );
      toast.success("Demo request saved");
    } else {
      toast.error("Failed to save demo request");
    }
    
    setRequestDemoDialog({ open: false, contact: null });
    setDemoInstructions("");
  };

  const renderCell = (contact: Contact, columnKey: Phase2ColumnKey, isLast: boolean) => {
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
              {/* Eye button for Lead Source */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLeadSourceDialog({ open: true, contact });
                    }}
                    className="p-1 hover:bg-muted rounded transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">View Lead Source</p>
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
                        handlePhoneCall(contact.mobile_number!, contact.id);
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
                placeholder="https://..."
              />
            ) : (
              <div className="px-3 py-1 min-h-[32px] flex items-center text-sm w-full">
                {contact.link ? (
                  <div className="flex items-center gap-2 w-full">
                    <span
                      className="text-primary hover:underline truncate flex-1 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = contact.link?.startsWith("http") ? contact.link : `https://${contact.link}`;
                        window.open(url, "_blank", "noopener,noreferrer");
                      }}
                    >
                      {contact.link}
                    </span>
                    <DuplicateWarning duplicates={duplicates} fieldLabel="link" />
                    <ExternalLink 
                      className="w-3.5 h-3.5 text-muted-foreground shrink-0 cursor-pointer hover:text-primary" 
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = contact.link?.startsWith("http") ? contact.link : `https://${contact.link}`;
                        window.open(url, "_blank", "noopener,noreferrer");
                      }}
                    />
                    <span
                      className="cursor-text text-muted-foreground hover:text-foreground"
                      onClick={() => startEditing(contact.id, "link", contact.link)}
                    >
                      ✎
                    </span>
                  </div>
                ) : (
                  <span
                    className="cursor-text flex-1 hover:bg-muted/50 rounded px-1 text-muted-foreground/50"
                    onClick={() => startEditing(contact.id, "link", contact.link)}
                  >
                    Empty
                  </span>
                )}
              </div>
            )}
          </div>
        );
      }

      case "sales_stage":
        return (
          <div className={baseClass} style={style}>
            <Select
              value={contact.sales_stage}
              onValueChange={(value) => handleSalesStageChange(contact.id, value)}
            >
              <SelectTrigger className="h-full border-0 rounded-none focus:ring-1 focus:ring-primary text-sm">
                <SelectValue>
                  <span className={`${salesStageColors[contact.sales_stage] || "bg-gray-400 text-white"} px-2 py-0.5 rounded text-xs font-medium`}>
                    {contact.sales_stage}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {phase2SalesStages.map((stage) => (
                  <SelectItem key={stage} value={stage} className="text-sm">{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "contact_count":
        return (
          <div className={baseClass} style={style}>
            <div 
              className="px-3 py-1 min-h-[32px] flex items-center justify-center cursor-pointer hover:bg-muted/50 w-full"
              onClick={() => handleIncrementAttempts(contact.id)}
              title="Click to increment attempts"
            >
              <div className="flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="min-w-[24px] h-6 flex items-center justify-center bg-primary/10 text-primary text-sm font-medium rounded px-2">
                  {contact.contact_count || 0}
                </span>
              </div>
            </div>
          </div>
        );

      case "last_contacted_at":
        return (
          <div className={baseClass} style={style}>
            <div 
              className="px-3 py-1 min-h-[32px] flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded w-full"
              onClick={() => handleSetLastUpdate(contact.id)}
              title="Click to set to current date/time"
            >
              {contact.last_contacted_at ? (
                <div className="flex items-center gap-2 w-full">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate flex-1 text-xs">
                    {formatLastContacted(contact.last_contacted_at)}
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground/50 text-xs flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Click to set
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
              <div
                className="cursor-text px-3 py-1.5 min-h-[32px] flex-1 text-sm whitespace-pre-wrap break-words hover:bg-muted/50 w-full"
                onClick={() => startEditing(contact.id, "notes", contact.notes)}
              >
                {contact.notes || <span className="text-muted-foreground/50">Empty</span>}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Loading contacts...
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-x-auto scrollbar-hide border border-border rounded-lg">
        {/* Header */}
        <div className="flex border-b border-border text-sm text-muted-foreground bg-slate-800">
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
                  "relative px-3 py-2 font-medium cursor-grab active:cursor-grabbing select-none",
                  isLast ? "flex-1 min-w-[150px]" : "border-r border-border shrink-0",
                  draggedColumn === columnKey && "opacity-50",
                  dragOverColumn === columnKey && "bg-primary/10"
                )}
                style={isLast ? { minWidth: columnWidths[columnKey] } : { width: columnWidths[columnKey] }}
              >
                <div className="flex items-center gap-1">
                  <GripVertical className="w-3 h-3 text-muted-foreground/50" />
                  {PHASE2_COLUMN_LABELS[columnKey]}
                </div>
                <ResizeHandle columnKey={columnKey} />
              </div>
            );
          })}
        </div>

        {/* Rows */}
        {contacts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No contacts in Phase 2 yet. Move contacts from Phase 1 by selecting "Demo Stage".
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

      {/* Lead Source Dialog */}
      <Dialog open={leadSourceDialog.open} onOpenChange={(open) => setLeadSourceDialog({ open, contact: open ? leadSourceDialog.contact : null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Lead Source</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {leadSourceDialog.contact && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Business: {leadSourceDialog.contact.business_name || "Unnamed"}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Lead Source:</span>
                    {leadSourceDialog.contact.lead_source ? (
                      <span className={`${leadSourceColors[leadSourceDialog.contact.lead_source] || "bg-gray-100 text-gray-700"} px-3 py-1 rounded text-sm font-medium`}>
                        {leadSourceDialog.contact.lead_source}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Demo Dialog */}
      <Dialog open={requestDemoDialog.open} onOpenChange={(open) => {
        if (!open) {
          setRequestDemoDialog({ open: false, contact: null });
          setDemoInstructions("");
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Demo - Instructions for Web Developer</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {requestDemoDialog.contact && (
              <p className="text-sm text-muted-foreground">
                Business: {requestDemoDialog.contact.business_name || "Unnamed"}
              </p>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">Demo Instructions / Notes</label>
              <Textarea
                value={demoInstructions}
                onChange={(e) => setDemoInstructions(e.target.value)}
                placeholder="Enter instructions for the web developer who will create the demo website..."
                className="min-h-[150px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setRequestDemoDialog({ open: false, contact: null });
                setDemoInstructions("");
              }}>
                Cancel
              </Button>
              <Button onClick={handleSaveDemoInstructions}>
                Save & Set Request Demo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Phase2ContactsTable;
