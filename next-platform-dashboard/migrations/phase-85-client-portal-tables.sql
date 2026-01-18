-- Phase 85: Client Portal Tables
-- Support tickets, messages, and notifications

-- Support tickets (linked to client via clients table)
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE, -- SUP-00001
  
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- general, bug, feature, billing
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  status TEXT DEFAULT 'open', -- open, in_progress, resolved, closed
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Ticket messages (conversation thread)
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'agent')),
  sender_id UUID NOT NULL, -- client_id or profile_id depending on sender_type
  sender_name TEXT NOT NULL,
  
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]', -- [{url, name, type}]
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client notifications
CREATE TABLE IF NOT EXISTS client_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL, -- ticket_update, site_published, invoice, system
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  metadata JSONB DEFAULT '{}',
  
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM support_tickets;
  
  NEW.ticket_number := 'SUP-' || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_ticket_number ON support_tickets;
CREATE TRIGGER set_ticket_number
BEFORE INSERT ON support_tickets
FOR EACH ROW
WHEN (NEW.ticket_number IS NULL OR NEW.ticket_number = '')
EXECUTE FUNCTION generate_ticket_number();

-- Update updated_at on ticket changes
CREATE OR REPLACE FUNCTION update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_support_tickets_timestamp ON support_tickets;
CREATE TRIGGER update_support_tickets_timestamp
BEFORE UPDATE ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION update_ticket_timestamp();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_client ON support_tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created ON ticket_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_client_notifications_client ON client_notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_client_notifications_unread ON client_notifications(client_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_client_notifications_created ON client_notifications(created_at DESC);

-- RLS Policies

-- Support Tickets RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Agency members can view and manage all tickets for their clients
CREATE POLICY "Agency members can view client tickets" ON support_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN profiles p ON p.agency_id = c.agency_id
      WHERE c.id = support_tickets.client_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Agency members can manage tickets" ON support_tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN profiles p ON p.agency_id = c.agency_id
      WHERE c.id = support_tickets.client_id
      AND p.id = auth.uid()
    )
  );

-- Clients can view and create their own tickets
CREATE POLICY "Clients can view own tickets" ON support_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = support_tickets.client_id
      AND c.portal_user_id = auth.uid()
      AND c.has_portal_access = true
    )
  );

CREATE POLICY "Clients can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = support_tickets.client_id
      AND c.portal_user_id = auth.uid()
      AND c.has_portal_access = true
    )
  );

-- Ticket Messages RLS
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Agency members can view and add messages to their client tickets
CREATE POLICY "Agency members can view ticket messages" ON ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets t
      JOIN clients c ON c.id = t.client_id
      JOIN profiles p ON p.agency_id = c.agency_id
      WHERE t.id = ticket_messages.ticket_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Agency members can add ticket messages" ON ticket_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets t
      JOIN clients c ON c.id = t.client_id
      JOIN profiles p ON p.agency_id = c.agency_id
      WHERE t.id = ticket_messages.ticket_id
      AND p.id = auth.uid()
    )
  );

-- Clients can view and add messages to their own tickets
CREATE POLICY "Clients can view own ticket messages" ON ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets t
      JOIN clients c ON c.id = t.client_id
      WHERE t.id = ticket_messages.ticket_id
      AND c.portal_user_id = auth.uid()
      AND c.has_portal_access = true
    )
  );

CREATE POLICY "Clients can add messages to own tickets" ON ticket_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets t
      JOIN clients c ON c.id = t.client_id
      WHERE t.id = ticket_messages.ticket_id
      AND c.portal_user_id = auth.uid()
      AND c.has_portal_access = true
    )
  );

-- Client Notifications RLS
ALTER TABLE client_notifications ENABLE ROW LEVEL SECURITY;

-- Agency members can view and manage notifications for their clients
CREATE POLICY "Agency members can view client notifications" ON client_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN profiles p ON p.agency_id = c.agency_id
      WHERE c.id = client_notifications.client_id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Agency members can manage notifications" ON client_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN profiles p ON p.agency_id = c.agency_id
      WHERE c.id = client_notifications.client_id
      AND p.id = auth.uid()
    )
  );

-- Clients can view and update their own notifications
CREATE POLICY "Clients can view own notifications" ON client_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = client_notifications.client_id
      AND c.portal_user_id = auth.uid()
      AND c.has_portal_access = true
    )
  );

CREATE POLICY "Clients can update own notifications" ON client_notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = client_notifications.client_id
      AND c.portal_user_id = auth.uid()
      AND c.has_portal_access = true
    )
  );
