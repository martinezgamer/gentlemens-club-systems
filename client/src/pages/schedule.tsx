import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/header";

export default function Schedule() {
  return (
    <>
      <Header title="Schedule Management" />
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Schedule Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Schedule management functionality will be implemented here. This will include:
            </p>
            <ul className="mt-4 space-y-2 text-gray-600">
              <li>• View and manage staff schedules</li>
              <li>• Assign shifts to employees</li>
              <li>• Handle schedule requests and changes</li>
              <li>• Calendar view of all shifts</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
