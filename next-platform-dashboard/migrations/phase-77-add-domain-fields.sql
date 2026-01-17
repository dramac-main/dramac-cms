-- Phase 77: Site Publishing Complete - Domain Fields Migration
-- This migration adds the necessary fields for custom domain support

-- Add custom domain fields to sites table
ALTER TABLE sites
ADD COLUMN IF NOT EXISTS custom_domain TEXT,
ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS domain_verification_token TEXT,
ADD COLUMN IF NOT EXISTS domain_last_checked TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Create index for subdomain lookup (for faster public site loading)
CREATE INDEX IF NOT EXISTS idx_sites_subdomain ON sites(subdomain);

-- Create index for custom domain lookup
CREATE INDEX IF NOT EXISTS idx_sites_custom_domain ON sites(custom_domain) WHERE custom_domain IS NOT NULL;

-- Create index for published sites (for faster public site queries)
CREATE INDEX IF NOT EXISTS idx_sites_published ON sites(published) WHERE published = true;

-- Ensure subdomain is unique (if not already constrained)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_subdomain'
    ) THEN
        ALTER TABLE sites ADD CONSTRAINT unique_subdomain UNIQUE (subdomain);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Ensure custom domain is unique when not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_sites_unique_custom_domain 
ON sites(custom_domain) 
WHERE custom_domain IS NOT NULL;

-- Add RLS policies for domain fields if they don't exist
DO $$
BEGIN
    -- Allow users to read their own sites' domain info
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'sites_domain_select_policy'
    ) THEN
        CREATE POLICY sites_domain_select_policy ON sites
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM clients c
                    JOIN agencies a ON c.agency_id = a.id
                    WHERE c.id = sites.client_id
                    AND a.owner_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Comment on columns for documentation
COMMENT ON COLUMN sites.custom_domain IS 'Custom domain configured for the site (e.g., www.example.com)';
COMMENT ON COLUMN sites.custom_domain_verified IS 'Whether the custom domain DNS has been verified';
COMMENT ON COLUMN sites.domain_verification_token IS 'Token for TXT record verification';
COMMENT ON COLUMN sites.domain_last_checked IS 'Last time domain verification was checked';
COMMENT ON COLUMN sites.published_at IS 'Timestamp when the site was last published';
