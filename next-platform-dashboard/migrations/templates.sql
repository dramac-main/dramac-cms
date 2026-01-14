-- Templates table for saving reusable designs
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  content JSONB NOT NULL,
  category TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Public templates visible to all
CREATE POLICY "Public templates are viewable by everyone"
  ON public.templates FOR SELECT
  USING (is_public = true);

-- Agency members can view their templates
CREATE POLICY "Agency members can view their templates"
  ON public.templates FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agency_members 
      WHERE user_id = auth.uid()
    )
  );

-- Admins can create templates
CREATE POLICY "Admins can create templates"
  ON public.templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agency_members 
      WHERE user_id = auth.uid() 
      AND agency_id = templates.agency_id
      AND role IN ('owner', 'admin')
    )
  );

-- Admins can update their templates
CREATE POLICY "Admins can update their templates"
  ON public.templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members 
      WHERE user_id = auth.uid() 
      AND agency_id = templates.agency_id
      AND role IN ('owner', 'admin')
    )
  );

-- Admins can delete their templates
CREATE POLICY "Admins can delete their templates"
  ON public.templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members 
      WHERE user_id = auth.uid() 
      AND agency_id = templates.agency_id
      AND role IN ('owner', 'admin')
    )
  );

CREATE INDEX idx_templates_agency ON public.templates(agency_id);
CREATE INDEX idx_templates_category ON public.templates(category);
CREATE INDEX idx_templates_public ON public.templates(is_public) WHERE is_public = true;

-- Trigger for updated_at
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
