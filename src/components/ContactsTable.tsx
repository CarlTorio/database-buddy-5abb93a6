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
import { Plus, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ColumnWidths {
  business_name: number;
  email: number;
  mobile: number;
  status: number;
  notes: number;
}

const DEFAULT_WIDTHS: ColumnWidths = {
  business_name: 200,
  email: 180,
  mobile: 140,
  status: 120,
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
  const [newRowId, setNewRowId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(DEFAULT_WIDTHS);
  const startWidthRef = useRef<number>(0);

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
        status: "Pending",
      })
      .select()
      .single();

    if (!error && data) {
      setContacts([...contacts, data]);
      setNewRowId(data.id);
      setEditingCell({ id: data.id, field: "business_name" });
    } else {
      toast.error("Failed to add contact");
    }
  };

  const handleUpdate = async (id: string, field: string, value: string) => {
    const { error } = await supabase
      .from("contacts")
      .update({ [field]: value.trim() || null })
      .eq("id", id);

    if (!error) {
      setContacts(
        contacts.map((c) =>
          c.id === id ? { ...c, [field]: value.trim() || null } : c
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

  const handleBlur = (id: string, field: string, value: string) => {
    handleUpdate(id, field, value);
    setEditingCell(null);

    // Clean up empty new rows
    if (newRowId === id && !value.trim() && field === "business_name") {
      const contact = contacts.find((c) => c.id === id);
      if (contact && !contact.business_name && !contact.email && !contact.mobile_number) {
        handleDelete(id);
      }
    }
    setNewRowId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string, field: string, value: string) => {
    if (e.key === "Enter") {
      handleBlur(id, field, value);
    }
    if (e.key === "Escape") {
      setEditingCell(null);
      setNewRowId(null);
    }
  };

  const statusColors: Record<string, string> = {
    "Already Called": "text-green-400",
    Pending: "text-yellow-400",
    Busy: "text-red-400",
  };

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

      {/* Rows */}
      {contacts.map((contact) => (
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
                  defaultValue={contact.business_name || ""}
                  onBlur={(e) => handleBlur(contact.id, "business_name", e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, contact.id, "business_name", e.currentTarget.value)}
                  className="h-6 px-1 py-0 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary text-sm"
                />
              ) : (
                <span
                  className="cursor-text flex-1 min-h-[24px] flex items-center hover:bg-muted/50 rounded px-1 text-sm truncate"
                  onClick={() => setEditingCell({ id: contact.id, field: "business_name" })}
                >
                  {contact.business_name || <span className="text-muted-foreground/50 text-sm">Empty</span>}
                </span>
              )}
            </div>
          </div>

          {/* Email */}
          <div
            className="border-r border-border shrink-0"
            style={{ width: columnWidths.email }}
          >
            {editingCell?.id === contact.id && editingCell?.field === "email" ? (
              <Input
                ref={inputRef}
                defaultValue={contact.email || ""}
                onBlur={(e) => handleBlur(contact.id, "email", e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, contact.id, "email", e.currentTarget.value)}
                className="h-full px-3 py-1 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-none text-sm"
              />
            ) : (
              <div
                className="cursor-text px-3 py-1 min-h-[32px] flex items-center hover:bg-muted/50 text-sm truncate"
                onClick={() => setEditingCell({ id: contact.id, field: "email" })}
              >
                {contact.email || <span className="text-muted-foreground/50 text-sm">Empty</span>}
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
                defaultValue={contact.mobile_number || ""}
                onBlur={(e) => handleBlur(contact.id, "mobile_number", e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, contact.id, "mobile_number", e.currentTarget.value)}
                className="h-full px-3 py-1 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-none text-sm"
              />
            ) : (
              <div
                className="cursor-text px-3 py-1 min-h-[32px] flex items-center hover:bg-muted/50 text-sm truncate"
                onClick={() => setEditingCell({ id: contact.id, field: "mobile_number" })}
              >
                {contact.mobile_number || <span className="text-muted-foreground/50 text-sm">Empty</span>}
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
                  <span className={`${statusColors[contact.status] || ""} text-sm`}>
                    {contact.status}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending" className="text-sm">Pending</SelectItem>
                <SelectItem value="Already Called" className="text-sm">Already Called</SelectItem>
                <SelectItem value="Busy" className="text-sm">Busy</SelectItem>
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
                defaultValue={contact.notes || ""}
                onBlur={(e) => handleBlur(contact.id, "notes", e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, contact.id, "notes", e.currentTarget.value)}
                className="h-full px-3 py-1 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary rounded-none text-sm"
              />
            ) : (
              <div
                className="cursor-text px-3 py-1.5 min-h-[32px] flex-1 hover:bg-muted/50 text-sm whitespace-pre-wrap break-words"
                onClick={() => setEditingCell({ id: contact.id, field: "notes" })}
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
    </div>
  );
};

export default ContactsTable;
