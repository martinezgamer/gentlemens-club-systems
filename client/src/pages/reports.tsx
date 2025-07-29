import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/header";

export default function Reports() {
  return (
    <>
      <Header title="Reports" />
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Reports & Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Reporting and analytics dashboard will be implemented here. This will include:
            </p>
            <ul className="mt-4 space-y-2 text-gray-600">
              <li>• Financial reports and summaries</li>
              <li>• Staff performance analytics</li>
              <li>• Activity logs and trends</li>
              <li>• Export capabilities</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
