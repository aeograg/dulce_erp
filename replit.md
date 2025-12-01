# Dulce ERP

## Overview

Dulce ERP is a comprehensive bakery management system designed for efficient management of inventory, multi-store stock tracking, cost calculation, recipe management, and AI-powered delivery forecasting. It features role-based access control for Admin, Manager, and Staff, a two-stage stock entry workflow, automatic cost calculation from ingredient-only recipes, stock discrepancy detection, and waste tracking. The system aims to streamline bakery operations, reduce waste, and optimize delivery planning.

## Recent Changes

**December 1, 2025 - Stock Control Improvements & Auto Sales Deduction**
- Updated Stock Control module to display "Inventory Stock" instead of "Delivered" column
- Changed Expected Stock formula to: Inventory Stock - sales - waste (uses store's inventory as baseline)
- Added auto-deduction of sales from store inventory when sales data is entered
- Sales validation checks inventory as-of the sale date, preventing overselling
- Success toast now confirms "Inventory has been updated automatically"
- Added `getInventoryAsOfDate` method for historical inventory lookups
- Removed product code column from Products table display
- Note: For backdated sales, subsequent inventory entries are not automatically recalculated

**November 26, 2025 - Needs List Multi-Item Support & Form Fixes**
- Added `items` column (JSON text array) to `needs_requests` table for multi-item support per request
- Migrated existing single-item records to new array format (itemId, itemName, quantity preserved in legacy columns)
- Fixed sticky zeros issue in number inputs by changing `step="0.01/0.001"` to `step="any"` across all form fields:
  - product-form.tsx: unitCost, sellingPrice, maxWastePercent
  - ingredients.tsx: costPerUnit
  - recipes.tsx: ingredient quantity
  - needs-list.tsx: item quantity
- Schema updated with backwards-compatible columns for gradual migration

**November 25, 2025 - Audit Fields Implementation (COMPLETED)**
- Added comprehensive audit tracking to all 11 database tables: `createdBy`, `createdAt`, `updatedAt`
- Tables updated: users, stores, products, ingredients, recipes, stock_entries, deliveries, sales, inventory, predetermined_deliveries, session
- Database migrations applied successfully with Drizzle Kit
- Backend storage layer updated to capture `username` from session and store in `createdBy` field
- API routes updated to pass authenticated user's username to all create/update operations
- Session management enhanced to store `username` alongside existing `userId`, `userRole`, `userStoreId`
- All timestamps auto-managed by PostgreSQL defaults (`defaultNow()` for creation, `defaultNow().onUpdateNow()` for updates)
- Feature enables CRUD audit trails for compliance and debugging

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
- **Sales Data Entry Module:** Form-based daily sales entry, automatically deducts from store inventory, validates against available stock as-of sale date, and shows success confirmation.
- **Delivery Module:** Form-based delivery entry, saves to `deliveries` table, automatically deducts from production center inventory AND adds to target store inventory, with validation for insufficient inventory.
- **Stock Control Module:** Comprehensive table view of all stock entries with inventory stock, current stock, waste, sales, expected remaining (Inventory Stock - sales - waste), and discrepancy %. Features filters, summary statistics, and color-coded discrepancy badges.
- **Remaining Stock Dashboard:** Real-time stock level monitoring across stores, displaying latest stock entry per product, low stock alerts, and grouped by store.
- **Inventory Module:** Store-specific inventory management with store selector dropdown (Admin/Manager only), production entry at Delahey production center, summary cards (total items, products, value), and auto-deduction/addition for deliveries between production center and stores.
- **Waste Management System:** `maxWastePercent` field in Product model, real-time waste percentage calculation, visual warnings, and color-coded validation.
- **Stock Entry Duplicate Prevention:** Server-side validation to prevent duplicate entries for the same date, product, and store.

- **Predetermined Delivery Feature**: Pre-configured delivery schedules for recurring store deliveries with editable quantities in a modal interface, automatically deducts from production center and adds to store inventory with inventory validation.

- **Audit Fields (createdBy, createdAt, updatedAt)**: Comprehensive CRUD tracking on all major tables. `createdBy` captures the username of who created each record, `createdAt` and `updatedAt` track timestamps for compliance and debugging. Automatically populated via session-based user identification and database defaults.

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