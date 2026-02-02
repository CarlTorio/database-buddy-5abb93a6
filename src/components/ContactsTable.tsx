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
import { Plus, FileText, Trash2, ExternalLink, Mail, Phone, Clock, GripVertical, AlertTriangle, User, Hash } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import {
  getSalesStagesForPhase,
  getPhaseTransition,
  salesStageColors,
  leadSourceColors,
  Phase,
} from "@/lib/salesStageConfig";
import DemoRequestDialog from "./DemoRequestDialog";
import RejectionReasonDialog from "./RejectionReasonDialog";
import PaymentConfirmationDialog from "./PaymentConfirmationDialog";
import LeadSourcePopover from "./LeadSourcePopover";

// Column types - Phase 2 hides lead_source by default
type Phase1ColumnKey = "assigned_to" | "business_name" | "contact_name" | "mobile_number" | "email" | "link" | "lead_source" | "sales_stage" | "contact_count" | "last_contacted_at" | "notes";
type Phase2ColumnKey = "assigned_to" | "business_name" | "contact_name" | "mobile_number" | "email" | "link" | "sales_stage" | "contact_count" | "last_contacted_at" | "notes" | "lead_source_action";
type Phase3ColumnKey = "assigned_to" | "business_name" | "contact_name" | "mobile_number" | "email" | "link" | "lead_source" | "sales_stage" | "contact_count" | "last_contacted_at" | "notes";

type ColumnKey = Phase1ColumnKey | Phase2ColumnKey | Phase3ColumnKey;

interface ColumnWidths {
  assigned_to: number;
  business_name: number;
  contact_name: number;
  mobile_number: number;
  email: number;
  link: number;
  lead_source: number;
  sales_stage: number;
  contact_count: number;
  last_contacted_at: number;
  notes: number;
  lead_source_action: number;
}

const DEFAULT_WIDTHS: ColumnWidths = {
  assigned_to: 100,
  business_name: 150,
  contact_name: 130,
  mobile_number: 120,
  email: 150,
  link: 140,
  lead_source: 110,
  sales_stage: 130,
  contact_count: 80,
  last_contacted_at: 140,
  notes: 180,
  lead_source_action: 50,
};

const COLUMN_LABELS: Record<string, string> = {
  assigned_to: "Assigned",
  business_name: "Business Name",
  contact_name: "Contact Name",
  mobile_number: "Number",
  email: "Email",
  link: "Link",
  lead_source: "Lead Source",
  sales_stage: "Sales Stage",
  contact_count: "# of Attempts",
  last_contacted_at: "Last Update",
  notes: "Notes",
  lead_source_action: "👁️",
};

const PHASE1_COLUMN_ORDER: Phase1ColumnKey[] = [
  "assigned_to",
  "business_name",
  "contact_name",
  "mobile_number",
  "email",
  "link",
  "lead_source",
  "sales_stage",
  "contact_count",
  "last_contacted_at",
  "notes",
];

const PHASE2_COLUMN_ORDER: Phase2ColumnKey[] = [
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
  "lead_source_action",
];

const PHASE3_COLUMN_ORDER: Phase3ColumnKey[] = [
  "assigned_to",
  "business_name",
  "contact_name",
  "mobile_number",
  "email",
  "link",
  "lead_source",
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
  demo_instructions?: string | null;
  current_phase: number;
  created_at: string;
  updated_at: string;
}

interface EmailTemplate {
  subject: string;
  body: string;
}

interface ContactsTableProps {
  categoryId: string;
  phase: Phase;
}

