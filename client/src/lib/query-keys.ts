// Centralized TanStack Query keys to prevent typos and simplify cache management
export const QUERY_KEYS = {
  // Authentication
  auth: {
    user: () => ['/api/auth/user'] as const,
  },

  // Dashboard
  dashboard: {
    metrics: () => ['/api/dashboard/metrics'] as const,
    currentStaff: () => ['/api/dashboard/current-staff'] as const,
  },

  // Staff Management
  staff: {
    all: () => ['/api/staff'] as const,
    byId: (id: string) => ['/api/staff', id] as const,
    timeClock: () => ['/api/time-clock'] as const,
    schedules: () => ['/api/schedules'] as const,
  },

  // Dancers
  dancers: {
    all: () => ['/api/dancers'] as const,
    applications: () => ['/api/dancer-applications'] as const,
    lineup: (clubLocation: string) => ['/api/lineup/current', clubLocation] as const,
    byId: (id: string) => ['/api/dancers', id] as const,
  },

  // Financial
  financial: {
    records: () => ['/api/financial/records'] as const,
    personalRecords: () => ['/api/financial/personal-records'] as const,
    payrollRecords: () => ['/api/payroll/records'] as const,
  },

  // Tasks
  tasks: {
    all: () => ['/api/tasks'] as const,
    byId: (id: string) => ['/api/tasks', id] as const,
    analytics: () => ['/api/tasks/analytics'] as const,
  },

  // Messages
  messages: {
    all: () => ['/api/messages'] as const,
    conversations: () => ['/api/messages/conversations'] as const,
    byId: (id: string) => ['/api/messages', id] as const,
  },

  // Notifications
  notifications: {
    all: () => ['/api/notifications'] as const,
    unreadCount: () => ['/api/notifications/unread-count'] as const,
  },

  // Music
  music: {
    requests: () => ['/api/music/requests'] as const,
    playlists: () => ['/api/music/playlists'] as const,
    analytics: () => ['/api/music/analytics'] as const,
  },

  // Analytics
  analytics: {
    customers: () => ['/api/analytics/customers'] as const,
    dailyMetrics: () => ['/api/analytics/daily-metrics'] as const,
    staffPerformance: () => ['/api/analytics/staff-performance'] as const,
  },

  // Admin
  admin: {
    users: () => ['/api/admin/users'] as const,
    settings: () => ['/api/admin/settings'] as const,
  },
} as const;

// Helper function to invalidate related queries based on WebSocket events
export const getQueriesToInvalidate = (event: string): string[][] => {
  switch (event) {
    case 'STAFF_UPDATE':
    case 'CLOCK_IN':
    case 'CLOCK_OUT':
      return [
        [...QUERY_KEYS.dashboard.currentStaff()],
        [...QUERY_KEYS.dashboard.metrics()],
        [...QUERY_KEYS.staff.timeClock()],
      ];
    
    case 'FINANCIAL_UPDATE':
    case 'TIPS_UPDATE':
      return [
        [...QUERY_KEYS.dashboard.metrics()],
        [...QUERY_KEYS.financial.records()],
      ];
    
    case 'DANCER_LINEUP_UPDATE':
      return [
        [...QUERY_KEYS.dancers.lineup('wiggles_gentlemens_club')],
        [...QUERY_KEYS.dancers.lineup('fantasy_gentlemens_club')],
      ];
    
    case 'TASK_UPDATE':
      return [
        [...QUERY_KEYS.tasks.all()],
        [...QUERY_KEYS.tasks.analytics()],
      ];
    
    case 'MESSAGE_UPDATE':
      return [
        [...QUERY_KEYS.messages.all()],
        [...QUERY_KEYS.messages.conversations()],
      ];
    
    case 'NOTIFICATION_UPDATE':
      return [
        [...QUERY_KEYS.notifications.all()],
        [...QUERY_KEYS.notifications.unreadCount()],
      ];
    
    case 'MUSIC_UPDATE':
      return [
        [...QUERY_KEYS.music.requests()],
        [...QUERY_KEYS.music.analytics()],
      ];
    
    default:
      // Return empty array for unknown events
      return [];
  }
};