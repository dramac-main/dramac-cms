# Phase EM-54: Social Media Management Module - Testing Guide

**Created**: January 28, 2026  
**Status**: Ready for Testing  
**Module**: Social Media Management (Hootsuite + Sprout Social style)

---

## 🎯 Testing Overview

This guide provides **step-by-step real-world workflows** for testing the Phase EM-54 Social Media Management Module. Follow these scenarios to verify all features work correctly with **real fields** (no placeholders).

---

## ✅ Prerequisites

Before testing, ensure:
1. **Database Migration Applied**: `migrations/em-54-social-media.sql` executed
2. **TypeScript Builds**: Zero errors (`tsc --noEmit`)
3. **Test Agency Created**: You have an agency account
4. **Test Site Created**: You have at least one site
5. **Development Server Running**: `pnpm dev` in `next-platform-dashboard/`

---

## 📋 Testing Scenarios

### Scenario 1: Connect Social Media Accounts (15 mins)

**Objective**: Connect social media accounts to start publishing content.

#### Step 1.1: Navigate to Social Module
1. Log in to DRAMAC dashboard
2. Go to **Dashboard** → Select your test site (e.g., "Acme Corporation")
3. Click the **"Social"** button in the site header (Share2 icon)
   - **Expected**: Redirects to `/dashboard/{siteId}/social`

#### Step 1.2: View Empty State
1. On the Social Dashboard, observe the empty state
2. Check displayed message: "No social accounts connected yet"
3. Locate the **"Connect Account"** button

#### Step 1.3: Mock Account Connection (Database Test)
Since OAuth requires actual platform credentials, we'll create a mock account directly in the database:

**Test Data**:
```sql
-- Insert test Facebook account
INSERT INTO mod_social.accounts (
  site_id,
  tenant_id,
  platform,
  platform_account_id,
  account_type,
  account_name,
  account_handle,
  account_avatar,
  account_url,
  access_token,
  refresh_token,
  token_expires_at,
  scopes,
  status,
  health_score,
  followers_count,
  following_count,
  posts_count,
  engagement_rate,
  created_by
) VALUES (
  '{YOUR_SITE_ID}',  -- Replace with actual site ID
  '{YOUR_TENANT_ID}', -- Replace with actual tenant ID
  'facebook',
  'fb_123456789',
  'page',
  'Acme Corporation Page',
  '@acmecorp',
  'https://via.placeholder.com/150',
  'https://facebook.com/acmecorp',
  'mock_access_token_fb_abc123xyz',
  'mock_refresh_token_fb_def456',
  NOW() + INTERVAL '60 days',
  ARRAY['pages_manage_posts', 'pages_read_engagement'],
  'active',
  95,
  12500,
  250,
  342,
  4.25,
  '{YOUR_USER_ID}'  -- Replace with actual user ID
);

-- Insert test Instagram account
INSERT INTO mod_social.accounts (
  site_id,
  tenant_id,
  platform,
  platform_account_id,
  account_type,
  account_name,
  account_handle,
  account_avatar,
  account_url,
  access_token,
  status,
  health_score,
  followers_count,
  following_count,
  posts_count,
  engagement_rate,
  created_by
) VALUES (
  '{YOUR_SITE_ID}',
  '{YOUR_TENANT_ID}',
  'instagram',
  'ig_987654321',
  'business',
  'Acme Corporation',
  '@acme_corp',
  'https://via.placeholder.com/150',
  'https://instagram.com/acme_corp',
  'mock_access_token_ig_xyz789',
  'active',
  92,
  8750,
  180,
  287,
  5.12,
  '{YOUR_USER_ID}'
);

-- Insert test Twitter account
INSERT INTO mod_social.accounts (
  site_id,
  tenant_id,
  platform,
  platform_account_id,
  account_type,
  account_name,
  account_handle,
  account_avatar,
  account_url,
  access_token,
  status,
  health_score,
  followers_count,
  following_count,
  posts_count,
  engagement_rate,
  created_by
) VALUES (
  '{YOUR_SITE_ID}',
  '{YOUR_TENANT_ID}',
  'twitter',
  'tw_555666777',
  'profile',
  'Acme Corp',
  '@AcmeCorp',
  'https://via.placeholder.com/150',
  'https://twitter.com/AcmeCorp',
  'mock_access_token_tw_pqr456',
  'active',
  88,
  5200,
  420,
  521,
  3.87,
  '{YOUR_USER_ID}'
);
```

