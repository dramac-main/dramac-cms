# DRAMAC CMS — Session 7 Prompt

## Wave 6: Industry Verticals — Session 1 (EM-60: Hotel Management Module)

---

### Context

You are continuing development of the **DRAMAC CMS** platform — an enterprise modular CMS with Next.js, TypeScript, and Supabase. The platform is production-deployed at `https://app.dramacagency.com`.

**All previous waves are complete:**

- Wave 1-5: Core infrastructure, developer tools, distribution, enterprise, 6 business modules
- Wave 7: Marketing Module (12 phases, MKT-01 to MKT-12)
- Wave 8: Invoicing Module (14 phases, INV-01 to INV-14)
- Wave 9: Billing V5 (10 phases, BIL-01 to BIL-10)
- Plus: DRAMAC Studio, Client Portal, Domain/Email, Blog, AI Website Designer, LP Builder Pro

**TSC Baseline**: 197 pre-existing errors (do NOT introduce new ones)

**Supabase Project ID**: `nfirsqmyxmmtbignofgb`

---

### Objective

Implement **Phase EM-60: Hotel Management Module** — a comprehensive hotel/property management system (similar to Cloudbeds/Little Hotelier). This is the first of 6 industry vertical modules.

**Master Guide**: `/phases/enterprise-modules/PHASE-EM-60-HOTEL-MANAGEMENT.md`

---

### What to Build (4 Tasks)

#### Task 1: Database Schema & Module Foundation (~2-3 hours)

- Apply the full hotel schema via Supabase MCP (13+ tables: room_types, rooms, rate_plans, room_rates, rate_overrides, guests, reservations, reservation_nights, folios, folio_charges, folio_payments, housekeeping_tasks, maintenance_requests)
- Use `mod_hotel` schema prefix per DRAMAC naming conventions (but adapt to platform pattern — the actual project uses flat tables with module prefix in table names, NOT Postgres schemas)
- Register hotel module in module catalog (`src/config/module-catalog.ts`)
- Create hotel types (`src/types/hotel-types.ts`)
- Create hotel constants (`src/config/hotel-constants.ts`)
- Add hotel permissions to roles system
- Add navigation entries
- Bootstrap hotel module in site creation flow

#### Task 2: Reservation Service & Server Actions (~2.5 hours)

- `src/lib/hotel/reservation-service.ts` — availability check, rate calculation, reservation CRUD
- `src/lib/hotel/hotel-actions.ts` — server actions for room types, rooms, guests, reservations, rate plans
- Availability engine (check room availability across date ranges, handle overbooking prevention)
- Automatic confirmation number generation
- Integration with existing Booking Module (EM-51) where applicable
- Automation event emissions (reservation.created, guest.checked_in, etc.)

#### Task 3: Front Desk Dashboard & Room Management UI (~2 hours)

- Room management pages (CRUD for room types, individual rooms)
- Reservation calendar/timeline view
- Front desk dashboard (today's arrivals, departures, in-house guests, room status grid)
- Check-in/check-out workflow
- Guest management (profile, stay history, preferences)

#### Task 4: Housekeeping & Operations (~1.5 hours)

- Housekeeping board (room status grid, task assignment)
- Maintenance request tracking
- Folio/billing management (charges, payments, guest bills)
- Guest folio view with charge posting

---

### Technical Requirements

1. **Follow existing patterns**: Use server actions pattern (not class-based services), Supabase admin client with `(admin as any)` casts (database.types.ts is stale), agency_id scoping on all queries
2. **Module registration**: Follow the pattern from CRM/Booking/E-Commerce modules in module-catalog.ts
3. **Navigation**: Add Hotel section to dashboard nav in `src/config/navigation.ts`
4. **Permissions**: Add `can_manage_hotel` to client permissions (follow `can_manage_invoices` pattern)
5. **DB Migration**: Apply via Supabase MCP tool — use flat table names with `hotel_` prefix (e.g., `hotel_room_types`, `hotel_rooms`), NOT Postgres schemas
6. **RLS Policies**: Agency-scoped isolation (eq agency_id)
7. **Components**: Use existing UI library (Radix UI, shadcn/ui, Tailwind, Lucide icons)
8. **Charts**: Use Recharts for any dashboard visualizations (already installed)

---

### Key Files to Reference

| File                                                         | Purpose                              |
| ------------------------------------------------------------ | ------------------------------------ |
| `/phases/enterprise-modules/PHASE-EM-60-HOTEL-MANAGEMENT.md` | Full spec with SQL schemas           |
| `/memory-bank/systemPatterns.md`                             | Architecture patterns                |
| `/memory-bank/techContext.md`                                | Tech stack details                   |
| `src/config/module-catalog.ts`                               | Module registration pattern          |
| `src/config/navigation.ts`                                   | Dashboard navigation                 |
| `src/types/booking-types.ts`                                 | Reference for similar module types   |
| `src/lib/booking/booking-actions.ts`                         | Reference for server actions pattern |
| `src/types/invoicing-types.ts`                               | Reference for complex module types   |

---

### Session Workflow

1. **Read memory bank files first** (all 6 files in `/memory-bank/`)
2. **Read the EM-60 master guide** before implementing
3. Implement Tasks 1-4 sequentially
4. Run `npx tsc --noEmit --skipLibCheck` after each task — maintain 197 baseline
5. Update memory bank at end of session

---

### Known Tech Debt (Carry-Forward)

These are pre-existing and do NOT need fixing this session:

- `database.types.ts` is stale — use `(admin as any)` casts (established pattern)
- Paddle `.env.local` has placeholder values (sandbox not configured yet)
- `getMrrHistory()` in billing-actions.ts has N+1 query pattern (36 queries for 12 months)
- `getChurnAnalysis()` defined but never called in admin-revenue-overview (UI not implemented)
- 197 TSC errors are all pre-existing

---

### Success Criteria

- [ ] Hotel database tables created via Supabase MCP (13+ tables with RLS)
- [ ] Module registered, types defined, permissions added, navigation wired
- [ ] Reservation service with availability checking and CRUD operations
- [ ] Front desk dashboard with today's operations view
- [ ] Room management UI (room types + individual rooms)
- [ ] Guest management with profiles and stay history
- [ ] Housekeeping board with task assignment
- [ ] Folio/billing system for guest charges
- [ ] Automation events emitted for key hotel operations
- [ ] TSC: 197 errors maintained (zero new)
- [ ] Memory bank updated
