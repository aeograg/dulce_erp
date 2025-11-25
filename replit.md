# Dulce ERP

## Overview

Dulce ERP is a comprehensive bakery management system designed for efficient management of inventory, multi-store stock tracking, cost calculation, recipe management, and AI-powered delivery forecasting. It features role-based access control for Admin, Manager, and Staff, a two-stage stock entry workflow, automatic cost calculation from ingredient-only recipes, stock discrepancy detection, and waste tracking. The system aims to streamline bakery operations, reduce waste, and optimize delivery planning.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:** React with TypeScript, Vite, Wouter for routing, and path aliases.
**UI Component System:** shadcn/ui (New York style) with Radix UI, Tailwind CSS for styling, custom Material Design principles, responsive mobile-first approach, and theme support (light/dark mode).
**State Management:** TanStack Query for server state management and caching, Context API for authentication, and session-based authentication using HTTP-only cookies.
**Design Principles:** System-based design prioritizing data clarity, role-aware interfaces, mobile-optimized layouts, consistent spacing, and Inter/Source Sans Pro typography.

### Backend Architecture

**Server Framework:** Express.js with TypeScript, `express-session` for session management, and middleware for JSON parsing, URL encoding, and request logging.
**API Design Pattern:** RESTful API with consistent error handling and session management.
**Authentication & Authorization:** bcrypt for password hashing, session-based authentication, and role-based access control middleware for Admin, Manager, and Staff roles.
**Business Logic Layers:** Storage abstraction layer, automatic cost calculation (ingredient-only), stock discrepancy detection (>5% variance), waste tracking with cap validation, two-stage stock entry, AI-powered delivery forecasting based on historical sales, and role-based store assignment.

### Data Storage

**Database System:** PostgreSQL via Neon serverless database, with Drizzle ORM for type-safe queries and schema management.
**Schema Design:**
- **Users:** Authentication, role management, and store assignment.
- **Stores:** Multi-location support with delivery schedules.
- **Products:** Inventory items with unit cost, selling price, `batchYield`, `maxWastePercent`, and minimum stock levels.
- **Ingredients:** Recipe components with cost per unit.
- **Recipes:** Many-to-many relationship between products and ingredients.
- **StockEntries:** Daily stock tracking including staff-entered data (currentStock, waste), auto-calculated values (expectedRemaining, discrepancy), and sales data.
- **Sales:** Separate sales tracking table with date, store, product, quantity, unit price.
- **Deliveries:** Records of delivered quantities.
- **Inventory:** Store-specific inventory tracking with storeId column, supporting both production center and individual store inventories. Includes quantityInStock, quantityProduced, and automatic inventory updates on deliveries.
**Data Validation:** Zod schemas for runtime validation and Drizzle schema validation for database constraints, along with react-hook-form for frontend validation.
**Seeding Strategy:** Default users, pre-configured stores, sample products, and ingredients.

### Key Modules & Features

- **Product Costing:** Simplified model with `batchYield` for accurate unit cost calculation.
- **User Management:** Admin-only CRUD with store assignments.
- **Two-Stage Stock Entry:** Staff enters current stock/waste; Admin/Manager enters sales and delivery data.
- **Sales Data Entry Module:** Form-based daily sales entry, updates stock entries.
- **Delivery Module:** Form-based delivery entry, saves to `deliveries` table, automatically deducts from production center inventory AND adds to target store inventory, with validation for insufficient inventory.
- **Stock Control Module:** Comprehensive table view of all stock entries with delivered, current stock, waste, sales, expected remaining, and discrepancy %. Features filters, summary statistics, and color-coded discrepancy badges.
- **Remaining Stock Dashboard:** Real-time stock level monitoring across stores, displaying latest stock entry per product, low stock alerts, and grouped by store.
- **Inventory Module:** Store-specific inventory management with store selector dropdown (Admin/Manager only), production entry at Delahey production center, summary cards (total items, products, value), and auto-deduction/addition for deliveries between production center and stores.
- **Waste Management System:** `maxWastePercent` field in Product model, real-time waste percentage calculation, visual warnings, and color-coded validation.
- **Stock Entry Duplicate Prevention:** Server-side validation to prevent duplicate entries for the same date, product, and store.

- **Predetermined Delivery Feature**: Pre-configured delivery schedules for recurring store deliveries with editable quantities in a modal interface, automatically deducts from production center and adds to store inventory with inventory validation.

## External Dependencies

**Database & ORM:**
- `@neondatabase/serverless`: PostgreSQL serverless connection.
- `drizzle-orm`: TypeScript ORM.
- `drizzle-kit`: Schema migration tooling.
- `ws`: WebSocket library for Neon database connections.

**Authentication & Security:**
- `bcryptjs`: Password hashing.
- `express-session`: Server-side session management.

**UI Component Libraries:**
- `@radix-ui/*`: Unstyled, accessible UI primitives.
- `class-variance-authority`: Component variant utility.
- `tailwind-merge`: Tailwind class merging.
- `lucide-react`: Icon library.
- `cmdk`: Command palette component.

**Form Management:**
- `react-hook-form`: Form state management.
- `@hookform/resolvers`: Zod integration for form validation.
- `zod`: Schema validation library.

**Development Tools:**
- `tsx`: TypeScript execution.
- `esbuild`: JavaScript bundler.
- `@replit/vite-plugin-*`: Replit-specific plugins.

**Utilities:**
- `date-fns`: Date manipulation.
- `nanoid`: Unique ID generation.
- `clsx`: Conditional className utility.