**How to Get Your IDs**:
```sql
-- Get your site ID
SELECT id, name FROM sites WHERE agency_id = '{YOUR_AGENCY_ID}' LIMIT 1;

-- Get your tenant ID (agency ID)
SELECT id, name FROM agencies LIMIT 1;

-- Get your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com' LIMIT 1;
```

#### Step 1.4: Verify Accounts Display
1. Refresh the Social Dashboard page
2. **Expected**: See 3 connected accounts (Facebook, Instagram, Twitter)
3. Verify each account card shows:
   - Platform icon and name
   - Account name: "Acme Corporation Page", "Acme Corporation", "Acme Corp"
   - Account handle: @acmecorp, @acme_corp, @AcmeCorp
   - Followers count: 12,500 | 8,750 | 5,200
   - Health score badge (green for 95, 92, 88)
   - Status badge: "Active"

**✅ Success Criteria**: 3 accounts visible with correct data.

---

### Scenario 2: Create & Schedule a Post (20 mins)

**Objective**: Compose a post, target multiple platforms, and schedule it.

#### Step 2.1: Navigate to Compose
1. From Social Dashboard, click **"Create Post"** button
   - **Expected**: Redirects to `/dashboard/{siteId}/social/compose`

#### Step 2.2: Compose Multi-Platform Post
1. In the **Post Content** textarea, enter:
   ```
   🚀 Big announcement! We're launching our new product next week!

   Get ready for innovation that will transform how you work. Stay tuned for the reveal on Monday!

   #ProductLaunch #Innovation #TechNews #AcmeCorp
   ```

2. **Select Target Accounts**:
   - Check: ☑️ Facebook - Acme Corporation Page
   - Check: ☑️ Instagram - Acme Corporation
   - Check: ☑️ Twitter - Acme Corp

3. **Verify Character Counts** (platform-specific limits):
   - Twitter: Should show count out of 280 characters
   - Facebook: Should show count out of 63,206 characters
   - Instagram: Should show count out of 2,200 characters

#### Step 2.3: Add Media
1. Click **"Add Media"** button
2. Select or upload an image:
   - **Test Image**: Use any product image (1200x630px recommended)
   - **Alt Text**: "New product teaser image with Acme logo"

3. **Expected**: Image preview appears below content
4. Verify image dimensions are displayed

#### Step 2.4: Customize Platform Content (Optional)
1. Click **"Customize by Platform"** toggle
2. For Instagram, add first comment:
   ```
   📸 Follow us for behind-the-scenes content!
   Link in bio for early access signup.
   ```

3. For Twitter, adjust content to fit character limit:
   ```
   🚀 Big announcement! New product launching Monday!

   Innovation that transforms how you work. Stay tuned!

   #ProductLaunch #Innovation #TechNews
   ```

#### Step 2.5: Schedule the Post
1. Toggle **"Schedule"** option
2. Click on **"Schedule Date"** picker
3. Select date: **Next Monday** (e.g., February 3, 2026)
4. Click on **"Schedule Time"** picker
5. Select time: **09:00 AM**
6. Verify timezone is set to your local timezone

7. Click **"Schedule Post"** button

