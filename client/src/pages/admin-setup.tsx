import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

const roles = [
  { value: 'owner', label: 'Owner' },
  { value: 'manager', label: 'Manager' },
  { value: 'house_mom', label: 'House Mom/Dad' },
  { value: 'dancer', label: 'Dancer' },
  { value: 'dj', label: 'DJ' },
  { value: 'bartender', label: 'Bartender' },
  { value: 'server', label: 'Server' },
  { value: 'barback', label: 'Barback' },
];

export default function AdminSetup() {
  const [selectedRole, setSelectedRole] = useState<string>('owner');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateRoleMutation = useMutation({
    mutationFn: async ({ role }: { role: string }) => {
      const response = await fetch('/api/admin/update-role', {
        method: 'POST',
        body: JSON.stringify({ role }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your role has been updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    },
  });

  const handleUpdateRole = () => {
    updateRoleMutation.mutate({ role: selectedRole });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Setup</CardTitle>
          <CardDescription>
            Set your role to access the FantasyCompanions management system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <div className="text-sm text-gray-600">
              <p>Welcome, {(user as any)?.firstName} {(user as any)?.lastName}!</p>
              <p>Current role: {(user as any)?.role || 'Not set'}</p>
            </div>
          ) : null}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Role</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Choose your role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleUpdateRole} 
            disabled={updateRoleMutation.isPending}
            className="w-full"
          >
            {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
          </Button>

          <div className="text-xs text-gray-500 mt-4">
            <p>Tip: Select "Owner" for full admin access to test all features.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}