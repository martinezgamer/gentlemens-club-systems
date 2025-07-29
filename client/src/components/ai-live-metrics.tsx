import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, TrendingUp, AlertTriangle, Target, Activity, Brain } from 'lucide-react';

interface LiveMetricsProps {
  className?: string;
}

interface LiveInsights {
  alerts?: string[];
  opportunities?: string[];
  recommendations?: string[];
  metrics?: { [key: string]: number };
}

export function AILiveMetrics({ className }: LiveMetricsProps) {
  const { data: liveInsights, isLoading } = useQuery<LiveInsights>({
    queryKey: ['/api/ai/live-insights'],
    refetchInterval: 30 * 1000, // Update every 30 seconds for live feel
  });

  const getMetricIcon = (key: string) => {
    if (key.includes('efficiency')) return <Zap className="h-4 w-4" />;
    if (key.includes('performance')) return <TrendingUp className="h-4 w-4" />;
    if (key.includes('health')) return <Activity className="h-4 w-4" />;
    if (key.includes('target')) return <Target className="h-4 w-4" />;
    return <Brain className="h-4 w-4" />;
  };

  const getMetricColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Live Alerts */}
      {liveInsights?.alerts && liveInsights.alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Live Alerts
              <Badge variant="destructive" className="text-xs">
                {liveInsights.alerts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {liveInsights.alerts.slice(0, 3).map((alert, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-orange-800">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p>{alert}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Opportunities */}
      {liveInsights?.opportunities && liveInsights.opportunities.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <TrendingUp className="h-5 w-5" />
              Opportunities
              <Badge variant="secondary" className="bg-green-200 text-green-800 text-xs">
                Live
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {liveInsights.opportunities.slice(0, 2).map((opportunity, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p>{opportunity}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Performance Metrics */}
      {liveInsights?.metrics && Object.keys(liveInsights.metrics).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Real-Time Metrics
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </CardTitle>
            <CardDescription>AI-powered performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(liveInsights.metrics).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getMetricIcon(key)}
                      <span className="text-sm font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </div>
                    <span className={`text-sm font-bold ${getMetricColor(value)}`}>
                      {Math.round(value)}%
                    </span>
                  </div>
                  <Progress 
                    value={value} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      {liveInsights?.recommendations && liveInsights.recommendations.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Brain className="h-5 w-5" />
              AI Recommendations
              <Badge variant="secondary" className="bg-purple-200 text-purple-800 text-xs">
                Smart
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {liveInsights.recommendations.slice(0, 3).map((recommendation, index) => (
                <div key={index} className="p-3 bg-white rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-2">
              <Brain className="h-5 w-5 text-purple-600 animate-pulse" />
              <span className="text-sm text-gray-500">AI analyzing live data...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}