#### Step 2.6: Verify Scheduled Post
**Test Data Inserted**:
```sql
-- Query to verify post was created
SELECT 
  id,
  content,
  status,
  scheduled_at,
  target_accounts,
  created_at
FROM mod_social.posts
WHERE site_id = '{YOUR_SITE_ID}'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Results**:
- `status` = 'scheduled'
- `scheduled_at` = '2026-02-03 09:00:00'
- `target_accounts` = Array with 3 account IDs
- `content` matches what you entered

**✅ Success Criteria**: Post created with status "scheduled" and appears in calendar.

---

### Scenario 3: Content Calendar Management (15 mins)

**Objective**: View scheduled posts in calendar, drag-drop to reschedule.

#### Step 3.1: Navigate to Calendar
1. From Social Dashboard, click **"Calendar"** in navigation
   - **Expected**: Redirects to `/dashboard/{siteId}/social/calendar`

#### Step 3.2: View Calendar Month View
1. **Expected**: Calendar displays current month
2. Verify controls:
   - ⬅️ Previous month button
   - ➡️ Next month button
   - **Today** button
   - View switcher: **Month** | Week | List

#### Step 3.3: Locate Scheduled Post
1. Navigate to February 2026 (or your scheduled month)
2. Find Monday, February 3rd
3. **Expected**: Post appears as a card on that date
4. Verify card shows:
   - 🕒 09:00 AM
   - Post preview: "🚀 Big announcement! We're launching..."
   - Platform icons: Facebook, Instagram, Twitter
   - Badge: "Scheduled"

#### Step 3.4: Add Calendar Event
Since we need database access, insert a calendar event:

```sql
-- Insert a campaign launch event
INSERT INTO mod_social.calendar_events (
  site_id,
  tenant_id,
  title,
  description,
  color,
  start_date,
  end_date,
  all_day,
  event_type,
  created_by
) VALUES (
  '{YOUR_SITE_ID}',
  '{YOUR_TENANT_ID}',
  'Product Launch Week',
  'Week-long campaign for new product announcement',
  '#10B981',
  '2026-02-03',
  '2026-02-07',
  true,
  'campaign',
  '{YOUR_USER_ID}'
);
```

#### Step 3.5: Verify Event Display
1. Refresh calendar page
2. **Expected**: See "Product Launch Week" spanning Feb 3-7
3. Verify event color is green (#10B981)

#### Step 3.6: Filter by Platform
1. Click **"Filters"** button
2. Select **"Instagram Only"**
3. **Expected**: Calendar only shows posts targeting Instagram
4. Clear filter, verify all posts return

**✅ Success Criteria**: Calendar displays posts and events correctly with filtering.

---

### Scenario 4: Social Inbox Management (15 mins)

**Objective**: Manage incoming comments, messages, and mentions.

#### Step 4.1: Seed Inbox with Test Data
```sql
-- Insert test comment on Facebook post
INSERT INTO mod_social.inbox_items (
  site_id,
  account_id,
  item_type,
  platform_item_id,
  content,
  author_id,
  author_name,
  author_handle,
  author_avatar,
  author_followers,
  status,
  priority,
  sentiment,
  sentiment_score,
  platform_created_at
) VALUES (
  '{YOUR_SITE_ID}',
  '{YOUR_FACEBOOK_ACCOUNT_ID}',
  'comment',
  'fb_comment_12345',
  'This looks amazing! When can we pre-order? 😍',
  'fb_user_99999',
  'Sarah Johnson',
  'sarahjohnson',
  'https://via.placeholder.com/50',
  523,
  'new',
  'high',
  'positive',
  0.89,
  NOW() - INTERVAL '2 hours'
);

-- Insert test mention on Twitter
INSERT INTO mod_social.inbox_items (
  site_id,
  account_id,
  item_type,
  platform_item_id,
  content,
  author_id,
  author_name,
  author_handle,
  author_avatar,
  author_followers,
  status,
  priority,
  sentiment,
  sentiment_score,
  platform_created_at
) VALUES (
  '{YOUR_SITE_ID}',
  '{YOUR_TWITTER_ACCOUNT_ID}',
  'mention',
  'tw_mention_67890',
  '@AcmeCorp Can you share more details about the pricing?',
  'tw_user_88888',
  'Mike Chen',
  'mikechen_tech',
  'https://via.placeholder.com/50',
  1250,
  'new',
  'urgent',
  'neutral',
  0.52,
  NOW() - INTERVAL '1 hour'
);

