-- Expand notifications.type CHECK constraint to match all types defined in
-- src/types/notifications.ts. The previous constraint only covered ~35 types
-- and silently rejected inserts for the ~20 newer types (email_provisioned,
-- domain_provisioned, email_expiry_*, quote_amendment_requested, etc.).
--
-- Safe to run multiple times.

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'welcome',
    'site_published',
    'site_updated',
    'client_created',
    'client_updated',
    'team_invite',
    'team_joined',
    'team_left',
    'payment_success',
    'payment_failed',
    'subscription_renewed',
    'subscription_cancelled',
    'comment_added',
    'mention',
    'security_alert',
    'system',
    'new_booking',
    'booking_confirmed',
    'booking_cancelled',
    'new_order',
    'order_shipped',
    'order_delivered',
    'order_cancelled',
    'refund_issued',
    'low_stock',
    'payment_received',
    'new_quote_request',
    'quote_accepted',
    'quote_rejected',
    'quote_amendment_requested',
    'form_submission',
    'chat_message',
    'chat_assigned',
    'chat_missed',
    'chat_rating',
    'email_provisioned',
    'email_provisioning_failed',
    'domain_provisioned',
    'domain_provisioning_failed',
    'dns_configured',
    'email_auto_renewed',
    'email_auto_renew_failed',
    'email_expiry_60d',
    'email_expiry_30d',
    'email_expiry_14d',
    'email_expiry_7d',
    'email_expiry_1d'
  )
);
