# Memory Bank Auto-Update Rule

## MANDATORY: Memory Bank Updates

This rule ensures the Memory Bank is ALWAYS updated after completing any task.

### Trigger Conditions
Update the Memory Bank in `/memory-bank/` at the END of EVERY task when:
- ✅ Any code changes are made (bug fixes, features, refactoring)
- ✅ Configuration files are modified
- ✅ Architecture or patterns are discovered/changed
- ✅ Dependencies are added/updated
- ✅ Database migrations are run
- ✅ API endpoints are created/modified
- ✅ User explicitly requests it
- ✅ ANY significant work is completed

### Required Process

**STEP 1: Before Final Commit**
After completing the task but BEFORE the final commit/push, update these files:

1. **`/memory-bank/progress.md`** - Add latest update section:
   ```markdown
   ### Latest Update: [Date] - [Brief Title] ✅
   **What was [built/fixed/changed]:**
   [Detailed description of changes]
   
   **Files [Created/Modified]:**
   - List all significant files with brief explanation
   
   **Impact:**
   - What this enables/fixes/improves
   
   **Commit:** `[hash]` - "[commit message]"
   ```

2. **`/memory-bank/activeContext.md`** - Update "Recent Work" section:
   ```markdown
   ## Recent Work
   
   ### [Feature/Fix Name] - [Date] ✅
   **[Category]:**
   [Detailed explanation of what was done]
   
   **Files [Created/Modified]:**
   - List with explanations
   
   **Key [Features/Fixes]:**
   1. Item with explanation
   2. Item with explanation
   
   **Technical Notes:**
   - Important patterns, decisions, or considerations
   ```

3. **Review and update if needed:**
   - `/memory-bank/systemPatterns.md` - If new patterns emerged
   - `/memory-bank/techContext.md` - If tech stack changed
   - `/memory-bank/productContext.md` - If features/UX changed

**STEP 2: Commit Memory Bank Updates**
```bash
git add memory-bank/
git commit -m "docs: update memory bank with [date] [brief description]"
git push origin main
```

**STEP 3: Confirm to User**
Always inform the user:
- ✅ Task completed
- ✅ Memory bank updated
- ✅ All changes committed and pushed

### Format Guidelines

**Date Format:** `Month DD, YYYY` (e.g., "February 13, 2026")

**Title Format:** Brief, descriptive (e.g., "Comprehensive Code Review & Cleanup")

**Content Requirements:**
- Be specific about what changed
- List key files with context
- Explain impact/what this enables
- Include commit hash and message
- Use clear section headers
- Use bullet points for lists
- Use ✅ for completed items

**Placement:**
- Add to TOP of relevant section (most recent first)
- Keep chronological order (newest first)
- Don't remove old entries, build history

### Memory Bank File Purposes

- **`projectbrief.md`** - Core requirements (rarely changes)
- **`productContext.md`** - Product goals, UX (update when features change)
- **`systemPatterns.md`** - Architecture, patterns (update when new patterns emerge)
- **`techContext.md`** - Tech stack, setup (update when dependencies/config change)
- **`activeContext.md`** - Current focus, recent work (update EVERY task)
- **`progress.md`** - Status tracking, what's done (update EVERY task)

### Why This Matters

The Memory Bank is the ONLY persistent memory across AI sessions. Without updates:
- ❌ Future sessions won't know what you built
- ❌ Decisions and patterns will be lost
- ❌ The AI will ask redundant questions
- ❌ Progress tracking becomes impossible
- ❌ Context for future work is missing

With consistent updates:
- ✅ Every session starts with full context
- ✅ Decisions and patterns are preserved
- ✅ Progress is accurately tracked
- ✅ Future work builds on past work
- ✅ Team members understand the evolution

### Non-Negotiable

This is NOT optional. Memory Bank updates are part of EVERY task completion, just like:
- Running tests before committing
- Writing commit messages
- Pushing to GitHub

**NO TASK IS COMPLETE WITHOUT UPDATING THE MEMORY BANK.**

### Checklist for Every Task

Before you say "task complete":
- [ ] Code changes committed
- [ ] Memory bank updated (progress.md + activeContext.md minimum)
- [ ] Memory bank committed and pushed
- [ ] User informed of completion + memory bank update

If any checkbox is unchecked, THE TASK IS NOT COMPLETE.