-- Insert test Instagram DM
INSERT INTO mod_social.inbox_items (
  site_id,
  account_id,
  item_type,
  platform_item_id,
  content,
  author_id,
  author_name,
  author_handle,
  author_avatar,
  author_followers,
  status,
  priority,
  sentiment,
  sentiment_score,
  platform_created_at
) VALUES (
  '{YOUR_SITE_ID}',
  '{YOUR_INSTAGRAM_ACCOUNT_ID}',
  'dm',
  'ig_dm_54321',
  'Hi! I'm interested in becoming a brand ambassador. How can I apply?',
  'ig_user_77777',
  'Emma Davis',
  'emmadavis_official',
  'https://via.placeholder.com/50',
  8200,
  'new',
  'normal',
  'positive',
  0.75,
  NOW() - INTERVAL '30 minutes'
);
```

#### Step 4.2: Navigate to Inbox
1. From Social Dashboard, click **"Inbox"** in navigation
   - **Expected**: Redirects to `/dashboard/{siteId}/social/inbox`

#### Step 4.3: View Inbox Items
1. **Expected**: See 3 inbox items
2. Verify tab counts:
   - **All (3)** 
   - **New (3)**
   - **Replied (0)**
   - **Flagged (0)**

3. Verify each item displays:
   - Author avatar and name
   - Platform icon (Facebook, Twitter, Instagram)
   - Item type badge: "Comment", "Mention", "DM"
   - Priority indicator: High (🔴), Urgent (🟠), Normal
   - Sentiment indicator: 😊 Positive | 😐 Neutral
   - Time ago: "2 hours ago", "1 hour ago", "30 minutes ago"
   - Message preview

#### Step 4.4: Respond to High Priority Item
1. Click on the Facebook comment from Sarah Johnson
2. **Expected**: Item expands showing full details
3. In the **"Reply"** textarea, type:
   ```
   Hi Sarah! 🎉 We're so excited you love it! Pre-orders open Monday, February 3rd at 9 AM EST. Stay tuned to our page for the link!
   ```

4. Click **"Send Reply"** button

#### Step 4.5: Mark Item as Replied
```sql
-- Update the inbox item with response
UPDATE mod_social.inbox_items
SET 
  status = 'replied',
  response_text = 'Hi Sarah! 🎉 We''re so excited you love it! Pre-orders open Monday, February 3rd at 9 AM EST. Stay tuned to our page for the link!',
  response_at = NOW(),
  response_by = '{YOUR_USER_ID}',
  response_time_seconds = EXTRACT(EPOCH FROM (NOW() - platform_created_at))::INTEGER,
  updated_at = NOW()
