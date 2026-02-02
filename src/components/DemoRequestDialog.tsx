import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface DemoRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (instructions: string, assignedDeveloper: string) => void;
  businessName: string;
  currentInstructions?: string;
  currentAssigned?: string;
}

const DEVELOPERS = ["DEVTORIO", "DEVRONA"];

const DemoRequestDialog = ({
  isOpen,
  onClose,
  onSave,
  businessName,
  currentInstructions = "",
  currentAssigned = "",
}: DemoRequestDialogProps) => {
  const [instructions, setInstructions] = useState(currentInstructions);
  const [selectedDeveloper, setSelectedDeveloper] = useState(currentAssigned || DEVELOPERS[0]);

  const handleSave = () => {
    onSave(instructions, selectedDeveloper);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Demo Request for {businessName}</DialogTitle>
          <DialogDescription>
            Provide instructions for the developer to create the demo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="instructions">Instructions for Developer</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter specific requirements for this demo...
- Preferred colors
- Services to highlight
- Special features needed
- Timeline expectations"
              className="min-h-[150px] resize-y"
            />
          </div>

          <div className="grid gap-2">
            <Label>Assign Developer</Label>
            <RadioGroup
              value={selectedDeveloper}
              onValueChange={setSelectedDeveloper}
              className="flex flex-col gap-2"
            >
              {DEVELOPERS.map((dev) => (
                <div key={dev} className="flex items-center space-x-2">
                  <RadioGroupItem value={dev} id={dev} />
                  <Label htmlFor={dev} className="cursor-pointer font-normal">
                    {dev}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DemoRequestDialog;
