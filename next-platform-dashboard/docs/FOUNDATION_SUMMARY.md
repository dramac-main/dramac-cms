# Foundation Summary

## Overview

The DRAMAC V2 foundation has been established across Phases 1-9. This document summarizes the technical foundation.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Styling | TailwindCSS 4 |
| Components | shadcn/ui + Radix |
| Forms | react-hook-form + Zod |
| State | TanStack Query |
| Hosting | Vercel |

## Database Schema

### Core Tables
- `organizations` - Agency/business accounts
- `users` - User profiles
- `organization_members` - User-org relationships
- `clients` - Client accounts (billable units)
- `sites` - Website projects
- `pages` - Site pages
- `page_content` - Craft.js JSON data

### Supporting Tables
- `modules` - Marketplace modules
- `client_modules` - Module installations
- `billing_events` - Usage tracking
- `media` - Uploaded files

## Authentication Flow

1. User signs up → Creates organization
2. Organization owner has super_admin role
3. Can invite team members (future)
4. Middleware protects dashboard routes

## Component Library

All components follow shadcn/ui patterns with Radix primitives:
- Fully accessible (ARIA)
- Keyboard navigable
- Theme-aware
- TypeScript typed

## Folder Structure

```
src/
├── app/           # Next.js App Router
├── components/    # React components
├── lib/           # Utilities & helpers
├── config/        # App configuration
└── types/         # TypeScript types
```

## Next Steps

With foundation complete, proceed to:
- Phase 11: Client Management
- Phase 12: Dashboard Statistics
- Phase 13: Site Management
