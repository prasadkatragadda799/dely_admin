# Dely Admin Panel

Admin dashboard for managing the Dely B2B grocery mobile app. This web-based admin panel provides comprehensive control over products, orders, users, companies, categories, offers, KYC verifications, and analytics.

## Features

- **Dashboard**: Overview of key metrics, revenue charts, and recent activity
- **Product Management**: Full CRUD operations with bulk actions, image upload, and stock management
- **Order Management**: Order tracking, status updates, and invoice generation
- **User Management**: User accounts, KYC verification, and activity tracking
- **Companies & Brands**: Manage companies and their associated brands
- **Categories**: Hierarchical category management with icons and colors
- **Offers & Promotions**: Create and manage promotional offers (banner, text, company)
- **KYC Verification**: Review and verify business KYC submissions
- **Analytics**: Comprehensive reports and charts for revenue, products, users, and orders
- **Settings**: Configure payment, delivery, tax, notifications, and admin users

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: Tailwind CSS
- **Components**: shadcn/ui
- **Charts**: Recharts
- **Routing**: React Router
- **State Management**: React Query
- **Forms**: React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js 18+ and npm (or use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

### Installation

```sh
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

### Build for Production

```sh
# Build the project
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── layout/       # Layout components (Header, Sidebar, etc.)
│   └── ui/           # shadcn/ui components
├── contexts/         # React contexts (Auth, etc.)
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── pages/            # Page components
│   ├── Dashboard.tsx
│   ├── Products.tsx
│   ├── Orders.tsx
│   ├── UsersPage.tsx
│   ├── Categories.tsx
│   ├── Companies.tsx
│   ├── Offers.tsx
│   ├── KYC.tsx
│   ├── Analytics.tsx
│   └── Settings.tsx
└── App.tsx           # Main app component with routing
```

## Design System

The admin panel follows a blue-white minimal theme:

- **Primary Color**: #1E6DD8 (Deep Blue)
- **Background**: White with light blue accents
- **Typography**: Inter font family
- **Components**: Modern, clean design with consistent spacing and shadows

## Authentication

The admin panel includes a demo authentication system. Default credentials:

- **Super Admin**: `admin@dely.com` / `admin123`
- **Manager**: `manager@dely.com` / `manager123`

## Development

### Code Style

- ESLint is configured for code quality
- TypeScript for type safety
- Follow React best practices and component patterns

### Adding New Features

1. Create new page components in `src/pages/`
2. Add routes in `src/App.tsx`
3. Update sidebar navigation in `src/components/layout/AdminSidebar.tsx`
4. Follow existing patterns for consistency

## License

Private project - All rights reserved
