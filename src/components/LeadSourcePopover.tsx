import { Eye } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { leadSourceColors } from "@/lib/salesStageConfig";

interface LeadSourcePopoverProps {
  leadSource: string | null;
}

const LeadSourcePopover = ({ leadSource }: LeadSourcePopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="p-1 rounded hover:bg-muted/50 transition-colors"
          title="View Lead Source"
        >
          <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" side="left">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Lead Source</p>
          {leadSource ? (
            <span
              className={`${
                leadSourceColors[leadSource] || "bg-gray-100 text-gray-700"
              } px-2 py-1 rounded text-sm font-medium inline-block`}
            >
              {leadSource}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Not set</span>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default LeadSourcePopover;
