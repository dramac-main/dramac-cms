# PHASE LAUNCH-08: Booking Module E2E Lifecycle

**User Journeys Covered**: Journey 9.1 (Booking Lifecycle — All Users), Journey 10.1 (Booking Module Roles)  
**Independence**: Fully independent — no other phase required first  
**Connection Points**: Booking on published sites (LAUNCH-01 Task 5), Booking in dashboard (LAUNCH-05 Task 7)

---

## Pre-Implementation: Read These Files First

```
memory-bank/systemPatterns.md (Notification Pattern, Auth Client Pattern)
memory-bank/activeContext.md (Booking bug fix sections)
memory-bank/progress.md (Booking Module Public Data Fix, Booking Studio Components Rebuilt)
docs/USER-JOURNEYS.md (Journey 9.1, Journey 10.1)
```

---

## Context

The booking module lifecycle spans 4 user types:
1. **Agency Owner** → Set up booking module (services, staff, hours, settings)
2. **Anonymous Visitor** → Book appointment on published site
3. **Agency Owner/Admin** → Manage bookings (confirm, reschedule, cancel)
4. **Portal Client** → View bookings (if permitted)

All booking data lives in `mod_booking_*` tables with per-module schema isolation.

---

## Task 1: Booking Module Setup (Agency Owner)

### Files to Audit
- `src/app/(dashboard)/dashboard/sites/[siteId]/booking/page.tsx`
- `src/app/(dashboard)/dashboard/sites/[siteId]/booking/layout.tsx`
- `src/modules/booking/components/*` (all dashboard components)
- `src/modules/booking/actions/booking-actions.ts`
- `src/modules/booking/context/booking-context.tsx` (or similar)

### Requirements
1. **Module access guard**: Booking page only accessible if module is installed for site
2. **Service management**: CRUD for services (name, description, duration, price, category)
3. **Staff management**: CRUD for staff (name, email, title, bio, photo, services they offer)
4. **Business hours**: Set operating hours per day of week
5. **Booking settings**: Require confirmation toggle, buffer time, advance booking limit, cancellation policy
6. **Calendar view**: Dashboard calendar showing all bookings
7. **Service pricing**: In ZMW format via `formatCurrency()`
8. **All data real**: From `mod_booking_*` tables

### What to Fix
- If services CRUD doesn't save — wire to real `mod_booking_services` table
- If staff CRUD doesn't save — wire to real `mod_booking_staff` table
- If business hours don't save — wire to real settings table
- If calendar shows mock bookings — query from `mod_booking_appointments`
- If pricing shows `$` — change to `formatCurrency()`
- If module access guard is missing — add `isModuleEnabledForSite()` check

### Verification
```
□ Module access guard works (redirect if not installed)
□ Create service → Saved to DB
□ Create staff member → Saved to DB
□ Set business hours → Saved to DB
□ Toggle require_confirmation → Saved
□ Calendar shows real bookings
□ All pricing in ZMW
```

---

## Task 2: Public Booking Flow (Anonymous Visitor)

### Files to Audit
- `src/modules/booking/studio/components/ServiceSelectorBlock.tsx`
- `src/modules/booking/studio/components/StaffGridBlock.tsx`
- `src/modules/booking/studio/components/BookingCalendarBlock.tsx`
- `src/modules/booking/studio/components/BookingFormBlock.tsx`
- `src/modules/booking/studio/components/BookingWidgetBlock.tsx`
- `src/modules/booking/actions/public-booking-actions.ts`
- `src/modules/booking/hooks/useBookingServices.ts`
- `src/modules/booking/hooks/useBookingStaff.ts`
- `src/modules/booking/hooks/useBookingSlots.ts`
- `src/modules/booking/hooks/useCreateBooking.ts`
- `src/modules/booking/hooks/useBookingSettings.ts`
- `src/app/embed/booking/[siteId]/page.tsx`

### Requirements
1. **Service selection**: Shows real services from `getPublicServices()`
2. **Staff selection**: Shows real staff from `getPublicStaff()` (optional if single staff)
3. **Calendar**: Shows real available slots from `getPublicAvailableSlots()`
4. **Slot availability**: Respects business hours, existing bookings, buffer time
5. **Booking form**: Collects name, email, phone, notes
6. **Submit booking**: `createPublicAppointment()` saves to DB using `createAdminClient()`
7. **Confirmation status**: "Confirmed" if `require_confirmation = false`, "Submitted" if `true`
8. **Error handling**: Shows error if booking fails (not success screen on error)
9. **Embed page**: `/embed/booking/[siteId]` works identically with `createAdminClient()`
10. **Demo data**: ONLY in Studio editor when `!siteId`
11. **Staff assignment**: `staff_id` correctly recorded in appointment

