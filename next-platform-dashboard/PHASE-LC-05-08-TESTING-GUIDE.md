# Live Chat Module — Testing Guide (LC-05 to LC-08)

## Prerequisites

1. **Running Dev Server**: `cd next-platform-dashboard && pnpm dev`
2. **Supabase**: Running instance with the `lc-01-chat-schema.sql` migration applied
3. **Module Installed**: Live Chat module must be enabled for your test site via the Module Marketplace
4. **Environment Variables** (in `.env.local`):
   ```env
   # Required for AI features (LC-06)
   ANTHROPIC_API_KEY=sk-ant-...

   # Required for WhatsApp (LC-05) - optional for testing
   WHATSAPP_ACCESS_TOKEN=...
   WHATSAPP_PHONE_NUMBER_ID=...
   WHATSAPP_BUSINESS_ACCOUNT_ID=...
   WHATSAPP_VERIFY_TOKEN=...
   WHATSAPP_APP_SECRET=...

   # Required for cron jobs (LC-06/08)
   CRON_SECRET=your-secret-here
   ```

---

## Step 1: Access the Live Chat Module

1. Log in to the dashboard
2. Go to **Dashboard → Sites → [Your Site]**
3. If Live Chat is not installed:
   - Go to **Module Marketplace**
   - Find **"Live Chat"** and click **Install**
4. Once installed, click **Live Chat** in the site sidebar
5. You should see the **Live Chat Overview** page with stats cards

---

## Step 2: Test Agent Dashboard (LC-03 — verify existing)

1. Navigate to **Live Chat → Agents**
2. Click **"Add Agent"** → fill in name, email, set status to **Online**
3. Navigate to **Live Chat → Departments**
4. Create a department (e.g., "Sales", "Support")
5. Navigate to **Live Chat → Canned Responses**
6. Create a canned response (e.g., shortcut: `/greeting`, text: "Hi, how can I help?")
7. Navigate to **Live Chat → Knowledge Base**
8. Create an article (e.g., title: "Pricing", content: "Our basic plan costs K99/month...")

---

## Step 3: Test the Chat Widget (LC-04 — verify existing)

1. Navigate to **Live Chat → Settings**
2. Customize widget colors, position, welcome message
3. Copy the **embed code** shown on the settings page
4. Open the widget preview or paste the embed code into an HTML file
5. Test the widget:
   - Submit pre-chat form (name, email)
   - Send a message
   - Check that the conversation appears in **Live Chat → Conversations**
   - Reply as an agent from the dashboard
   - Verify real-time message delivery

---

## Step 4: Test WhatsApp Integration (LC-05)

### Without a real WhatsApp account (UI testing):
1. Navigate to **Live Chat → Settings**
2. Scroll to or click the **WhatsApp** tab/section
3. You should see the **WhatsApp Setup** component with:
   - Connection status indicator
   - Setup guide (step-by-step instructions)
   - Credentials form (Access Token, Phone Number ID, etc.)
   - Webhook URL to copy
4. Fill in test values and click **Save Settings**
5. Verify the status updates

### Navigate to WhatsApp page:
1. Go to **Live Chat → WhatsApp** (in the sidebar)
2. The WhatsApp page wrapper should load

### Test WhatsApp webhook (developer testing):
```bash
# Verify webhook (GET)
curl "http://localhost:3000/api/modules/live-chat/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test123"

# Should return: test123
```

### WhatsApp UI Components:
- **WhatsAppWindowIndicator**: Shows 24-hour messaging window countdown (visible on WhatsApp conversations)
- **WhatsAppStatusIndicator**: Shows message delivery status (✓, ✓✓, blue ✓✓)
- **TemplateMessageDialog**: Appears when the 24h window expires and you need to send a template message

---

## Step 5: Test AI & Smart Routing (LC-06)

### AI Suggestions (requires ANTHROPIC_API_KEY):
1. Go to **Live Chat → Conversations**
2. Open an active conversation with a visitor message
3. Look for the **"AI Suggestions"** panel below the message input
4. Click **"Suggest"** button
5. Three AI-generated reply suggestions should appear
6. Click any suggestion to insert it into the message input

### Conversation Summary:
1. In a conversation with 3+ messages
2. Look for the **"AI Summary"** card in the conversation sidebar
3. Click **"Generate"**
4. Should show: summary text, sentiment badge (positive/neutral/negative), topic tags

