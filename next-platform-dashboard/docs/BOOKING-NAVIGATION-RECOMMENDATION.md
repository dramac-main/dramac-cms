# Booking Module - Navigation Placement Recommendation

**Date**: January 24, 2026  
**Module**: EM-51 Booking Module  
**Current Status**: Implemented, TypeScript clean, NOT in sidebar

---

## 🎯 Recommendation: **DO NOT Add to Main Sidebar**

### Why? **CRM Pattern Analysis**

#### Current CRM Implementation (EM-50)
```typescript
// src/config/navigation.ts (Line 52)
{
  title: "CRM",
  href: "/dashboard/crm",
  icon: Building2,
  dataTour: "crm",
}
```

**BUT**: CRM is **agency-wide**, not site-specific!

#### CRM Routes
- **Global**: `/dashboard/crm` (all contacts across agency)
- **Site-specific**: `/dashboard/[siteId]/crm` (site contacts only)

#### Booking Routes (Current)
- **Site-specific ONLY**: `/dashboard/[siteId]/booking`
- **No global booking dashboard** (doesn't make sense - bookings are per-site)

---

## ❌ Problem: Different Access Patterns

| Feature | CRM | Booking |
|---------|-----|---------|
| **Scope** | Agency-wide + per-site | **Per-site ONLY** |
| **Global View** | ✅ All contacts | ❌ N/A (bookings are local) |
| **Use Case** | Sales team tracks across sites | Salon/spa/service per location |
| **Navigation** | Main sidebar (global) | **Should be site-level** |

---

## ✅ Correct Implementation

### Option 1: Site Modules Tab (RECOMMENDED ⭐)

**Location**: Inside Site Detail Page → Modules Tab

```
/dashboard/sites/[siteId]
  ├── Overview Tab
  ├── Pages Tab
  ├── CRM Tab (site-specific CRM)
  └── Modules Tab
       ├── 📅 Booking Module (if installed)
       ├── 🛍️ E-commerce Module
       └── + Install More Modules
```

**Why this is best**:
- ✅ Booking is a **module** (install per-site)
- ✅ Matches platform architecture (site_module_installations)
- ✅ User installs booking on Site A, not Site B
- ✅ Follows module marketplace pattern
- ✅ No sidebar clutter for unused modules

**Implementation**: Already exists in site detail page!

---

### Option 2: Dynamic Sidebar (If Booking Becomes Universal)

**IF** you later add agency-wide booking features:

```typescript
// src/config/navigation.ts
{
  items: [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Clients", href: "/dashboard/clients", icon: Users },
    { title: "Sites", href: "/dashboard/sites", icon: Globe },
    { title: "CRM", href: "/dashboard/crm", icon: Building2 },
    { title: "Media Library", href: "/dashboard/media", icon: ImageIcon },
    // NEW: Only show if user has ANY site with booking installed
    ...(hasBookingInstalled ? [{ 
      title: "Bookings", 
      href: "/dashboard/bookings", // All bookings across sites
      icon: Calendar 
    }] : [])
  ]
}
```

**Requirements for this**:
- [ ] Agency-wide booking dashboard
- [ ] Cross-site appointment view
- [ ] Staff management across locations
- [ ] Aggregate analytics

**Current Status**: ❌ Not implemented (and likely not needed)

---

## 🏆 Best Practice: Module vs. Core Feature

| Type | Examples | Sidebar Placement |
|------|----------|-------------------|
| **Core Platform** | Dashboard, Clients, Sites | ✅ Always in sidebar |
| **Universal Tools** | CRM, Media Library | ✅ In sidebar (agency-wide) |
| **Site Modules** | Booking, E-commerce, Forms | ❌ In site detail / Modules tab |
| **Integrations** | Stripe, QuickBooks | ❌ In Settings → Integrations |

---

## 📋 Action Items

### Immediate (Now)
- [x] **Do NOT add to sidebar** - Keep as site-specific module
- [x] Verify booking accessible via `/dashboard/[siteId]/booking`
- [ ] Ensure "Back to Site" button works
- [ ] Test booking appears in site modules list

### Future (Phase 2 - If Needed)
- [ ] Implement agency-wide booking dashboard
- [ ] Add cross-site calendar view
- [ ] Create global staff directory
- [ ] Then add to sidebar with dynamic visibility

---

## 🎨 User Journey (Current - CORRECT)

1. **User**: "I want booking for my salon website"
2. **Action**: Go to Sites → Select Salon Site → Modules Tab
3. **Install**: Click "Install Booking Module"
4. **Access**: Click "Open Booking" OR `/dashboard/[siteId]/booking`
5. **Manage**: Create services, staff, appointments for THAT salon

**Result**: Booking isolated to that site, clean UX ✅

---

## 🚫 Anti-Pattern to Avoid

❌ **Don't Do This:**
```typescript
// BAD: Adding booking to main sidebar like CRM
{
  title: "Booking",
  href: "/dashboard/booking", // No siteId = broken
  icon: Calendar
}
```

**Why it's wrong**:
- User clicks "Booking" → Which site's bookings?
- Need to pick site first → Extra navigation
- Clutter sidebar with site-specific features
- Breaks module installation paradigm

---

## 📖 Platform Philosophy

From `memory-bank/projectbrief.md`:

> "Modules can be purchased, white-labeled, and resold"

From `memory-bank/systemPatterns.md`:

> "Module Types:
> 1. Widget - Simple component (no database)
> 2. **App - Multi-page application (with database)** ← BOOKING IS THIS
> 3. Integration - Third-party API"

**Key Insight**: Apps are **installed per-site**, not global to agency.

---

## ✅ Final Recommendation

**Keep booking as a site-level module. Do NOT add to main sidebar.**

**Access Pattern**:
```
/dashboard/sites → Select Site → Modules Tab → Booking Module
```

**OR** (direct link):
```
/dashboard/[siteId]/booking
```

**Sidebar should only have**:
- Platform-wide features (Dashboard, Clients, Sites)
- Agency-wide tools (CRM, Media Library, Settings)
- NOT per-site modules (Booking, E-commerce, etc.)

---

**Conclusion**: The current implementation is architecturally correct. Booking should remain accessible through site-specific routes, not the global sidebar.
