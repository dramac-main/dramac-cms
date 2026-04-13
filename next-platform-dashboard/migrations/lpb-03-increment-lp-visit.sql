-- Phase LPB-03: Atomic LP visit counter increment
-- Creates a simple RPC function for incrementing the total_visits counter
-- on a landing page record. Used by the /api/marketing/lp/track endpoint.

CREATE OR REPLACE FUNCTION increment_lp_visit(lp_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE mod_mktmod01_landing_pages
  SET total_visits = COALESCE(total_visits, 0) + 1,
      updated_at = now()
  WHERE id = lp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
