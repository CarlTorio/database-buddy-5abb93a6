import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";

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

const ContactsTable = ({ categoryId, isAdding = false, onAddingChange }: ContactsTableProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Contact>>({});
  const [newContact, setNewContact] = useState({
    business_name: "",
    email: "",
    mobile_number: "",
    status: "Pending",
    notes: "",
  });

  useEffect(() => {
    fetchContacts();
  }, [categoryId]);

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("category_id", categoryId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setContacts(data);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newContact.business_name.trim()) {
      toast.error("Business name is required");
      return;
    }

    const { data, error } = await supabase
      .from("contacts")
      .insert({
        category_id: categoryId,
        business_name: newContact.business_name.trim(),
        email: newContact.email.trim() || null,
        mobile_number: newContact.mobile_number.trim() || null,
        status: newContact.status,
        notes: newContact.notes.trim() || null,
      })
      .select()
      .single();

    if (!error && data) {
      setContacts([data, ...contacts]);
      setNewContact({
        business_name: "",
        email: "",
        mobile_number: "",
        status: "Pending",
        notes: "",
      });
      onAddingChange?.(false);
      toast.success("Contact added");
    } else {
      toast.error("Failed to add contact");
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingId(contact.id);
    setEditData({
      business_name: contact.business_name,
      email: contact.email || "",
      mobile_number: contact.mobile_number || "",
      status: contact.status,
      notes: contact.notes || "",
    });
  };

  const handleSave = async () => {
    if (!editingId || !editData.business_name?.trim()) {
      toast.error("Business name is required");
      return;
    }

    const { error } = await supabase
      .from("contacts")
      .update({
        business_name: editData.business_name.trim(),
        email: editData.email?.trim() || null,
        mobile_number: editData.mobile_number?.trim() || null,
        status: editData.status,
        notes: editData.notes?.trim() || null,
      })
      .eq("id", editingId);

    if (!error) {
      setContacts(
        contacts.map((c) =>
          c.id === editingId ? { ...c, ...editData } : c
        )
      );
      setEditingId(null);
      setEditData({});
      toast.success("Contact updated");
    } else {
      toast.error("Failed to update contact");
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

  const statusColors: Record<string, string> = {
    "Already Called": "bg-green-500/20 text-green-400",
    Pending: "bg-yellow-500/20 text-yellow-400",
    Busy: "bg-red-500/20 text-red-400",
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
      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[200px]">
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    onClick={() => onAddingChange?.(true)}
                    disabled={isAdding}
                    className="rounded-full w-8 h-8"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  Business Name
                </div>
              </TableHead>
              <TableHead className="w-[200px]">Email</TableHead>
              <TableHead className="w-[150px]">Mobile Number</TableHead>
              <TableHead className="w-[140px]">Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Add New Row */}
            {isAdding && (
              <TableRow className="bg-primary/5">
                <TableCell>
                  <Input
                    placeholder="Business name"
                    value={newContact.business_name}
                    onChange={(e) =>
                      setNewContact({ ...newContact, business_name: e.target.value })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Email"
                    value={newContact.email}
                    onChange={(e) =>
                      setNewContact({ ...newContact, email: e.target.value })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Mobile"
                    value={newContact.mobile_number}
                    onChange={(e) =>
                      setNewContact({ ...newContact, mobile_number: e.target.value })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={newContact.status}
                    onValueChange={(value) =>
                      setNewContact({ ...newContact, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Already Called">Already Called</SelectItem>
                      <SelectItem value="Busy">Busy</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Textarea
                    placeholder="Notes / Feedback"
                    value={newContact.notes}
                    onChange={(e) =>
                      setNewContact({ ...newContact, notes: e.target.value })
                    }
                    className="min-h-[60px]"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={handleAdd}>
                      <Save className="w-4 h-4 text-green-500" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onAddingChange?.(false)}
                    >
                      <X className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Existing Contacts */}
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  {editingId === contact.id ? (
                    <Input
                      value={editData.business_name || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, business_name: e.target.value })
                      }
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:text-primary"
                      onClick={() => handleEdit(contact)}
                    >
                      {contact.business_name}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === contact.id ? (
                    <Input
                      value={editData.email || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, email: e.target.value })
                      }
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:text-primary"
                      onClick={() => handleEdit(contact)}
                    >
                      {contact.email || "-"}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === contact.id ? (
                    <Input
                      value={editData.mobile_number || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, mobile_number: e.target.value })
                      }
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:text-primary"
                      onClick={() => handleEdit(contact)}
                    >
                      {contact.mobile_number || "-"}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === contact.id ? (
                    <Select
                      value={editData.status}
                      onValueChange={(value) =>
                        setEditData({ ...editData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Already Called">Already Called</SelectItem>
                        <SelectItem value="Busy">Busy</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        statusColors[contact.status] || ""
                      }`}
                    >
                      {contact.status}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === contact.id ? (
                    <Textarea
                      value={editData.notes || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, notes: e.target.value })
                      }
                      className="min-h-[60px]"
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:text-primary text-sm"
                      onClick={() => handleEdit(contact)}
                    >
                      {contact.notes || "-"}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === contact.id ? (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={handleSave}>
                        <Save className="w-4 h-4 text-green-500" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(null);
                          setEditData({});
                        }}
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(contact.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {contacts.length === 0 && !isAdding && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No contacts yet. Click "Add Contact" to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ContactsTable;
