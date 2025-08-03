import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Eye, EyeOff, X } from 'lucide-react';
import { DashboardWidget } from '@shared/schema';

interface WidgetWrapperProps {
  widget: DashboardWidget;
  children: React.ReactNode;
  onToggleVisibility: (widgetId: string) => void;
  onRemove: (widgetId: string) => void;
  isCustomizing: boolean;
}

export function WidgetWrapper({ 
  widget, 
  children, 
  onToggleVisibility, 
  onRemove, 
  isCustomizing 
}: WidgetWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!widget.isVisible && !isCustomizing) {
    return null;
  }

  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-1 md:col-span-2',
    large: 'col-span-1 md:col-span-2 lg:col-span-3'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${sizeClasses[widget.size as keyof typeof sizeClasses]} ${
        isDragging ? 'opacity-50' : ''
      } ${!widget.isVisible ? 'opacity-50' : ''}`}
    >
      <Card className={`relative h-full ${isCustomizing ? 'border-2 border-dashed border-gray-300' : ''}`}>
        {isCustomizing && (
          <div className="absolute top-2 right-2 z-10 flex space-x-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => onToggleVisibility(widget.id)}
            >
              {widget.isVisible ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => onRemove(widget.id)}
            >
              <X className="h-3 w-3" />
            </Button>
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
            >
              <GripVertical className="h-3 w-3" />
            </div>
          </div>
        )}
        {children}
      </Card>
    </div>
  );
}