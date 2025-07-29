import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/header";

export default function Music() {
  return (
    <>
      <Header title="Music Requests" />
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Music Request System</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Music request management will be implemented here. This will include:
            </p>
            <ul className="mt-4 space-y-2 text-gray-600">
              <li>• Submit music requests to DJs</li>
              <li>• View pending and approved requests</li>
              <li>• DJ request management interface</li>
              <li>• Playlist creation and sharing</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
