# PHASE LC-07: Analytics Dashboard & Reporting

**Phase**: LC-07  
**Module**: Live Chat & Omnichannel Messaging  
**Goal**: Build comprehensive analytics dashboards showing conversation volume, response times, agent performance, customer satisfaction, channel breakdown, and AI effectiveness — all from real database data  
**Independence**: Requires LC-01 (types + DB tables). Can run independently of LC-02 through LC-06 (uses direct DB queries)  
**Estimated Files**: ~10 files  
**Prerequisites**: LC-01 complete (mod_chat_analytics and other tables exist)

---

## CRITICAL RULES

1. Read `/memory-bank/systemPatterns.md` for ALL platform patterns before starting
2. ALL charts use `recharts` library (already in dependencies)
3. ALL data comes from real database queries — ZERO mock data, ZERO Math.random(), ZERO hardcoded numbers
4. Currency formatting: `formatCurrency()` from `@/lib/locale-config`
5. Date/time: Use `date-fns` for formatting, `DEFAULT_TIMEZONE` from locale-config
6. Use Tailwind semantic tokens for colors — no hardcoded hex in components
7. Charts should use muted/semantic colors that work in both light and dark mode
8. Run `npx tsc --noEmit` at the end — zero errors

---

## Task 1: Analytics Server Actions

**File**: `next-platform-dashboard/src/modules/live-chat/actions/analytics-actions.ts`

```typescript
'use server'

// All functions use createClient from @/lib/supabase/server
// All functions use mapRecord/mapRecords from ../lib/map-db-record

// 1. getChatAnalyticsOverview(siteId: string, dateFrom: string, dateTo: string)
//    - Query mod_chat_analytics for date range
//    - Aggregate totals:
//      - Total conversations, total messages
//      - New visitors, returning visitors
//      - Widget vs WhatsApp conversation split
//      - Resolved, missed counts
//      - Avg first response time, avg resolution time
//      - Avg rating, total ratings, satisfaction percentage
//      - AI auto-responses, AI resolved
//    - Compare with previous period of same length for trend arrows
//    - Return { overview: ChatAnalyticsOverview, previousPeriod: ChatAnalyticsOverview, error }

// 2. getChatAnalyticsByDay(siteId: string, dateFrom: string, dateTo: string)
//    - Query mod_chat_analytics grouped by date
//    - Return array of daily data for charts
//    - Return { dailyData: DailyAnalyticsData[], error }

// 3. getChatAnalyticsByHour(siteId: string, date?: string)
//    - Query mod_chat_conversations for the given date (default: today)
//    - Group by hour of created_at
//    - Return { hourlyData: HourlyAnalyticsData[], error }
//    - Used for "busiest hours" chart

// 4. getAgentPerformanceAnalytics(siteId: string, dateFrom: string, dateTo: string)
//    - Query mod_chat_conversations joined with mod_chat_agents
//    - Group by agent: total chats, resolved, avg response time, avg rating
//    - Return { agents: AgentPerformanceData[], error }

// 5. getChannelBreakdown(siteId: string, dateFrom: string, dateTo: string)
//    - Query mod_chat_conversations grouped by channel
//    - Return { channels: Array<{ channel: string, count: number, percentage: number }>, error }

// 6. getSatisfactionBreakdown(siteId: string, dateFrom: string, dateTo: string)
//    - Query mod_chat_conversations where rating IS NOT NULL
//    - Group by rating (1-5)
//    - Calculate CSAT (% of 4 and 5 stars), NPS equivalent
//    - Return { ratings: Array<{ rating: number, count: number }>, csat: number, averageRating: number, error }

// 7. getResponseTimeDistribution(siteId: string, dateFrom: string, dateTo: string)
//    - Query first_response_time_seconds from conversations
//    - Bucket into ranges: <30s, 30s-1m, 1-5m, 5-15m, 15-30m, 30m-1h, >1h
//    - Return { distribution: Array<{ bucket: string, count: number, percentage: number }>, error }

// 8. getTopTags(siteId: string, dateFrom: string, dateTo: string, limit?: number)
//    - Unnest tags from mod_chat_conversations
//    - Group by tag, count occurrences
//    - Return { tags: Array<{ tag: string, count: number }>, error }

// 9. getAiAnalytics(siteId: string, dateFrom: string, dateTo: string)
//    - Query mod_chat_messages where is_ai_generated = true
//    - Calculate: total AI responses, conversations handled entirely by AI,
//      avg AI confidence, handoff rate
//    - Return { aiStats: AiAnalyticsData, error }

// 10. aggregateDailyAnalytics(siteId: string, date: string)
//     - Called by cron job to compute daily aggregate
//     - Query conversations and messages for the given date
//     - Upsert into mod_chat_analytics
//     - Return { success, error }

// Additional types (add to types/index.ts or define inline):

// ChatAnalyticsOverview: {
//   totalConversations, totalMessages, newVisitors, returningVisitors,
//   widgetConversations, whatsappConversations,
//   resolvedConversations, missedConversations,
//   avgFirstResponseSeconds, avgResolutionSeconds,
//   avgRating, totalRatings, satisfactionScore,
//   aiAutoResponses, aiResolved
// }

// DailyAnalyticsData: {
//   date: string, conversations: number, messages: number,
//   resolved: number, missed: number, avgResponseTime: number,
//   avgRating: number, newVisitors: number
// }

// HourlyAnalyticsData: {
//   hour: number, conversations: number
// }

// AiAnalyticsData: {
//   totalAiResponses: number, aiResolvedConversations: number,
//   avgConfidence: number, handoffRate: number, totalHandoffs: number
// }
```

