# EM-51 Booking Module - Testing Guide

**Status**: Ready to Test  
**Date**: January 24, 2026  
**TypeScript Errors**: 0 ✅

## Quick Test Plan (5 Minutes)

### 1. **Access Booking Module** (30 sec)
- Navigate to: `/dashboard/[your-site-id]/booking`
- ✅ **Verify**: Dashboard loads with 5 tabs (Calendar, Appointments, Services, Staff, Analytics)

### 2. **Create a Service** (45 sec)
- Click "Create Service" button
- Fill in:
  - Name: "Haircut"
  - Duration: 30 minutes
  - Price: 50
  - Category: "Salon Services"
- ✅ **Verify**: Service appears in Services view

### 3. **Create a Staff Member** (45 sec)
- Switch to Staff tab
- Click "Create Staff"
- Fill in:
  - Name: "Sarah Johnson"
  - Email: "sarah@test.com"
  - Select the service created above
- ✅ **Verify**: Staff appears with assigned services

### 4. **Create an Appointment** (60 sec)
- Switch to Calendar view
- Click "Create Appointment"
- Fill in:
  - Customer name: "John Doe"
  - Customer email: "john@test.com"
  - Select service
  - Select staff
  - Pick date & time
- ✅ **Verify**: Appointment appears in Calendar & Appointments list

### 5. **Test Appointment Actions** (60 sec)
- In Appointments view, click on the appointment
- Test status changes:
  - Mark as "Confirmed" ✅
  - Mark as "Completed" ✅
  - Mark as "Cancelled" ✅
- ✅ **Verify**: Status badges update, Analytics numbers change

### 6. **View Analytics** (30 sec)
- Switch to Analytics tab
- ✅ **Verify**: 
  - Stats show: 1 Total Booking, revenue $50
  - "Service Performance" chart displays data
  - "Recent Appointments" list shows your booking

---

## What This Tests

| Feature | Coverage |
|---------|----------|
| ✅ **Services CRUD** | Create, Read |
| ✅ **Staff CRUD** | Create, Read, Assign Services |
| ✅ **Appointments CRUD** | Create, Read, Update Status |
| ✅ **Calendar View** | Display appointments by date |
| ✅ **Staff Assignments** | Many-to-many staff-service linking |
| ✅ **Status Workflow** | Pending → Confirmed → Completed/Cancelled |
| ✅ **Analytics** | Real-time stats, revenue tracking |
| ✅ **Database** | All 8 tables functioning |
| ✅ **TypeScript** | 0 compilation errors |

---

## Expected Results

### Database Tables Used
- `mod_bookmod01_services` (stores services)
- `mod_bookmod01_staff` (stores staff)
- `mod_bookmod01_staff_services` (staff-service relationships)
- `mod_bookmod01_appointments` (bookings)
- `mod_bookmod01_settings` (module config)

### Key Functions Tested
- `addService()`, `fetchServices()`
- `addStaff()`, `fetchStaff()`
- `addAppointment()`, `fetchAppointments()`
- `editAppointment()` (status changes)
- Analytics aggregations

---

## Troubleshooting

### If Dashboard Doesn't Load
- Check migration ran: `em-51-booking-module-schema.sql`
- Verify siteId is valid
- Check console for RLS policy errors

### If Create Dialogs Error
- Check browser console for specific error
- Verify all required fields filled
- Ensure staff has assigned services (for appointments)

### If Analytics Shows 0
- Create at least 1 appointment first
- Refresh the Analytics tab
- Check appointments have `price` value

---

## Success Criteria ✅

- [ ] All 5 tabs load without errors
- [ ] Can create Service, Staff, Appointment
- [ ] Calendar displays appointments
- [ ] Status changes work (Pending → Confirmed → Completed)
- [ ] Analytics shows accurate numbers
- [ ] No TypeScript/console errors
- [ ] Detail sheets open and display data

**Total Test Time**: ~5 minutes  
**Confidence Level**: High (follows proven CRM patterns exactly)
