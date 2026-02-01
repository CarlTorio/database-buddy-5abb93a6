import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Phase {
  id: string;
  title: string;
  contacts: { id: string; name: string; email?: string }[];
}

const phases: Phase[] = [
  { id: "leads", title: "Phase 1: Leads Stage", contacts: [] },
  { id: "presentation", title: "Phase 2: Presentation", contacts: [] },
  { id: "conversion", title: "Phase 3: Conversion", contacts: [] },
];

const SalesPipeline = () => {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-foreground mb-6">Sales Pipeline</h2>
      <div className="flex flex-col gap-4">
        {phases.map((phase) => (
          <Card key={phase.id} className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">{phase.title}</CardTitle>
            </CardHeader>
            <CardContent className="min-h-[100px]">
              {phase.contacts.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No contacts in this phase yet
                </p>
              ) : (
                <div className="space-y-2">
                  {phase.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-2 bg-muted rounded-md text-sm"
                    >
                      {contact.name}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SalesPipeline;
