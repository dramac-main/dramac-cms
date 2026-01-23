# Product Context: What DRAMAC Actually Is

**Last Updated**: January 23, 2026  
**Based On**: Actual codebase analysis of database schema, routes, and features

## What DRAMAC Is

DRAMAC is a **multi-tenant SaaS platform** that combines:
1. **Website Builder** - Visual drag-and-drop page builder (Craft.js)
2. **Module Marketplace** - Browse, purchase, and install business modules
3. **Module Studio** - Build and publish custom modules
4. **Agency Dashboard** - Manage clients, sites, billing, and team
5. **Client Portal** - White-labeled client access to their sites and modules

## The Hierarchy

```
Super Admin (Platform level)
    └── Agency (Organization)
            ├── Team Members (agency_members)
            │   └── Roles: owner, admin, member
            ├── Clients
            │   └── Client Portal Access (optional)
            ├── Sites (one per client)
            │   ├── Pages (visual builder)
            │   ├── Blog (posts, categories)
            │   ├── SEO Settings
            │   ├── Form Submissions
            │   └── Installed Modules
            └── Module Subscriptions (agency pays)
```

## Actual Implemented Features

### 1. Agency Management
- **Multi-tenancy** - Agencies are isolated with RLS policies
- **Team members** - Invite users with roles (owner, admin, member)
- **Activity logging** - Track all actions
- **Branding** - Custom branding settings (`custom_branding` JSON field)
- **White-labeling** - `white_label_enabled` flag

### 2. Client Management
- **Client records** - Name, email, company, phone, notes, tags
- **Client portal** - Optional access with configurable permissions:
  - `can_edit_content` - Edit site content
  - `can_view_analytics` - View analytics
  - `can_view_invoices` - View billing
  - `has_portal_access` - Portal enabled
- **Site permissions** - Per-site granular access
- **Notifications** - Client-specific notifications

### 3. Website Builder
- **Sites** - Each site has subdomain (`{subdomain}.dramac.io`)
- **Custom domains** - Full domain support with verification
- **Pages** - Craft.js visual builder with JSON content
- **Templates** - Save and reuse page designs
- **SEO** - Meta tags, Open Graph, sitemap, robots.txt
- **Google/Facebook tracking** - Analytics and pixels

### 4. Blog System
- **Posts** - Full CMS with TipTap editor
- **Categories** - Organize posts
- **SEO per post** - Meta title, description, OG image
- **Scheduling** - Publish in future
- **Featured posts** - Highlight important content
- **Reading time** - Auto-calculated

### 5. Media Library
- **Assets** - Upload images, documents
- **Folders** - Organize media
- **Tagging** - Search by tags
- **Optimization** - Thumbnail URLs, dimensions tracked
- **Usage tracking** - Know where assets are used

### 6. Module Marketplace (modules_v2)

**Module Properties:**
- Name, description, icon, screenshots
- Category, tags, features list
- Version tracking (`current_version`)
- Install count, ratings, reviews
- Author info with verification
- Premium/free flag
- Install level: `agency`, `client`, or `site`

**Module Types:**
- `widget` - Simple embeddable component
- `app` - Multi-page application  
- `integration` - Third-party connector
- `system` - Full business application
- `custom` - Bespoke solution

**Module Pricing:**
- `free`, `one-time`, `monthly`, `yearly`
- Wholesale price (to agency)
- Suggested retail (to clients)
- LemonSqueezy integration for payments

### 7. Module Studio (module_source)

**Development Features:**
- Monaco code editor in browser
- Module files management
- Version control (`module_versions`)
- Dependencies tracking
- Module manifests (render mode, permissions, etc.)
- Test runs and results
- Deployment to marketplace

**Module Code Structure:**
- `render_code` - React component code
- `styles` - CSS/Tailwind
- `settings_schema` - Configuration options
- `api_routes` - Custom API endpoints
- `default_settings` - Initial config

### 8. Module Installation System

**Three Levels:**
1. **Agency Install** (`agency_module_installations`)
   - Agency subscribes to module
   - Gets subscription with LemonSqueezy
   - Controls max installations
   
2. **Client Install** (`client_module_installations`)
   - Agency enables for specific client
   - Can have custom pricing (markup)
   - Tracks billing per client
   
3. **Site Install** (`site_module_installations`)
   - Module active on specific site
   - Has its own settings
   - Links back to subscription

