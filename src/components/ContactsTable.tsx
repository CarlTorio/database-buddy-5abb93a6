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
import { Plus, FileText, Trash2, ExternalLink, Mail, Phone, Clock, GripVertical, AlertTriangle, Hash, User } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface EmailTemplate {
  subject: string;
  body: string;
}

type ColumnKey = "assigned" | "business_name" | "contact_name" | "number" | "email" | "link" | "lead_source" | "sales_stage" | "attempts" | "last_update" | "notes";

interface ColumnWidths {
  assigned: number;
  business_name: number;
  contact_name: number;
  number: number;
  email: number;
  link: number;
  lead_source: number;
  sales_stage: number;
  attempts: number;
  last_update: number;
  notes: number;
}

const DEFAULT_WIDTHS: ColumnWidths = {
  assigned: 100,
  business_name: 150,
  contact_name: 130,
  number: 120,
  email: 150,
  link: 140,
  lead_source: 120,
  sales_stage: 130,
  attempts: 90,
  last_update: 150,
  notes: 180,
};

const COLUMN_LABELS: Record<ColumnKey, string> = {
  assigned: "Assigned",
  business_name: "Business Name",
  contact_name: "Contact Name",
  number: "Number",
  email: "Email",
  link: "Link",
  lead_source: "Lead Source",
  sales_stage: "Sales Stage",
  attempts: "# Attempts",
  last_update: "Last Update",
  notes: "Notes",
};

const DEFAULT_COLUMN_ORDER: ColumnKey[] = [
  "assigned",
  "business_name",
  "contact_name",
  "number",
  "email",
  "link",
  "lead_source",
  "sales_stage",
  "attempts",
  "last_update",
  "notes",
];

const MIN_WIDTH = 80;

const LEAD_SOURCES = ["Cold Call", "Messenger", "Referral", "Ads"];
const SALES_STAGES = ["Lead", "Approached", "Demo Stage"];

interface Contact {
  id: string;
  category_id: string;
  assigned_to: string | null;
  business_name: string;
  contact_name: string | null;
  email: string | null;
  mobile_number: string | null;
  link: string | null;
  lead_source: string | null;
  sales_stage: string | null;
  attempts: number;
  notes: string | null;
  last_contacted_at: string | null;
  contact_count: number;
  created_at: string;
  updated_at: string;
}

interface ContactsTableProps {
  categoryId: string;
  isAdding?: boolean;
  onAddingChange?: (isAdding: boolean) => void;
}

