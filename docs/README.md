# DRAMAC CMS Documentation

**Last Updated:** April 11, 2026

This folder contains high-level platform documentation and reference guides.

---

## Quick Reference

- **[../STATUS.md](../STATUS.md)** — Implementation status overview (at root for quick access)
- **[PLATFORM-ANALYSIS.md](PLATFORM-ANALYSIS.md)** — Platform architecture and feature overview
- **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** — Quick reference for development

---

## Platform Context (AI Memory Bank)

- [memory-bank/projectbrief.md](../memory-bank/projectbrief.md) — Core requirements and scope
- [memory-bank/productContext.md](../memory-bank/productContext.md) — Features, user journeys, modules
- [memory-bank/systemPatterns.md](../memory-bank/systemPatterns.md) — Architecture patterns and conventions
- [memory-bank/techContext.md](../memory-bank/techContext.md) — Tech stack, setup, constraints
- [memory-bank/activeContext.md](../memory-bank/activeContext.md) — Current state and recent changes
- [memory-bank/progress.md](../memory-bank/progress.md) — Status tracker

---

## Setup & Integration Guides

- [RESELLERCLUB-SETUP-GUIDE.md](RESELLERCLUB-SETUP-GUIDE.md) — ResellerClub domain registration setup
- [RESELLERCLUB-QUICK-REFERENCE.md](RESELLERCLUB-QUICK-REFERENCE.md) — ResellerClub API quick reference
- [MCP-SETUP.md](MCP-SETUP.md) — MCP server configuration for AI assistants

---

## Domain & Service References

- [RESELLERCLUB-IMPLEMENTATION-SUMMARY.md](RESELLERCLUB-IMPLEMENTATION-SUMMARY.md) — Domain module implementation details
- [RESELLERCLUB-IP-WHITELIST.md](RESELLERCLUB-IP-WHITELIST.md) — IP whitelist configuration
- [RESELLERCLUB-UI-CHANGES.md](RESELLERCLUB-UI-CHANGES.md) — Domain UI component changes
- [BOOKING-MODULE-DEEP-STUDY.md](BOOKING-MODULE-DEEP-STUDY.md) — Booking module architecture deep dive
- [PLATFORM-DISCOVERY-ANALYSIS.md](PLATFORM-DISCOVERY-ANALYSIS.md) — Platform discovery analysis
- [USER-JOURNEYS.md](USER-JOURNEYS.md) — User journey documentation

---

## Dashboard-Specific Docs

See [next-platform-dashboard/docs/](../next-platform-dashboard/docs/) for:

- Module setup guides (Paddle, Resend, Domain/Email, Media Library)
- Component master plans (completed — historical reference)
- Phase implementation summaries (completed — historical reference)
- Testing guides per module/phase
- User journey guides (CRM, Social Media, Automation)

---

## Documentation Structure

```
dramac-cms/
├── STATUS.md                          # Main status (root)
├── docs/                              # This folder — high-level docs
│   ├── README.md                      # Index (this file)
│   ├── PLATFORM-ANALYSIS.md           # Architecture overview
│   ├── QUICK-REFERENCE.md             # Dev quick reference
│   ├── MCP-SETUP.md                   # AI MCP configuration
│   ├── RESELLERCLUB-*.md              # Domain service docs
│   └── *.md                           # Other reference docs
├── memory-bank/                       # AI assistant context (6 files)
├── phases/enterprise-modules/         # Phase planning docs (historical)
└── next-platform-dashboard/docs/      # Dashboard guides & testing
```

# 📚 DRAMAC CMS Documentation

**Last Updated:** January 23, 2026

This folder contains high-level platform documentation and status tracking.

---

## 📋 Quick Reference

- **[STATUS.md](../STATUS.md)** - Implementation status overview (at root for quick access)
- **[PLATFORM-ANALYSIS.md](PLATFORM-ANALYSIS.md)** - Deep platform architecture and feature analysis
- **[IMPLEMENTATION-COMPLETE.md](IMPLEMENTATION-COMPLETE.md)** - Completed phases summary
- **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** - Quick reference guide

---

## 📂 Project-Specific Documentation

### Implementation Documentation

- [phases/enterprise-modules/](../phases/enterprise-modules/) - All enterprise module phase docs
- [memory-bank/](../memory-bank/) - AI assistant context files

### Dashboard Documentation

- [next-platform-dashboard/docs/](../next-platform-dashboard/docs/) - Dashboard-specific guides and testing

### Package Documentation

- [packages/sdk/README.md](../packages/sdk/README.md) - Module SDK documentation
- [packages/dramac-cli/README.md](../packages/dramac-cli/README.md) - CLI tools documentation

---

## 🗂️ Documentation Structure

```
dramac-cms/
├── STATUS.md                          # Main status file (root for quick access)
├── docs/                              # High-level documentation
│   ├── README.md                      # This file
│   ├── PLATFORM-ANALYSIS.md           # Platform overview
│   ├── IMPLEMENTATION-COMPLETE.md     # Completed work
│   └── QUICK-REFERENCE.md             # Quick guide
│
├── memory-bank/                       # AI assistant context
│   ├── activeContext.md
│   ├── projectbrief.md
│   ├── progress.md
│   └── ...
│
├── phases/enterprise-modules/         # Phase documentation
│   ├── INDEX.md
│   ├── IMPLEMENTATION-ORDER.md
│   └── PHASE-EM-*.md
│
└── next-platform-dashboard/
    └── docs/                          # Dashboard-specific docs
        ├── HOW-TO-DEPLOY-MODULE-TO-BETA.md
        ├── PHASE-*-TESTING-*.md
        └── ...
```
