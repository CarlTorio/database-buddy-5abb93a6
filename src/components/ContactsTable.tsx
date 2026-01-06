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
import { Plus, FileText, Trash2, ExternalLink, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

interface EmailTemplate {
  subject: string;
  body: string;
}

interface ColumnWidths {
  business_name: number;
  email: number;
  mobile: number;
  status: number;
  link: number;
  notes: number;
}

const DEFAULT_WIDTHS: ColumnWidths = {
  business_name: 200,
  email: 180,
  mobile: 140,
  status: 120,
  link: 180,
  notes: 250,
};

const MIN_WIDTH = 80;

interface Contact {
  id: string;
  category_id: string;
  business_name: string;
  email: string | null;
  mobile_number: string | null;
  status: string;
  link?: string | null;
  notes: string | null;
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
      setContacts(data);
    }
    setLoading(false);
  };

  const handleAddNew = async () => {
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        category_id: categoryId,
        business_name: "",
        status: "Lead",
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

  const handleUpdate = async (id: string, field: string, value: string) => {
    const updateValue = field === "status" ? value : (value.trim() || null);
    const { error } = await supabase
      .from("contacts")
      .update({ [field]: updateValue, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (!error) {
      setContacts(
        contacts.map((c) =>
          c.id === id ? { ...c, [field]: updateValue, updated_at: new Date().toISOString() } : c
        )
      );
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
    handleUpdate(id, field, editValue);
    setEditingCell(null);

    // Clean up empty new rows
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
      handleBlur(id, field);
    }
    if (e.key === "Escape") {
      setEditingCell(null);
      setNewRowId(null);
    }
  };

  const openGmailCompose = (email: string) => {
    if (!emailTemplate) {
      toast.error("Email template not loaded");
      return;
    }
    const subject = encodeURIComponent(emailTemplate.subject);
    const body = encodeURIComponent(emailTemplate.body);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${subject}&body=${body}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  const statusColors: Record<string, string> = {
    Lead: "bg-slate-100 text-slate-700 border-slate-300",
    Contacted: "bg-blue-100 text-blue-700 border-blue-300",
    Rejected: "bg-red-100 text-red-700 border-red-300",
    "Demo Stage": "bg-purple-100 text-purple-700 border-purple-300",
    "Decision Pending": "bg-orange-100 text-orange-700 border-orange-300",
    "Closed Won": "bg-green-100 text-green-700 border-green-300",
    "Closed Lost": "bg-gray-100 text-gray-700 border-gray-300",
    Completed: "bg-emerald-100 text-emerald-700 border-emerald-300",
  };

  // Priority order for sorting (higher number = higher priority = shows at top)
  const statusPriority: Record<string, number> = {
    Lead: 1,
    Rejected: 2,
    "Closed Lost": 3,
    Contacted: 4,
    "Decision Pending": 5,
    "Demo Stage": 6,
    "Closed Won": 7,
    Completed: 8,
  };

  // Separate and sort contacts
  const activeContacts = contacts
    .filter((c) => c.status !== "Completed")
    .sort((a, b) => (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0));

  const completedContacts = contacts
    .filter((c) => c.status === "Completed")
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const ResizeHandle = ({ columnKey }: { columnKey: keyof ColumnWidths }) => (
    <div
      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary active:bg-primary transition-colors z-10"
      onMouseDown={handleResizeStart(columnKey)}
    >
      <div className="absolute right-[-1px] top-0 bottom-0 w-[3px] opacity-0 hover:opacity-100 bg-primary/50" />
    </div>
  );

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Loading contacts...
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border border-border rounded-lg">
      {/* Header */}
      <div className="flex border-b border-border text-sm text-muted-foreground">
        <div
          className="relative px-3 py-2 border-r border-border font-medium shrink-0"
          style={{ width: columnWidths.business_name }}
        >
          Business Name
          <ResizeHandle columnKey="business_name" />
        </div>
        <div
          className="relative px-3 py-2 border-r border-border font-medium shrink-0"
          style={{ width: columnWidths.link }}
        >
          Link
          <ResizeHandle columnKey="link" />
        </div>
        <div
          className="relative px-3 py-2 border-r border-border font-medium shrink-0"
          style={{ width: columnWidths.email }}
        >
          Email
          <ResizeHandle columnKey="email" />
        </div>
        <div
          className="relative px-3 py-2 border-r border-border font-medium shrink-0"
          style={{ width: columnWidths.mobile }}
        >
          Mobile
          <ResizeHandle columnKey="mobile" />
        </div>
        <div
          className="relative px-3 py-2 border-r border-border font-medium shrink-0"
          style={{ width: columnWidths.status }}
        >
          Status
          <ResizeHandle columnKey="status" />
        </div>
        <div
          className="relative px-3 py-2 font-medium flex-1 min-w-[150px]"
          style={{ minWidth: columnWidths.notes }}
        >
          Notes
          <ResizeHandle columnKey="notes" />
        </div>
      </div>

      {/* Active Rows */}
      {activeContacts.map((contact) => (
        <div
          key={contact.id}
          className="flex border-b border-border hover:bg-muted/30 group"
        >
          {/* Business Name */}
          <div
            className="border-r border-border shrink-0"
            style={{ width: columnWidths.business_name }}
          >
            <div className="flex items-center gap-2 px-2 py-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {editingCell?.id === contact.id && editingCell?.field === "business_name" ? (
                <Input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleBlur(contact.id, "business_name")}
                  onKeyDown={(e) => handleKeyDown(e, contact.id, "business_name")}
                  className="h-6 px-1 py-0 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary text-sm"
                />
              ) : (
                <span
                  className="cursor-text flex-1 min-h-[24px] flex items-center hover:bg-muted/50 rounded px-1 text-sm truncate"
                  onClick={() => startEditing(contact.id, "business_name", contact.business_name)}
                >
                  {contact.business_name || <span className="text-muted-foreground/50 text-sm">Empty</span>}
                </span>
              )}
            </div>
          </div>

          {/* Link */}
          <div
            className="border-r border-border shrink-0"
            style={{ width: columnWidths.link }}
          >
            {editingCell?.id === contact.id && editingCell?.field === "link" ? (
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleBlur(contact.id, "link")}
                onKeyDown={(e) => handleKeyDown(e, contact.id, "link")}
                className="h-full px-3 py-1 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-none text-sm"
                placeholder="https://..."
              />
            ) : (
              <div
                className="px-3 py-1 min-h-[32px] flex items-center text-sm"
              >
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

          {/* Email */}
          <div
            className="border-r border-border shrink-0"
            style={{ width: columnWidths.email }}
          >
            {editingCell?.id === contact.id && editingCell?.field === "email" ? (
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleBlur(contact.id, "email")}
                onKeyDown={(e) => handleKeyDown(e, contact.id, "email")}
                className="h-full px-3 py-1 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-none text-sm"
              />
            ) : (
              <div className="px-3 py-1 min-h-[32px] flex items-center gap-2 text-sm">
                {contact.email ? (
                  <>
                    <span
                      className="cursor-text flex-1 hover:bg-muted/50 rounded px-1 truncate"
                      onClick={() => startEditing(contact.id, "email", contact.email)}
                    >
                      {contact.email}
                    </span>
                    <Mail
                      className="w-4 h-4 text-muted-foreground shrink-0 cursor-pointer hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        openGmailCompose(contact.email!);
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

          {/* Mobile */}
          <div
            className="border-r border-border shrink-0"
            style={{ width: columnWidths.mobile }}
          >
            {editingCell?.id === contact.id && editingCell?.field === "mobile_number" ? (
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleBlur(contact.id, "mobile_number")}
                onKeyDown={(e) => handleKeyDown(e, contact.id, "mobile_number")}
                className="h-full px-3 py-1 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-none text-sm"
              />
            ) : (
              <div className="px-3 py-1 min-h-[32px] flex items-center gap-2 text-sm">
                {contact.mobile_number ? (
                  <>
                    <span
                      className="cursor-text flex-1 hover:bg-muted/50 rounded px-1 truncate"
                      onClick={() => startEditing(contact.id, "mobile_number", contact.mobile_number)}
                    >
                      {contact.mobile_number}
                    </span>
                    <Phone
                      className="w-4 h-4 text-muted-foreground shrink-0 cursor-pointer hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`tel:${contact.mobile_number}`, "_self");
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

          {/* Status */}
          <div
            className="border-r border-border shrink-0"
            style={{ width: columnWidths.status }}
          >
            <Select
              value={contact.status}
              onValueChange={(value) => handleUpdate(contact.id, "status", value)}
            >
              <SelectTrigger className="h-full border-0 rounded-none focus:ring-1 focus:ring-primary text-sm">
                <SelectValue>
                  <span className={`${statusColors[contact.status] || "bg-gray-400 text-white"} px-2 py-0.5 rounded text-xs font-medium`}>
                    {contact.status}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lead" className="text-sm">Lead</SelectItem>
                <SelectItem value="Contacted" className="text-sm">Contacted</SelectItem>
                <SelectItem value="Rejected" className="text-sm">Rejected</SelectItem>
                <SelectItem value="Demo Stage" className="text-sm">Demo Stage</SelectItem>
                <SelectItem value="Decision Pending" className="text-sm">Decision Pending</SelectItem>
                <SelectItem value="Closed Won" className="text-sm">Closed Won</SelectItem>
                <SelectItem value="Closed Lost" className="text-sm">Closed Lost</SelectItem>
                <SelectItem value="Completed" className="text-sm">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div
            className="flex items-start flex-1"
            style={{ minWidth: columnWidths.notes }}
          >
            {editingCell?.id === contact.id && editingCell?.field === "notes" ? (
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleBlur(contact.id, "notes")}
                onKeyDown={(e) => handleKeyDown(e, contact.id, "notes")}
                className="h-full px-3 py-1 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-none text-sm"
              />
            ) : (
              <div
                className="cursor-text px-3 py-1.5 min-h-[32px] flex-1 hover:bg-muted/50 text-sm whitespace-pre-wrap break-words"
                onClick={() => startEditing(contact.id, "notes", contact.notes)}
              >
                {contact.notes || <span className="text-muted-foreground/50 text-sm">Empty</span>}
              </div>
            )}
            <button
              onClick={() => handleDelete(contact.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 rounded transition-opacity shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </button>
          </div>
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

      {/* Completed Section */}
      {completedContacts.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3 px-3 text-emerald-600">Completed ({completedContacts.length})</h3>
          <div className="border border-border rounded-lg">
            {/* Completed Header */}
            <div className="flex border-b border-border text-sm text-muted-foreground bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="px-3 py-2 border-r border-border font-medium shrink-0" style={{ width: columnWidths.business_name }}>
                Business Name
              </div>
              <div className="px-3 py-2 border-r border-border font-medium shrink-0" style={{ width: columnWidths.link }}>
                Link
              </div>
              <div className="px-3 py-2 border-r border-border font-medium shrink-0" style={{ width: columnWidths.email }}>
                Email
              </div>
              <div className="px-3 py-2 border-r border-border font-medium shrink-0" style={{ width: columnWidths.mobile }}>
                Mobile
              </div>
              <div className="px-3 py-2 border-r border-border font-medium shrink-0" style={{ width: columnWidths.status }}>
                Status
              </div>
              <div className="px-3 py-2 font-medium flex-1 min-w-[150px]" style={{ minWidth: columnWidths.notes }}>
                Notes
              </div>
            </div>

            {/* Completed Rows */}
            {completedContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex border-b border-border hover:bg-muted/30 group last:border-b-0"
              >
                {/* Business Name */}
                <div className="border-r border-border shrink-0" style={{ width: columnWidths.business_name }}>
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{contact.business_name || "—"}</span>
                  </div>
                </div>

                {/* Link */}
                <div className="border-r border-border shrink-0" style={{ width: columnWidths.link }}>
                  <div className="px-3 py-1 min-h-[32px] flex items-center text-sm">
                    {contact.link ? (
                      <a
                        href={contact.link.startsWith("http") ? contact.link : `https://${contact.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        {contact.link}
                      </a>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="border-r border-border shrink-0" style={{ width: columnWidths.email }}>
                  <div className="px-3 py-1 min-h-[32px] flex items-center gap-2 text-sm">
                    {contact.email ? (
                      <>
                        <span className="truncate flex-1">{contact.email}</span>
                        <Mail
                          className="w-4 h-4 text-muted-foreground shrink-0 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => openGmailCompose(contact.email!)}
                        />
                      </>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </div>
                </div>

                {/* Mobile */}
                <div className="border-r border-border shrink-0" style={{ width: columnWidths.mobile }}>
                  <div className="px-3 py-1 min-h-[32px] flex items-center gap-2 text-sm">
                    {contact.mobile_number ? (
                      <>
                        <span className="truncate flex-1">{contact.mobile_number}</span>
                        <Phone
                          className="w-4 h-4 text-muted-foreground shrink-0 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => window.open(`tel:${contact.mobile_number}`, "_self")}
                        />
                      </>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="border-r border-border shrink-0" style={{ width: columnWidths.status }}>
                  <div className="px-3 py-1 min-h-[32px] flex items-center">
                    <Select
                      value={contact.status}
                      onValueChange={(value) => handleUpdate(contact.id, "status", value)}
                    >
                      <SelectTrigger className="h-auto border-0 p-0 focus:ring-0 text-sm">
                        <SelectValue>
                          <span className={`${statusColors[contact.status]} px-2 py-0.5 rounded text-xs font-medium`}>
                            {contact.status}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Lead" className="text-sm">Lead</SelectItem>
                        <SelectItem value="Contacted" className="text-sm">Contacted</SelectItem>
                        <SelectItem value="Rejected" className="text-sm">Rejected</SelectItem>
                        <SelectItem value="Demo Stage" className="text-sm">Demo Stage</SelectItem>
                        <SelectItem value="Decision Pending" className="text-sm">Decision Pending</SelectItem>
                        <SelectItem value="Closed Won" className="text-sm">Closed Won</SelectItem>
                        <SelectItem value="Closed Lost" className="text-sm">Closed Lost</SelectItem>
                        <SelectItem value="Completed" className="text-sm">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Notes */}
                <div className="flex items-start flex-1" style={{ minWidth: columnWidths.notes }}>
                  <div className="px-3 py-1.5 min-h-[32px] flex-1 text-sm whitespace-pre-wrap break-words">
                    {contact.notes || <span className="text-muted-foreground/50">—</span>}
                  </div>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 rounded transition-opacity shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsTable;
