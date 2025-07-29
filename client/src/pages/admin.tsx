import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/header";

export default function Admin() {
  return (
    <>
      <Header title="Admin Panel" />
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Administrative Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Administrative control panel will be implemented here. This will include:
            </p>
            <ul className="mt-4 space-y-2 text-gray-600">
              <li>• Module permissions management</li>
              <li>• Role-based access control settings</li>
              <li>• System configuration</li>
              <li>• User management controls</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
