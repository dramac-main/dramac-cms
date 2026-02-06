# Phase AWD-02: Data Context System

> **Priority**: 🔴 HIGH
> **Estimated Time**: 8-10 hours
> **Prerequisites**: AWD-01 Complete
> **Status**: 📋 READY TO IMPLEMENT

---

## ⚠️ BEFORE YOU BEGIN

**REQUIRED READING**: Before implementing this phase, you MUST read:

1. **[PHASE-AWD-CONTEXT.md](./PHASE-AWD-CONTEXT.md)** - Project structure, tech stack, database schema
2. **Memory Bank**: `/memory-bank/systemPatterns.md` - Architecture decisions
3. **Database Schema**: See PHASE-AWD-CONTEXT.md for full SQL definitions

**This phase CAN be implemented after AWD-01** - it reads from database to provide AI context.

---

## 📁 Files To Create

| File | Purpose |
|------|--------|
| `next-platform-dashboard/src/lib/ai/website-designer/data-context/types.ts` | Type definitions |
| `next-platform-dashboard/src/lib/ai/website-designer/data-context/builder.ts` | Main DataContextBuilder class |
| `next-platform-dashboard/src/lib/ai/website-designer/data-context/formatter.ts` | Format context for AI |
| `next-platform-dashboard/src/lib/ai/website-designer/data-context/checker.ts` | Check for missing data |
| `next-platform-dashboard/src/lib/ai/website-designer/data-context/index.ts` | Public exports |

---

## 🔧 Implementation Pattern

```typescript
// Use server-side Supabase client
import { createClient } from "@/lib/supabase/server";

// All data fetching is server-side
export async function buildDataContext(siteId: string): Promise<BusinessDataContext> {
  const supabase = await createClient();
  
  // Fetch all related data in parallel
  const [site, branding, client, ...] = await Promise.all([
    supabase.from("sites").select("*").eq("id", siteId).single(),
    supabase.from("site_branding").select("*").eq("site_id", siteId).single(),
    // ... more queries
  ]);
  
  return { site: site.data, branding: branding.data, /* ... */ };
}
```

---

## 🎯 Objective

Create a comprehensive **Data Context System** that automatically pulls business information from existing database tables to provide the AI Website Designer with complete knowledge of the client/site being designed.

**Principle:** The AI should NEVER ask for information that already exists in the database.

---

## 📊 Data Sources

### Primary Data Tables

```typescript
// Sources the AI will pull from automatically
interface DataSources {
  // 1. SITE DATA
  site: {
    table: "sites",
    fields: ["id", "name", "domain", "settings", "seo_title", "seo_description", "analytics_id"],
    use: "Domain, SEO defaults, site configuration",
  };
  
  // 2. SITE BRANDING
  branding: {
    table: "site_branding",
    fields: ["business_name", "logo_url", "logo_dark_url", "favicon_url", "primary_color", "secondary_color", "accent_color", "font_heading", "font_body"],
    use: "Logo, colors, fonts, business name",
  };
  
  // 3. CLIENT DATA
  client: {
    table: "clients",
    fields: ["company", "name", "email", "phone", "website", "industry", "notes", "address", "city", "state", "country"],
    use: "Contact info, business details, location",
  };
  
  // 4. AGENCY DATA
  agency: {
    table: "agencies",
    fields: ["name", "logo_url", "branding"],
    use: "White-label branding",
  };
  
  // 5. SOCIAL LINKS
  socialLinks: {
    table: "site_social_links",
    fields: ["platform", "url", "display_order"],
    use: "Social media footer/header links",
  };
  
  // 6. BUSINESS HOURS
  businessHours: {
    table: "site_business_hours",
    fields: ["day", "open_time", "close_time", "is_closed"],
    use: "Contact page, footer hours",
  };
  
  // 7. LOCATIONS
  locations: {
    table: "site_locations",
    fields: ["name", "address", "city", "state", "zip", "country", "phone", "email", "lat", "lng", "is_primary"],
    use: "Multi-location businesses, maps",
  };
  
  // 8. TESTIMONIALS
  testimonials: {
    table: "site_testimonials", // Or CRM if available
    fields: ["name", "company", "role", "content", "rating", "image_url", "featured"],
    use: "Testimonials section auto-populate",
  };
  
  // 9. TEAM MEMBERS
  team: {
    table: "site_team_members",
    fields: ["name", "role", "bio", "image_url", "email", "phone", "social_links", "display_order"],
    use: "Team section auto-populate",
  };
  
  // 10. SERVICES/PRODUCTS
  services: {
    table: "site_services", // Or ecommerce products
    fields: ["name", "description", "price", "image_url", "features", "category"],
    use: "Services/pricing sections",
  };
  
  // 11. PORTFOLIO/PROJECTS
  portfolio: {
    table: "site_portfolio",
    fields: ["title", "description", "image_url", "gallery", "client", "category", "date", "link"],
    use: "Portfolio/case studies sections",
  };
  
  // 12. BLOG/CONTENT
  blog: {
    table: "posts",
    fields: ["title", "excerpt", "featured_image", "category", "author", "published_at"],
    use: "Blog section, recent posts",
  };
  
  // 13. FAQ
  faq: {
    table: "site_faq",
    fields: ["question", "answer", "category", "display_order"],
    use: "FAQ section auto-populate",
  };
}
```