### Smart Routing:
- When a new conversation arrives with no agent assigned, the routing engine automatically:
  1. Detects intent from the visitor's message
  2. Maps it to the best department
  3. Scores available agents by department match, load, and fairness
  4. Assigns the best agent

### AI Auto-Response (when no agents online):
- Set all agents to **Offline**
- Send a message via the widget
- If `ANTHROPIC_API_KEY` is set, AI will auto-respond using knowledge base articles
- The auto-response appears as a "system" message from "AI Assistant"

### Test AI Status:
- The AI features work even without an API key — they just return empty results
- With the key set, all 5 features activate: auto-responses, suggestions, summaries, intent detection, sentiment

---

## Step 6: Test Analytics Dashboard (LC-07)

1. Navigate to **Live Chat → Analytics**
2. You should see the full analytics dashboard with:
   - **Date range selector** (7d, 14d, 30d, 90d)
   - **4 KPI cards**: Total Conversations, Avg Response Time, Resolution Rate, Satisfaction
   - **AI Performance card** (if AI has been used)
   - **Conversations Over Time** chart (area chart)
   - **Response Time Trend** chart (area chart)
   - **Channel Breakdown** (pie chart)
   - **Satisfaction Distribution** (bar chart with colored bars)
   - **Busiest Hours** (bar chart by hour)
   - **Agent Performance Table** with columns: Agent, Chats, Resolved, Rate, Avg Response, Rating, Load

3. Click **"Export CSV"** to download analytics data
4. Change the date range and verify the charts update

> **Note**: Charts will show "No data yet" until conversations have been created and the cron job has aggregated analytics.

---

## Step 7: Test Cron Job (LC-06/08)

```bash
# Run the chat cron job manually
curl -H "Authorization: Bearer your-secret-here" \
  "http://localhost:3000/api/cron/chat"
```

Expected response:
```json
{
  "success": true,
  "timestamp": "...",
  "rebalanced": 0,
  "missedChecked": 0,
  "staleClosed": 0,
  "agentsSetOffline": 0,
  "analyticsAggregated": 1
}
```

The cron job:
- Rebalances unassigned conversations to available agents
- Checks for missed conversations (>5 min with no agent)
- Closes stale conversations (>24h inactive)
- Sets agents offline if not seen for >30 min
- Aggregates daily analytics data

---

## Step 8: Test Production Hardening (LC-08)

### Email Templates:
- Two new email types are registered: `chat_transcript` and `chat_missed_notification`
- These are available in both standard and branded template systems
- They'll be sent when conversations end (transcript) or are missed (notification)

### Module Catalog:
- Go to **Module Marketplace** → Find **Live Chat**
- Verify the feature list now shows 12 features including WhatsApp, AI, analytics

### Verify Zero Errors:
```bash
cd next-platform-dashboard
npx tsc --noEmit
# Should complete with no errors
```

---

## Quick Smoke Test Checklist

| Feature | How to Test | Expected Result |
|---------|------------|-----------------|
| Overview Page | Visit `/live-chat` | Stats cards with numbers |
| Conversations | Visit `/live-chat/conversations` | List of conversations |
| Agent Management | Visit `/live-chat/agents` | Create/edit agents |
| Widget Settings | Visit `/live-chat/settings` | Widget customization form |
| WhatsApp Setup | Visit `/live-chat/settings` (WhatsApp section) | Config form + webhook URL |
| AI Suggestions | Open a conversation → click "Suggest" | 3 reply suggestions |
| AI Summary | Open a conversation → click "Generate" | Summary + sentiment + topics |
| Analytics | Visit `/live-chat/analytics` | Charts + KPI cards + export |
| Cron Job | `GET /api/cron/chat` with auth header | JSON success response |
| Transcript | In conversation view → export action | Text transcript download |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Module not found" | Install Live Chat from the Module Marketplace |
| AI features return empty | Set `ANTHROPIC_API_KEY` in `.env.local` |
| Analytics show "No data" | Create some conversations, then run the cron job |
| WhatsApp status "Not configured" | Fill in WhatsApp credentials in Settings |
| Charts not rendering | Ensure `recharts` is installed (`pnpm list recharts`) |
| TypeScript errors | Run `npx tsc --noEmit` — should be zero errors |
