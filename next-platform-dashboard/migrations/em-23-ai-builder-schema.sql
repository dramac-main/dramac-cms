-- Phase EM-23: AI Module Builder Database Schema
-- AI-powered module generation from natural language descriptions

-- AI Generation Sessions
CREATE TABLE ai_module_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Status
  status TEXT DEFAULT 'drafting' CHECK (status IN (
    'drafting', 'generating', 'reviewing', 'complete', 'failed', 'cancelled'
  )),
  
  -- Final module
  module_id UUID REFERENCES modules_v2(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation Messages
CREATE TABLE ai_module_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_module_sessions(id) ON DELETE CASCADE,
  
  -- Message
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Metadata
  tokens_used INTEGER,
  model TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Specifications
CREATE TABLE ai_module_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_module_sessions(id) ON DELETE CASCADE,
  
  -- Version
  version INTEGER DEFAULT 1,
  
  -- Spec content
  spec JSONB NOT NULL,
  /*
  {
    name: "Inventory Tracker",
    description: "...",
    type: "app",
    features: ["product list", "stock alerts", "categories"],
    entities: [
      { name: "product", fields: [...] }
    ],
    pages: [...],
    api_endpoints: [...],
    components: [...]
  }
  */
  
  -- Status
  is_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Code
CREATE TABLE ai_module_generated_code (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_module_sessions(id) ON DELETE CASCADE,
  spec_id UUID NOT NULL REFERENCES ai_module_specs(id) ON DELETE CASCADE,
  
  -- Code content
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'sql', 'tsx', 'ts', 'json'
  content TEXT NOT NULL,
  
  -- Status
  is_modified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_sessions_agency ON ai_module_sessions(agency_id);
CREATE INDEX idx_ai_sessions_user ON ai_module_sessions(user_id);
CREATE INDEX idx_ai_sessions_status ON ai_module_sessions(status);
CREATE INDEX idx_ai_messages_session ON ai_module_messages(session_id);
CREATE INDEX idx_ai_messages_created ON ai_module_messages(created_at);
CREATE INDEX idx_ai_specs_session ON ai_module_specs(session_id);
CREATE INDEX idx_ai_specs_approved ON ai_module_specs(is_approved);
CREATE INDEX idx_ai_code_session ON ai_module_generated_code(session_id);
CREATE INDEX idx_ai_code_spec ON ai_module_generated_code(spec_id);

-- Enable RLS
ALTER TABLE ai_module_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_module_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_module_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_module_generated_code ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_module_sessions
CREATE POLICY "Users can view their agency's sessions"
  ON ai_module_sessions FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sessions in their agency"
  ON ai_module_sessions FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own sessions"
  ON ai_module_sessions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions"
  ON ai_module_sessions FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for ai_module_messages
CREATE POLICY "Users can view messages in their sessions"
  ON ai_module_messages FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM ai_module_sessions 
      WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create messages in their sessions"
  ON ai_module_messages FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM ai_module_sessions WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for ai_module_specs
CREATE POLICY "Users can view specs in their sessions"
  ON ai_module_specs FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM ai_module_sessions 
      WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create specs in their sessions"
  ON ai_module_specs FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM ai_module_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update specs in their sessions"
  ON ai_module_specs FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM ai_module_sessions WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for ai_module_generated_code
CREATE POLICY "Users can view generated code in their sessions"
  ON ai_module_generated_code FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM ai_module_sessions 
      WHERE agency_id IN (
        SELECT agency_id FROM agency_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create generated code in their sessions"
  ON ai_module_generated_code FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM ai_module_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update generated code in their sessions"
  ON ai_module_generated_code FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM ai_module_sessions WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_ai_module_sessions_updated_at
  BEFORE UPDATE ON ai_module_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
