# Tanawal Admin Portal

A modern admin portal for the Tanawal food delivery app built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Dashboard**: KPI cards, charts, and recent activity overview
- **Users Management**: View and manage app users with detailed information
- **Orders Management**: Track and manage food delivery orders
- **Modern UI**: Clean, responsive design with sky blue theme
- **Component-based**: Modular architecture using shadcn/ui components

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx          # Dashboard
│   ├── users/
│   │   └── page.tsx      # Users page
│   └── orders/
│       └── page.tsx      # Orders page
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   └── dashboard/        # Dashboard components
└── lib/
    └── utils.ts          # Utility functions
```

## Features Overview

### Dashboard
- Revenue and order statistics
- Interactive charts showing monthly trends
- Recent activity feed
- KPI cards with growth indicators

### Users Page
- User table with contact information
- User statistics and metrics
- Search and filter functionality
- Status management

### Orders Page
- Order tracking and management
- Order statistics and metrics
- Status updates and filtering
- Payment method tracking

## Customization

The app uses a sky blue color scheme that can be customized in:
- `tailwind.config.js` - Color definitions
- `src/app/globals.css` - CSS variables
- Component files - Individual styling

## Dummy Data

The application includes realistic dummy data for:
- User profiles and statistics
- Order history and tracking
- Revenue and growth metrics
- Restaurant and location data

## Development

- Run `npm run dev` for development
- Run `npm run build` for production build
- Run `npm run lint` for code linting

## License

Private project for Tanawal food delivery app.
