# Bakery ERP Design Guidelines

## Design Approach
**System-Based Design**: Clean, functional dashboard interface prioritizing data clarity and efficient workflows. Drawing from Material Design and modern admin panel patterns (Linear, Notion dashboards) for a professional, utility-focused experience.

## Core Design Principles
1. **Clarity First**: Data readability over visual flourish
2. **Role-Aware Interface**: Clear visual hierarchy based on user permissions
3. **Mobile-Optimized**: Touch-friendly controls, responsive tables
4. **Efficient Workflows**: Minimize clicks for common tasks

---

## Typography System
- **Headings**: Inter or Source Sans Pro (clean, readable)
  - H1: 2rem (32px) - Page titles
  - H2: 1.5rem (24px) - Section headers
  - H3: 1.25rem (20px) - Card/module titles
- **Body**: 1rem (16px) - Forms, tables, content
- **Small/Meta**: 0.875rem (14px) - Labels, timestamps, secondary info
- **Weights**: Regular (400) for body, Semibold (600) for headings, Medium (500) for labels

---

## Layout System
**Spacing Primitives**: Consistent use of Tailwind units: 2, 4, 8, 12, 16, 24
- Component padding: `p-4` to `p-6`
- Section spacing: `mb-8` between major sections
- Card spacing: `gap-4` in grids, `space-y-6` in stacks
- Form field spacing: `space-y-4`

**Grid Structure**:
- Desktop: Sidebar navigation (260px fixed) + main content area
- Tablet/Mobile: Collapsible hamburger menu + full-width content
- Dashboard cards: 1 col mobile, 2-3 cols tablet/desktop (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)

---

## Component Library

### Navigation
- **Sidebar (Desktop)**: Fixed left navigation with role-based menu items
  - Logo/brand at top
  - Grouped menu items (Inventory, Stock, Reports, Settings)
  - Active state indicator (border-left accent)
  - User info + logout at bottom
- **Mobile**: Top navbar with hamburger menu, slide-in drawer

### Dashboard Cards
- Rounded corners (`rounded-lg`)
- Subtle shadow (`shadow-md`)
- Padding: `p-6`
- **Alert Cards** (low stock, discrepancies):
  - Icon + title + metric + "View Details" link
  - Warning state with amber accent border-left
- **Stats Cards**: Large number + label + trend indicator

### Data Tables
- Striped rows for readability (`even:bg-gray-50`)
- Sticky header on scroll
- Sortable columns (clickable headers with sort icons)
- Responsive: Horizontal scroll on mobile OR card-based layout for critical tables
- Row hover state for interactivity
- Pagination controls (bottom center)
- Search/filter bar above table

### Forms
- **Input Fields**: 
  - Full-width with clear labels above
  - Placeholder text for guidance
  - Spacing: `space-y-4` between fields
  - Required field indicator (*)
- **Buttons**:
  - Primary: Solid, medium size (`px-6 py-2.5`)
  - Secondary: Outline style
  - Destructive: Red for delete actions
  - Grouping: Inline for related actions (Save/Cancel)
- **Date Pickers**: Calendar dropdown
- **Dropdowns/Selects**: Custom styled with chevron icon

### Modals/Dialogs
- Centered overlay for forms (Add Product, Stock Entry)
- Max-width: `max-w-2xl` for multi-field forms
- Header with title + close button
- Footer with action buttons (right-aligned)

### Alerts/Notifications
- Toast notifications (top-right) for success/error messages
- Inline alerts for form validation errors
- Dashboard alert banners for critical issues

---

## Page Layouts

### Login Page
- Centered card design (`max-w-md` centered)
- Logo + title "Bakery ERP"
- Simple email/password form
- No distracting backgrounds - clean, focused

### Dashboard (Role-Specific)
- **Admin/Manager**: 3-column grid of alert/stat cards, recent activity table
- **Staff**: Simplified view with quick stock entry form, today's assignments
- Low-stock alerts prominent at top
- Recent discrepancies section

### Inventory Management
- Search bar + "Add Product" button (top-right)
- Filterable product table (name, unit cost, selling price, stock level, actions)
- Inline edit or modal for updates

### Stock Entry (Staff Daily Input)
- Step-by-step form or single-page with clear sections
- Date picker (defaults to today)
- Store selector (radio buttons or dropdown)
- Product rows with: Delivered qty, Current stock, Waste % (max 3%)
- Auto-calculated fields (Expected, Discrepancy) - read-only, highlighted if >5%
- Submit button with confirmation

### Reports Page
- Filter panel (date range, store, product)
- Export button (CSV/PDF)
- Results table with sortable columns
- Visual indicators for discrepancies (red highlight for >5%)

---

## Visual Hierarchy
- Page title always at top-left of content area
- Primary actions (Add, Create, Submit) - top-right positioning
- Critical alerts/warnings - top of page, visually distinct
- Tables - central focus with ample whitespace
- Secondary actions/filters - above or aside from main content

---

## Mobile Optimization
- Touch-friendly button sizing (min 44px height)
- Responsive tables: Stack or horizontal scroll with visible scroll indicator
- Collapsible sections for long forms
- Bottom-sheet style modals for mobile
- Fixed bottom action bar for primary buttons on mobile forms

---

## Accessibility
- WCAG AA contrast ratios
- Focus states on all interactive elements (visible outline)
- Aria labels for icon-only buttons
- Form field labels always visible
- Keyboard navigation support

---

## Animations
**Minimal, Functional Only**:
- Page transitions: None (instant)
- Modal open/close: Simple fade-in (150ms)
- Dropdown menus: Slide-down (100ms)
- Loading states: Spinner for data fetching
- No decorative animations

---

## Key UX Patterns
- **Confirmation for destructive actions**: Delete product → modal confirmation
- **Auto-save indicators**: Forms show "Saved" timestamp
- **Inline validation**: Real-time feedback on form inputs
- **Breadcrumbs**: For nested views (Reports > Stock Summary > Store 1)
- **Empty states**: Helpful messages + action prompts when tables are empty

---

## Images
**No hero images needed** - this is a functional dashboard application. Use icons throughout (Material Icons or Heroicons via CDN) for:
- Navigation menu items
- Alert cards (warning triangle, check circle)
- Table action buttons (edit, delete, view)
- Empty state illustrations (optional, simple line art)