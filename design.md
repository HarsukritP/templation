# 🎨 Templation Web App Design

## Design Philosophy
Clean, modern interface inspired by firecrawl.dev with dark theme and accent colors, focusing on developer experience and efficient template management.

## Tech Stack
- **Framework**: Next.js (App Router)
- **UI Library**: shadcn/ui components
- **Styling**: Tailwind CSS
- **Icons**: Lucide icons
- **Authentication**: Auth0
- **State Management**: React Query + Context API

## Color Palette
```
Primary: #6366F1 (indigo-500)
Secondary: #8B5CF6 (violet-500)
Accent: #EC4899 (pink-500)
Background: #09090B (slate-950)
Foreground: #FAFAFA (slate-50)
Card Background: #18181B (slate-900)
Border: #27272A (slate-800)
```

## Typography
```
Headings: Inter (600)
Body: Inter (400)
Code: JetBrains Mono (400)
```

## Layout Structure

```
+-------------------------------------------------------+
|  NAVBAR                                          USER |
+-------------------------------------------------------+
|                                                       |
|  +-------------------+  +-------------------------+   |
|  |                   |  |                         |   |
|  |  SIDEBAR          |  |  MAIN CONTENT          |   |
|  |                   |  |                         |   |
|  |  • Dashboard      |  |                         |   |
|  |  • Templates      |  |                         |   |
|  |  • Setup          |  |                         |   |
|  |  • Account        |  |                         |   |
|  |                   |  |                         |   |
|  |                   |  |                         |   |
|  +-------------------+  +-------------------------+   |
|                                                       |
+-------------------------------------------------------+
```

## Page Designs

### 1. Dashboard (Home)
```
+-------------------------------------------------------+
|  NAVBAR                                          USER |
+-------------------------------------------------------+
|                                                       |
|  +-------------------+  +-------------------------+   |
|  |                   |  | DASHBOARD               |   |
|  |  SIDEBAR          |  |                         |   |
|  |                   |  | Recent Templates        |   |
|  |                   |  | +-----+ +-----+ +-----+ |   |
|  |                   |  | |     | |     | |     | |   |
|  |                   |  | +-----+ +-----+ +-----+ |   |
|  |                   |  |                         |   |
|  |                   |  | Quick Actions           |   |
|  |                   |  | [Search] [Convert]      |   |
|  |                   |  |                         |   |
|  |                   |  | API Key Status          |   |
|  |                   |  | [••••••••] [Regenerate] |   |
|  |                   |  |                         |   |
|  +-------------------+  +-------------------------+   |
|                                                       |
+-------------------------------------------------------+
```

### 2. Template Library
```
+-------------------------------------------------------+
|  NAVBAR                                          USER |
+-------------------------------------------------------+
|                                                       |
|  +-------------------+  +-------------------------+   |
|  |                   |  | TEMPLATES               |   |
|  |  SIDEBAR          |  |                         |   |
|  |                   |  | [Search]  [Filters ▼]   |   |
|  |                   |  |                         |   |
|  |                   |  | +-----+  +-----+        |   |
|  |                   |  | |     |  |     |        |   |
|  |                   |  | | Img |  | Img |        |   |
|  |                   |  | |     |  |     |        |   |
|  |                   |  | +-----+  +-----+        |   |
|  |                   |  | Title     Title         |   |
|  |                   |  | Tech      Tech          |   |
|  |                   |  |                         |   |
|  |                   |  | +-----+  +-----+        |   |
|  +-------------------+  +-------------------------+   |
|                                                       |
+-------------------------------------------------------+
```

### 3. Template Detail View
```
+-------------------------------------------------------+
|  NAVBAR                                          USER |
+-------------------------------------------------------+
|                                                       |
|  +-------------------+  +-------------------------+   |
|  |                   |  | TEMPLATE: React Portfolio   |
|  |  SIDEBAR          |  |                         |   |
|  |                   |  | +---------------------+ |   |
|  |                   |  | |                     | |   |
|  |                   |  | |  Screenshot         | |   |
|  |                   |  | |                     | |   |
|  |                   |  | +---------------------+ |   |
|  |                   |  |                         |   |
|  |                   |  | Tech: React, Tailwind   |   |
|  |                   |  | Source: github.com/...  |   |
|  |                   |  |                         |   |
|  |                   |  | [Recreate] [Customize]  |   |
|  +-------------------+  +-------------------------+   |
|                                                       |
+-------------------------------------------------------+
```