const ContactsTable = ({ categoryId }: ContactsTableProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newRowId, setNewRowId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(DEFAULT_WIDTHS);
  const startWidthRef = useRef<number>(0);
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate | null>(null);
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>(DEFAULT_COLUMN_ORDER);
  const [currentUser, setCurrentUser] = useState<string>("");

  // Fetch current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      // Try to get from localStorage first (set during login)
      const storedUser = localStorage.getItem("currentUserName");
      if (storedUser) {
        setCurrentUser(storedUser);
      }
    };
    fetchCurrentUser();
  }, []);

  // Load column order from localStorage
  useEffect(() => {
    const storageKey = `contacts-column-order-v2-${categoryId || 'default'}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_COLUMN_ORDER.length) {
          setColumnOrder(parsed as ColumnKey[]);
          return;
        }
      } catch {
        // Invalid JSON, use default
      }
    }
    setColumnOrder(DEFAULT_COLUMN_ORDER);
  }, [categoryId]);

  useEffect(() => {
    const storageKey = `contacts-column-order-v2-${categoryId || 'default'}`;
    localStorage.setItem(storageKey, JSON.stringify(columnOrder));
  }, [columnOrder, categoryId]);

  useEffect(() => {
    const storageKey = `contacts-column-widths-v2-${categoryId || 'default'}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          setColumnWidths({ ...DEFAULT_WIDTHS, ...parsed });
          return;
        }
      } catch {
        // Invalid JSON, use default
      }
    }
    setColumnWidths(DEFAULT_WIDTHS);
  }, [categoryId]);

  useEffect(() => {
    const storageKey = `contacts-column-widths-v2-${categoryId || 'default'}`;
    localStorage.setItem(storageKey, JSON.stringify(columnWidths));
  }, [columnWidths, categoryId]);

  const [draggedColumn, setDraggedColumn] = useState<ColumnKey | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ColumnKey | null>(null);

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
    (key: keyof ColumnWidths) => (e: React.MouseEvent) => {
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

  const handleDragStart = (e: React.DragEvent, columnKey: ColumnKey) => {
    setDraggedColumn(columnKey);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", columnKey);
  };

  const handleDragOver = (e: React.DragEvent, columnKey: ColumnKey) => {
    e.preventDefault();
    if (draggedColumn && draggedColumn !== columnKey) {
      setDragOverColumn(columnKey);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetColumn: ColumnKey) => {
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
      .order("created_at", { ascending: true });

    if (!error && data) {
      setContacts(data as Contact[]);
    }
    setLoading(false);
  };

  const handleAddNew = async () => {
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        category_id: categoryId,
        business_name: "",
        assigned_to: currentUser || null,
        sales_stage: "Lead",
        attempts: 1,
      })
      .select()
      .single();

    if (!error && data) {
      setContacts([...contacts, data as Contact]);
      setNewRowId(data.id);
      startEditing(data.id, "business_name", "");
    } else {
      toast.error("Failed to add contact");
    }
  };

  const pendingSaveRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const handleUpdate = useCallback(async (id: string, field: string, value: string | number, immediate = false) => {
    let updateValue: string | number | null;
    if (field === "attempts") {
      updateValue = typeof value === "number" ? value : parseInt(value) || 1;
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

    if (newRowId === id && !editValue.trim() && field === "business_name") {
      const contact = contacts.find((c) => c.id === id);
      if (contact && !contact.business_name && !contact.email && !contact.mobile_number) {
        handleDelete(id);
      }
    }
    setNewRowId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string, field: string) => {
    if (e.key === "Enter") {
      handleUpdate(id, field, editValue, true);
      setEditingCell(null);
      setNewRowId(null);
    }
    if (e.key === "Escape") {
      setEditingCell(null);
      setNewRowId(null);
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
    await updateLastUpdate(contactId);
    const subject = encodeURIComponent(emailTemplate.subject);
    const body = encodeURIComponent(emailTemplate.body);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${subject}&body=${body}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  const handlePhoneCall = async (phone: string, contactId: string) => {
    await updateLastUpdate(contactId);
    window.open(`tel:${phone}`, "_self");
  };

  const updateLastUpdate = async (contactId: string) => {
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
    }
  };

  const handleIncrementAttempts = async (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    const newAttempts = (contact.attempts || 1) + 1;
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from("contacts")
      .update({ 
        attempts: newAttempts,
        updated_at: now 
      })
      .eq("id", contactId);

    if (!error) {
      setContacts(
        contacts.map((c) =>
          c.id === contactId 
            ? { ...c, attempts: newAttempts, updated_at: now } 
            : c
        )
      );
    }
  };

  const handleLastUpdateClick = async (contactId: string) => {
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
      toast.success("Last update saved");
    }
  };

  const formatLastUpdate = (date: string | null) => {
    if (!date) return null;
    return format(new Date(date), "MMM d, yyyy h:mm a");
  };

  const salesStageColors: Record<string, string> = {
    Lead: "bg-slate-100 text-slate-700 border-slate-300",
    Approached: "bg-blue-100 text-blue-700 border-blue-300",
    "Demo Stage": "bg-purple-100 text-purple-700 border-purple-300",
  };

  const leadSourceColors: Record<string, string> = {
    "Cold Call": "bg-cyan-100 text-cyan-700 border-cyan-300",
    Messenger: "bg-indigo-100 text-indigo-700 border-indigo-300",
    Referral: "bg-green-100 text-green-700 border-green-300",
    Ads: "bg-orange-100 text-orange-700 border-orange-300",
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

  const ResizeHandle = ({ columnKey }: { columnKey: keyof ColumnWidths }) => (
    <div
      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary active:bg-primary transition-colors z-10"
      onMouseDown={handleResizeStart(columnKey)}
    >
      <div className="absolute right-[-1px] top-0 bottom-0 w-[3px] opacity-0 hover:opacity-100 bg-primary/50" />
    </div>
  );

  const renderCell = (contact: Contact, columnKey: ColumnKey, isLast: boolean) => {
    const baseClass = isLast ? "flex items-start flex-1" : "border-r border-border shrink-0";
    const style = isLast 
      ? { minWidth: columnWidths[columnKey] } 
      : { width: columnWidths[columnKey] };

    switch (columnKey) {
      case "assigned":
        return (
          <div className={baseClass} style={style}>
            {editingCell?.id === contact.id && editingCell?.field === "assigned_to" ? (
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => handleInputChange(contact.id, "assigned_to", e.target.value)}
                onBlur={() => handleBlur(contact.id, "assigned_to")}
                onKeyDown={(e) => handleKeyDown(e, contact.id, "assigned_to")}
                className="h-full px-3 py-1 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-none text-sm"
              />
            ) : (
              <div 
                className="px-3 py-1 min-h-[32px] flex items-center gap-2 text-sm w-full cursor-text hover:bg-muted/50"
                onClick={() => startEditing(contact.id, "assigned_to", contact.assigned_to)}
              >
                <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">
                  {contact.assigned_to || <span className="text-muted-foreground/50">Unassigned</span>}
                </span>
              </div>
            )}
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
              <div 
                className="px-3 py-1 min-h-[32px] flex items-center text-sm w-full cursor-text hover:bg-muted/50"
                onClick={() => startEditing(contact.id, "contact_name", contact.contact_name)}
              >
                {contact.contact_name || <span className="text-muted-foreground/50">Empty</span>}
              </div>
            )}
          </div>
        );

      case "number": {
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

      case "lead_source":
        return (
          <div className={baseClass} style={style}>
            <Select
              value={contact.lead_source || ""}
              onValueChange={(value) => handleUpdate(contact.id, "lead_source", value, true)}
            >
              <SelectTrigger className="h-full border-0 rounded-none focus:ring-1 focus:ring-primary text-sm">
                <SelectValue placeholder="Select...">
                  {contact.lead_source ? (
                    <span className={`${leadSourceColors[contact.lead_source] || "bg-gray-100 text-gray-700"} px-2 py-0.5 rounded text-xs font-medium`}>
                      {contact.lead_source}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/50">Select...</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map((source) => (
                  <SelectItem key={source} value={source} className="text-sm">
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "sales_stage":
        return (
          <div className={baseClass} style={style}>
            <Select
              value={contact.sales_stage || "Lead"}
              onValueChange={(value) => handleUpdate(contact.id, "sales_stage", value, true)}
            >
              <SelectTrigger className="h-full border-0 rounded-none focus:ring-1 focus:ring-primary text-sm">
                <SelectValue>
                  <span className={`${salesStageColors[contact.sales_stage || "Lead"]} px-2 py-0.5 rounded text-xs font-medium`}>
                    {contact.sales_stage || "Lead"}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SALES_STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage} className="text-sm">
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "attempts":
        return (
          <div className={baseClass} style={style}>
            <div 
              className="px-3 py-1 min-h-[32px] flex items-center justify-center gap-2 text-sm w-full cursor-pointer hover:bg-muted/50"
              onClick={() => handleIncrementAttempts(contact.id)}
              title="Click to increment"
            >
              <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
                {contact.attempts || 1}
              </span>
            </div>
          </div>
        );

      case "last_update":
        return (
          <div className={baseClass} style={style}>
            <div 
              className="px-3 py-1 min-h-[32px] flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded w-full"
              onClick={() => handleLastUpdateClick(contact.id)}
              title="Click to update timestamp"
            >
              {contact.last_contacted_at ? (
                <div className="flex items-center gap-2 w-full">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate flex-1 text-xs">
                    {formatLastUpdate(contact.last_contacted_at)}
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground/50 text-xs flex items-center gap-2">
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
                className="px-3 py-1 min-h-[32px] flex items-center text-sm w-full cursor-text hover:bg-muted/50"
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
    <div className="space-y-4">
      {/* Add New Button */}
      <Button onClick={handleAddNew} size="sm">
        <Plus className="w-4 h-4 mr-2" />
        Add Contact
      </Button>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {/* Header */}
          <div className="flex bg-muted/50 border-b border-border min-w-max">
            {columnOrder.map((columnKey, index) => {
              const isLast = index === columnOrder.length - 1;
              return (
                <div
                  key={columnKey}
                  className={cn(
                    "relative px-3 py-2 text-sm font-medium text-muted-foreground select-none",
                    isLast ? "flex-1" : "border-r border-border shrink-0",
                    dragOverColumn === columnKey && "bg-primary/10"
                  )}
                  style={isLast ? { minWidth: columnWidths[columnKey] } : { width: columnWidths[columnKey] }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, columnKey)}
                  onDragOver={(e) => handleDragOver(e, columnKey)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, columnKey)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-3 h-3 text-muted-foreground/50" />
                    <span>{COLUMN_LABELS[columnKey]}</span>
                  </div>
                  {!isLast && <ResizeHandle columnKey={columnKey} />}
                </div>
              );
            })}
            {/* Actions column */}
            <div className="w-12 px-2 py-2 text-sm font-medium text-muted-foreground shrink-0" />
          </div>

          {/* Body */}
          {contacts.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              No contacts yet. Click "Add Contact" to create one.
            </div>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors min-w-max"
              >
                {columnOrder.map((columnKey, index) => {
                  const isLast = index === columnOrder.length - 1;
                  return (
                    <div key={columnKey}>
                      {renderCell(contact, columnKey, isLast)}
                    </div>
                  );
                })}
                {/* Delete button */}
                <div className="w-12 flex items-center justify-center shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(contact.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactsTable;
