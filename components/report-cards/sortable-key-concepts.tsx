"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { GripVertical } from "lucide-react";

interface SortableItemProps {
  id: string;
  title: string;
  isSelected: boolean;
  onEdit: () => void;
  onRemove: () => void;
}

function SortableItem({ id, title, isSelected, onEdit, onRemove }: SortableItemProps) {
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
      {...attributes}
    >
      <button
        {...listeners}
        className="cursor-grab p-1 hover:bg-gray-100 rounded"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </button>
      <Button
        type="button"
        variant={isSelected ? "default" : "outline"}
        onClick={onEdit}
      >
        {title}
      </Button>
      <button
        type="button"
        onClick={onRemove}
        className="text-red-500 hover:text-red-700"
      >
        ×
      </button>
    </div>
  );
}

export { SortableItem }; 