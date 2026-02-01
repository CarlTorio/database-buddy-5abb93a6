import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User, Building2, Phone, Mail, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

interface SalesPipelineProps {
  categoryId: string;
}

const SALES_PHASES = [
  { id: "Lead", name: "Phase 1: Lead Stage", color: "border-l-slate-500" },
  { id: "Approached", name: "Phase 2: Presentation", color: "border-l-blue-500" },
  { id: "Demo Stage", name: "Phase 3: Conversion", color: "border-l-green-500" },
];

const SalesPipeline = ({ categoryId }: SalesPipelineProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedContact, setDraggedContact] = useState<Contact | null>(null);

  useEffect(() => {
    fetchContacts();
  }, [categoryId]);

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

  const handleAddContact = async (salesStage: string) => {
    const currentUser = localStorage.getItem("currentUserName") || null;
    
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        category_id: categoryId,
        business_name: "New Contact",
        assigned_to: currentUser,
        sales_stage: salesStage,
        attempts: 1,
      })
      .select()
      .single();

    if (!error && data) {
      setContacts([...contacts, data as Contact]);
      toast.success("Contact added");
    } else {
      toast.error("Failed to add contact");
    }
  };

  const handleDragStart = (e: React.DragEvent, contact: Contact) => {
    setDraggedContact(contact);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    
    if (!draggedContact || draggedContact.sales_stage === targetStage) {
      setDraggedContact(null);
      return;
    }

    const { error } = await supabase
      .from("contacts")
      .update({ sales_stage: targetStage, updated_at: new Date().toISOString() })
      .eq("id", draggedContact.id);

    if (!error) {
      setContacts(
        contacts.map((c) =>
          c.id === draggedContact.id ? { ...c, sales_stage: targetStage } : c
        )
      );
      toast.success(`Moved to ${SALES_PHASES.find(p => p.id === targetStage)?.name || targetStage}`);
    } else {
      toast.error("Failed to move contact");
    }
    
    setDraggedContact(null);
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

  const getContactsByStage = (stageId: string) => {
    return contacts.filter((c) => c.sales_stage === stageId);
  };

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Loading pipeline...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {SALES_PHASES.map((phase) => (
        <div
          key={phase.id}
          className="flex flex-col"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, phase.id)}
        >
          <Card className={cn("flex-1 min-h-[500px] border-l-4", phase.color)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  {phase.name}
                </CardTitle>
                <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {getContactsByStage(phase.id).length}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={() => handleAddContact(phase.id)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>

              <div className="space-y-2">
                {getContactsByStage(phase.id).map((contact) => (
                  <Card
                    key={contact.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, contact)}
                    className={cn(
                      "cursor-grab active:cursor-grabbing hover:border-primary/50 transition-all group",
                      draggedContact?.id === contact.id && "opacity-50"
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium text-sm truncate">
                              {contact.business_name || "Untitled"}
                            </span>
                          </div>
                          
                          {contact.contact_name && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <User className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{contact.contact_name}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            {contact.mobile_number && (
                              <a
                                href={`tel:${contact.mobile_number}`}
                                className="text-muted-foreground hover:text-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {contact.email && (
                              <a
                                href={`mailto:${contact.email}`}
                                className="text-muted-foreground hover:text-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {contact.link && (
                              <a
                                href={contact.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>

                          {contact.assigned_to && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              Assigned: {contact.assigned_to}
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(contact.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};

export default SalesPipeline;
