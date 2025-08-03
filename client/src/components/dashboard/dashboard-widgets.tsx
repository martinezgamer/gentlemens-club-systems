import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DashboardWidget } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { WidgetWrapper } from './widget-wrapper';
import { MetricsWidget } from './widgets/metrics-widget';
import { StaffWorkingWidget } from './widgets/staff-working-widget';
import { DancersWidget } from './widgets/dancers-widget';
import { QuickActionsWidget } from './widgets/quick-actions-widget';
import { RecentTasksWidget } from './widgets/recent-tasks-widget';
import { MusicRequestsWidget } from './widgets/music-requests-widget';
import { NotificationsWidget } from './widgets/notifications-widget';
import { Button } from '@/components/ui/button';
import { Settings, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DashboardWidgetsProps {
  className?: string;
}

export function DashboardWidgets({ className }: DashboardWidgetsProps) {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: widgets = [], isLoading } = useQuery<DashboardWidget[]>({
    queryKey: ['/api/dashboard/widgets'],
  });

  const updateWidgetsMutation = useMutation({
    mutationFn: async (widgets: DashboardWidget[]) => {
      const res = await apiRequest('PUT', '/api/dashboard/widgets', { widgets });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/widgets'] });
      toast({
        title: "Dashboard updated",
        description: "Your widget layout has been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to save widget layout.",
        variant: "destructive",
      });
    },
  });

  const resetWidgetsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/dashboard/widgets/reset');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/widgets'] });
      toast({
        title: "Dashboard reset",
        description: "Your dashboard has been reset to default layout.",
      });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = widgets.findIndex((widget) => widget.id === active.id);
      const newIndex = widgets.findIndex((widget) => widget.id === over?.id);

      const newWidgets = arrayMove(widgets, oldIndex, newIndex);
      updateWidgetsMutation.mutate(newWidgets);
    }
  };

  const handleToggleVisibility = (widgetId: string) => {
    const updatedWidgets = widgets.map(widget =>
      widget.id === widgetId ? { ...widget, isVisible: !widget.isVisible } : widget
    );
    updateWidgetsMutation.mutate(updatedWidgets);
  };

  const handleRemoveWidget = (widgetId: string) => {
    const updatedWidgets = widgets.filter(widget => widget.id !== widgetId);
    updateWidgetsMutation.mutate(updatedWidgets);
  };

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.widgetType) {
      case 'metrics_overview':
        return <MetricsWidget />;
      case 'staff_working':
        return <StaffWorkingWidget />;
      case 'dancers_fantasy':
        return <DancersWidget clubLocation="fantasy_gentlemens_club" />;
      case 'dancers_wiggles':
        return <DancersWidget clubLocation="wiggles_gentlemens_club" />;
      case 'quick_actions':
        return <QuickActionsWidget />;
      case 'recent_tasks':
        return <RecentTasksWidget />;
      case 'music_requests':
        return <MusicRequestsWidget />;
      case 'notifications':
        return <NotificationsWidget />;
      default:
        return <div className="p-4">Unknown widget type</div>;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading dashboard...</div>;
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => resetWidgetsMutation.mutate()}
            disabled={resetWidgetsMutation.isPending}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Layout
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCustomizing(!isCustomizing)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {isCustomizing ? 'Done' : 'Customize'}
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={widgets.map(w => w.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {widgets.map((widget) => (
              <WidgetWrapper
                key={widget.id}
                widget={widget}
                onToggleVisibility={handleToggleVisibility}
                onRemove={handleRemoveWidget}
                isCustomizing={isCustomizing}
              >
                {renderWidget(widget)}
              </WidgetWrapper>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {isCustomizing && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Customization Mode:</strong> Drag widgets to reorder, click the eye icon to show/hide,
            or click the X to remove widgets. Changes are saved automatically.
          </p>
        </div>
      )}
    </div>
  );
}