WHERE platform_item_id = 'fb_comment_12345';
```

#### Step 4.6: Filter and Search
1. Click **"Priority: High"** filter
   - **Expected**: Only shows urgent/high priority items
2. Clear filter
3. In search box, type: "pricing"
   - **Expected**: Shows Twitter mention from Mike Chen
4. Clear search

#### Step 4.7: Use Saved Reply
Create a saved reply first:
```sql
-- Insert saved reply template
INSERT INTO mod_social.saved_replies (
  site_id,
  tenant_id,
  name,
  content,
  category,
  shortcut,
  created_by
) VALUES (
  '{YOUR_SITE_ID}',
  '{YOUR_TENANT_ID}',
  'Pricing Information',
  'Thank you for your interest! Our pricing starts at $99/month for the basic plan. Visit our website at acmecorp.com/pricing for full details, or DM us for a custom quote!',
  'Sales',
  '/pricing',
  '{YOUR_USER_ID}'
);
```

1. Click on Mike Chen's Twitter mention
2. In reply box, type: `/pricing`
3. **Expected**: Autocomplete shows saved reply
4. Press Enter to insert template
5. Customize if needed, then click **"Send Reply"**

**✅ Success Criteria**: Inbox displays items correctly, replies sent, filters work.

---

### Scenario 5: Analytics Dashboard (10 mins)

**Objective**: View engagement metrics and performance insights.

#### Step 5.1: Seed Analytics Data
```sql
-- Insert daily analytics for Facebook account (last 7 days)
INSERT INTO mod_social.analytics_daily (
  account_id,
  date,
  followers_count,
  followers_gained,
  followers_lost,
  posts_count,
  impressions,
  reach,
  engagement_total,
  likes,
  comments,
  shares,
  clicks,
  profile_views,
  website_clicks,
  engagement_rate
) VALUES 
  ('{YOUR_FACEBOOK_ACCOUNT_ID}', CURRENT_DATE - INTERVAL '6 days', 12450, 20, 5, 2, 8500, 6200, 450, 320, 85, 45, 120, 230, 45, 5.29),
  ('{YOUR_FACEBOOK_ACCOUNT_ID}', CURRENT_DATE - INTERVAL '5 days', 12470, 25, 8, 1, 6300, 4800, 380, 280, 65, 35, 95, 180, 32, 6.03),
  ('{YOUR_FACEBOOK_ACCOUNT_ID}', CURRENT_DATE - INTERVAL '4 days', 12495, 30, 10, 3, 12000, 9500, 720, 520, 125, 75, 210, 340, 68, 6.00),
  ('{YOUR_FACEBOOK_ACCOUNT_ID}', CURRENT_DATE - INTERVAL '3 days', 12525, 35, 8, 2, 9200, 7100, 580, 420, 95, 65, 165, 280, 55, 6.30),
  ('{YOUR_FACEBOOK_ACCOUNT_ID}', CURRENT_DATE - INTERVAL '2 days', 12560, 40, 12, 1, 7800, 5900, 490, 360, 80, 50, 140, 210, 48, 6.28),
  ('{YOUR_FACEBOOK_ACCOUNT_ID}', CURRENT_DATE - INTERVAL '1 day', 12600, 45, 10, 2, 10500, 8200, 650, 480, 105, 65, 185, 290, 62, 6.19),
  ('{YOUR_FACEBOOK_ACCOUNT_ID}', CURRENT_DATE, 12645, 50, 15, 1, 8900, 6800, 560, 410, 90, 60, 155, 250, 52, 6.29);