### What to Fix
- If hooks use `createClient()` — must use `public-booking-actions.ts` with admin client
- If slots don't respect business hours — verify availability calculation
- If confirmation shows wrong status — check `require_confirmation` setting usage
- If staff_id isn't saved — verify the `.eq('staff_id', '')` bug is fixed (was fixed in earlier session)
- If embed uses `createClient()` — change to `createAdminClient()`
- If demo data shows on published site — verify `siteId` guard

### Verification
```
□ Services show real data on published site
□ Staff shows real data
□ Calendar shows real available slots
□ Unavailable times are blocked
□ Submit booking → Saved to DB with correct staff_id
□ require_confirmation OFF → "Booking Confirmed!"
□ require_confirmation ON → "Booking Submitted!"
□ Error → Shows error message (not success)
□ Embed page works
□ Demo data only in Studio editor
```

---

## Task 3: Booking Management (Agency Dashboard)

### Files to Audit
- Booking dashboard components (calendar, appointment list)
- `src/modules/booking/actions/booking-actions.ts`
- Appointment management (confirm, reschedule, cancel)

### Requirements
1. **Appointment list**: All bookings from `mod_booking_appointments` table
2. **Appointment detail**: Customer info, service, staff, date/time, status, notes
3. **Confirm appointment**: Change status from "pending" to "confirmed"
4. **Reschedule**: Change date/time of appointment
5. **Cancel**: Cancel appointment with reason
6. **Status tracking**: pending → confirmed → completed → cancelled
7. **Filter**: Filter by status, date range, staff, service
8. **Notifications on cancel**: `notifyBookingCancelled()` → in-app + emails

### What to Fix
- If appointment list shows mock data — query from real `mod_booking_appointments`
- If confirm/reschedule/cancel don't save — wire to real DB updates
- If cancellation doesn't trigger notification — call `notifyBookingCancelled()`
- If status filter doesn't work — implement query filter
- If customer info is incomplete — join with appointment data

### Verification
```
□ Appointment list shows real bookings
□ Confirm appointment → Status updated in DB
□ Reschedule → New date/time saved
□ Cancel → Status updated + notifications triggered
□ Owner receives cancellation in-app notification
□ Customer receives cancellation email
□ Filters work (status, date, staff)
```

---

## Task 4: Notification Chain Verification

### Files to Audit
- `src/lib/services/business-notifications.ts` (`notifyNewBooking`, `notifyBookingCancelled`)
- `src/lib/email/send-email.ts`
- `src/lib/email/templates.ts`
- `src/lib/email/email-types.ts`
- `src/lib/services/notifications.ts`

### Requirements
1. **New booking**: In-app notification to owner + email to owner + email to customer
2. **Booking cancelled**: In-app notification to owner + email to owner + email to customer
3. **Email templates**: Proper HTML with service name, date, time, customer info
4. **Email sender**: From `noreply@app.dramacagency.com`
5. **In-app notification**: Clickable, navigates to booking detail
6. **No duplicate emails**: `createNotification()` does NOT send email (in-app only)

### What to Fix
- If notification functions aren't called — wire into booking actions
- If email templates have placeholder data — fill with real booking data
- If in-app notifications don't link to booking page — add proper action_url
- If duplicate emails are sent — verify `createNotification()` is in-app only

### Verification
```
□ New booking → Owner gets in-app notification
□ New booking → Owner gets email with booking details
□ New booking → Customer gets confirmation email
□ Cancel booking → Owner gets in-app notification
□ Cancel booking → Owner gets cancellation email
□ Cancel booking → Customer gets cancellation email
□ No duplicate emails (only one per recipient per event)
□ Email from address is correct
```

---

## Task 5: Booking Module Roles (Per-Site)

### Files to Audit
- Booking role/permission system
- `src/modules/booking/types/*`

### Requirements
1. **Admin role (100)**: Full access — services, staff, bookings, settings
2. **Manager role (75)**: Manage bookings, reschedule, view all calendars
3. **Staff role (50)**: View own bookings, mark complete, view schedule
4. **Viewer role (10)**: Read-only access to booking calendar
5. **Role enforcement**: UI and data access limited by role

### What to Fix
- If roles aren't enforced — add role checks to booking actions
- If all users see all data regardless of role — add role-based filtering
- If role assignment doesn't work — wire to `module_user_roles` or similar

### Verification
```
□ Admin can manage everything
□ Manager can manage bookings but not settings
□ Staff sees only their own bookings
□ Viewer is read-only
□ Role assignment works
```

---

## Summary: Verification Checklist (Complete Before Commit)
```
□ TypeScript: npx tsc --noEmit --skipLibCheck = 0 errors
□ All 5 tasks verified
□ Complete booking lifecycle works:
  □ Owner sets up services/staff/hours
  □ Visitor books on published site
  □ Owner receives notification + email
  □ Customer receives confirmation email
  □ Owner confirms/reschedules/cancels booking
  □ Cancellation notifications work
□ All pricing in ZMW
□ No mock/demo data on published sites
□ Embed booking works
□ Module roles enforced
```
