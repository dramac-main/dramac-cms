# 🚀 Quick Fix Guide - Getting DRAMAC CMS Fully Functional

## What Just Happened?

I fixed **3 critical bugs** in the codebase:

1. ✅ **AI Agents**: Column name mismatch (`type` → `agent_type`)
2. ✅ **Social Media**: Table naming issue (`mod_social.accounts` → `social_accounts`)
3. ✅ **Social Page**: Server/Client component boundary error

**The code is now correct!** But you need to set up the database tables.

---

## 📝 What You Need To Do Now

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/nfirsqmyxmmtbignofgb
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Diagnostic Script

Copy and paste this entire file into the SQL Editor:
```
scripts/quick-fix-database.sql
```

Then click **Run** (or press Ctrl+Enter)

### Step 3: Check the Results

The script will:
- ✅ Show you what tables currently exist
- ✅ Create missing `social_*` tables
- ✅ Set up basic indexes and RLS policies
- ✅ Display a success message

### Step 4: Start Your Dev Server

```powershell
cd F:\dramac-cms\next-platform-dashboard
pnpm dev
```

### Step 5: Test the Platform

Open your browser and test:

1. **AI Agents**: http://localhost:3000/dashboard/sites/[YOUR-SITE-ID]/ai-agents
   - Should load without "column ai_agents.type does not exist" error
   
2. **Social Media**: http://localhost:3000/dashboard/sites/[YOUR-SITE-ID]/social
   - Should load without "Could not find table" error
   - Should show empty state (no accounts connected yet)

---

## 🎯 What Each Module Does Now

### AI Agents Module ✅
- Create intelligent agents that can automate tasks
- Agents have goals, tools, and can execute workflows
- Fixed: Now uses correct `agent_type` column

### Social Media Module ✅
- Connect multiple social media accounts (Facebook, Twitter, LinkedIn, etc.)
- Schedule and publish posts
- View analytics and engagement metrics
- Fixed: Now uses correct table names in `public` schema

---

## 🐛 If You Still See Errors

### Error: "column ai_agents.type does not exist"
**Solution**: Your `ai_agents` table has the wrong column name. Run:
```sql
ALTER TABLE ai_agents RENAME COLUMN type TO agent_type;
```

### Error: "Could not find table 'social_accounts'"
**Solution**: The social media tables don't exist yet. Run the SQL script in Step 2 above.

### Error: "Event handlers cannot be passed to Client Component"
**Solution**: This should be fixed in the code now. Clear your `.next` folder and restart:
```powershell
rm -r -force .next
pnpm dev
```

---

## 📊 Database Tables Created

When you run the SQL script, you'll get these tables:

| Table Name | Purpose |
|-----------|---------|
| `social_accounts` | Connected social media accounts |
| `social_posts` | Scheduled/published content |
| `social_analytics_daily` | Daily engagement metrics |
| `social_post_analytics` | Per-post performance data |
| `social_inbox_items` | Comments, mentions, DMs |
| `social_saved_replies` | Reusable response templates |
| `social_approval_requests` | Post approval workflow |
| `social_publish_log` | Publishing history |
| `social_optimal_times` | Best times to post |

---

## ✅ Final Checklist

- [ ] Run the SQL script in Supabase
- [ ] See "Database setup complete! ✅" message
- [ ] Start dev server: `pnpm dev`
- [ ] Visit AI Agents page - no errors
- [ ] Visit Social Media page - no errors
- [ ] Celebrate! 🎉

---

## 💡 Next Steps (Optional)

Once the basics work, you can:
1. Connect real social media accounts (requires OAuth setup)
2. Create test posts with scheduling
3. View analytics dashboards
4. Set up approval workflows for team collaboration

---

## 🆘 Need Help?

If something doesn't work:
1. Check the browser console for errors (F12)
2. Check the terminal where `pnpm dev` is running
3. Share the error message and I'll help fix it!
