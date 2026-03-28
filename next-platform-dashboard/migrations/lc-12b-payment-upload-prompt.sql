-- PHASE LC-12b: Add payment_upload_prompt content type
-- Applied: 2026-03-31
-- This content type is used when the AI responds with payment method details
-- after the customer selects a method, showing an "Upload Proof" button.

ALTER TABLE mod_chat_messages 
DROP CONSTRAINT mod_chat_messages_content_type_check;

ALTER TABLE mod_chat_messages 
ADD CONSTRAINT mod_chat_messages_content_type_check 
CHECK (content_type = ANY (ARRAY[
  'text'::text, 'image'::text, 'file'::text, 'audio'::text, 
  'video'::text, 'location'::text, 'system'::text, 'note'::text, 
  'whatsapp_template'::text, 'payment_method_select'::text,
  'payment_upload_prompt'::text
]));