```

#### Step 5.2: View Analytics Overview
1. From Social Dashboard, locate the **"Analytics Overview"** section
2. Verify metric cards display:
   - **Total Followers**: 26,645 (sum across all accounts)
   - **Total Engagement**: 3,830 (last 7 days)
   - **Avg. Engagement Rate**: 6.05%
   - **Posts Published**: 12 (last 7 days)

#### Step 5.3: View Performance Graph
1. **Expected**: Line graph showing daily metrics
2. Verify graph displays:
   - X-axis: Last 7 days (dates)
   - Y-axis: Engagement count
   - Line shows trend: peaks on day 4 (720), day 6 (650)

3. Toggle metric view:
   - Switch to "Impressions"
   - **Expected**: Graph updates to show impressions trend
   - Highest: 12,000 on day 4

#### Step 5.4: View Top Performing Posts
1. Scroll to **"Top Posts"** section
2. **Expected**: Shows posts sorted by engagement rate
3. Each post card should display:
   - Post content preview
   - Platform icons
   - Engagement count
   - Engagement rate %
   - Published date

**✅ Success Criteria**: Analytics display correct metrics and trends.

---

### Scenario 6: Campaign Management (10 mins)

**Objective**: Create a campaign and track performance.

#### Step 6.1: Create Campaign via Database
```sql
-- Insert product launch campaign
INSERT INTO mod_social.campaigns (
  site_id,
  tenant_id,
  name,
  description,
  color,
  start_date,
  end_date,
  goals,
  budget,
  hashtags,
  utm_source,
  utm_medium,
  utm_campaign,
  status,
  created_by
) VALUES (
  '{YOUR_SITE_ID}',
  '{YOUR_TENANT_ID}',
  'Q1 Product Launch',
  'Major product launch campaign with social amplification across all platforms',
  '#8B5CF6',
  '2026-02-03',
  '2026-02-28',
  '{"impressions": 50000, "engagement": 2500, "clicks": 800, "followers": 500}'::jsonb,
  2500.00,
  ARRAY['ProductLaunch', 'Innovation', 'TechNews', 'AcmeCorp'],
  'social',
  'organic',
  'q1_launch_2026',
  'active',
  '{YOUR_USER_ID}'
) RETURNING id;
```

#### Step 6.2: Link Posts to Campaign
Update the post created in Scenario 2:
```sql
-- Link scheduled post to campaign
UPDATE mod_social.posts
SET campaign_id = '{CAMPAIGN_ID_FROM_ABOVE}'
WHERE content LIKE '%Big announcement%'
  AND site_id = '{YOUR_SITE_ID}';
```

#### Step 6.3: View Campaign Dashboard
1. From Social Dashboard, click **"Campaigns"** tab
2. **Expected**: See "Q1 Product Launch" campaign card
3. Verify campaign card shows:
   - Name: "Q1 Product Launch"
   - Status badge: "Active" (green)
   - Date range: Feb 3 - Feb 28, 2026
   - Progress bar showing days elapsed
   - Goal metrics:
     - Impressions: 0 / 50,000 (0%)
     - Engagement: 0 / 2,500 (0%)
     - Clicks: 0 / 800 (0%)
     - Followers: 0 / 500 (0%)

#### Step 6.4: View Campaign Details
1. Click on the campaign card
2. **Expected**: Opens campaign detail view
3. Verify sections:
   - **Overview**: Goals, budget, hashtags
   - **Associated Posts**: Shows 1 post (the scheduled announcement)
   - **Performance**: Timeline chart (will populate after posts go live)
   - **Hashtag Performance**: Tracks hashtag reach

**✅ Success Criteria**: Campaign created and linked to posts.

---

## 🔍 Verification Queries

Run these SQL queries to verify data integrity:

### Check All Social Accounts
```sql
SELECT 
  platform,
  account_name,
  account_handle,
  status,
  followers_count,
  engagement_rate,
  created_at
FROM mod_social.accounts
WHERE site_id = '{YOUR_SITE_ID}'
ORDER BY platform;
```

**Expected**: 3 accounts (Facebook, Instagram, Twitter) with status 'active'.

### Check Scheduled Posts
```sql
SELECT 
  id,
  LEFT(content, 50) as content_preview,
  status,
  scheduled_at,
  array_length(target_accounts, 1) as account_count,
  campaign_id IS NOT NULL as has_campaign
FROM mod_social.posts
WHERE site_id = '{YOUR_SITE_ID}'
  AND status = 'scheduled'
ORDER BY scheduled_at;
```

**Expected**: At least 1 scheduled post for February 3, 2026, 9:00 AM.

### Check Inbox Items
```sql
SELECT 
  item_type,
  LEFT(content, 50) as content_preview,
  author_name,
  status,
  priority,
  sentiment,
  platform_created_at
FROM mod_social.inbox_items
WHERE site_id = '{YOUR_SITE_ID}'
ORDER BY platform_created_at DESC;
```

**Expected**: 3 inbox items (1 comment, 1 mention, 1 DM).

### Check Analytics Data
```sql
SELECT 
  date,
  posts_count,
  impressions,
  engagement_total,
  engagement_rate,
  followers_gained