const ContactsTable = ({ categoryId, phase }: ContactsTableProps) => {
  const { userName } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newRowId, setNewRowId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(DEFAULT_WIDTHS);
  const startWidthRef = useRef<number>(0);
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate | null>(null);
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>(getColumnOrderForPhase(phase));

  // Dialog states
  const [demoRequestContact, setDemoRequestContact] = useState<Contact | null>(null);
  const [rejectionContact, setRejectionContact] = useState<Contact | null>(null);
  const [paymentContact, setPaymentContact] = useState<Contact | null>(null);

  // Drag and drop state
  const [draggedColumn, setDraggedColumn] = useState<ColumnKey | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ColumnKey | null>(null);

  // Pending saves ref for debounce
  const pendingSaveRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  function getColumnOrderForPhase(p: Phase): ColumnKey[] {
    switch (p) {
      case "lead": return [...PHASE1_COLUMN_ORDER];
      case "presentation": return [...PHASE2_COLUMN_ORDER];
      case "conversion": return [...PHASE3_COLUMN_ORDER];
      default: return [...PHASE1_COLUMN_ORDER];
    }
  }

  function getPhaseNumber(p: Phase): number {
    switch (p) {
      case "lead": return 1;
      case "presentation": return 2;
      case "conversion": return 3;
      default: return 1;
    }
  }

  function getDefaultStageForPhase(p: Phase): string {
    switch (p) {
      case "lead": return "Lead";
      case "presentation": return "Request Demo";
      case "conversion": return "Negotiating";
      default: return "Lead";
    }
  }

  // Update column order when phase changes
  useEffect(() => {
    const storageKey = `contacts-column-order-${phase}-${categoryId || 'default'}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setColumnOrder(parsed as ColumnKey[]);
          return;
        }
      } catch (e) {
        // Invalid JSON, use default
      }
    }
    setColumnOrder(getColumnOrderForPhase(phase));
  }, [categoryId, phase]);

  // Save column order to localStorage
  useEffect(() => {
    const storageKey = `contacts-column-order-${phase}-${categoryId || 'default'}`;
    localStorage.setItem(storageKey, JSON.stringify(columnOrder));
  }, [columnOrder, categoryId, phase]);

  // Load column widths from localStorage
  useEffect(() => {
    const storageKey = `contacts-column-widths-${phase}-${categoryId || 'default'}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          setColumnWidths({ ...DEFAULT_WIDTHS, ...parsed });
          return;
        }
      } catch (e) {
        // Invalid JSON, use default
      }
    }
    setColumnWidths(DEFAULT_WIDTHS);
  }, [categoryId, phase]);

  // Save column widths to localStorage
  useEffect(() => {
    const storageKey = `contacts-column-widths-${phase}-${categoryId || 'default'}`;
    localStorage.setItem(storageKey, JSON.stringify(columnWidths));
  }, [columnWidths, categoryId, phase]);

  // Fetch email template
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

  // Fetch contacts for this phase
  useEffect(() => {
    fetchContacts();
  }, [categoryId, phase]);

  // Focus input when editing
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  const fetchContacts = async () => {
    const phaseNumber = getPhaseNumber(phase);
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("category_id", categoryId)
      .eq("current_phase", phaseNumber)
      .order("created_at", { ascending: true });

    if (!error && data) {
      // Filter out archived stages
      const activeContacts = data.filter((c: Contact) => 
        !['Not Interested', 'Rejected', 'Closed Lost', 'Completed'].includes(c.sales_stage)
      );
      setContacts(activeContacts);
    }
    setLoading(false);
  };

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

  // Drag and drop handlers
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

    if (draggedIndex !== -1 && targetIndex !== -1) {
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedColumn);
      setColumnOrder(newOrder);
    }
    
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

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
    
    // Optimistic update
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

  // Handle sales stage change with phase transitions
  const handleSalesStageChange = async (contact: Contact, newStage: string) => {
    // Check for special stage triggers
    if (newStage === "Request Demo" && phase === "presentation") {
      // Open demo request dialog
      setDemoRequestContact(contact);
      return;
    }

    if (newStage === "Rejected" && phase === "presentation") {
      // Open rejection reason dialog first
      setRejectionContact(contact);
      return;
    }

    if (newStage === "Closed Won" && phase === "conversion") {
      // Open payment confirmation dialog
      setPaymentContact(contact);
      return;
    }

    // Check for phase transition
    const transition = getPhaseTransition(newStage);
    
    if (transition) {
      // Move to new phase
      const { targetPhase, newStage: transitionStage } = transition;
      
      const { error } = await supabase
        .from("contacts")
        .update({
          sales_stage: transitionStage,
          current_phase: targetPhase,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contact.id);

      if (!error) {
        // Remove from current list
        setContacts(prev => prev.filter(c => c.id !== contact.id));
        toast.success(`Client moved to Phase ${targetPhase}: ${targetPhase === 2 ? 'Presentation' : 'Conversion'}`);
      } else {
        toast.error("Failed to move client");
      }
      return;
    }

    // Normal stage update
    await handleUpdate(contact.id, "sales_stage", newStage, true);
  };

  // Demo request dialog save handler
  const handleDemoRequestSave = async (instructions: string, assignedDeveloper: string) => {
    if (!demoRequestContact) return;

    const { error } = await supabase
      .from("contacts")
      .update({
        sales_stage: "Request Demo",
        demo_instructions: instructions,
        assigned_to: assignedDeveloper,
        updated_at: new Date().toISOString(),
      })
      .eq("id", demoRequestContact.id);

    if (!error) {
      setContacts(prev =>
        prev.map(c =>
          c.id === demoRequestContact.id
            ? { ...c, sales_stage: "Request Demo", demo_instructions: instructions, assigned_to: assignedDeveloper, updated_at: new Date().toISOString() }
            : c
        )
      );
      toast.success("Demo request sent to developer");
    } else {
      toast.error("Failed to save demo request");
    }
    setDemoRequestContact(null);
  };

  // Rejection reason save handler
  const handleRejectionSave = async (reason: string) => {
    if (!rejectionContact) return;

    const existingNotes = rejectionContact.notes || "";
    const newNotes = existingNotes 
      ? `${existingNotes}\n\n[REJECTION REASON]: ${reason}`
      : `[REJECTION REASON]: ${reason}`;

    const { error } = await supabase
      .from("contacts")
      .update({
        sales_stage: "Rejected",
        notes: newNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rejectionContact.id);

    if (!error) {
      // Remove from active list (archived)
      setContacts(prev => prev.filter(c => c.id !== rejectionContact.id));
      toast.success("Contact archived as rejected");
    } else {
      toast.error("Failed to save rejection");
    }
    setRejectionContact(null);
  };

  // Payment confirmation save handler
  const handlePaymentSave = async (amount: number) => {
    if (!paymentContact) return;

    const existingNotes = paymentContact.notes || "";
    const newNotes = existingNotes 
      ? `${existingNotes}\n\n[PAYMENT RECEIVED]: ₱${amount.toLocaleString()}`
      : `[PAYMENT RECEIVED]: ₱${amount.toLocaleString()}`;

    const { error } = await supabase
      .from("contacts")
      .update({
        sales_stage: "Closed Won",
        value: amount,
        notes: newNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentContact.id);

    if (!error) {
      setContacts(prev =>
        prev.map(c =>
          c.id === paymentContact.id
            ? { ...c, sales_stage: "Closed Won", value: amount, notes: newNotes, updated_at: new Date().toISOString() }
            : c
        )
      );
      toast.success("Payment confirmed! 🎉");
    } else {
      toast.error("Failed to save payment");
    }
    setPaymentContact(null);
  };

  const handleAddNew = async () => {
    const phaseNumber = getPhaseNumber(phase);
    const defaultStage = getDefaultStageForPhase(phase);
    
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        category_id: categoryId,
        business_name: "",
        sales_stage: defaultStage,
        current_phase: phaseNumber,
        assigned_to: userName || null,
        contact_count: 0,
      })
      .select()
      .single();

    if (!error && data) {
      setContacts([...contacts, data]);
      setNewRowId(data.id);
      startEditing(data.id, "business_name", "");
    } else {
      toast.error("Failed to add contact");
    }
  };

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

  // Duplicate detection
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

  const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

  // Render column cell content
  const renderCell = (contact: Contact, columnKey: ColumnKey, isLast: boolean) => {
    const baseClass = isLast ? "flex items-start flex-1" : "border-r border-border shrink-0";
    const widthKey = columnKey as keyof ColumnWidths;
    const style = isLast 
      ? { minWidth: columnWidths[widthKey] || 100 } 
      : { width: columnWidths[widthKey] || 100 };

    const salesStages = getSalesStagesForPhase(phase);

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
                    <span className="text-muted-foreground/50 text-xs">Select...</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cold Call" className="text-sm">Cold Call</SelectItem>
                <SelectItem value="Messenger" className="text-sm">Messenger</SelectItem>
                <SelectItem value="Referral" className="text-sm">Referral</SelectItem>
                <SelectItem value="Ads" className="text-sm">Ads</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case "lead_source_action":
        // Eye icon for Phase 2 to view lead source
        return (
          <div className={baseClass} style={style}>
            <div className="flex items-center justify-center w-full h-full">
              <LeadSourcePopover leadSource={contact.lead_source} />
            </div>
          </div>
        );

      case "sales_stage":
        return (
          <div className={baseClass} style={style}>
            <Select
              value={contact.sales_stage}
              onValueChange={(value) => handleSalesStageChange(contact, value)}
            >
              <SelectTrigger className="h-full border-0 rounded-none focus:ring-1 focus:ring-primary text-sm">
                <SelectValue>
                  <span className={`${salesStageColors[contact.sales_stage] || "bg-gray-400 text-white"} px-2 py-0.5 rounded text-xs font-medium`}>
                    {contact.sales_stage}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {salesStages.map((stage) => (
                  <SelectItem key={stage} value={stage} className="text-sm">
                    <span className={`${salesStageColors[stage] || "bg-gray-100 text-gray-700"} px-2 py-0.5 rounded text-xs font-medium`}>
                      {stage}
                    </span>
                  </SelectItem>
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
            const widthKey = columnKey as keyof ColumnWidths;
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
                style={isLast ? { minWidth: columnWidths[widthKey] || 100 } : { width: columnWidths[widthKey] || 100 }}
              >
                <div className="flex items-center gap-1">
                  <GripVertical className="w-3 h-3 text-muted-foreground/50" />
                  {COLUMN_LABELS[columnKey] || columnKey}
                </div>
                <ResizeHandle columnKey={widthKey} />
              </div>
            );
          })}
        </div>

        {/* Rows */}
        {contacts.map((contact) => (
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
        ))}

        {/* Add New Row Button */}
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 w-full px-3 py-2 text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </button>
      </div>

      {/* Dialogs */}
      <DemoRequestDialog
        isOpen={!!demoRequestContact}
        onClose={() => setDemoRequestContact(null)}
        onSave={handleDemoRequestSave}
        businessName={demoRequestContact?.business_name || ""}
        currentInstructions={demoRequestContact?.demo_instructions || ""}
        currentAssigned={demoRequestContact?.assigned_to || ""}
      />

      <RejectionReasonDialog
        isOpen={!!rejectionContact}
        onClose={() => setRejectionContact(null)}
        onSave={handleRejectionSave}
        businessName={rejectionContact?.business_name || ""}
      />

      <PaymentConfirmationDialog
        isOpen={!!paymentContact}
        onClose={() => setPaymentContact(null)}
        onSave={handlePaymentSave}
        businessName={paymentContact?.business_name || ""}
      />
    </>
  );
};

export default ContactsTable;