---

## 🏗️ Architecture

### 1. Data Context Builder

```typescript
// src/lib/ai/website-designer/data-context-builder.ts

import { createClient } from "@/lib/supabase/server";

export interface BusinessDataContext {
  site: SiteData;
  branding: BrandingData;
  client: ClientData;
  contact: ContactData;
  social: SocialLink[];
  hours: BusinessHours[];
  locations: Location[];
  testimonials: Testimonial[];
  team: TeamMember[];
  services: Service[];
  portfolio: PortfolioItem[];
  blog: BlogPost[];
  faq: FAQItem[];
  modules: EnabledModule[];
}

export async function buildDataContext(siteId: string): Promise<BusinessDataContext> {
  const supabase = await createClient();
  
  // Parallel fetch all data sources
  const [
    { data: site },
    { data: branding },
    { data: client },
    { data: social },
    { data: hours },
    { data: locations },
    { data: testimonials },
    { data: team },
    { data: services },
    { data: portfolio },
    { data: blog },
    { data: faq },
    { data: modules },
  ] = await Promise.all([
    supabase.from("sites").select("*, agencies(*)").eq("id", siteId).single(),
    supabase.from("site_branding").select("*").eq("site_id", siteId).single(),
    supabase.from("clients").select("*").eq("id", site?.client_id).single(),
    supabase.from("site_social_links").select("*").eq("site_id", siteId),
    supabase.from("site_business_hours").select("*").eq("site_id", siteId),
    supabase.from("site_locations").select("*").eq("site_id", siteId),
    supabase.from("site_testimonials").select("*").eq("site_id", siteId).limit(20),
    supabase.from("site_team_members").select("*").eq("site_id", siteId).order("display_order"),
    supabase.from("site_services").select("*").eq("site_id", siteId),
    supabase.from("site_portfolio").select("*").eq("site_id", siteId).limit(20),
    supabase.from("posts").select("*").eq("site_id", siteId).eq("status", "published").limit(10),
    supabase.from("site_faq").select("*").eq("site_id", siteId),
    supabase.from("site_modules").select("*").eq("site_id", siteId).eq("enabled", true),
  ]);
  
  // Build contact object from multiple sources
  const contact: ContactData = {
    email: client?.email || locations?.[0]?.email,
    phone: client?.phone || locations?.[0]?.phone,
    address: {
      street: client?.address || locations?.[0]?.address,
      city: client?.city || locations?.[0]?.city,
      state: client?.state || locations?.[0]?.state,
      zip: client?.zip || locations?.[0]?.zip,
      country: client?.country || locations?.[0]?.country,
    },
    mapCoordinates: locations?.[0] ? {
      lat: locations[0].lat,
      lng: locations[0].lng,
    } : null,
  };
  
  return {
    site: site || {},
    branding: branding || {},
    client: client || {},
    contact,
    social: social || [],
    hours: hours || [],
    locations: locations || [],
    testimonials: testimonials || [],
    team: team || [],
    services: services || [],
    portfolio: portfolio || [],
    blog: blog || [],
    faq: faq || [],
    modules: modules || [],
  };
}
```

### 2. Context Formatter for AI

```typescript
// src/lib/ai/website-designer/context-formatter.ts

export function formatContextForAI(context: BusinessDataContext): string {
  const sections: string[] = [];
  
  // === BUSINESS IDENTITY ===
  sections.push(`## Business Identity
