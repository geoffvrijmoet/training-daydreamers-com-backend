"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { GripVertical } from "lucide-react";

interface SortableItemProps {
  id: string;
  title: string;
  isSelected: boolean;
  onClick: () => void;
}

function SortableItem({ id, title, isSelected, onClick }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab p-1 hover:bg-gray-100 rounded"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </button>
      <Button
        type="button"
        variant={isSelected ? "default" : "outline"}
        onClick={onClick}
      >
        {title}
      </Button>
    </div>
  );
}

export { SortableItem }; 