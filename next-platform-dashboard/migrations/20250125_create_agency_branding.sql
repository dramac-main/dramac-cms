-- Phase WL-01: Agency Branding Table
-- Creates the agency_branding table for per-agency white-label branding

CREATE TABLE IF NOT EXISTS public.agency_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  
  -- Core Identity
  agency_display_name TEXT NOT NULL,
  tagline TEXT,
  
  -- Logos (stored as Supabase Storage paths)
  logo_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  apple_touch_icon_url TEXT,
  
  -- Colors (hex values)
  primary_color TEXT DEFAULT '#0F172A',
  primary_foreground TEXT DEFAULT '#FFFFFF',
  accent_color TEXT DEFAULT '#3B82F6',
  accent_foreground TEXT DEFAULT '#FFFFFF',
  
  -- Email Branding
  email_from_name TEXT,
  email_reply_to TEXT,
  email_footer_text TEXT,
  email_footer_address TEXT,
  email_logo_url TEXT,
  email_social_links JSONB DEFAULT '{}',
  
  -- Portal Branding
  portal_welcome_title TEXT,
  portal_welcome_subtitle TEXT,
  portal_login_background_url TEXT,
  portal_custom_css TEXT,
  
  -- Legal / Footer
  support_email TEXT,
  support_url TEXT,
  privacy_policy_url TEXT,
  terms_of_service_url TEXT,
  
  -- White-Label Level
  white_label_level TEXT DEFAULT 'basic' CHECK (white_label_level IN ('basic', 'full', 'custom')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(agency_id)
);

-- RLS Policies
ALTER TABLE public.agency_branding ENABLE ROW LEVEL SECURITY;

-- Agency members can read their agency's branding
CREATE POLICY "Agency members can read branding"
  ON public.agency_branding FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members WHERE user_id = auth.uid()
    )
  );

-- Agency owners/admins can update branding
CREATE POLICY "Agency admins can update branding"
  ON public.agency_branding FOR ALL
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Super admins can manage all branding
CREATE POLICY "Super admins full access to branding"
  ON public.agency_branding FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Portal clients can read branding for their agency
CREATE POLICY "Portal clients can read branding"
  ON public.agency_branding FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.portal_clients WHERE user_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_agency_branding_updated_at
  BEFORE UPDATE ON public.agency_branding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