- **Business Name**: ${context.branding.business_name || context.client.company || "Not specified"}
- **Industry**: ${context.client.industry || "Not specified"}
- **Website Domain**: ${context.site.domain || "Not specified"}
- **Logo URL**: ${context.branding.logo_url || "Not available"}
- **Logo (Dark)**: ${context.branding.logo_dark_url || "Not available"}
- **Favicon**: ${context.branding.favicon_url || "Not available"}`);
  
  // === BRAND COLORS ===
  if (context.branding.primary_color || context.branding.secondary_color) {
    sections.push(`## Brand Colors
- **Primary Color**: ${context.branding.primary_color || "Not specified"}
- **Secondary Color**: ${context.branding.secondary_color || "Not specified"}
- **Accent Color**: ${context.branding.accent_color || "Not specified"}`);
  }
  
  // === TYPOGRAPHY ===
  if (context.branding.font_heading || context.branding.font_body) {
    sections.push(`## Typography
- **Heading Font**: ${context.branding.font_heading || "System default"}
- **Body Font**: ${context.branding.font_body || "System default"}`);
  }
  
  // === CONTACT INFORMATION ===
  sections.push(`## Contact Information
- **Email**: ${context.contact.email || "Not specified"}
- **Phone**: ${context.contact.phone || "Not specified"}
- **Address**: ${formatAddress(context.contact.address)}
${context.contact.mapCoordinates ? `- **Map Coordinates**: ${context.contact.mapCoordinates.lat}, ${context.contact.mapCoordinates.lng}` : ""}`);
  
  // === SOCIAL MEDIA ===
  if (context.social.length > 0) {
    sections.push(`## Social Media Links
${context.social.map(s => `- **${s.platform}**: ${s.url}`).join("\n")}`);
  }
  
  // === BUSINESS HOURS ===
  if (context.hours.length > 0) {
    sections.push(`## Business Hours
${context.hours.map(h => `- **${h.day}**: ${h.is_closed ? "Closed" : `${h.open_time} - ${h.close_time}`}`).join("\n")}`);
  }
  
  // === LOCATIONS ===
  if (context.locations.length > 0) {
    sections.push(`## Locations (${context.locations.length} total)
${context.locations.map(l => `### ${l.name}${l.is_primary ? " (Primary)" : ""}
- Address: ${l.address}, ${l.city}, ${l.state} ${l.zip}
- Phone: ${l.phone || "N/A"}
- Email: ${l.email || "N/A"}`).join("\n\n")}`);
  }
  
  // === TEAM MEMBERS ===
  if (context.team.length > 0) {
    sections.push(`## Team Members (${context.team.length} total)
${context.team.slice(0, 10).map(t => `- **${t.name}** - ${t.role}${t.image_url ? " (has photo)" : ""}`).join("\n")}
${context.team.length > 10 ? `... and ${context.team.length - 10} more team members` : ""}`);
  }
  
  // === SERVICES ===
  if (context.services.length > 0) {
    sections.push(`## Services/Products (${context.services.length} total)
${context.services.slice(0, 10).map(s => `- **${s.name}**: ${s.description?.substring(0, 100)}...${s.price ? ` (${s.price})` : ""}`).join("\n")}
${context.services.length > 10 ? `... and ${context.services.length - 10} more services` : ""}`);
  }
  
  // === TESTIMONIALS ===
  if (context.testimonials.length > 0) {
    sections.push(`## Testimonials (${context.testimonials.length} available)
${context.testimonials.slice(0, 5).map(t => `- "${t.content?.substring(0, 100)}..." - ${t.name}, ${t.company || t.role}`).join("\n")}
${context.testimonials.length > 5 ? `... and ${context.testimonials.length - 5} more testimonials` : ""}`);
  }
  
  // === FAQ ===
  if (context.faq.length > 0) {
    sections.push(`## FAQ (${context.faq.length} questions)
${context.faq.slice(0, 5).map(f => `- **Q**: ${f.question}\n  **A**: ${f.answer?.substring(0, 100)}...`).join("\n")}
${context.faq.length > 5 ? `... and ${context.faq.length - 5} more FAQ items` : ""}`);
  }
  
  // === PORTFOLIO ===
  if (context.portfolio.length > 0) {
    sections.push(`## Portfolio/Projects (${context.portfolio.length} items)
