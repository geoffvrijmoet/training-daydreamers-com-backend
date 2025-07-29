import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Plus, Trash } from "lucide-react";
import { cn } from "@/lib/utils";

// Tailwind color variants: light background & darker text
export const COLOR_VARIANTS = [
  { bg: "bg-blue-100", text: "text-blue-700", hex: "#DBEAFE" },
  { bg: "bg-green-100", text: "text-green-700", hex: "#DCFCE7" },
  { bg: "bg-purple-100", text: "text-purple-700", hex: "#EDE9FE" },
  { bg: "bg-amber-100", text: "text-amber-700", hex: "#FEF3C7" },
  { bg: "bg-pink-100", text: "text-pink-700", hex: "#FCE7F3" },
  { bg: "bg-orange-100", text: "text-orange-700", hex: "#FFEDD5" },
  { bg: "bg-teal-100", text: "text-teal-700", hex: "#CCFBF1" },
  { bg: "bg-rose-100", text: "text-rose-700", hex: "#FFE4E6" },
];

interface DescribedItem {
  title: string;
  description: string;
}

interface CategoryBoxProps {
  id: string;
  title: string;
  items: DescribedItem[];
  onAddNew: () => void;
  onDelete?: () => void; // Optional delete handler
  colorIndex?: number; // Used to pick hue
  isExpanded: boolean;
  onToggle: () => void;
  dimmed: boolean;
  staggerIndex?: number;
  children?: React.ReactNode;
}

function stripHtmlTags(html: string): string {
  if (!html) return "";
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export function CategoryBox({ title, items, onAddNew, onDelete, colorIndex = 0, isExpanded, onToggle, dimmed, staggerIndex = 0, children }: CategoryBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [expandedPosition, setExpandedPosition] = useState({ top: 0, left: 0, width: 0 });
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    if (isExpanded && boxRef.current) {
      const box = boxRef.current;
      const parent = box.parentElement;
      if (parent) {
        const rect = box.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        setExpandedPosition({
          top: rect.top - parentRect.top,
          left: 0,
          width: parentRect.width,
        });
      }
    }
  }, [isExpanded]);

  // Detect overflow in preview when collapsed
  useEffect(() => {
    if (!isExpanded && previewRef.current) {
      const el = previewRef.current;
      setOverflowing(el.scrollWidth - el.clientWidth > 5);
    } else {
      setOverflowing(false);
    }
  }, [isExpanded, items]);

  const variant = COLOR_VARIANTS[colorIndex % COLOR_VARIANTS.length];

  return (
    <div 
      ref={boxRef}
      className={cn(
         "relative border rounded-lg transition-all duration-300 overflow-hidden", 
         variant.bg,
         dimmed ? "opacity-30" : "opacity-100",
         isExpanded ? "shadow-xl" : "",
         "fade-in-up"
      )}
      style={{ animationDelay: `${staggerIndex * 100}ms` }}
    >
      <div 
        className={cn("p-4 flex items-center cursor-pointer", variant.bg, variant.text, isExpanded ? "hover:opacity-90" : "hover:opacity-95")}
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          <div className="flex items-center gap-2">
            <h3 className={cn("font-semibold text-lg", variant.text)}>{title}</h3>
            {!isExpanded && (
              <span className="text-sm opacity-70">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
            )}
            
            {/* Delete button, shown only if onDelete is provided */}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
                className="h-7 w-7 p-0 text-red-600 hover:text-red-800"
              >
                <Trash size={14} />
              </Button>
            )}
          </div>

            {/* Preview container - collapsed only */}
            {!isExpanded && (
              <div
                ref={previewRef}
                className="ml-20 flex-1 min-w-0 gap-[20px] overflow-hidden relative hidden sm:flex"
                style={{
                }}
              >
                {items.slice(0, 20).map((item, idx) => (
                  <div
                    key={`${idx}-${item.title}`}
                    className="w-[200px] flex-shrink-0 bg-white/40 rounded-sm px-2 py-1"
                    style={{
                      WebkitMaskImage:
                        'linear-gradient(to bottom, black 0%, black calc(100% - 10px), transparent 100%)',
                      maskImage:
                        'linear-gradient(to bottom, black 0%, black calc(100% - 10px), transparent 100%)',
                    }}
                  >
                    <div className="w-full overflow-hidden">
                      <h4 className="text-[15px] font-bold leading-tight truncate">
                        {item.title}
                      </h4>
                      <p className="text-[13px] leading-tight break-words h-[50px] overflow-hidden">
                        {stripHtmlTags(item.description)}
                      </p>
                    </div>
                  </div>
                ))}
                </div>
            )}
          </div>
      </div>
 
      {/* Removed below-title item count per updated design */}

      <div
        className={cn(
          "transition-all duration-200 ease-in-out",
          isExpanded ? "opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        )}
      >
        <div className={cn("p-4 border-t", variant.bg, variant.text)}
              style={{maxHeight: isExpanded ? '1000px' : 0, transition: 'max-height 0.5s ease', overflow:'hidden'}}>
          {isExpanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddNew}
              className={cn("gap-1 h-7 px-2 mb-4", variant.text)}
            >
              <Plus size={14} />
              Add New
            </Button>
          )}
          {children}
        </div>
      </div>

      {/* Outer right fade overlay when collapsed */}
      {!isExpanded && overflowing && (
        <div
          className="pointer-events-none absolute top-0 right-0 h-full w-[150px] z-10 hidden sm:block"
          style={{
            background: `linear-gradient(to right, rgba(255,255,255,0) 0%, ${variant.hex} 100%)`,
          }}
        />
      )}
    </div>
  );
} 