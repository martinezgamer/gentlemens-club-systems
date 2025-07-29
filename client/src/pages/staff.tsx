import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/header";

export default function Staff() {
  return (
    <>
      <Header title="Staff Management" />
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Staff Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Staff management interface will be implemented here. This will include:
            </p>
            <ul className="mt-4 space-y-2 text-gray-600">
              <li>• View all staff members</li>
              <li>• Invite new employees</li>
              <li>• Edit staff details and roles</li>
              <li>• Manage active/inactive status</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
