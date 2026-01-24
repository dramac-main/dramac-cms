# CRM Quick Test Guide

**Time Required:** ~5 minutes  
**Goal:** Verify all CRM features work correctly

## Test Steps

### 1. Access CRM (Navigation) ✅ Pass
- [ ] Click **CRM** in sidebar → Verify agency dashboard loads
- [ ] Click **"Back to Dashboard"** → Returns to main dashboard ✓
- [ ] Go to **Sites** → Click any site → Click **CRM tab**
- [ ] Click **"Open CRM Dashboard"** button
- [ ] Verify **"Back to Site"** button appears and works ✓

### 2. Create Pipeline (if none exists) ❌ Fail
- [ ] If empty state shows, click **"Create Pipeline"**
- [ ] Or click **Settings** → **"New Pipeline"**
- [ ] Enter name "Sales Pipeline", set rotting days to 30
- [ ] Click **"Create Pipeline"** → Verify 6 default stages appear ✓

### 3. Create Company
- [ ] Go to **Companies** tab
- [ ] Click **"New Company"**
- [ ] Fill: Name, Industry, Phone, Website
- [ ] Click **"Create Company"** → Verify appears in list ✓

### 4. Create Contact
- [ ] Go to **Contacts** tab
- [ ] Click **"New Contact"**
- [ ] Fill: First/Last Name, Email, select Company
- [ ] Click **"Create Contact"** → Verify appears in list ✓

### 5. Create Deal & Move Through Pipeline
- [ ] Go to **Deals** tab
- [ ] Click **"Add Deal"**
- [ ] Fill: Name, Amount ($5000), select Contact, Company
- [ ] Select Pipeline and Stage
- [ ] Click **"Create Deal"** → Verify card appears in Kanban ✓
- [ ] **Drag deal card** to next stage → Verify moves smoothly ✓
- [ ] Verify probability updates automatically ✓

### 6. Log Activity ✅ Pass
- [ ] Go to **Activities** tab
- [ ] Click **"Log Activity"**
- [ ] Select type (Call/Meeting), pick Contact
- [ ] Add notes, set outcome
- [ ] Click **"Log Activity"** → Verify appears in timeline ✓

### 7. View Details
- [ ] Click any **contact card** → Verify detail sheet opens ✓ ✅ Pass
- [ ] Edit a field, save → Verify updates ✓ ❌ Fail (when I clicked on edit, it triggared an error)
- [ ] Click any **company** → Verify detail sheet works ✓ ✅ Pass
- [ ] Click any **deal card** → Verify detail sheet and activities show ✓ ❌ Fail (it requires pipline and pipeline failed)

### 8. Test Search ❌ Fail
- [ ] Use search bar at top
- [ ] Type contact name → Press Enter
- [ ] Check console for search results (UI coming soon) ✓

### 9. Check Reports
- [ ] Go to **Reports** tab ✅ Pass
- [ ] Verify pipeline funnel displays ✓ ❌ Fail
- [ ] Check stage distribution chart ✓
- [ ] Verify stats are accurate ✓ ✅ Pass

### 10. Multi-Site Verification ✅ Pass
- [ ] Go back to agency CRM dashboard
- [ ] Use site selector dropdown
- [ ] Switch to another site
- [ ] Verify CRM data is isolated per site ✓

## ✅ Success Criteria
All checkboxes checked = CRM fully functional!

## Common Issues

**Can't create pipeline?**
→ Check browser console for errors

**Deal not moving?**
→ Ensure you're dragging to a different stage

**Data not showing?**
→ Verify migration was applied (check `em-50-crm-add-is-active-column.sql`)

**Navigation broken?**
→ Clear cache and refresh browser

---

**Last Updated:** January 24, 2026  
**Tested By:** _________________  
**Result:** ✅ Pass / ❌ Fail  
**Notes:** ___________________
