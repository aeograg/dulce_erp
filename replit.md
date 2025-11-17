# Bakery ERP System

## Overview

A comprehensive bakery ERP web application for managing inventory, multi-store stock tracking, cost calculation, recipe management, and delivery forecasting with role-based access control. Built with modern web technologies, the system serves three user roles (Admin, Manager, Staff) with different permission levels. Features a two-stage stock entry workflow where Staff inputs end-of-day data (current stock, waste) for their assigned store, then Admin/Manager later adds delivered quantities and sales figures. Includes automatic cost calculation from ingredient-only recipes, stock discrepancy detection (>5% threshold), waste tracking, and AI-powered delivery planning based on historical sales data.

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
- Automatic cost calculation based on recipe ingredients only (labor/overhead costs removed)
- Stock discrepancy detection (alerts when >5% variance from expected)
- Waste tracking with 3% cap validation
- Two-stage stock entry workflow: Staff enters current_stock/waste, Admin/Manager adds delivered/sales
- Delivery forecasting engine analyzing historical sales patterns and store-specific delivery schedules
- Role-based store assignment (Staff restricted to their assigned store)

### Data Storage

**Database System**
- PostgreSQL via Neon serverless database
- Drizzle ORM for type-safe database queries and schema management
- WebSocket connection for serverless database access

**Schema Design**
- **Users**: Authentication, role management (Admin, Manager, Staff), and optional store assignment
- **Stores**: Multi-location support with delivery schedules (daily, every-2-days, every-3-days)
- **Products**: Core inventory items with unit cost (auto-calculated from recipes), selling price, and minimum stock levels
- **Ingredients**: Recipe components with cost per unit and measurement unit
- **Recipes**: Many-to-many relationship between products and ingredients with quantities for cost calculation
- **StockEntries**: Daily stock tracking with:
  - Staff-entered: currentStock, waste (end-of-day counts)
  - Auto-calculated: expectedRemaining, discrepancy percentage
- **Sales**: Separate sales tracking table with date, store, product, quantity, unit price, source (manual/square)
- **Deliveries**: Delivery records with date, store, product, quantitySent
- **Inventory**: Production center inventory with date, product, quantityInStock, quantityProduced, notes

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

## Feature Implementation Status

**Completed Features**
- ✅ Simplified product costing model (ingredient costs only, auto-calculated from recipes)
- ✅ User management with store assignments (Admin-only CRUD operations)
- ✅ Two-stage stock entry workflow (Staff enters stock/waste, Admin/Manager enters sales via Sales Data Entry)
- ✅ **Sales Data Entry Module** - Easy daily sales entry form with separate sales table
- ✅ **Delivery Module** - Dedicated delivery entry screen with auto-inventory deduction
- ✅ **Stock Control Module** - Comprehensive stock entry viewer with aggregated sales and delivery data
- ✅ **Remaining Stock Dashboard** - Real-time stock level monitoring with low stock alerts grouped by store
- ✅ **Inventory Module** - Production center inventory management with production recording and forecasting
- ✅ Delivery forecasting based on historical sales patterns
- ✅ Role-based access control with store restrictions for Staff
- ✅ Automatic discrepancy detection and flagging (>5% threshold)
- ✅ Recipe-based cost calculation with real-time updates
- ✅ Multi-store inventory tracking
- ✅ Dashboard with alerts for low stock and discrepancies

**New Modules (Added Nov 16-17, 2025)**

1. **Sales Data Entry Module** (`/sales-data-entry` - Admin/Manager only) - *Replaces Stock Update*
   - Form-based daily sales entry with date selector (defaults to today)
   - Store selector dropdown
   - Dynamic product list showing all products with quantity input fields
   - Only allows sales entry for products with existing stock entries for selected date/store
   - Updates stock_entries table with sales data
   - Sequential API calls with error handling
   - Prepared for future Square POS integration
   - Clear/reset functionality for convenience

2. **Delivery Module** (`/deliveries` - Admin/Manager only)
   - Form-based delivery entry with date selector (defaults to today)
   - Store selector dropdown
   - Dynamic product list with quantity input fields (integer, defaults to 0)
   - Saves to `deliveries` table with date, storeId, productId, and quantitySent
   - Recent deliveries list showing last 10 entries
   - Batch validation and sequential error handling

3. **Stock Control Module** (`/stock-control` - Admin/Manager only)
   - Comprehensive table view of all stock entries
   - Columns: date, store, product, **delivered (from deliveries module)**, current stock, waste, sales, expected remaining, discrepancy %
   - Filters: date picker and store dropdown
   - Summary statistics cards: total entries, high discrepancies (>=5%), total waste
   - Color-coded discrepancy badges (destructive for >=5%)
   - Loading states and empty state handling

4. **Remaining Stock Dashboard** (`/remaining-stock` - Admin/Manager only)
   - Real-time stock level monitoring across all stores
   - Displays latest stock entry per product per store
   - Columns: product, reported remaining (current stock), expected remaining (calculated), min stock level, status
   - Low stock alerts with badge indicators
   - Grouped by store for easy navigation
   - Summary cards: total products, low stock alerts, stores monitored
   - Loading states and empty state messaging

5. **Inventory Module** (`/inventory` - Admin/Manager only) (Added Nov 17, 2025)
   - **Production Entry Section**
     - Form to record daily/weekly production at production center
     - Automatically adds produced quantity to inventory stock
     - Recent production history showing last 10 entries
     - Validation prevents zero or negative production quantities
   - **Inventory Stock Levels Section**
     - Simple table showing current stock levels for all products
     - Displays product name, current stock, unit cost, and total value
     - Clean, focused view without forecast calculations
   - **Auto-Deduction Integration**
     - Deliveries automatically deduct from production center inventory
     - Prevents over-delivery with insufficient inventory validation
     - Clear error messages when delivery exceeds available stock
   - **Data Model**
     - `inventory` table tracks: date, productId, quantityInStock, quantityProduced, notes
     - Cumulative stock tracking (each entry shows total available inventory)
     - Production center uses first store or dedicated production center entry

**Future Enhancement Opportunities**
- Square API integration for automated sales data import
- Advanced reporting with custom date ranges and export functionality
- Email notifications for critical alerts (low stock, high discrepancies)
- Mobile-optimized interface for field staff
- Batch stock entry for multiple products at once
- Integration between Delivery Module and Stock Entry (auto-populate delivered quantities)