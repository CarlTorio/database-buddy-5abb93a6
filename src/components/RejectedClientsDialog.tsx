import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { XCircle, Phone, Mail, ExternalLink, User, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RejectedClient {
  id: string;
  business_name: string;
  contact_name: string | null;
  mobile_number: string | null;
  email: string | null;
  link: string | null;
  demo_link: string | null;
  lead_source: string | null;
  assigned_to: string | null;
  current_phase: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface RejectedClientsDialogProps {
  categoryId: string;
}

const RejectedClientsDialog = ({ categoryId }: RejectedClientsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<RejectedClient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRejectedClients();
  }, [categoryId]);

  useEffect(() => {
    if (open) {
      fetchRejectedClients();
    }
  }, [open]);

  const fetchRejectedClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("category_id", categoryId)
      .eq("sales_stage", "Rejected")
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setClients(data);
    }
    setLoading(false);
  };

  const getPhaseLabel = (phase: number) => {
    switch (phase) {
      case 1:
        return "Lead Stage";
      case 2:
        return "Presentation";
      default:
        return `Phase ${phase}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <XCircle className="w-4 h-4 text-destructive" />
          Rejected ({clients.length || 0})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-destructive" />
            Rejected Contacts
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading rejected contacts...
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No rejected contacts yet. Contacts marked as "Rejected" in Phase 1 or Phase 2 will appear here.
            </div>
          ) : (
            <div className="space-y-4">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="border border-border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors"
                >
                  {/* Header with Business Name */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-destructive" />
                      <h3 className="font-semibold text-lg">
                        {client.business_name || "Unnamed Business"}
                      </h3>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded">
                        {getPhaseLabel(client.current_phase)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(client.updated_at), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>

                  {/* Client Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {/* Contact Name */}
                    {client.contact_name && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{client.contact_name}</span>
                      </div>
                    )}

                    {/* Assigned To */}
                    {client.assigned_to && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Assigned:</span>
                        <span>{client.assigned_to}</span>
                      </div>
                    )}

                    {/* Mobile Number */}
                    {client.mobile_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a
                          href={`tel:${client.mobile_number}`}
                          className="text-primary hover:underline"
                        >
                          {client.mobile_number}
                        </a>
                      </div>
                    )}

                    {/* Email */}
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <a
                          href={`mailto:${client.email}`}
                          className="text-primary hover:underline truncate max-w-[200px]"
                        >
                          {client.email}
                        </a>
                      </div>
                    )}

                    {/* Lead Source */}
                    {client.lead_source && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Source:</span>
                        <span className="px-2 py-0.5 bg-secondary rounded text-xs">
                          {client.lead_source}
                        </span>
                      </div>
                    )}

                    {/* Notes */}
                    {client.notes && (
                      <div className="col-span-2 flex items-start gap-2">
                        <span className="text-muted-foreground">Notes:</span>
                        <span className="text-sm">{client.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Links Section */}
                  {(client.link || client.demo_link) && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
                      {client.link && (
                        <a
                          href={client.link.startsWith("http") ? client.link : `https://${client.link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-secondary hover:bg-secondary/80 rounded"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Website
                        </a>
                      )}
                      {client.demo_link && (
                        <a
                          href={client.demo_link.startsWith("http") ? client.demo_link : `https://${client.demo_link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-secondary hover:bg-secondary/80 rounded"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Demo
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default RejectedClientsDialog;