### 4. Setup Guide
```
+-------------------------------------------------------+
|  NAVBAR                                          USER |
+-------------------------------------------------------+
|                                                       |
|  +-------------------+  +-------------------------+   |
|  |                   |  | SETUP GUIDE             |   |
|  |  SIDEBAR          |  |                         |   |
|  |                   |  | 1. Install MCP Server   |   |
|  |                   |  | ```                     |   |
|  |                   |  | npx @templation/mcp...  |   |
|  |                   |  | ```                     |   |
|  |                   |  |                         |   |
|  |                   |  | 2. Configure mcp.json   |   |
|  |                   |  | ```                     |   |
|  |                   |  | {                       |   |
|  |                   |  |   "mcpServers": {...}   |   |
|  |                   |  | }                       |   |
|  +-------------------+  +-------------------------+   |
|                                                       |
+-------------------------------------------------------+
```

### 5. Account Settings
```
+-------------------------------------------------------+
|  NAVBAR                                          USER |
+-------------------------------------------------------+
|                                                       |
|  +-------------------+  +-------------------------+   |
|  |                   |  | ACCOUNT                 |   |
|  |  SIDEBAR          |  |                         |   |
|  |                   |  | Profile                 |   |
|  |                   |  | Name: [John Doe       ] |   |
|  |                   |  | Email: [j.doe@mail.com] |   |
|  |                   |  |                         |   |
|  |                   |  | GitHub Integration      |   |
|  |                   |  | Status: Connected ✓     |   |
|  |                   |  | Username: johndoe       |   |
|  |                   |  | [Manage Repositories]   |   |
|  |                   |  | [View Coding Analysis]  |   |
|  |                   |  |                         |   |
|  |                   |  | API Keys                |   |
|  |                   |  | Current: ••••••••••••   |   |
|  |                   |  | [Regenerate Key]        |   |
|  |                   |  |                         |   |
|  |                   |  | Connected Services      |   |
|  |                   |  | [Manage Integrations]   |   |
|  +-------------------+  +-------------------------+   |
|                                                       |
+-------------------------------------------------------+
```

## Component Library (shadcn/ui)

### Core Components
1. **Layout Components**
   - Sheet (for sidebar on mobile)
   - Separator
   - Tabs (for content organization)
   - Card (for template items)

2. **Input Components**
   - Button (primary, secondary, ghost variants)
   - Input (for search, form fields)
   - Select (for filters)
   - Checkbox (for filter options)
   - Form (with React Hook Form integration)

3. **Display Components**
   - Avatar (for user profile)
   - Badge (for tech stack tags)
   - Tooltip (for additional information)
   - Toast (for notifications)
   - Dialog (for confirmations)

4. **Navigation Components**
   - Navigation Menu (for main navigation)
   - Dropdown Menu (for user menu)
   - Pagination (for template browsing)

## Key UI Patterns

### Template Card
```
+-------------------------+
|                         |
|      Screenshot         |
|                         |
+-------------------------+
| Template Name           |
| Description text...     |
+-------------------------+
| React | TypeScript | ... |
+-------------------------+
| [View] [Recreate]       |
+-------------------------+
```

### Search with Filters
```
+--------------------------------------+
| Search templates...    | Filters ▼ | |
+--------------------------------------+
| ☑ React  | ☑ TypeScript | ☐ Vue     |
| ☐ Beginner | ☑ Intermediate | ☐ Adv |
+--------------------------------------+
```

### API Key Display
```
+--------------------------------------+
| Your API Key                         |
| abc123•••••••••••••••••••••••        |
| [Show] [Copy] [Regenerate]           |
+--------------------------------------+
```

### GitHub Integration Section
```
+--------------------------------------+
| GitHub Integration                   |
+--------------------------------------+
| Status: Connected ✓                  |
| Username: johndoe                    |
| Repositories: 24 available           |
|                                      |
| [Manage Repositories]                |
| [View Coding Analysis]               |
| [Disconnect]                         |
+--------------------------------------+
```

## Responsive Design
- Mobile-first approach
- Sidebar collapses to sheet component on mobile
- Template cards stack vertically on smaller screens
- Simplified navigation via hamburger menu on mobile
- Touch-friendly UI elements

## Animation Guidelines
- Subtle transitions between pages (150-200ms)
- Hover effects on interactive elements
- Loading states with skeleton components
- Toast notifications slide in from top-right

## Accessibility Features
- Proper heading hierarchy
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast ratio meeting WCAG AA standards
- Focus indicators for keyboard users

## Dark Mode Implementation
- Default dark theme with option for light mode
- System preference detection
- Persistent theme preference in local storage
- Smooth transition between themes

## Next Steps for Full Project Scope
1. Add visualization components for GitHub analysis in Account page
2. Implement advanced filtering and sorting for templates
3. Create template customization interface
4. Add collaborative features for team templates
5. Implement template marketplace UI

## Implementation Notes
1. Use Next.js App Router for efficient page routing
2. Install shadcn/ui components as needed using the CLI
3. Maintain consistent spacing with Tailwind's spacing scale
4. Use CSS variables for theme customization
5. Implement responsive breakpoints at sm, md, lg, xl 