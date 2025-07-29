import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DroppableProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function Droppable({ id, children, className, disabled }: DroppableProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-colors",
        isOver && "bg-blue-50 border-blue-200",
        className
      )}
    >
      {children}
    </div>
  );
}