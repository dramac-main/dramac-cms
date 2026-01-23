# DRAMAC CMS - GitHub Copilot Instructions

## Memory Bank System

This project uses a Memory Bank located in `/memory-bank/` to maintain context across sessions. Your context resets between sessions, so you MUST rely on these files to understand the project.

### Start of Every Task
**REQUIRED:** Read ALL memory bank files before starting any task:
1. `/memory-bank/projectbrief.md` - Core requirements and project scope
2. `/memory-bank/productContext.md` - Purpose, problems solved, UX goals
3. `/memory-bank/systemPatterns.md` - Architecture, patterns, key decisions
4. `/memory-bank/techContext.md` - Tech stack, setup, constraints
5. `/memory-bank/activeContext.md` - Current focus, recent changes, next steps
6. `/memory-bank/progress.md` - Status, what works, what's left, known issues

### File Hierarchy
```
projectbrief.md (foundation)
    ├── productContext.md
    ├── systemPatterns.md
    └── techContext.md
            └── activeContext.md (current state)
                    └── progress.md (tracking)
```

### When to Update Memory Bank
Automatically update when:
- Discovering new architectural patterns or technical decisions
- Implementing significant features or changes
- User explicitly requests "update memory bank" (review ALL files)
- Context needs clarification for future sessions

When updating:
1. Review ALL memory bank files (even if no changes needed)
2. Focus on `activeContext.md` and `progress.md` for current state
3. Document insights, patterns, and learnings
4. Update next steps and considerations

### Project Context
- **Project:** DRAMAC CMS - Enterprise modular CMS platform
- **Stack:** Next.js, TypeScript, Supabase, PostgreSQL, pnpm monorepo
- **Location:** Dashboard in `/next-platform-dashboard/`
- **Packages:** SDK, CLI tools, test modules in `/packages/`
- **Documentation:** Phase docs in `/phases/`, dashboard docs in `/next-platform-dashboard/docs/`

### Key Patterns
- Always check memory bank before making assumptions
- Document patterns as they emerge
- Keep activeContext.md current with latest decisions
- Track progress consistently
- Memory bank is your only link to previous work - maintain it with precision

### Working with This Project
1. Start every session by reading the memory bank files
2. When implementing changes, refer to systemPatterns.md for consistency
3. Check activeContext.md for recent decisions and current focus
4. Update memory bank after significant work
5. Use progress.md to understand what's completed vs. what's pending

**Remember:** After every reset, you start fresh. The Memory Bank is your only source of truth about this project's history, decisions, and current state.
