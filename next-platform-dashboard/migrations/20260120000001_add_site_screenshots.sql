-- Add screenshot URL column to sites table
ALTER TABLE sites 
ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

ALTER TABLE sites 
ADD COLUMN IF NOT EXISTS screenshot_updated_at TIMESTAMPTZ;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sites_screenshot_updated 
ON sites(screenshot_updated_at) 
WHERE screenshot_url IS NOT NULL;
