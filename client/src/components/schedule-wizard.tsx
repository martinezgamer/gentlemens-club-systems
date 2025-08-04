import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droppable } from "@/components/ui/droppable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Users, Wand2, Plus, Save, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format, addDays, startOfWeek } from "date-fns";
import type { Schedule, User } from "@shared/types";

interface ScheduleSlot {
  id: string;
  date: Date;
  time: string;
  shiftType: 'day' | 'night' | 'double' | 'split';
  assignedStaff?: {
    id: string;
    name: string;
    role: string;
  };
  isRequired: boolean;
}

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  availability?: string[];
  maxShiftsPerWeek?: number;
  currentShifts?: number;
}

const SHIFT_TYPES = [
  { value: "day", label: "Day Shift", color: "bg-blue-100 text-blue-800" },
  { value: "night", label: "Night Shift", color: "bg-purple-100 text-purple-800" },
  { value: "double", label: "Double Shift", color: "bg-yellow-100 text-yellow-800" },
  { value: "split", label: "Split Shift", color: "bg-green-100 text-green-800" }
];

const SHIFT_TIMES = {
  day: "9:00 AM - 5:00 PM",
  night: "6:00 PM - 2:00 AM",
  double: "9:00 AM - 2:00 AM",
  split: "12:00 PM - 4:00 PM & 8:00 PM - 12:00 AM"
};

