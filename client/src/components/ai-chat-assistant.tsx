import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, MessageCircle, Loader2, Lightbulb, TrendingUp, AlertTriangle, Music, Users, DollarSign } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  category?: 'insight' | 'recommendation' | 'alert' | 'general';
}

interface AIChatAssistantProps {
  className?: string;
}

export function AIChatAssistant({ className }: AIChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI club management assistant. I can help you with scheduling, financial insights, staff performance, and more. What would you like to know?',
      timestamp: new Date(),
      category: 'general'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      // Process the message and return an AI response
      const response = await apiRequest('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, context: 'club_management' })
      });
      return response;
    },
    onSuccess: (response) => {
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: response.response || 'I\'m processing your request...',
        timestamp: new Date(),
        category: response.category || 'general'
      };
      setMessages(prev => [...prev, aiMessage]);
    },
    onError: () => {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: 'I\'m experiencing some difficulties right now. Let me analyze your club data and get back to you with insights.',
        timestamp: new Date(),
        category: 'general'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'insight': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'recommendation': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'alert': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <Bot className="h-4 w-4 text-purple-500" />;
    }
  };

  const quickActions = [
    { label: 'Staff Performance', icon: Users, query: 'Show me staff performance insights' },
    { label: 'Financial Analysis', icon: DollarSign, query: 'Analyze our financial performance' },
    { label: 'Schedule Optimization', icon: TrendingUp, query: 'Help me optimize staff schedules' },
    { label: 'Music Recommendations', icon: Music, query: 'Generate a music playlist for tonight' }
  ];

  return (
    <Card className={`flex flex-col h-[500px] ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-600" />
          AI Assistant
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
            Live
          </Badge>
        </CardTitle>
        <CardDescription>
          Your intelligent club management companion
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    {getCategoryIcon(message.category)}
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p>{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-primary-foreground/70' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.type === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
                </div>
                <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm">
                  <p>AI is thinking...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="px-4 py-2 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="justify-start gap-2 text-xs h-8"
                onClick={() => {
                  setInputValue(action.query);
                  setTimeout(() => handleSendMessage(), 100);
                }}
              >
                <action.icon className="h-3 w-3" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="px-4 pb-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your club..."
              className="flex-1"
              disabled={chatMutation.isPending}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || chatMutation.isPending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}