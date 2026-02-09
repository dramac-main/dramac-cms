# PHASE-UX-02: Notification Center, In-App Notifications & Real-Time Updates

**Priority**: 🟡 P1 (High — User Engagement)  
**Estimated Effort**: 2-3 days  
**Dependencies**: PHASE-WL-01 (BrandingProvider), PHASE-WL-02 (Notification Preferences)  
**Goal**: Build a world-class notification system — in-app real-time notifications alongside the email system

---

## Context

The current notification system has basic infrastructure but lacks:
- Real-time in-app notifications (WebSocket/SSE)
- Notification center dropdown in the header
- Mark as read/unread functionality
- Notification grouping and summarization
- Push notification support (optional)
- Integration between email and in-app notifications

---

## Task 1: Notification Database Schema Enhancement

**Problem**: Need a robust notification storage that supports grouping, read status, and action links.

### Migration

```sql
-- Enhance existing notifications table or create if not exists
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id),
  
  -- Content
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT,                    -- Icon name (e.g., 'calendar', 'shopping-cart', 'users')
  icon_color TEXT,              -- Icon color (e.g., 'blue', 'green', 'red')
  
  -- Action
  action_url TEXT,              -- Where clicking the notification goes
  action_label TEXT,            -- "View booking", "Review order"
  
  -- Categorization
  category TEXT NOT NULL CHECK (category IN (
    'team', 'site', 'booking', 'order', 'form', 'billing', 
    'security', 'system', 'domain', 'module'
  )),
  
  -- Grouping
  group_key TEXT,               -- Group related notifications (e.g., 'site:abc123')
  
  -- Source
  source_type TEXT,             -- 'booking', 'order', 'form_submission', etc.
  source_id UUID,               -- ID of the source record
  
  -- Actor (who triggered the notification)
  actor_id UUID REFERENCES auth.users(id),
  actor_name TEXT,
  actor_avatar_url TEXT,
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  archived BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Expiry (optional)
  expires_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read, created_at DESC)
  WHERE NOT archived;
CREATE INDEX idx_notifications_user_category ON public.notifications(user_id, category, created_at DESC);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());
```

### Acceptance Criteria
- [ ] Notifications table supports all required fields
- [ ] Efficient indexes for unread count and category queries
- [ ] RLS restricts users to their own notifications

---

## Task 2: Notification Service (Server-Side)

**Problem**: No centralized service for creating and managing notifications.  
**Solution**: Build a `NotificationService` that creates notifications, checks preferences, and optionally sends emails.

### Implementation

Create `src/lib/services/notification-service.ts`:

```typescript
interface CreateNotificationOptions {
  userId: string;
  agencyId?: string;
  title: string;
  body: string;
  category: NotificationCategory;
  icon?: string;
  iconColor?: string;
  actionUrl?: string;
  actionLabel?: string;
  sourceType?: string;
  sourceId?: string;
  actorId?: string;
  actorName?: string;
  actorAvatarUrl?: string;
  groupKey?: string;
  // Email settings
  sendEmail?: boolean;       // Also send as email? (default: check preferences)
  emailType?: EmailType;     // Which email template to use
  emailData?: Record<string, any>; // Data for email template
}

export class NotificationService {
  
  // Create a single notification
  static async create(options: CreateNotificationOptions): Promise<Notification> {
    // 1. Check notification preferences
    const prefs = await getNotificationPreferences(options.userId);
    const categoryKey = `inapp_${options.category}_notifications` as keyof NotificationPreferences;
    
    // 2. Create in-app notification (unless opted out)
    let notification: Notification | null = null;
    if (prefs[categoryKey] !== false) {
      notification = await supabase.from('notifications').insert({
        user_id: options.userId,
        agency_id: options.agencyId,
        title: options.title,
        body: options.body,
        category: options.category,
        icon: options.icon,
        icon_color: options.iconColor,
        action_url: options.actionUrl,
        action_label: options.actionLabel,
        source_type: options.sourceType,
        source_id: options.sourceId,
        actor_id: options.actorId,
        actor_name: options.actorName,
        actor_avatar_url: options.actorAvatarUrl,
        group_key: options.groupKey,
      }).select().single();
    }
    
    // 3. Send email if configured
    if (options.sendEmail !== false && options.emailType) {
      await sendBrandedEmail(options.agencyId!, {
        to: await getUserEmail(options.userId),
        emailType: options.emailType,
        data: options.emailData,
        recipientUserId: options.userId,
      });
    }
    
    // 4. Trigger real-time event (for WebSocket/SSE)
    await broadcastNotification(options.userId, notification);
    
    return notification!;
  }
  
  // Create notifications for multiple users (e.g., all team members)
  static async createBulk(
    userIds: string[], 
    options: Omit<CreateNotificationOptions, 'userId'>
  ): Promise<void> {
    await Promise.all(
      userIds.map(userId => this.create({ ...options, userId }))
    );
  }
  
  // Mark as read
  static async markRead(notificationId: string, userId: string): Promise<void> {
    await supabase.from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId);
  }
  
  // Mark all as read
  static async markAllRead(userId: string, category?: string): Promise<void> {
    let query = supabase.from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false);
    if (category) query = query.eq('category', category);
    await query;
  }
  
  // Get unread count
  static async getUnreadCount(userId: string): Promise<number> {
    const { count } = await supabase.from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
      .eq('archived', false);
    return count ?? 0;
  }
}
```

