import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/header";

export default function Messages() {
  return (
    <>
      <Header title="Messages" />
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Internal Messaging</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Internal messaging system will be implemented here. This will include:
            </p>
            <ul className="mt-4 space-y-2 text-gray-600">
              <li>• Send messages to individual staff members</li>
              <li>• Group messaging by role</li>
              <li>• Message status tracking</li>
              <li>• Announcements system</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