${context.portfolio.slice(0, 5).map(p => `- **${p.title}**: ${p.description?.substring(0, 80)}... (${p.category || "Uncategorized"})`).join("\n")}
${context.portfolio.length > 5 ? `... and ${context.portfolio.length - 5} more projects` : ""}`);
  }
  
  // === BLOG POSTS ===
  if (context.blog.length > 0) {
    sections.push(`## Recent Blog Posts (${context.blog.length} available)
${context.blog.slice(0, 5).map(b => `- **${b.title}**: ${b.excerpt?.substring(0, 80)}...`).join("\n")}
${context.blog.length > 5 ? `... and ${context.blog.length - 5} more posts` : ""}`);
  }
  
  // === ENABLED MODULES ===
  if (context.modules.length > 0) {
    sections.push(`## Enabled Features/Modules
${context.modules.map(m => `- ${m.module_type} (enabled)`).join("\n")}`);
  }
  
  return sections.join("\n\n---\n\n");
}

function formatAddress(addr: any): string {
  if (!addr) return "Not specified";
  const parts = [addr.street, addr.city, addr.state, addr.zip, addr.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Not specified";
}
```

### 3. Data Availability Checker

```typescript
// src/lib/ai/website-designer/data-checker.ts

export interface DataAvailability {
  hasLogo: boolean;
  hasColors: boolean;
  hasFonts: boolean;
  hasContact: boolean;
  hasSocial: boolean;
  hasHours: boolean;
  hasLocations: boolean;
  hasTeam: boolean;
  hasServices: boolean;
  hasTestimonials: boolean;
  hasPortfolio: boolean;
  hasBlog: boolean;
  hasFaq: boolean;
  // Scores
  brandingScore: number;    // 0-100
  contentScore: number;     // 0-100
  overallReadiness: number; // 0-100
}

export function checkDataAvailability(context: BusinessDataContext): DataAvailability {
  const hasLogo = Boolean(context.branding.logo_url);
  const hasColors = Boolean(context.branding.primary_color);
  const hasFonts = Boolean(context.branding.font_heading || context.branding.font_body);
  const hasContact = Boolean(context.contact.email || context.contact.phone);
  const hasSocial = context.social.length > 0;
  const hasHours = context.hours.length > 0;
  const hasLocations = context.locations.length > 0;
  const hasTeam = context.team.length > 0;
  const hasServices = context.services.length > 0;
  const hasTestimonials = context.testimonials.length > 0;
  const hasPortfolio = context.portfolio.length > 0;
  const hasBlog = context.blog.length > 0;
  const hasFaq = context.faq.length > 0;
  
  // Calculate scores
  const brandingScore = [
    hasLogo ? 40 : 0,
    hasColors ? 30 : 0,
    hasFonts ? 30 : 0,
  ].reduce((a, b) => a + b, 0);
  
  const contentScore = [
    hasContact ? 15 : 0,
    hasSocial ? 10 : 0,
    hasTeam ? 15 : 0,
    hasServices ? 20 : 0,
    hasTestimonials ? 15 : 0,
    hasPortfolio ? 10 : 0,
    hasFaq ? 10 : 0,
    hasHours ? 5 : 0,
  ].reduce((a, b) => a + b, 0);
  
  const overallReadiness = Math.round((brandingScore * 0.4) + (contentScore * 0.6));
  
  return {
    hasLogo,
    hasColors,
    hasFonts,
    hasContact,
    hasSocial,
    hasHours,
    hasLocations,
    hasTeam,
    hasServices,
    hasTestimonials,
    hasPortfolio,
    hasBlog,
    hasFaq,
    brandingScore,
    contentScore,
    overallReadiness,
  };
}
```

### 4. Missing Data Prompter