---

## Task 2: Analytics Dashboard Page

**File**: `next-platform-dashboard/src/app/(dashboard)/dashboard/sites/[siteId]/live-chat/analytics/page.tsx`

```
Server page:
1. Auth guard
2. Get siteId from params
3. Default date range: last 30 days
4. Call getChatAnalyticsOverview(siteId, dateFrom, dateTo)
5. Call getChatAnalyticsByDay(siteId, dateFrom, dateTo)
6. Call getAgentPerformanceAnalytics(siteId, dateFrom, dateTo)
7. Call getChannelBreakdown(siteId, dateFrom, dateTo)
8. Call getSatisfactionBreakdown(siteId, dateFrom, dateTo)
9. Pass all data to <ChatAnalyticsWrapper />
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/wrappers/ChatAnalyticsWrapper.tsx`

```
'use client' wrapper.
Props: { overview, previousOverview, dailyData, agentPerformance, channelBreakdown, satisfactionBreakdown, siteId }

Features:
1. Date range picker (last 7d, 30d, 90d, custom range)
   - On change: re-fetch data via server actions (useTransition + router.refresh or client-side fetch)

2. Stats overview cards (top row, 4 cards):
   - Total Conversations (with % change vs previous period, trend arrow)
   - Avg Response Time (formatted as "X min Y sec", with trend)
   - Satisfaction Score (percentage, with trend)
   - Online Agents (current count, not trended)

3. Secondary stats row:
   - Messages sent/received
   - New vs Returning visitors
   - Resolved vs Missed
   - AI resolved count

4. Conversations Over Time chart (Line/Area chart):
   - X: dates, Y: conversation count
   - Two lines: total conversations and resolved conversations
   - Tooltips with exact numbers
   - Recharts ResponsiveContainer + AreaChart

5. Response Time Trend chart (Line chart):
   - X: dates, Y: avg response time in seconds
   - Formatted as minutes:seconds in tooltips
   - Goal line at configurable target (e.g., 2 minutes)

6. Channel Breakdown (Donut/Pie chart):
   - Widget vs WhatsApp vs API
   - Percentage labels
   - Recharts PieChart

7. Satisfaction Breakdown:
   - Bar chart: rating 1-5 distribution
   - CSAT percentage display
   - Average rating with stars

8. Busiest Hours heatmap or bar chart:
   - X: hour (0-23), Y: conversation count
   - Highlight peak hours

9. Agent Performance table:
   - Columns: Agent, Total Chats, Resolved, Avg Response Time, Avg Rating, Current Load
   - Sortable by each column
   - Click agent → could navigate to filtered view

10. AI Performance section:
    - AI responses sent
    - Conversations resolved by AI alone
    - Avg confidence score
    - Handoff rate (% of AI conversations that needed human)
    - AI vs Human resolution chart

11. Top Tags cloud or bar chart

12. Export button: Download CSV of analytics data
```

---

## Task 3: Analytics Chart Components

