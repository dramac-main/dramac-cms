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
