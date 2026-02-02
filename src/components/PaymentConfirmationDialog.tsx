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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PaymentConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number) => void;
  businessName: string;
}

const PaymentConfirmationDialog = ({
  isOpen,
  onClose,
  onSave,
  businessName,
}: PaymentConfirmationDialogProps) => {
  const [amount, setAmount] = useState("");

  const handleSave = () => {
    const numAmount = parseFloat(amount.replace(/[^\d.]/g, ""));
    if (!isNaN(numAmount) && numAmount > 0) {
      onSave(numAmount);
      setAmount("");
      onClose();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Payment Confirmation ✅</DialogTitle>
          <DialogDescription>
            Confirm payment received from {businessName}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Payment Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ₱
              </span>
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-8"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentConfirmationDialog;
