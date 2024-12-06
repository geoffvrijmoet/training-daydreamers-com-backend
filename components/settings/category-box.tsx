import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface DescribedItem {
  title: string;
  description: string;
}

interface CategoryBoxProps {
  title: string;
  items: DescribedItem[];
  onAddNew: () => void;
  children?: React.ReactNode;
}

export function CategoryBox({ title, items, onAddNew, children }: CategoryBoxProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          <h3 className="font-semibold text-lg">{title}</h3>
          <span className="text-sm text-gray-500">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onAddNew();
          }}
          className="gap-1"
        >
          <Plus size={16} />
          Add New
        </Button>
      </div>

      <div
        className={cn(
          "transition-all duration-200 ease-in-out",
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        )}
      >
        <div className="p-4 border-t bg-gray-50">
          {children}
        </div>
      </div>
    </div>
  );
} 