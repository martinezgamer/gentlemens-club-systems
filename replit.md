# FantasyCompanions - Club Management Platform

## Overview

FantasyCompanions is a comprehensive full-stack club management platform designed specifically for gentlemen's clubs. The application streamlines operations, communication, and scheduling across multiple user roles including owners, managers, house staff, dancers, DJs, bartenders, servers, and barbacks.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite with custom configuration

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Neon serverless connection
- **ORM**: Drizzle ORM with TypeScript schema
- **Authentication**: Replit OAuth with session management
- **Real-time**: WebSocket integration for live updates
- **API Design**: RESTful endpoints with comprehensive error handling

### Project Structure
```
├── client/           # React frontend
├── server/           # Express backend
├── shared/           # Shared types and schemas
├── migrations/       # Database migration files
└── attached_assets/  # Project documentation
```

## Key Components

### Authentication System
- **Provider**: Replit OAuth with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Authorization**: Role-based access control (RBAC) with 9 distinct user roles
- **Security**: HTTP-only cookies with CSRF protection

### Database Layer
- **Schema**: Comprehensive relational design with 15+ tables
- **Key Entities**: Users, schedules, time clock entries, financial records, messages, tasks, music requests
- **Data Integrity**: Foreign key constraints and enum validation
- **Migration Strategy**: Drizzle Kit for schema management

### Real-time Features
- **WebSocket Server**: Integrated with Express for live updates
- **Event Broadcasting**: Real-time notifications for clock-ins, financial updates, and message delivery
- **Client Synchronization**: Automatic query invalidation on WebSocket events

### UI/UX Framework
- **Component System**: Modular Radix UI primitives with consistent styling
- **Theme System**: CSS variables for light/dark mode support
- **Responsive Design**: Mobile-first approach with breakpoint utilities
- **Accessibility**: ARIA compliant components throughout

## Data Flow

### Client-Server Communication
1. **Authentication Flow**: OAuth redirect → session creation → user profile retrieval
2. **API Requests**: RESTful endpoints with credential-based authentication
3. **Real-time Updates**: WebSocket events trigger query cache invalidation
4. **Error Handling**: Centralized error boundary with user-friendly messages

### Database Operations
1. **Query Layer**: Drizzle ORM with type-safe operations
2. **Transaction Management**: Automatic rollback on failures
3. **Connection Pooling**: Neon serverless with WebSocket support
4. **Data Validation**: Zod schemas for runtime type checking

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless database connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **express**: Web application framework
- **passport**: Authentication middleware