**Module Subscriptions:**
- Billing cycle (monthly/yearly)
- Markup system (percentage, fixed, or custom price)
- LemonSqueezy webhook integration
- Subscription status tracking

### 9. Module Infrastructure

**Database Isolation:**
- Per-module schemas (`mod_<short_id>`)
- `module_database_registry` tracks schemas
- Storage size and row counts
- Cleanup functions for orphaned data

**Module API System:**
- Custom API routes per module
- API key management with scopes
- Rate limiting per key
- Request logging and analytics

**Module Auth/Permissions:**
- Custom roles per module per site
- Permission definitions
- User role assignments
- Invitation system for module access

**Module Sessions:**
- Track anonymous users
- Device info, referrer
- Activity timestamps

**Module Data:**
- Key-value storage per module per site
- TTL/expiration support
- JSON data values

### 10. Module Analytics (EM-03)

**Tracking:**
- `module_usage_events` - Loads, actions, errors
- `module_analytics` - Aggregated stats
- `module_error_logs` - Error tracking
- Load time tracking
- Install/uninstall counts

### 11. Module Webhooks

**Incoming Webhooks:**
- Per-module webhook endpoints
- Signature verification (HMAC)
- Allowed sources whitelist
- Logging with request/response
- Failure tracking

### 12. Module Testing (EM-81B)

**Features:**
- `module_test_runs` - Test execution
- `module_test_results` - Individual results
- `test_site_configuration` - Test site settings
- `beta_enrollment` - Beta program
- Testing tiers support

### 13. Module Requests

**Community Features:**
- Submit module requests
- Vote on requests (upvotes)
- Assigned developer
- Track from request → built module
- Budget range, priority, status

### 14. Module Reviews

**Rating System:**
- 1-5 star ratings
- Written reviews
- Verified purchase flag
- Helpful count
- Moderation status

### 15. Billing (LemonSqueezy)

**Platform Subscriptions:**
- Agency subscription plans
- `subscriptions` table with LemonSqueezy IDs
- Invoices tracking

**Module Billing:**
- Per-module subscriptions
- Agency markup on retail pricing
- Client billing separate from agency

### 16. Forms System (Phase 82)

**Features:**
- Form submissions capture
- Form settings (notifications, rate limiting)
- Spam detection (honeypot)
- Webhook triggers
- Email notifications

### 17. SEO Tools (Phase 84)

**Features:**
- Site-level SEO settings
- Page-level meta/OG
- SEO audits with scores
- Robots.txt management
- Sitemap generation
- Google/Bing verification

### 18. Support System

**Features:**
- Support tickets from clients
- Ticket messages (conversation)
- Assignee tracking
- Priority and status
- Category organization

### 19. Notifications

**User Notifications:**
- System notifications
- Read/unread tracking
- Links to actions

**Notification Preferences:**
- Email toggles (billing, security, updates)
- Digest frequency

### 20. Admin Features

**Super Admin:**
- Manage all agencies
- View all users
- Module approval
- Platform analytics
- Audit logs

**Security:**
- Activity logging
- Audit trails
- Rate limiting
- RLS policies on all tables

## User Journeys (Actual)

### Agency Onboarding
```
1. Sign up → Create agency
2. Complete onboarding (goals, industry, team size)
3. Create first client
4. Create first site for client
5. Build pages with visual builder
6. Browse marketplace, install modules
7. Configure modules for site
8. Publish site
```

### Adding a Module
```
1. Agency browses marketplace
2. View module details, reviews, pricing
3. Click "Subscribe" → LemonSqueezy checkout
4. Module subscription created
5. Go to client's site settings
6. Enable module for that site
7. Configure module settings
8. Module renders on client site
```

### Building a Module (Studio)
```
1. Open Module Studio
2. Create new module or edit existing
3. Write render code (React)
4. Define settings schema
5. Add dependencies if needed
6. Test in sandbox
7. Create version
8. Deploy to marketplace (pending approval)
```

### Client Portal Access
```
1. Agency enables portal for client
2. Client receives invitation email
3. Client logs in to portal
4. Sees their sites and modules
5. Can edit content (if permitted)
6. Can view analytics (if permitted)
7. Can submit support tickets
```

## Technical Reality

