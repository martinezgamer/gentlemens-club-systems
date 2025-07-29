import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/header";

export default function Tasks() {
  return (
    <>
      <Header title="Task Management" />
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Task Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Task management system will be implemented here. This will include:
            </p>
            <ul className="mt-4 space-y-2 text-gray-600">
              <li>• Create and assign tasks to staff</li>
              <li>• Track task progress and completion</li>
              <li>• Set priorities and due dates</li>
              <li>• Task filtering and search</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