```typescript
// src/lib/ai/website-designer/missing-data-prompter.ts

export interface MissingDataPrompt {
  field: string;
  question: string;
  priority: "critical" | "recommended" | "optional";
  examples?: string[];
}

export function getMissingDataPrompts(availability: DataAvailability, context: BusinessDataContext): MissingDataPrompt[] {
  const prompts: MissingDataPrompt[] = [];
  
  // CRITICAL - Without these, website quality suffers significantly
  if (!availability.hasLogo) {
    prompts.push({
      field: "logo",
      question: "Please provide your business logo URL or upload a logo",
      priority: "critical",
    });
  }
  
  if (!context.branding.business_name && !context.client.company) {
    prompts.push({
      field: "businessName",
      question: "What is your business name?",
      priority: "critical",
    });
  }
  
  if (!context.client.industry) {
    prompts.push({
      field: "industry",
      question: "What industry is your business in?",
      priority: "critical",
      examples: ["Restaurant", "Law Firm", "E-commerce", "Healthcare", "Real Estate", "Construction"],
    });
  }
  
  // RECOMMENDED - Improves website quality
  if (!availability.hasColors) {
    prompts.push({
      field: "colors",
      question: "What are your brand colors? (Primary and secondary)",
      priority: "recommended",
      examples: ["#3b82f6 (blue)", "#10b981 (green)", "#f59e0b (amber)"],
    });
  }
  
  if (!availability.hasContact) {
    prompts.push({
      field: "contact",
      question: "What is your business email and/or phone number?",
      priority: "recommended",
    });
  }
  
  // OPTIONAL - Nice to have
  if (!availability.hasTestimonials) {
    prompts.push({
      field: "testimonials",
      question: "Would you like to add customer testimonials?",
      priority: "optional",
    });
  }
  
  if (!availability.hasSocial) {
    prompts.push({
      field: "social",
      question: "What are your social media links?",
      priority: "optional",
      examples: ["Facebook", "Instagram", "LinkedIn", "Twitter/X", "YouTube"],
    });
  }
  
  return prompts;
}
```

---

## 📋 Implementation Tasks

### Task 1: Create Database Tables (if missing)

```sql
-- Check/create supporting tables
CREATE TABLE IF NOT EXISTS site_social_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_business_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS site_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT,
  phone TEXT,
  email TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  bio TEXT,
  image_url TEXT,
  email TEXT,
  phone TEXT,
  social_links JSONB DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  image_url TEXT,
  features JSONB DEFAULT '[]',
  category TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_portfolio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  gallery JSONB DEFAULT '[]',
  client_name TEXT,
  category TEXT,
  project_date DATE,
  link TEXT,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  role TEXT,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  image_url TEXT,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_faq (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE site_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_faq ENABLE ROW LEVEL SECURITY;

-- Same pattern as other site-level tables
CREATE POLICY "Users can view own site data" ON site_social_links FOR SELECT USING (site_id IN (SELECT id FROM sites WHERE agency_id IN (SELECT agency_id FROM agency_users WHERE user_id = auth.uid())));
-- Repeat for other tables...
```

### Task 2: Build Context Builder (2 hours)

- Create `src/lib/ai/website-designer/data-context-builder.ts`
- Implement parallel data fetching
- Handle missing tables gracefully
- Cache context for session

### Task 3: Build Context Formatter (2 hours)

- Create `src/lib/ai/website-designer/context-formatter.ts`
- Format all data for AI consumption
- Handle edge cases (empty data, null values)
- Include formatting helpers

### Task 4: Build Data Checker (1 hour)

- Create `src/lib/ai/website-designer/data-checker.ts`
- Calculate availability scores
- Identify critical missing data

### Task 5: Build Missing Data Prompter (1 hour)

- Create `src/lib/ai/website-designer/missing-data-prompter.ts`
- Generate smart prompts for missing data
- Prioritize by importance

### Task 6: Integration Testing (2 hours)

- Test with real site data
- Test with minimal data
- Test with complete data
- Verify AI context quality

---

## ✅ Completion Checklist

- [ ] Database tables created/verified
- [ ] RLS policies added
- [ ] Data context builder implemented
- [ ] Context formatter implemented
- [ ] Data availability checker implemented
- [ ] Missing data prompter implemented
- [ ] Integration tests passing
- [ ] Context caching working
- [ ] Error handling complete

---

## 📁 Files Created

```
src/lib/ai/website-designer/
├── data-context-builder.ts
├── context-formatter.ts
├── data-checker.ts
├── missing-data-prompter.ts
├── types.ts
└── index.ts
```

---

## 🔗 Dependencies

- **Database**: Supabase tables for business data
- **Auth**: User must have access to site
- **Caching**: TanStack Query or similar for context caching

---

**READY TO IMPLEMENT! 🚀**
