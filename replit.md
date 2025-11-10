# Bakery ERP System

## Overview

A comprehensive bakery ERP web application for managing inventory, multi-store stock tracking, cost calculation, and recipe management with role-based access control. Built with modern web technologies, the system serves three user roles (Admin, Manager, Staff) with different permission levels to handle daily bakery operations including product management, stock entries, discrepancy tracking, and profitability analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server
- Client-side routing using Wouter (lightweight router)
- Path aliases configured for clean imports (`@/`, `@shared/`, `@assets/`)

**UI Component System**
- shadcn/ui component library (New York style) with Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Custom design system following Material Design principles with focus on clarity and efficiency
- Responsive, mobile-first approach with touch-friendly controls
- Theme support (light/dark mode) with localStorage persistence

**State Management**
- TanStack Query (React Query) for server state management and caching
- Context API for authentication state (AuthProvider)
- Session-based authentication with HTTP-only cookies
- Query invalidation strategy to keep UI synchronized with backend changes

**Design Principles**
- System-based design prioritizing data clarity over visual flourish
- Role-aware interface with visual hierarchy based on permissions
- Mobile-optimized layouts with collapsible sidebar navigation
- Consistent spacing system using Tailwind's scale (2, 4, 8, 12, 16, 24)
- Typography system using Inter/Source Sans Pro fonts

### Backend Architecture

**Server Framework**
- Express.js server with TypeScript
- Session-based authentication using express-session
- Middleware for JSON parsing, URL encoding, and request logging
- Role-based access control via custom middleware (`requireAuth`, `requireRole`)

**API Design Pattern**
- RESTful API endpoints organized by resource
- Consistent error handling with appropriate HTTP status codes
- Session management with configurable security settings (httpOnly, secure flags)
- CRUD operations for all major entities (products, ingredients, recipes, stock entries)

**Authentication & Authorization**
- bcrypt for password hashing (10 rounds)
- Session-based authentication with server-side session storage
- Role-based middleware decorators for route protection
- Three-tier role system: Admin (full access), Manager (operations), Staff (data entry)

**Business Logic Layers**
- Storage abstraction layer (IStorage interface) separating data access from routes
- Automatic cost calculation based on recipe ingredients, labor, and overhead
- Stock discrepancy detection (alerts when >5% variance from expected)
- Waste tracking with 3% cap validation
- Delivery planning based on minimum stock levels and historical sales data

### Data Storage

**Database System**
- PostgreSQL via Neon serverless database
- Drizzle ORM for type-safe database queries and schema management
- WebSocket connection for serverless database access

**Schema Design**
- **Users**: Authentication and role management (Admin, Manager, Staff)
- **Stores**: Multi-location support with delivery schedules (daily, every-2-days)
- **Products**: Core inventory items with pricing, costs, and minimum stock levels
- **Ingredients**: Recipe components with cost per unit
- **Recipes**: Many-to-many relationship between products and ingredients with quantities
- **StockEntries**: Daily stock tracking with delivered, current stock, waste, sales, and discrepancy fields

**Data Validation**
- Zod schemas for runtime type validation
- Drizzle schema validation for database constraints
- Frontend form validation using react-hook-form with Zod resolvers

**Seeding Strategy**
- Default users with hashed passwords for all three roles
- Pre-configured stores matching business delivery schedules
- Sample products and ingredients for immediate testing
- Seed script runs on initial database setup

### External Dependencies

**Database & ORM**
- @neondatabase/serverless - PostgreSQL serverless connection with WebSocket support
- drizzle-orm - TypeScript ORM with type-safe queries
- drizzle-kit - Schema migration and push tooling
- ws - WebSocket library for Neon database connections

**Authentication & Security**
- bcryptjs - Password hashing and verification
- express-session - Server-side session management
- connect-pg-simple - PostgreSQL session store (configured but may not be actively used)

**UI Component Libraries**
- @radix-ui/* - Comprehensive set of unstyled, accessible UI primitives (accordion, dialog, dropdown, select, toast, etc.)
- class-variance-authority - Utility for creating component variants
- tailwind-merge - Intelligent Tailwind class merging
- lucide-react - Icon library
- cmdk - Command palette component

**Form Management**
- react-hook-form - Performant form state management
- @hookform/resolvers - Zod integration for form validation
- zod - Schema validation library

**Development Tools**
- tsx - TypeScript execution for development
- esbuild - Fast JavaScript bundler for production builds
- @replit/vite-plugin-* - Replit-specific development plugins (cartographer, dev banner, runtime error overlay)

**Utilities**
- date-fns - Date manipulation and formatting
- nanoid - Unique ID generation
- clsx - Conditional className utility

**Future Integration Placeholder**
- Square API for sales data import (environment variable SQUARE_API_KEY configured but not yet implemented)
- Manual sales entry form serves as fallback until API integration is complete