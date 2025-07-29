import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain } from "lucide-react";
import Header from "@/components/header";
import { AIInsightsDashboard } from "@/components/ai-insights-dashboard";
import { AIChatAssistant } from "@/components/ai-chat-assistant";
import { AILiveMetrics } from "@/components/ai-live-metrics";
import { AISmartNotifications } from "@/components/ai-smart-notifications";

export default function Admin() {
  return (
    <>
      <Header title="Admin Settings" />
      <div className="max-w-7xl mx-auto space-y-6">
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

        {/* AI Features Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Features & Analytics
            </CardTitle>
            <CardDescription>
              Advanced AI-powered insights and real-time analytics for your club
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
              <div className="xl:col-span-1">
                <AIInsightsDashboard />
              </div>
              <div className="xl:col-span-1">
                <AILiveMetrics />
              </div>
              <div className="xl:col-span-1">
                <AIChatAssistant className="h-[400px]" />
              </div>
            </div>

            {/* AI Smart Alerts */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI Smart Alerts
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                  Live
                </Badge>
              </h3>
              <AISmartNotifications />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
