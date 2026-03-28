-- =============================================================================
-- PHASE LC-12: Payment Method Selection Buttons
-- =============================================================================
-- Adds 'payment_method_select' content type for interactive payment method
-- selection in live chat. When a visitor has a pending manual payment order,
-- the AI sends a button-based message asking which payment method they want,
-- instead of dumping all instructions at once.
-- =============================================================================

-- Add payment_method_select to the content_type CHECK constraint
ALTER TABLE mod_chat_messages DROP CONSTRAINT IF EXISTS mod_chat_messages_content_type_check;
ALTER TABLE mod_chat_messages ADD CONSTRAINT mod_chat_messages_content_type_check
  CHECK (content_type IN (
    'text', 'image', 'file', 'audio', 'video', 'location',
    'system', 'note', 'whatsapp_template', 'payment_method_select'
  ));

-- Content for 'payment_method_select' messages is a JSON string:
-- {
--   "text": "How would you like to pay for order ORD-001?",
--   "orderNumber": "ORD-001",
--   "orderTotal": "ZMW 150.00",
--   "buttons": [
--     { "id": "bank_transfer", "label": "Bank Transfer" },
--     { "id": "mobile_money", "label": "Mobile Money" }
--   ]
-- }