function DraggableStaffCard({ staff, isOverlay = false }: { staff: StaffMember; isOverlay?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: staff.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 bg-white border border-gray-200 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isOverlay ? 'rotate-3 shadow-lg' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-sm text-gray-900">
            {staff.firstName} {staff.lastName}
          </p>
          <p className="text-xs text-gray-500 capitalize">
            {staff.role?.replace('_', ' ')}
          </p>
        </div>
        <div className="text-right">
          <Badge 
            variant="secondary" 
            className="text-xs"
          >
            {staff.currentShifts || 0}/{staff.maxShiftsPerWeek || 5}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function ScheduleSlotCard({ 
  slot, 
  onAssignStaff, 
  onRemoveStaff 
}: { 
  slot: ScheduleSlot; 
  onAssignStaff: (slotId: string, staffId: string) => void;
  onRemoveStaff: (slotId: string) => void;
}) {
  const shiftType = SHIFT_TYPES.find(s => s.value === slot.shiftType);

  return (
    <Droppable id={slot.id}>
      <Card className="h-24 flex flex-col justify-between">
        <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-xs font-medium text-gray-700">
              {format(slot.date, 'MMM d')}
            </span>
          </div>
          <Badge className={`text-xs ${shiftType?.color}`}>
            {shiftType?.label}
          </Badge>
        </div>
        
        {slot.assignedStaff ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-900">
                {slot.assignedStaff.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {slot.assignedStaff.role.replace('_', ' ')}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemoveStaff(slot.id)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-8 border-2 border-dashed border-gray-300 rounded text-xs text-gray-500">
            Drop staff here
          </div>
        )}
        </CardContent>
      </Card>
    </Droppable>
  );
}

export default function ScheduleWizard({
  isOpen,
  onClose,
  onSave
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedules: Schedule[]) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date()));
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([]);
  const [newSlot, setNewSlot] = useState({
    date: new Date(),
    shiftType: 'day' as const,
    isRequired: true
  });

  // Fetch all users
  const { data: allUsers } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  // Initialize staff and slots
  useEffect(() => {
    if (Array.isArray(allUsers)) {
      const staff = allUsers
        .filter((user: User) => user.role !== 'owner' && user.role !== 'manager')
        .map((user: User) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role || '',
          maxShiftsPerWeek: 5,
          currentShifts: 0
        }));
      setAvailableStaff(staff);
    }
  }, [allUsers]);

  // Generate week slots
  const generateWeekSlots = () => {
    const slots: ScheduleSlot[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(selectedWeek, i);
      
      // Add day shift
      slots.push({
        id: `${format(date, 'yyyy-MM-dd')}-day`,
        date,
        time: SHIFT_TIMES.day,
        shiftType: 'day',
        isRequired: true
      });
      
      // Add night shift
      slots.push({
        id: `${format(date, 'yyyy-MM-dd')}-night`,
        date,
        time: SHIFT_TIMES.night,
        shiftType: 'night',
        isRequired: true
      });
    }
    setScheduleSlots(slots);
  };

  useEffect(() => {
    generateWeekSlots();
  }, [selectedWeek]);

  // Add custom slot
  const addCustomSlot = () => {
    const newSlotData: ScheduleSlot = {
      id: `${format(newSlot.date, 'yyyy-MM-dd')}-${newSlot.shiftType}-${Date.now()}`,
      date: newSlot.date,
      time: SHIFT_TIMES[newSlot.shiftType],
      shiftType: newSlot.shiftType,
      isRequired: newSlot.isRequired
    };
    
    setScheduleSlots(prev => [...prev, newSlotData].sort((a, b) => 
      a.date.getTime() - b.date.getTime() || a.shiftType.localeCompare(b.shiftType)
    ));
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const staffId = active.id as string;
    const slotId = over.id as string;

    // Check if dropping on a schedule slot
    if (slotId.includes('-day') || slotId.includes('-night') || slotId.includes('-double') || slotId.includes('-split')) {
      assignStaffToSlot(slotId, staffId);
    }
  };

  // Assign staff to slot
  const assignStaffToSlot = (slotId: string, staffId: string) => {
    const staff = availableStaff.find(s => s.id === staffId);
    if (!staff) return;

    setScheduleSlots(prev => prev.map(slot => {
      if (slot.id === slotId) {
        return {
          ...slot,
          assignedStaff: {
            id: staff.id,
            name: `${staff.firstName} ${staff.lastName}`,
            role: staff.role
          }
        };
      }
      return slot;
    }));

    // Update staff current shifts
    setAvailableStaff(prev => prev.map(s => 
      s.id === staffId 
        ? { ...s, currentShifts: (s.currentShifts || 0) + 1 }
        : s
    ));
  };

  // Remove staff from slot
  const removeStaffFromSlot = (slotId: string) => {
    const slot = scheduleSlots.find(s => s.id === slotId);
    if (!slot?.assignedStaff) return;

    setScheduleSlots(prev => prev.map(s => 
      s.id === slotId 
        ? { ...s, assignedStaff: undefined }
        : s
    ));

    // Update staff current shifts
    setAvailableStaff(prev => prev.map(s => 
      s.id === slot.assignedStaff?.id 
        ? { ...s, currentShifts: Math.max(0, (s.currentShifts || 0) - 1) }
        : s
    ));
  };

  // Auto-assign staff
  const autoAssignStaff = () => {
    const unassignedSlots = scheduleSlots.filter(slot => !slot.assignedStaff);
    const staffWithCapacity = availableStaff.filter(staff => 
      (staff.currentShifts || 0) < (staff.maxShiftsPerWeek || 5)
    );

    unassignedSlots.forEach(slot => {
      const availableStaffForSlot = staffWithCapacity.filter(staff => 
        (staff.currentShifts || 0) < (staff.maxShiftsPerWeek || 5)
      );

      if (availableStaffForSlot.length > 0) {
        // Simple assignment - prefer staff with fewer current shifts
        const selectedStaff = availableStaffForSlot.sort((a, b) => 
          (a.currentShifts || 0) - (b.currentShifts || 0)
        )[0];

        assignStaffToSlot(slot.id, selectedStaff.id);
      }
    });

    toast({
      title: "Auto-assignment Complete",
      description: "Staff has been automatically assigned to available slots",
    });
  };

  // Save schedule
  const saveSchedule = () => {
    const schedulesToSave = scheduleSlots
      .filter(slot => slot.assignedStaff)
      .map(slot => ({
        userId: slot.assignedStaff!.id,
        date: slot.date,
        shiftType: slot.shiftType,
        startTime: slot.date, // This would need proper time parsing
        endTime: addDays(slot.date, 1), // This would need proper time parsing
        notes: `Scheduled via wizard for ${format(slot.date, 'MMM d, yyyy')}`
      }));

    onSave(schedulesToSave);
    onClose();
  };

  const activeStaff = activeId ? availableStaff.find(s => s.id === activeId) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Interactive Schedule Wizard
          </DialogTitle>
        </DialogHeader>

        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToParentElement]}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Staff Pool */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Available Staff</h3>
                <Badge variant="secondary">
                  {availableStaff.length} staff
                </Badge>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                <SortableContext 
                  items={availableStaff.map(s => s.id)} 
                  strategy={verticalListSortingStrategy}
                >
                  {availableStaff.map((staff) => (
                    <DraggableStaffCard key={staff.id} staff={staff} />
                  ))}
                </SortableContext>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={autoAssignStaff}
                  className="w-full flex items-center gap-2"
                  variant="outline"
                >
                  <Wand2 className="w-4 h-4" />
                  Auto-Assign Staff
                </Button>
              </div>
            </div>

            {/* Schedule Grid */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Week of {format(selectedWeek, 'MMM d, yyyy')}
                </h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
                  >
                    Previous Week
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
                  >
                    Next Week
                  </Button>
                </div>
              </div>

              {/* Schedule Slots Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {scheduleSlots.map((slot) => (
                  <div key={slot.id} id={slot.id}>
                    <ScheduleSlotCard
                      slot={slot}
                      onAssignStaff={assignStaffToSlot}
                      onRemoveStaff={removeStaffFromSlot}
                    />
                  </div>
                ))}
              </div>

              {/* Add Custom Slot */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Add Custom Slot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="slot-date">Date</Label>
                      <Input
                        id="slot-date"
                        type="date"
                        value={format(newSlot.date, 'yyyy-MM-dd')}
                        onChange={(e) => setNewSlot(prev => ({
                          ...prev,
                          date: new Date(e.target.value)
                        }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="slot-type">Shift Type</Label>
                      <Select
                        value={newSlot.shiftType}
                        onValueChange={(value: string) => setNewSlot(prev => ({
                          ...prev,
                          shiftType: value
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SHIFT_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button
                    onClick={addCustomSlot}
                    className="w-full flex items-center gap-2"
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Slot
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeStaff ? (
              <DraggableStaffCard staff={activeStaff} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Actions */}
        <div className="flex justify-between pt-6 border-t">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {scheduleSlots.filter(s => s.assignedStaff).length} / {scheduleSlots.length} slots filled
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {availableStaff.filter(s => (s.currentShifts || 0) > 0).length} staff assigned
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={saveSchedule}
              disabled={!scheduleSlots.some(s => s.assignedStaff)}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Schedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}