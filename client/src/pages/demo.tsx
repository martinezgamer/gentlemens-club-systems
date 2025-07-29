import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/header";
import { 
  Crown, 
  Settings, 
  Users, 
  UserCog, 
  Music, 
  Coffee, 
  Shield, 
  DoorOpen,
  Target,
  MessageSquare,
  Calendar,
  DollarSign,
  Clock,
  Eye,
  EyeOff
} from "lucide-react";

// Role definitions with their permissions and features
const roleDefinitions = {
  superuser: {
    name: "Superuser",
    icon: Crown,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    description: "Full system access across all clubs",
    features: [
      "Complete system administration",
      "Access to all clubs and locations", 
      "User management and role assignment",
      "Financial records and reporting",
      "AI insights and analytics",
      "Task management across all clubs",
      "Messaging system access",
      "Dancer application review",
      "Schedule management",
      "Real-time dashboard metrics"
    ],
    restrictions: []
  },
  owner: {
    name: "Owner",
    icon: Crown,
    color: "bg-gold-100 text-gold-800 dark:bg-gold-900 dark:text-gold-300",
    description: "Business owner with comprehensive access",
    features: [
      "Financial oversight and reporting",
      "Staff management and scheduling",
      "AI business intelligence",
      "Performance analytics",
      "Task delegation and monitoring",
      "Club operations oversight",
      "Dancer management",
      "High-level messaging access"
    ],
    restrictions: [
      "Limited to assigned club location",
      "Cannot create other superuser accounts"
    ]
  },
  manager: {
    name: "Manager",
    icon: Settings,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    description: "Club management and operations",
    features: [
      "Staff scheduling and coordination",
      "Task assignment and tracking",
      "Dancer application review",
      "Daily operations management",
      "Basic financial reporting",
      "Team messaging",
      "Performance monitoring"
    ],
    restrictions: [
      "Limited to assigned club location",
      "Cannot access system-wide settings",
      "Limited financial access"
    ]
  },
  house_mom: {
    name: "House Mom",
    icon: Users,
    color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    description: "Dancer support and coordination",
    features: [
      "Dancer support and guidance",
      "Schedule coordination",
      "Basic task management",
      "Dancer communication",
      "Performance tracking",
      "Application assistance"
    ],
    restrictions: [
      "Limited to assigned club location",
      "Cannot approve/reject applications independently",
      "Limited financial access"
    ]
  },
  house_dad: {
    name: "House Dad",
    icon: UserCog,
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    description: "Security and operations support",
    features: [
      "Security oversight",
      "Operations support",
      "Staff coordination",
      "Basic task management",
      "Incident reporting",
      "Safety protocols"
    ],
    restrictions: [
      "Limited to assigned club location",
      "Cannot access financial records",
      "Limited administrative access"
    ]
  },
  dj: {
    name: "DJ",
    icon: Music,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    description: "Music and entertainment management",
    features: [
      "Music request management",
      "Entertainment scheduling",
      "Basic task tracking",
      "Performance coordination",
      "Equipment management"
    ],
    restrictions: [
      "Limited to assigned club location",
      "Cannot access financial or staff records",
      "Limited to entertainment-related tasks"
    ]
  },
  host: {
    name: "Host",
    icon: Coffee,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    description: "Customer service and hospitality",
    features: [
      "Customer service coordination",
      "Basic task tracking",
      "Shift reporting",
      "Guest management",
      "Service coordination"
    ],
    restrictions: [
      "Limited to assigned club location",
      "Cannot access staff or financial records",
      "Limited administrative access"
    ]
  },
  floor_host: {
    name: "Floor Host",
    icon: Eye,
    color: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
    description: "Floor operations and customer experience",
    features: [
      "Floor operations oversight",
      "Customer experience management", 
      "Basic task coordination",
      "Performance monitoring",
      "Service quality assurance"
    ],
    restrictions: [
      "Limited to assigned club location",
      "Cannot access staff or financial records",
      "Limited to floor operations"
    ]
  },
  front_door: {
    name: "Front Door",
    icon: DoorOpen,
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    description: "Entry management and security",
    features: [
      "Entry management",
      "Basic security protocols",
      "Shift tracking",
      "Incident reporting",
      "Customer check-in"
    ],
    restrictions: [
      "Limited to assigned club location",
      "Cannot access internal operations",
      "Very limited system access"
    ]
  },
  bartender: {
    name: "Bartender",
    icon: Coffee,
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    description: "Bar operations and service",
    features: [
      "Bar inventory management",
      "Service coordination",
      "Basic task tracking",
      "Shift reporting",
      "Customer service"
    ],
    restrictions: [
      "Limited to assigned club location",
      "Cannot access staff records",
      "Limited to bar-related functions"
    ]
  },
  server: {
    name: "Server",
    icon: Coffee,
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    description: "Food and beverage service",
    features: [
      "Service coordination",
      "Order management",
      "Basic task tracking",
      "Customer service",
      "Shift reporting"
    ],
    restrictions: [
      "Limited to assigned club location",
      "Cannot access staff records",
      "Limited to service functions"
    ]
  },
  barback: {
    name: "Barback",
    icon: Coffee,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    description: "Bar support and maintenance",
    features: [
      "Bar support tasks",
      "Inventory assistance",
      "Basic task tracking",
      "Cleaning coordination",
      "Equipment maintenance"
    ],
    restrictions: [
      "Limited to assigned club location",
      "Cannot access records or management functions",
      "Limited to support tasks only"
    ]
  }
};