### What Actually Works
- ✅ Multi-tenant agency/client/site hierarchy
- ✅ User auth with Supabase
- ✅ Role-based access control
- ✅ Visual page builder (Craft.js)
- ✅ Blog CMS (TipTap)
- ✅ Media library
- ✅ Module marketplace with categories
- ✅ Module Studio code editor
- ✅ Module versioning
- ✅ Module installation at agency/client/site levels
- ✅ Module subscriptions (LemonSqueezy)
- ✅ Module analytics tracking
- ✅ Module API gateway
- ✅ Module auth/permissions
- ✅ Module database isolation
- ✅ Module webhooks
- ✅ Module testing infrastructure
- ✅ Module reviews and ratings
- ✅ Module requests/voting
- ✅ SEO tools
- ✅ Form submissions
- ✅ Support tickets
- ✅ Client portal
- ✅ Custom domains
- ✅ External embedding (EM-31)

### What's Database-Ready But Needs UI/Logic
- ⚠️ Module dependency resolution
- ⚠️ Module events system (inter-module communication)
- ⚠️ Full beta program management
- ⚠️ Revenue dashboard for developers

### What's Planned But Not Built
- ⬜ Business modules (CRM, Booking, E-commerce)
- ⬜ Industry verticals
- ⬜ VS Code extension (packages exist)
- ⬜ CLI tools (packages exist)

## Target Users

### Primary: Digital Agencies
- 5-50 employees
- Manage multiple client websites
- Need modular features per client
- Want white-label capabilities
- Value efficiency and reusability

### Secondary: Agency Clients
- Small-medium businesses
- Need website + business tools
- Limited technical knowledge
- Access via client portal
- Pay agency for services

### Future: Module Developers
- Build custom modules
- Sell on marketplace
- Revenue sharing (70/30)
- Use Studio or VS Code SDK

## Pricing Structure (Implemented)

### Platform Tiers (agencies table `plan` field)
- **free** - Limited features
- **starter** - Basic tier
- **professional** - Full features
- **enterprise** - Custom

### Module Pricing (modules_v2)
- **free** - No cost
- **one-time** - Single payment
- **monthly** - Recurring monthly
- **yearly** - Annual with discount

### Module Markup (agency_module_subscriptions)
- Agencies buy at wholesale
- Set their own retail price
- Keep the margin
- `markup_type`: percentage, fixed, custom

## Integration Points

### LemonSqueezy (Primary Billing)
- Platform subscriptions
- Module subscriptions
- Order/invoice tracking
- Webhook for status updates

### Supabase
- Database (PostgreSQL)
- Authentication
- Row-level security
- Storage (media library)
- Realtime (future)

### Resend (Email)
- Transactional emails
- Handlebars templates
- Notification delivery

### External (EM-31)
- Domain allowlisting
- OAuth 2.0 for API access
- Embed SDK for external sites
- Webhooks for integrations

## Key Database Tables

### Core 15 Tables
1. `agencies` - Organizations
2. `profiles` - Users
3. `agency_members` - Team
4. `clients` - Agency's customers
5. `sites` - Websites
6. `pages` - Page content
7. `assets` - Media files
8. `modules_v2` - Marketplace catalog
9. `module_source` - Studio modules
10. `agency_module_subscriptions` - Module billing
11. `site_module_installations` - Module usage
12. `subscriptions` - Platform billing
13. `blog_posts` - Blog content
14. `form_submissions` - Form data
15. `support_tickets` - Help requests

### Module System Tables (~25)
Complete infrastructure for module lifecycle, permissions, analytics, webhooks, testing, and data storage.

## What Makes DRAMAC Different

1. **True Multi-Tenancy** - Not just user separation, but Agency→Client→Site hierarchy
2. **Module Marketplace** - Not just plugins, but full business applications
3. **Three-Level Install** - Agency, Client, or Site level modules
4. **Agency Markup** - Agencies profit from module resale
5. **Module Studio** - Build in browser with Monaco editor
6. **Database Isolation** - Each module can have own schema
7. **White-Label Ready** - Custom branding, domains, client portal
8. **External Embedding** - Modules work outside the platform

## Reality Check

This is a **sophisticated, production-grade platform** with:
- 70+ database tables
- Full RLS security model
- Complex billing flow
- Modular architecture
- Comprehensive analytics

It's NOT a simple website builder. It's closer to a **platform-as-a-service for agencies** that lets them build, customize, and resell software to their clients.

The vision of "Beyond GoHighLevel" is being realized through the module system - any business application can be a module, and agencies can mix and match to create custom solutions.
