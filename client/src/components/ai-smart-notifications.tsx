import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Brain, Lightbulb, AlertTriangle, TrendingUp, Zap, Music, Users, DollarSign, Clock } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';

interface SmartNotification {
  id: string;
  type: 'insight' | 'recommendation' | 'alert' | 'opportunity' | 'automation';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  actionable: boolean;
  timestamp: Date;
}

interface LiveInsights {
  alerts: string[];
  opportunities: string[];
  recommendations: string[];
  metrics: { [key: string]: number };
}

interface AISmartNotificationsProps {
  className?: string;
}

export function AISmartNotifications({ className }: AISmartNotificationsProps) {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Poll for new AI insights every 60 seconds
  const { data: liveInsights } = useQuery<LiveInsights>({
    queryKey: ['/api/ai/live-insights'],
    refetchInterval: 60 * 1000,
  });

  // Generate smart notifications from AI insights
  useEffect(() => {
    if (liveInsights) {
      const newNotifications: SmartNotification[] = [];
      
      // Convert alerts to notifications
      liveInsights.alerts?.forEach((alert: string, index: number) => {
        const id = `alert-${Date.now()}-${index}`;
        if (!dismissedIds.has(id)) {
          newNotifications.push({
            id,
            type: 'alert',
            title: 'AI Alert',
            message: alert,
            priority: 'high',
            category: 'operations',
            actionable: true,
            timestamp: new Date()
          });
        }
      });

      // Convert opportunities to notifications
      liveInsights.opportunities?.forEach((opportunity: string, index: number) => {
        const id = `opportunity-${Date.now()}-${index}`;
        if (!dismissedIds.has(id)) {
          newNotifications.push({
            id,
            type: 'opportunity',
            title: 'Business Opportunity',
            message: opportunity,
            priority: 'medium',
            category: 'revenue',
            actionable: true,
            timestamp: new Date()
          });
        }
      });

      // Convert recommendations to notifications
      liveInsights.recommendations?.slice(0, 2).forEach((rec: string, index: number) => {
        const id = `rec-${Date.now()}-${index}`;
        if (!dismissedIds.has(id)) {
          newNotifications.push({
            id,
            type: 'recommendation',
            title: 'AI Recommendation',
            message: rec,
            priority: 'medium',
            category: 'optimization',
            actionable: true,
            timestamp: new Date()
          });
        }
      });

      // Add time-sensitive automation suggestions
      const currentHour = new Date().getHours();
      if (currentHour >= 19 && currentHour <= 23) { // Evening hours
        const id = `auto-music-${Date.now()}`;
        if (!dismissedIds.has(id)) {
          newNotifications.push({
            id,
            type: 'automation',
            title: 'Smart Music Automation',
            message: 'AI suggests switching to high-energy playlist for peak hours. Auto-generate now?',
            priority: 'medium',
            category: 'music',
            actionable: true,
            timestamp: new Date()
          });
        }
      }

      setNotifications(newNotifications);
    }
  }, [liveInsights, dismissedIds]);

  const getNotificationIcon = (type: string, category: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'recommendation': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'automation': return <Zap className="h-4 w-4 text-purple-500" />;
      default: return <Brain className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'music': return <Music className="h-3 w-3" />;
      case 'revenue': return <DollarSign className="h-3 w-3" />;
      case 'operations': return <Users className="h-3 w-3" />;
      case 'optimization': return <TrendingUp className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-blue-500 bg-blue-50';
      case 'low': return 'border-gray-300 bg-gray-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  const dismissNotification = (id: string) => {
    setDismissedIds(prev => new Set(Array.from(prev).concat([id])));
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleAction = (notification: SmartNotification) => {
    // Handle different types of actionable notifications
    if (notification.category === 'music' && notification.type === 'automation') {
      // TODO: Integrate with music generation API
      console.log('Generating AI music playlist...');
    }
    dismissNotification(notification.id);
  };

  const visibleNotifications = notifications.filter(n => !dismissedIds.has(n.id));

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {visibleNotifications.slice(0, 5).map((notification) => (
        <Card 
          key={notification.id} 
          className={`${getPriorityColor(notification.priority)} border-l-4 shadow-sm hover:shadow-md transition-shadow`}
        >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getNotificationIcon(notification.type, notification.category)}
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      {getCategoryIcon(notification.category)}
                      {notification.category}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => dismissNotification(notification.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                <h4 className="font-semibold text-sm text-gray-900 mb-1">
                  {notification.title}
                </h4>
                
                <p className="text-xs text-gray-700 mb-3">
                  {notification.message}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {notification.timestamp.toLocaleTimeString()}
                  </span>
                  
                  {notification.actionable && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs px-2"
                      onClick={() => handleAction(notification)}
                    >
                      {notification.type === 'automation' ? 'Activate' : 'Act Now'}
                    </Button>
                  )}
                </div>
              </CardContent>
        </Card>
        ))}
      
      {visibleNotifications.length > 5 && (
        <div className="text-center p-2">
          <Badge variant="secondary" className="text-xs">
            +{visibleNotifications.length - 5} more insights
          </Badge>
        </div>
      )}
    </div>
  );
}