FROM mod_social.analytics_daily
WHERE account_id IN (
  SELECT id FROM mod_social.accounts 
  WHERE site_id = '{YOUR_SITE_ID}'
)
ORDER BY date DESC
LIMIT 7;
```

**Expected**: 7 days of analytics data with varying metrics.

---

## 🐛 Common Issues & Solutions

### Issue 1: Accounts Not Displaying
**Symptoms**: Social Dashboard shows "No accounts connected"  
**Solution**: 
- Verify `site_id` and `tenant_id` match your actual IDs
- Check RLS policies are not blocking access
- Run: `SELECT * FROM mod_social.accounts WHERE site_id = '{YOUR_SITE_ID}'`

### Issue 2: Posts Not Appearing in Calendar
**Symptoms**: Calendar is empty despite having scheduled posts  
**Solution**:
- Verify `scheduled_at` is in the future
- Check `status` is 'scheduled' (not 'draft')
- Refresh the page to clear cache

### Issue 3: Inbox Items Not Loading
**Symptoms**: Inbox shows zero items  
**Solution**:
- Verify `site_id` matches
- Check `account_id` references valid account
- Ensure `status` is 'new' or other valid status

### Issue 4: TypeScript Errors
**Symptoms**: Build fails with type errors  
**Solution**:
- Run: `cd next-platform-dashboard && npx tsc --noEmit`
- Check imports in action files
- Verify Supabase client types are generated

---

## 📊 Success Metrics

After completing all scenarios, verify:

- ✅ **3 Social Accounts Connected**: Facebook, Instagram, Twitter
- ✅ **1 Post Scheduled**: For February 3, 2026, 9:00 AM
- ✅ **3 Inbox Items**: 1 replied, 2 pending
- ✅ **1 Campaign Created**: "Q1 Product Launch" active
- ✅ **7 Days of Analytics**: Daily data for last week
- ✅ **1 Calendar Event**: Product Launch Week visible
- ✅ **1 Saved Reply**: Pricing template created

---

## 🚀 Next Steps

After testing:

1. **Run Full TypeScript Check**: `tsc --noEmit`
2. **Test Additional Features**:
   - Optimal posting times calculation
   - Team permissions and roles
   - Approval workflows
   - Brand mentions tracking
   - Competitor monitoring
   - AI content generation

3. **Production Readiness**:
   - Set up OAuth credentials for real platforms
   - Configure webhook endpoints for real-time sync
   - Set up scheduled jobs for analytics refresh
   - Test publishing to actual social accounts (sandbox mode)

---

## 📝 Testing Notes Template

Use this template to document your testing:

```markdown
## Test Session: [Date]
**Tester**: [Your Name]
**Environment**: Development

### Scenario 1: Connect Accounts
- [ ] Step 1.1: Navigation - PASS/FAIL
- [ ] Step 1.2: Empty state - PASS/FAIL  
- [ ] Step 1.3: Mock accounts - PASS/FAIL
- [ ] Step 1.4: Verify display - PASS/FAIL
**Notes**: 

### Scenario 2: Create Post
- [ ] Step 2.1: Navigate - PASS/FAIL
- [ ] Step 2.2: Compose - PASS/FAIL
- [ ] Step 2.3: Add media - PASS/FAIL
- [ ] Step 2.4: Customize - PASS/FAIL
- [ ] Step 2.5: Schedule - PASS/FAIL
- [ ] Step 2.6: Verify - PASS/FAIL
**Notes**:

[Continue for all scenarios...]

### Issues Found
1. [Issue description]
   - **Severity**: Critical/Major/Minor
   - **Steps to Reproduce**: 
   - **Expected**: 
   - **Actual**: 

### Overall Assessment
- **Pass Rate**: __/__ scenarios passed
- **Ready for Production**: YES/NO
- **Blockers**: [List any critical issues]
```

---

**End of Testing Guide** 🎯
