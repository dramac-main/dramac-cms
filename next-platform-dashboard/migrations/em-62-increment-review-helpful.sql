-- ============================================================================
-- RPC function to atomically increment review helpful count
-- Phase ECOM-60: Product Reviews & Ratings
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_review_helpful(review_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE mod_ecommod01_reviews 
  SET helpful_count = helpful_count + 1
  WHERE id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
