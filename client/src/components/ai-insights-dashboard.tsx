import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Lightbulb, TrendingUp, AlertCircle, Brain, Music, Users, DollarSign } from 'lucide-react';

// AI Response Types
interface BusinessIntelligence {
  keyInsights?: string[];
  performanceMetrics?: { [key: string]: number };
  recommendations?: string[];
  alerts?: string[];
  trends?: string[];
}

interface FinancialAnalysis {
  insights?: string[];
  trends?: string[];
  recommendations?: string[];
  categorizations?: { [key: string]: string };
  forecastedRevenue?: number;
}

interface StaffPerformance {
  insights?: string[];
  topPerformers?: string[];
  improvementAreas?: { [staffId: string]: string[] };
  recommendations?: string[];
}

interface ScheduleInsights {
  optimizedSchedules?: any[];
  insights?: string[];
  conflicts?: string[];
  recommendations?: string[];
}

interface AIInsightsProps {
  className?: string;
}

export function AIInsightsDashboard({ className }: AIInsightsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Business Intelligence
  const { data: businessIntelligence, isLoading: biLoading } = useQuery<BusinessIntelligence>({
    queryKey: ['/api/ai/business-intelligence'],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Schedule Insights
  const { data: scheduleInsights, isLoading: scheduleLoading } = useQuery<ScheduleInsights>({
    queryKey: ['/api/ai/schedule-insights'],
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });

  // Financial Analysis
  const { data: financialAnalysis, isLoading: financialLoading } = useQuery<FinancialAnalysis>({
    queryKey: ['/api/ai/financial-analysis'],
    refetchInterval: 15 * 60 * 1000, // Refresh every 15 minutes
  });

  // Staff Performance
  const { data: staffPerformance, isLoading: staffLoading } = useQuery<StaffPerformance>({
    queryKey: ['/api/ai/staff-performance'],
    refetchInterval: 20 * 60 * 1000, // Refresh every 20 minutes
  });

  const isLoading = biLoading || scheduleLoading || financialLoading || staffLoading;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-6 w-6 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-900">AI Intelligence Center</h2>
        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
          Powered by Gemini AI
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Operations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Key Business Insights */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Key Business Insights
                </CardTitle>
                <CardDescription>
                  AI-powered analysis of your business operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {biLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Analyzing business data...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {businessIntelligence?.keyInsights?.map((insight, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-800">{insight}</p>
                      </div>
                    )) || (
                      <p className="text-sm text-gray-500">No insights available. AI is analyzing your data...</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alerts & Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {biLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {businessIntelligence?.alerts?.slice(0, 5).map((alert, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{alert}</p>
                      </div>
                    )) || (
                      <p className="text-sm text-gray-500">No alerts at this time</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Business Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Business Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {biLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Analyzing trends...</span>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {businessIntelligence?.trends?.map((trend, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">{trend}</p>
                    </div>
                  )) || (
                    <p className="text-sm text-gray-500">Trend analysis in progress...</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Financial Insights</CardTitle>
                <CardDescription>AI analysis of revenue and expenses</CardDescription>
              </CardHeader>
              <CardContent>
                {financialLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {financialAnalysis?.insights?.map((insight, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">{insight}</p>
                      </div>
                    )) || (
                      <p className="text-sm text-gray-500">Financial analysis in progress...</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Forecasting</CardTitle>
              </CardHeader>
              <CardContent>
                {financialLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {financialAnalysis?.forecastedRevenue && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          ${financialAnalysis.forecastedRevenue.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">Projected next month</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      {financialAnalysis?.recommendations?.slice(0, 3).map((rec, index) => (
                        <div key={index} className="p-2 bg-blue-50 rounded text-sm text-blue-800">
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>AI analysis of staff performance</CardDescription>
              </CardHeader>
              <CardContent>
                {staffLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {staffPerformance?.topPerformers && staffPerformance.topPerformers.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-700 mb-2">Top Performers</h4>
                        <div className="space-y-1">
                          {staffPerformance.topPerformers.slice(0, 5).map((performer, index) => (
                            <Badge key={index} variant="outline" className="mr-2 mb-1">
                              {performer}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {staffPerformance?.insights?.slice(0, 4).map((insight, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                          {insight}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                {scheduleLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scheduleInsights?.conflicts && scheduleInsights.conflicts.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-700 mb-2">Schedule Conflicts</h4>
                        <div className="space-y-2">
                          {scheduleInsights.conflicts.slice(0, 3).map((conflict, index) => (
                            <div key={index} className="p-2 bg-red-50 rounded text-sm text-red-800">
                              {conflict}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-blue-700 mb-2">Recommendations</h4>
                      <div className="space-y-2">
                        {scheduleInsights?.recommendations?.slice(0, 3).map((rec, index) => (
                          <div key={index} className="p-2 bg-blue-50 rounded text-sm text-blue-800">
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Music AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    // TODO: Implement music playlist generation
                  }}
                >
                  Generate Smart Playlist
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  AI-powered music recommendations based on time and crowd
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    // TODO: Implement task prioritization
                  }}
                >
                  Optimize Task Priority
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  AI-driven task prioritization and workflow optimization
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Message Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    // TODO: Implement message sentiment analysis
                  }}
                >
                  Analyze Messages
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Sentiment analysis and communication insights
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
              <CardDescription>Strategic recommendations for business improvement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {businessIntelligence?.recommendations?.map((recommendation, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{recommendation}</p>
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500 col-span-2">AI recommendations loading...</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}