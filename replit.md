# FantasyCompanions - Club Management Platform

## Overview

FantasyCompanions is a comprehensive full-stack club management platform designed specifically for gentlemen's clubs. It streamlines operations, communication, and scheduling for multiple user roles including owners, managers, house staff, dancers, DJs, bartenders, servers, and barbacks. The platform's vision is to enhance efficiency, improve communication, and provide advanced AI-powered tools for operational insights and management across club locations like "Wiggles Gentlemen's Club" and "Fantasy Gentlemen's Club".

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Neon serverless connection
- **ORM**: Drizzle ORM with TypeScript schema
- **Authentication**: Replit OAuth with session management; custom superuser authentication
- **Real-time**: WebSocket integration for live updates
- **API Design**: RESTful endpoints with comprehensive error handling

### Project Structure
- `client/`: React frontend
- `server/`: Express backend
- `shared/`: Shared types and schemas
- `migrations/`: Database migration files
- `attached_assets/`: Project documentation

### Key Components
- **Authentication System**: Replit OAuth (OpenID Connect) and custom superuser login with PostgreSQL-backed sessions. Implements Role-Based Access Control (RBAC) across 9+ distinct user roles (including `superuser`, `owner`, `manager`, `house_mom`, `house_dad`, `dj`, `host`, `floor_host`, `front_door`, `bartender`, `server`, `barback`). Supports case-insensitive authentication.
- **Database Layer**: Relational design with 15+ tables for users, schedules, time clock entries, financial records, messages, tasks, and music requests. Uses Drizzle Kit for schema management.
- **Real-time Features**: WebSocket server for live updates, including clock-ins, financial updates, and message delivery, with client synchronization via query invalidation.
- **UI/UX Framework**: Modular Radix UI components, consistent styling with Tailwind CSS, light/dark mode support via CSS variables, responsive design, and ARIA compliance.
- **Internal Messaging System**: Supports individual and group messaging with real-time updates and AI-enhanced features for professional tone optimization and sentiment analysis.
- **Smart Notification System**: In-app, bell, and toast notifications for application status, new dancer applications, and real-time alerts.
- **Dancer Application & Management**: Standalone public application form with AI-powered assistance (Gemini) for experience enhancement, availability formatting, and stage name suggestions. Comprehensive dancer management with `Active`, `Pending`, and `Inactive` tabs, including club assignments and role-based filtering. Supports secure ID document uploads.
- **AI-Powered Task Management**: Full CRUD operations for tasks with Gemini AI for task enhancement, intelligent prioritization, workload analysis, and real-time statistics.
- **Club & Staff Assignment**: Supports staff assignment to specific clubs or "both_clubs" for cross-location roles. Includes `floor_host` role integration.
- **Personal Finance System**: Worker-only access for personal financial tracking with comprehensive role-based permissions and enhanced database schema for expense categories and pay frequency. Management roles cannot access personal finance.
- **AI Feature Consolidation**: All AI-powered features (Real-Time Metrics, AI Staff Insights, AI Recommendations, AI Smart Alerts) are centralized in the Admin Settings for a cleaner dashboard.
- **Codebase Analysis**: Gemini 2.5 Pro used for architectural, performance, and security assessment, identifying critical vulnerabilities (e.g., hardcoded credentials, missing database indexes) and providing an implementation roadmap.

## External Dependencies

### Core Framework Dependencies
- `@neondatabase/serverless`: PostgreSQL serverless database connection
- `drizzle-orm`: Type-safe database operations
- `@tanstack/react-query`: Server state management
- `express`: Web application framework
- `passport`: Authentication middleware

### UI/UX Dependencies
- `@radix-ui/*`: Accessible component primitives
- `tailwindcss`: Utility-first CSS framework
- `lucide-react`: Icon library
- `class-variance-authority`: Component variant management

### Development Tools
- `typescript`: Static type checking
- `vite`: Build tool and development server
- `tsx`: TypeScript execution for Node.js
- `esbuild`: JavaScript bundler for production

### Third-Party Integrations
- **Replit OAuth**: For user authentication and session management.
- **Neon Database**: Serverless PostgreSQL for database hosting.
- **Gemini AI**: Integrated for AI-powered features like task enhancement, communication analysis, dancer application assistance, and codebase analysis.
```