### Acceptance Criteria
- [ ] `NotificationService.create()` creates in-app + optional email notification
- [ ] Respects user's notification preferences
- [ ] Bulk creation for multi-user notifications
- [ ] Mark read/unread functionality
- [ ] Unread count query is efficient

---

## Task 3: Real-Time Notification Delivery (Supabase Realtime)

**Problem**: Notifications only appear on page refresh.  
**Solution**: Use Supabase Realtime to push new notifications to the client instantly.

### Implementation

Create `src/hooks/use-realtime-notifications.ts`:

```typescript
export function useRealtimeNotifications() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
  
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to new notifications for this user
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setUnreadCount(prev => prev + 1);
          setLatestNotification(payload.new as Notification);
          
          // Show toast for new notification
          toast(payload.new.title, {
            description: payload.new.body,
            action: payload.new.action_url ? {
              label: payload.new.action_label ?? 'View',
              onClick: () => router.push(payload.new.action_url),
            } : undefined,
          });
        }
      )
      .subscribe();
    
    // Fetch initial unread count
    NotificationService.getUnreadCount(user.id).then(setUnreadCount);
    
    return () => { supabase.removeChannel(channel); };
  }, [user]);
  
  return { unreadCount, latestNotification };
}
```

### Acceptance Criteria
- [ ] New notifications appear in real-time (no page refresh)
- [ ] Toast notification shown when new notification arrives
- [ ] Unread count updates in real-time
- [ ] Subscription cleans up on unmount

---

## Task 4: Notification Center UI (Header Dropdown)

**Problem**: No way to view and interact with notifications from the dashboard.  
**Solution**: Bell icon in header with dropdown notification center.

### Implementation

Create `src/components/notifications/notification-center.tsx`:

**Bell Icon with Badge:**
```
[🔔] ← Red dot with unread count (e.g., "3")
```

**Dropdown Panel (on click):**
```
┌──────────────────────────────────────┐
│ Notifications              Mark all ✓│
│──────────────────────────────────────│
│ Filter: All | Unread | [Category ▾] │
│──────────────────────────────────────│
│ 🔵 John added a new booking          │ ← Unread (blue dot)
│    Via Acme Photography · 2 min ago  │
│    [View booking →]                  │
│──────────────────────────────────────│
│    Site "Portfolio" was published     │ ← Read (no dot)
│    1 hour ago                        │
│    [View site →]                     │
│──────────────────────────────────────│
│ 🔵 New order #1234 ($45.00)         │
│    Via E-Commerce Store · 3 hrs ago  │
│    [View order →]                    │
│──────────────────────────────────────│
│         View all notifications →     │
└──────────────────────────────────────┘
```

**Features:**
- Infinite scroll (load more as user scrolls)
- Filter by: All / Unread / Category
- Click notification → navigate to action URL + mark as read
- "Mark all as read" button
- Actor avatar shown when available
- Relative timestamps ("2 min ago", "Yesterday")
- Empty state: "You're all caught up! 🎉"

### Full Notification Page

Create `src/app/(dashboard)/dashboard/notifications/page.tsx`:
- Full-page version of the notification center
- Grouped by day ("Today", "Yesterday", "This week", "Older")
- Bulk actions: mark read, archive, delete
- Filter by category tabs
- Search notifications

### Acceptance Criteria
- [ ] Bell icon in header with unread badge
- [ ] Dropdown shows recent notifications
- [ ] Click notification → navigates + marks as read
- [ ] "Mark all as read" works
- [ ] Filter by category works
- [ ] Full notification page with grouping and bulk actions
- [ ] Empty state is friendly
- [ ] Mobile: dropdown becomes full-screen

---

## Task 5: Integrate Notifications Across All Features

**Problem**: Features (booking, e-commerce, team, etc.) don't create notifications.  
**Solution**: Add `NotificationService.create()` calls at every key event.

### Notification Map

