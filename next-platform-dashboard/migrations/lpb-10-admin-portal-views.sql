-- ============================================================
-- LPB-10: Admin aggregation view + portal permission additions
-- ============================================================

-- Materialized view for admin dashboard performance (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS mod_mktmod01_lp_admin_stats AS
SELECT
  lp.site_id,
  s.name AS site_name,
  a.id AS agency_id,
  a.name AS agency_name,
  COUNT(lp.id) AS total_lps,
  COUNT(lp.id) FILTER (WHERE lp.status = 'published') AS published_lps,
  COUNT(lp.id) FILTER (WHERE lp.status = 'draft') AS draft_lps,
  COUNT(lp.id) FILTER (WHERE lp.status = 'archived') AS archived_lps,
  COUNT(lp.id) FILTER (WHERE lp.use_studio_format = true) AS studio_lps,
  COUNT(lp.id) FILTER (WHERE lp.use_studio_format = false OR lp.use_studio_format IS NULL) AS legacy_lps,
  COALESCE(SUM(lp.total_visits), 0) AS total_visits,
  COALESCE(SUM(lp.total_conversions), 0) AS total_conversions,
  CASE
    WHEN SUM(lp.total_visits) > 0
    THEN ROUND((SUM(lp.total_conversions)::numeric / SUM(lp.total_visits)::numeric) * 100, 2)
    ELSE 0
  END AS avg_conversion_rate,
  MAX(lp.created_at) AS last_lp_created_at,
  MAX(lp.updated_at) AS last_lp_updated_at
FROM mod_mktmod01_landing_pages lp
JOIN sites s ON s.id = lp.site_id
JOIN agencies a ON a.id = s.agency_id
GROUP BY lp.site_id, s.name, a.id, a.name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lp_admin_stats_site
ON mod_mktmod01_lp_admin_stats(site_id);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_lp_admin_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mod_mktmod01_lp_admin_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