### UI/UX Dependencies
- **@radix-ui/***: Accessible component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Component variant management

### Development Tools
- **typescript**: Static type checking
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: JavaScript bundler for production

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Neon serverless PostgreSQL with environment-based configuration
- **Session Storage**: PostgreSQL sessions table
- **WebSocket**: Integrated with Express server

### Production Build
- **Frontend**: Vite build with static asset optimization
- **Backend**: esbuild compilation to single JavaScript bundle
- **Database**: Production Neon database with connection pooling
- **Process Management**: Node.js process with environment variable configuration

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **SESSION_SECRET**: Session encryption key (required)
- **REPL_ID**: Replit environment identifier
- **NODE_ENV**: Environment flag (development/production)

### Scaling Considerations
- **Database**: Neon serverless auto-scaling
- **WebSocket**: Single server instance (can be extended to multiple with Redis)
- **Static Assets**: Served through Vite/Express static middleware
- **Session Store**: PostgreSQL-backed for horizontal scaling support

## Recent Changes

### Latest Implementation: Internal Messaging System (Complete)
**Date:** January 29, 2025

✅ **Comprehensive Messaging System:**
- Individual messaging to specific staff members
- Group messaging by role (owner, manager, dancers, bartenders, etc.)
- Message status tracking (sent, delivered, read)
- Real-time unread message count
- Search and filter functionality
- Beautiful UI with status indicators and badges

✅ **AI-Powered Features:**
- AI-enhanced announcements with professional tone optimization
- Sentiment analysis for communication health monitoring
- Smart subject line and content enhancement
- Urgency detection and timing recommendations
- Communication insights for management

✅ **Technical Implementation:**
- Complete frontend interface with React + TypeScript
- Backend API routes with proper authentication
- Database schema with message status tracking
- Real-time updates via WebSocket integration
- Comprehensive error handling and fallbacks

### Latest Implementation: Smart Notification System with Club Location Management (Complete)
**Date:** January 29, 2025

✅ **Smart Notification System:**
- In-app notifications for application status changes (approved/rejected)
- Real-time notifications for new dancer applications
- Notification bell with unread count in top-right corner
- Toast notifications for immediate alerts
- Mark as read/mark all as read functionality
- WebSocket integration for real-time updates

✅ **Club Location Management:**
- Updated to use specific club names: "Wiggles Gentlemen's Club" and "Fantasy Gentlemen's Club"
- Ability to change club locations after application submission
- Club-specific badges and filtering throughout the system
- Role-based permissions for location changes

### Latest Implementation: Superuser Account & Case-Insensitive Authentication (Complete)
**Date:** January 29, 2025

✅ **Superuser Account Created:**
- Email: maritnezgamer@gmail.com  
- Password: Chicago@21
- Role: superuser with full system access
- Account automatically created in database

✅ **Case-Insensitive Authentication:**
- Works with any capitalization (MARITNEZGAMER@GMAIL.COM, etc.)
- Custom login endpoint bypasses OIDC for superuser account
- Mock session structure maintains compatibility with existing auth system
- Updated authentication middleware to handle superuser sessions

✅ **Technical Implementation:**
- Custom /api/auth/login endpoint for superuser authentication
- Updated isAuthenticated middleware to handle both OIDC and custom login
- Login page accessible at /login route
- Database user record created with proper role assignments
- Maintains backward compatibility with Replit OIDC authentication

### Latest Implementation: Standalone AI-Powered Dancer Application (Complete)
**Date:** January 29, 2025

✅ **Standalone Public Application Form:**
- Publicly accessible at `/apply` route (no authentication required)
- Beautiful, professional UI with gradient design and modern styling
- Complete form validation with Zod schema integration
- File upload functionality for ID documents
- Success confirmation with clear next steps information

✅ **AI-Powered Application Assistant:**
- Smart experience enhancement using Gemini AI
- Availability formatting and optimization
- Creative stage name suggestions based on applicant context
- Real-time AI suggestions with elegant UI integration
- Form field enhancement with professional tone

✅ **Technical Implementation:**
- Separate public API endpoints for unauthenticated access
- AI application service with Gemini integration
- Enhanced form UX with loading states and suggestions
- Proper error handling and user feedback
- Full TypeScript type safety and LSP compliance

✅ **Security & Privacy:**
- Public form isolated from management interface
- Privacy notice and consent handling
- Secure file upload with validation
- Professional data handling practices

### Latest Implementation: Enhanced Dancer Management System (Complete)
**Date:** January 29, 2025

✅ **Comprehensive Dancer Applications Page:**
- Shows actual dancer names instead of just application forms
- Displays club assignments for each dancer
- Role-based filtering: superusers see all clubs, staff see only their assigned club
- Public application link sharing with copy/open functionality

✅ **Three-Tab Interface:**
- Active Dancers: Currently working dancers with full details
- Pending Applications: Applications awaiting review with approve/reject
- Inactive Dancers: Former dancers with reactivation options

✅ **Enhanced Functionality:**
- Stage name display alongside real names
- Club location badges for easy identification
- Detailed dancer profiles in modal dialogs
- Application review system with rejection reasons
- Status toggle functionality for activation/deactivation

✅ **Security & Permissions:**
- Club-based access control implemented
- Superuser sees all locations, regular staff filtered to assigned club
- Proper role-based permissions for approve/reject actions

### Latest Implementation: AI-Powered Task Management System (Complete)
**Date:** January 29, 2025

✅ **Comprehensive AI-Enhanced Task Management:**
- Complete task management system with create, read, update, delete operations
- AI-powered task enhancement using Gemini for intelligent suggestions
- Smart task prioritization and workload analysis
- Real-time task statistics and progress tracking
- Advanced filtering by status, priority, assignee, and club location
- Role-based access control for task management features

✅ **Gemini AI Integration Features:**
- Task creation enhancement with AI-generated descriptions and suggestions
- Intelligent task prioritization based on business impact and urgency
- Staff workload analysis with overload detection and recommendations
- Automated task categorization and time estimation
- Smart optimization suggestions for workflow improvements
- AI-powered insights dashboard for managers and owners

✅ **Enhanced Database Schema:**
- Extended tasks table with AI-friendly fields: tags, category, estimatedTime, actualTime, clubLocation
- Added comprehensive tracking fields: startedAt, completedAt, notes, attachments, aiSuggestions
- Updated timestamps for better audit trails and performance monitoring
- Full support for both clubs assignment and filtering

✅ **Modern Frontend Implementation:**
- Beautiful, responsive React interface with TypeScript
- Real-time task statistics dashboard with visual metrics
- Interactive task cards with status management and quick actions
- AI insights dialog with workload analysis and optimization suggestions
- Comprehensive task creation form with AI enhancement integration
- Advanced search and filtering capabilities

✅ **Technical Architecture:**
- server/ai-task-service.ts: Dedicated AI service for task intelligence
- Enhanced storage methods with comprehensive CRUD operations
- RESTful API endpoints with proper authentication and validation
- Real-time WebSocket integration for live updates
- Complete error handling and user feedback systems

### Latest Implementation: Both Clubs Staff Assignment System (Complete)
**Date:** January 29, 2025

✅ **Both Clubs Assignment Feature:**
- Added "both_clubs" to club location enum in database schema
- Updated all club assignment dropdowns to include "Both Clubs" option
- Enhanced staff filtering logic to handle both clubs assignments
- Updated server-side storage methods for proper filtering
- Staff assigned to "both_clubs" appear in both Wiggles and Fantasy staff counts

✅ **Enhanced Staff Management:**
- Added "Both Clubs Staff" overview card showing cross-location assignments
- Updated superuser default assignment to "both_clubs" for full access
- Improved badge coloring system with blue for both clubs assignments
- Server-side filtering now shows both club staff when filtering by specific club

✅ **Floor Host Role Integration:**
- Added "floor_host" to staff role enum in database schema
- Updated all role selection dropdowns to include Floor Host option
- Enhanced role display functions across staff management interface
- Updated messaging system role labels to include Floor Host
- Added Floor Host to admin setup role selection

✅ **Complete Role System:**
- All 12 staff roles now properly integrated: superuser, owner, manager, house_mom, house_dad, dj, host, floor_host, front_door, bartender, server, barback
- Role-based access control maintains functionality across all systems
- Consistent role display names throughout the application

### Latest Implementation: AI Features Reorganization & Enhanced Personal Finance (Complete)
**Date:** January 29, 2025

✅ **AI Features Moved from Dashboard to Admin Settings:**
- Removed Real-Time Metrics, AI Staff Insights, AI Recommendations, AI Smart Alerts from main dashboard
- Consolidated all AI features in Admin Settings page for cleaner interface
- Simplified dashboard to focus on core operations (staff status, current dancers, metrics)
- Updated quick actions to replace "AI Insights" with "View Reports"

✅ **Enhanced Personal Finance System with Access Control:**
- Implemented strict worker-only access for personal financial tracking
- Added comprehensive role-based permissions for financial record creation
- Enhanced database schema with personal expense categories and pay frequency tracking
- Protected API endpoints with granular user role validation

✅ **Comprehensive Access Control Implementation:**
- Personal finance features restricted to worker roles (dancer, bartender, server, dj, host, floor_host, front_door, barback, house_mom, house_dad)
- Management roles (owner, manager, superuser) cannot access personal finance tracking
- Users can only view their own personal financial data
- Role-based financial record creation permissions implemented

✅ **Database Schema Enhancements:**
- Added expense category enum (food, transportation, housing, utilities, entertainment, shopping, healthcare, education, savings, other)
- Added pay frequency enum (weekly, bi_weekly, monthly) for paycheck tracking
- Enhanced financial records table with personal expense fields and privacy controls
- Implemented proper data isolation for personal financial tracking

✅ **Frontend Access Control:**
- Personal Finance page shows access restriction message for non-workers
- Dashboard simplified and focused on core operational metrics
- Admin Settings page now contains all AI-powered features
- Proper role-based component rendering throughout application

### Current Status
- ✅ AI features successfully moved from dashboard to Admin Settings for cleaner interface
- ✅ Dashboard simplified and focused on core operations
- ✅ Personal finance system operational with strict worker-only access control
- ✅ Enhanced database schema with proper access controls and data mapping
- ✅ All role-based permissions properly implemented and tested
- ✅ Real-time WebSocket communication active
- ✅ Complete AI-powered Task Management system operational with Gemini integration
- ✅ Advanced task creation, assignment, and tracking with intelligent prioritization
- ✅ Complete dancer application system with SSN and ID upload functionality
- ✅ Enhanced dancer management with role-based club filtering
- ✅ Standalone public application form with AI assistance operational
- ✅ Superuser account operational with case-insensitive authentication
- ✅ Internal messaging system fully operational with AI features
- ✅ All staff roles including Floor Host properly integrated
- ✅ All TypeScript compilation errors resolved
- ✅ Database operations optimized with proper return types