| Event | Recipient(s) | Category | Icon | Email? |
|-------|-------------|----------|------|--------|
| New booking received | Site owner + agency admins | booking | `calendar` | ✅ |
| Booking cancelled | Site owner + customer | booking | `calendar-x` | ✅ |
| Booking confirmed | Customer | booking | `calendar-check` | ✅ |
| New order placed | Site owner + agency admins | order | `shopping-cart` | ✅ |
| Order shipped | Customer | order | `truck` | ✅ |
| Order cancelled | Customer + site owner | order | `x-circle` | ✅ |
| New form submission | Site owner | form | `file-text` | ✅ (digest) |
| Team member invited | Invitee | team | `user-plus` | ✅ |
| Team member joined | Agency members | team | `user-check` | ✅ |
| Team member removed | Removed member | team | `user-minus` | ✅ |
| Site published | Agency members | site | `globe` | ✅ |
| Site taken offline | Agency admins | site | `globe-off` | ❌ |
| Domain connected | Site owner | domain | `link` | ✅ |
| Domain health alert | Site owner | domain | `alert-triangle` | ✅ |
| Payment received | Agency owner | billing | `credit-card` | ✅ |
| Payment failed | Agency owner | billing | `alert-circle` | ✅ |
| Trial ending (3 days) | Agency owner | billing | `clock` | ✅ |
| Subscription upgraded | Agency owner | billing | `trending-up` | ✅ |
| Module installed | Agency admins | module | `package` | ❌ |
| Module updated | Agency admins | module | `refresh-cw` | ❌ |
| Password changed | User | security | `shield` | ✅ (always) |
| New device login | User | security | `smartphone` | ✅ (always) |
| Role changed | Affected user | team | `shield` | ✅ |

### Implementation

For each event, find the server action/API route that handles it and add:

```typescript
// Example: In booking creation action
await NotificationService.create({
  userId: siteOwnerId,
  agencyId,
  title: `New booking from ${customerName}`,
  body: `${serviceName} on ${formatDate(bookingDate)}`,
  category: 'booking',
  icon: 'calendar',
  iconColor: 'blue',
  actionUrl: `/dashboard/sites/${siteId}/booking/${bookingId}`,
  actionLabel: 'View booking',
  sourceType: 'booking',
  sourceId: bookingId,
  actorName: customerName,
  sendEmail: true,
  emailType: 'booking_confirmation_owner',
  emailData: { customerName, serviceName, bookingDate, ... },
});
```

### Acceptance Criteria
- [ ] All events in the notification map trigger in-app notifications
- [ ] Email sent alongside in-app notification (where marked)
- [ ] Notifications respect user preferences
- [ ] Actor information shown when relevant
- [ ] Action URLs navigate to correct page

---

## Task 6: Notification Sound & Browser Notifications (Optional Enhancement)

**Problem**: Users may miss notifications if they're in a different tab.  
**Solution**: Optional browser notification support.

### Implementation

1. **Notification Sound**:
   - Play a subtle sound on new notification (configurable in preferences)
   - Add `notification_sound` boolean to preferences

2. **Browser Notifications (Web Push)**:
   - Request permission on first login
   - Show browser notification when tab is in background
   - Click browser notification → focus tab + navigate to notification

3. **Preferences**:
   - Add to notification preferences page:
     - Sound on/off
     - Browser notifications on/off
     - Do not disturb schedule

### Acceptance Criteria
- [ ] Notification sound plays for new notifications (when enabled)
- [ ] Browser notification shown when tab is in background
- [ ] User can disable sound and browser notifications
- [ ] Sound is subtle and professional

---

## Files to Create/Modify

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `migrations/XXXX_notifications_enhanced.sql` | Enhanced notifications table |
| CREATE | `src/lib/services/notification-service.ts` | Core notification service |
| CREATE | `src/hooks/use-realtime-notifications.ts` | Real-time subscription |
| CREATE | `src/components/notifications/notification-center.tsx` | Header dropdown |
| CREATE | `src/components/notifications/notification-item.tsx` | Single notification card |
| CREATE | `src/components/notifications/notification-filters.tsx` | Category/status filters |
| MODIFY | `src/app/(dashboard)/dashboard/notifications/page.tsx` | Full notification page |
| MODIFY | Dashboard header component | Bell icon + badge |
| MODIFY | 15-20 server action files | Add notification creation calls |
| MODIFY | Notification preferences page | Sound/push toggles |

---

## Testing Checklist

- [ ] Create a booking → notification appears in real-time in notification center
- [ ] Bell icon shows correct unread count
- [ ] Click notification → navigates to correct page + marks as read
- [ ] "Mark all as read" clears all unread indicators
- [ ] Filter by category → only matching notifications shown
- [ ] Full notification page shows grouped notifications
- [ ] Toggle off booking notifications in preferences → no in-app notification for bookings
- [ ] Multiple team members receive notification when team event occurs
- [ ] Notification toast appears when notification arrives
- [ ] Empty state shown when no notifications
- [ ] Mobile: notification center is full-screen
- [ ] 50+ notifications → pagination/infinite scroll works