**File**: `next-platform-dashboard/src/modules/live-chat/components/analytics/ConversationChart.tsx`
```
Recharts AreaChart showing conversations over time.
Props: { data: DailyAnalyticsData[] }
Two areas: total conversations (primary color) and resolved (green/success)
Responsive, with tooltips and legend.
Use semantic colors: hsl(var(--primary)), hsl(var(--chart-1)), etc.
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/analytics/ResponseTimeChart.tsx`
```
Recharts LineChart showing average response time trend.
Props: { data: DailyAnalyticsData[] }
Format Y-axis as minutes:seconds
Optional goal line
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/analytics/ChannelPieChart.tsx`
```
Recharts PieChart showing channel distribution.
Props: { data: Array<{ channel: string, count: number, percentage: number }> }
Labels with percentages
Colors: widget=primary, whatsapp=green, api=blue
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/analytics/SatisfactionChart.tsx`
```
Recharts BarChart showing rating distribution (1-5 stars).
Props: { data: Array<{ rating: number, count: number }>, csat: number, averageRating: number }
Color gradient from red (1) to green (5)
CSAT percentage displayed prominently
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/analytics/AgentPerformanceTable.tsx`
```
Sortable table of agent metrics.
Props: { data: AgentPerformanceData[] }
Columns: Agent (avatar + name), Chats, Resolved, Avg Response, Rating, Load
Sort by clicking column headers
Highlight top performer
```

**File**: `next-platform-dashboard/src/modules/live-chat/components/analytics/BusiestHoursChart.tsx`
```
Recharts BarChart showing conversation count by hour.
Props: { data: HourlyAnalyticsData[] }
X-axis: 12am, 1am, ..., 11pm
Highlight current hour
Color intensity based on volume
```

---

## Task 4: Chat Transcript Email

**File**: `next-platform-dashboard/src/modules/live-chat/lib/transcript-service.ts`

```typescript
// Generate and send conversation transcripts

// 1. generateTranscript(conversationId: string): string
//    - Load all messages for conversation
//    - Format as readable text:
//      ---
//      Conversation Transcript
//      Date: February 11, 2026
//      Visitor: John Doe (john@example.com)
//      Agent: Jane Smith
//      ---
//      [09:15] John Doe: Hello, I need help with...
//      [09:16] AI Assistant: Hi John! I'd be happy to help...
//      [09:18] Jane Smith: Hi John, let me assist you...
//      ---
//      Rating: ⭐⭐⭐⭐⭐ (5/5)
//      Comment: "Great support!"
//      ---
//    - Return formatted transcript string

// 2. sendTranscriptToVisitor(conversationId: string)
//    - Load conversation + visitor
//    - Generate transcript
//    - Send email to visitor using sendBrandedEmail
//    - Email type: 'chat_transcript'
//    - Return { success, error }

// 3. sendTranscriptToAgent(conversationId: string, agentEmail: string)
//    - Same but send to agent email
//    - Return { success, error }
```

---

## Task 5: Export Functionality

Add export capability to the analytics actions:

```typescript
// In analytics-actions.ts, add:

// exportAnalyticsCSV(siteId: string, dateFrom: string, dateTo: string)
//   - Query daily analytics data
//   - Format as CSV string
//   - Return { csv: string, filename: string, error: string | null }
//   - Filename format: "chat-analytics-{siteId}-{dateFrom}-to-{dateTo}.csv"

// exportConversationsCSV(siteId: string, dateFrom: string, dateTo: string)
//   - Query conversations with visitor info, agent info
//   - Include: conversation ID, visitor name/email, channel, status, created_at, resolved_at,
//     first_response_time, resolution_time, rating, tags, agent name
//   - Return { csv: string, filename: string, error: string | null }
```

---

## Verification Checklist

1. [ ] Analytics overview shows real aggregated data from database
2. [ ] Date range picker changes all charts and stats
3. [ ] Trend arrows show comparison with previous period
4. [ ] Conversation volume chart renders correctly with recharts
5. [ ] Response time chart shows times formatted as minutes:seconds
6. [ ] Channel breakdown pie chart works with real data
7. [ ] Satisfaction bar chart shows 1-5 star distribution
8. [ ] Busiest hours chart shows hourly distribution
9. [ ] Agent performance table is sortable
10. [ ] AI analytics section shows real AI metrics
11. [ ] CSV export works for both analytics and conversations
12. [ ] Transcript email generates formatted text
13. [ ] All charts handle empty data gracefully (show empty state, not broken chart)
14. [ ] Charts work in both light and dark mode
15. [ ] All numbers are real — ZERO mock data
16. [ ] `npx tsc --noEmit` passes with zero errors

### Testing Instructions
1. Create test conversations, messages, and ratings via the dashboard or API
2. Run the daily analytics aggregation (or wait for cron)
3. Navigate to `/dashboard/sites/[siteId]/live-chat/analytics`
4. Verify all charts show data (may be sparse with few test records)
5. Change date range → charts should update
6. Test CSV export → download and verify data
7. Test transcript email → verify format in email
8. Test with zero data → all charts should show empty states
9. Test in dark mode → charts should be readable
10. Commit: `git add -A && git commit -m "feat(live-chat): PHASE-LC-07: analytics dashboard & reporting" && git push`
