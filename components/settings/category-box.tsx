import { useState, useRef, useEffect } from "react";
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

function stripHtmlTags(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export function CategoryBox({ title, items, onAddNew, children }: CategoryBoxProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const [expandedPosition, setExpandedPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (isExpanded && boxRef.current) {
      const box = boxRef.current;
      const grid = box.parentElement;
      if (grid) {
        const boxRect = box.getBoundingClientRect();
        const gridRect = grid.getBoundingClientRect();
        setExpandedPosition({
          top: boxRect.top - gridRect.top,
          left: gridRect.left - boxRect.left,
          width: gridRect.width,
        });
      }
    }
  }, [isExpanded]);

  return (
    <div 
      ref={boxRef}
      className={cn(
        "border rounded-lg bg-white transition-all duration-300",
        isExpanded ? "absolute z-10 shadow-xl" : "relative"
      )}
      style={isExpanded ? {
        top: expandedPosition.top,
        left: expandedPosition.left,
        width: expandedPosition.width,
      } : undefined}
    >
      <div 
        className="p-4 flex items-center cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 flex-1">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddNew();
              }}
              className="gap-1 h-7 px-2"
            >
              <Plus size={14} />
              Add New
            </Button>
          </div>
          <span className="text-sm text-gray-500 ml-auto">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      {!isExpanded && items.length > 0 && (
        <div className="px-4 pb-4">
          <div className="text-sm text-gray-600 line-clamp-2">
            {items.slice(0, 3).map(item => (
              `${item.title}${item.description ? ': ' + stripHtmlTags(item.description) : ''}`
            )).join(', ')}
            {items.length > 3 && ` and ${items.length - 3} more`}
          </div>
        </div>
      )}

      <div
        className={cn(
          "transition-all duration-200 ease-in-out",
          isExpanded ? "opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        )}
      >
        <div className="p-4 border-t bg-gray-50">
          {children}
        </div>
      </div>
    </div>
  );
} 