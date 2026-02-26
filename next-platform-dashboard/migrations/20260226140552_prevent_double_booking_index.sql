-- ============================================================================
-- Migration: Prevent Double Bookings with Unique Partial Index
-- ============================================================================
-- 
-- Creates a database-level safeguard against double bookings.
-- Even if the application-level conflict check has a race condition
-- (two simultaneous requests both pass the check before either inserts),
-- this index will cause the second INSERT to fail with a unique violation.
--
-- The index covers non-cancelled appointments for a specific staff member
-- at a specific time. This means:
--   - Two appointments for the SAME staff at the SAME time → BLOCKED
--   - Two appointments for DIFFERENT staff at the same time → ALLOWED
--   - Cancelled appointments → IGNORED (can re-book the slot)
--
-- Note: staff_id IS NOT NULL constraint means this only applies to
-- staff-specific bookings. Appointments with staff_id = NULL (no staff
-- assigned) are not covered by this index.
-- ============================================================================

-- Unique partial index: prevent double-booking for the same staff member
CREATE UNIQUE INDEX IF NOT EXISTS idx_prevent_double_booking
  ON mod_bookmod01_appointments (site_id, staff_id, start_time)
  WHERE staff_id IS NOT NULL AND status != 'cancelled';

-- Comment for documentation
COMMENT ON INDEX idx_prevent_double_booking IS 
  'Prevents double bookings: unique constraint on (site_id, staff_id, start_time) for non-cancelled appointments with assigned staff.';
