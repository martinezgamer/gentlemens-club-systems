import React from 'react';
import { useLocation } from 'wouter';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus, Megaphone, BarChart3 } from 'lucide-react';

export function QuickActionsWidget() {
  const [, setLocation] = useLocation();

  return (
    <div>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="flex flex-col items-center p-4 h-auto space-y-2 border-dashed hover:border-primary hover:bg-primary/5"
            onClick={() => setLocation('/tasks')}
          >
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Plus className="text-primary text-lg" />
            </div>
            <span className="text-xs font-medium text-gray-700">Create Task</span>
          </Button>

          <Button 
            variant="outline" 
            className="flex flex-col items-center p-4 h-auto space-y-2 border-dashed hover:border-success hover:bg-success/5"
            onClick={() => setLocation('/staff')}
          >
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <UserPlus className="text-success text-lg" />
            </div>
            <span className="text-xs font-medium text-gray-700">Invite Staff</span>
          </Button>

          <Button 
            variant="outline" 
            className="flex flex-col items-center p-4 h-auto space-y-2 border-dashed hover:border-warning hover:bg-warning/5"
            onClick={() => setLocation('/messages')}
          >
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <Megaphone className="text-warning text-lg" />
            </div>
            <span className="text-xs font-medium text-gray-700">Announcement</span>
          </Button>

          <Button 
            variant="outline" 
            className="flex flex-col items-center p-4 h-auto space-y-2 border-dashed hover:border-blue-500 hover:bg-blue-50"
            onClick={() => setLocation('/admin')}
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-blue-600 text-lg" />
            </div>
            <span className="text-xs font-medium text-gray-700">View Reports</span>
          </Button>
        </div>
      </CardContent>
    </div>
  );
}