export default function Demo() {
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || 'superuser');
  const [showRestrictions, setShowRestrictions] = useState(false);

  const currentRoleInfo = roleDefinitions[selectedRole as keyof typeof roleDefinitions];
  const IconComponent = currentRoleInfo?.icon || Crown;

  const getNavigationAccess = (role: string) => {
    const highAccess = ['superuser', 'owner', 'manager'];
    const mediumAccess = ['house_mom', 'house_dad'];
    const limitedAccess = ['dj', 'host', 'floor_host', 'front_door', 'bartender', 'server', 'barback'];

    if (highAccess.includes(role)) {
      return {
        dashboard: true,
        staff: true,
        tasks: true,
        messages: true,
        schedule: true,
        dancers: true,
        financials: role === 'superuser' || role === 'owner',
        aiInsights: true,
        settings: role === 'superuser'
      };
    } else if (mediumAccess.includes(role)) {
      return {
        dashboard: true,
        staff: true,
        tasks: true,
        messages: true,
        schedule: true,
        dancers: true,
        financials: false,
        aiInsights: false,
        settings: false
      };
    } else {
      return {
        dashboard: true,
        staff: false,
        tasks: true,
        messages: true,
        schedule: false,
        dancers: false,
        financials: false,
        aiInsights: false,
        settings: false
      };
    }
  };

  const navigation = getNavigationAccess(selectedRole);

  return (
    <>
      <Header title="Role Access Demo" />
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Role Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Role Access Demonstration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Select Role to Test:</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleDefinitions).map(([key, role]) => (
                      <SelectItem key={key} value={key}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={showRestrictions ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowRestrictions(!showRestrictions)}
                  className="flex items-center gap-2"
                >
                  {showRestrictions ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showRestrictions ? 'Hide' : 'Show'} Restrictions
                </Button>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Current User:</strong> {user?.firstName} {user?.lastName} ({user?.role})
                <br />
                <strong>Testing Role:</strong> {currentRoleInfo?.name}
                <br />
                <strong>Club Access:</strong> {user?.clubLocation === 'both_clubs' ? 'Both Clubs' : 
                  user?.clubLocation === 'wiggles_gentlemens_club' ? 'Wiggles Gentlemen\'s Club' :
                  user?.clubLocation === 'fantasy_gentlemens_club' ? 'Fantasy Gentlemen\'s Club' : 'Unassigned'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Role Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${currentRoleInfo?.color}`}>
                <IconComponent className="w-5 h-5" />
              </div>
              {currentRoleInfo?.name}
              <Badge className={currentRoleInfo?.color}>{selectedRole}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {currentRoleInfo?.description}
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Available Features
                </h4>
                <ul className="space-y-2">
                  {currentRoleInfo?.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              {showRestrictions && currentRoleInfo?.restrictions.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                    <EyeOff className="w-4 h-4" />
                    Access Restrictions
                  </h4>
                  <ul className="space-y-2">
                    {currentRoleInfo.restrictions.map((restriction, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        {restriction}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Access */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Navigation & Page Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(navigation).map(([page, hasAccess]) => {
                const pageIcons = {
                  dashboard: Target,
                  staff: Users,
                  tasks: Target,
                  messages: MessageSquare,
                  schedule: Calendar,
                  dancers: Users,
                  financials: DollarSign,
                  aiInsights: Target,
                  settings: Settings
                };
                
                const PageIcon = pageIcons[page as keyof typeof pageIcons];
                
                return (
                  <div key={page} className={`p-3 rounded-lg border-2 ${
                    hasAccess 
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' 
                      : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <PageIcon className={`w-4 h-4 ${
                        hasAccess ? 'text-green-600' : 'text-red-600'
                      }`} />
                      <span className={`text-sm font-medium capitalize ${
                        hasAccess ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                      }`}>
                        {page.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                    <Badge className={`text-xs ${
                      hasAccess 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {hasAccess ? 'Accessible' : 'Restricted'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Feature Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Feature Comparison Across Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Feature</th>
                    <th className="text-center p-2">Superuser</th>
                    <th className="text-center p-2">Owner</th>
                    <th className="text-center p-2">Manager</th>
                    <th className="text-center p-2">House Staff</th>
                    <th className="text-center p-2">Service Staff</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Dashboard Access', superuser: true, owner: true, manager: true, house: true, service: true },
                    { feature: 'Staff Management', superuser: true, owner: true, manager: true, house: true, service: false },
                    { feature: 'Task Management', superuser: true, owner: true, manager: true, house: true, service: true },
                    { feature: 'Financial Records', superuser: true, owner: true, manager: false, house: false, service: false },
                    { feature: 'AI Insights', superuser: true, owner: true, manager: true, house: false, service: false },
                    { feature: 'Dancer Management', superuser: true, owner: true, manager: true, house: true, service: false },
                    { feature: 'System Settings', superuser: true, owner: false, manager: false, house: false, service: false },
                    { feature: 'Cross-Club Access', superuser: true, owner: false, manager: false, house: false, service: false },
                  ].map((row, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-medium">{row.feature}</td>
                      <td className="text-center p-2">
                        {row.superuser ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span>}
                      </td>
                      <td className="text-center p-2">
                        {row.owner ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span>}
                      </td>
                      <td className="text-center p-2">
                        {row.manager ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span>}
                      </td>
                      <td className="text-center p-2">
                        {row.house ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span>}
                      </td>
                      <td className="text-center p-2">
                        {row.service ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Testing Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Testing Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How to Test Role Access:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  <li>Select different roles from the dropdown above</li>
                  <li>Review the available features and restrictions for each role</li>
                  <li>Check the navigation access permissions</li>
                  <li>Test actual page access by navigating to different sections</li>
                  <li>Verify that restricted features are properly hidden or disabled</li>
                </ol>
              </div>
              
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Common Issues to Check:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                  <li>Buttons or menu items that should be hidden but are visible</li>
                  <li>Features accessible when they shouldn't be</li>
                  <li>Error messages when accessing restricted content</li>
                  <li>Data filtering based on club location assignments</li>
                  <li>Role-specific functionality working as expected</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}