import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Phase {
  id: string;
  title: string;
  contacts: Contact[];
}

interface SalesPipelineProps {
  categoryId: string;
}

const SalesPipeline = ({ categoryId }: SalesPipelineProps) => {
  const [phases, setPhases] = useState<Phase[]>([
    { id: "leads", title: "Phase 1: Leads Stage", contacts: [] },
    { id: "presentation", title: "Phase 2: Presentation", contacts: [] },
    { id: "conversion", title: "Phase 3: Conversion", contacts: [] },
  ]);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");

  const handleAddContact = () => {
    if (!newContactName.trim()) return;
    
    const newContact: Contact = {
      id: Date.now().toString(),
      name: newContactName.trim(),
      email: newContactEmail.trim() || undefined,
      phone: newContactPhone.trim() || undefined,
    };
    
    setPhases(prev => prev.map(phase => 
      phase.id === "leads" 
        ? { ...phase, contacts: [...phase.contacts, newContact] }
        : phase
    ));
    
    setNewContactName("");
    setNewContactEmail("");
    setNewContactPhone("");
    setIsAdding(false);
  };

  const handleRemoveContact = (phaseId: string, contactId: string) => {
    setPhases(prev => prev.map(phase => 
      phase.id === phaseId 
        ? { ...phase, contacts: phase.contacts.filter(c => c.id !== contactId) }
        : phase
    ));
  };

  return (
    <div className="space-y-4">
      {phases.map((phase, index) => (
        <Card key={phase.id} className="border-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">{phase.title}</CardTitle>
            {index === 0 && (
              <Button 
                size="sm" 
                onClick={() => setIsAdding(true)}
                className="h-8"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Client
              </Button>
            )}
          </CardHeader>
          <CardContent className="min-h-[80px]">
            {/* Add new contact form - only in Phase 1 */}
            {index === 0 && isAdding && (
              <div className="mb-4 p-3 bg-muted rounded-lg space-y-2">
                <Input
                  placeholder="Client Name *"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  autoFocus
                />
                <Input
                  placeholder="Email (optional)"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                />
                <Input
                  placeholder="Phone (optional)"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddContact}>
                    Add
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setIsAdding(false);
                      setNewContactName("");
                      setNewContactEmail("");
                      setNewContactPhone("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            
            {phase.contacts.length === 0 && !isAdding ? (
              <p className="text-muted-foreground text-sm">
                No contacts in this phase yet
              </p>
            ) : (
              <div className="space-y-2">
                {phase.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-3 bg-muted rounded-md flex items-center justify-between group"
                  >
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      {contact.email && (
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                      )}
                      {contact.phone && (
                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveContact(phase.id, contact.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SalesPipeline;
