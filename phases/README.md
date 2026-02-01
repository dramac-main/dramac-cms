# DRAMAC CMS - Phase Documentation

This folder contains all implementation phase documents organized by category.

---

## 📁 Phase Categories

### 🎨 UI/Layout Fixes
**Folder**: [`ui-sidebar-spacing/`](ui-sidebar-spacing/)

Global sidebar and spacing standardization across the platform.

| Document | Description |
|----------|-------------|
| [PHASE-UI-00-MASTER-INDEX.md](ui-sidebar-spacing/PHASE-UI-00-MASTER-INDEX.md) | **START HERE** - Master index for all UI phases |
| [PHASE-UI-GLOBAL-01-SIDEBAR-SPACING-FIX.md](ui-sidebar-spacing/PHASE-UI-GLOBAL-01-SIDEBAR-SPACING-FIX.md) | Full specification document |

**Phases**: 01A → 01B → 01C → 02A → 02B → 02C → 03A → 03B → 04A → 04B → 04C → 04D → 05A

---

### 📊 Dashboard/Analytics (DS)
**Location**: Root folder

| Phase | File | Description |
|-------|------|-------------|
| DS-02A | [PHASE-DS-02A-SITE-ANALYTICS-DASHBOARD.md](PHASE-DS-02A-SITE-ANALYTICS-DASHBOARD.md) | Site analytics dashboard |
| DS-03A | [PHASE-DS-03A-CRM-ANALYTICS-DASHBOARD.md](PHASE-DS-03A-CRM-ANALYTICS-DASHBOARD.md) | CRM analytics dashboard |
| DS-04A | [PHASE-DS-04A-ADMIN-DASHBOARD-PLATFORM-OVERVIEW.md](PHASE-DS-04A-ADMIN-DASHBOARD-PLATFORM-OVERVIEW.md) | Admin platform overview |
| DS-04B | [PHASE-DS-04B-ADMIN-DASHBOARD-AGENCY-METRICS.md](PHASE-DS-04B-ADMIN-DASHBOARD-AGENCY-METRICS.md) | Admin agency metrics |
| DS-05 | [PHASE-DS-05-BILLING-REVENUE-DASHBOARDS.md](PHASE-DS-05-BILLING-REVENUE-DASHBOARDS.md) | Billing & revenue dashboards |

---

### ⚠️ Error Handling (EH)
**Location**: Root folder

| Phase | File | Description |
|-------|------|-------------|
| EH-01 | [PHASE-EH-01-CORE-ERROR-INFRASTRUCTURE.md](PHASE-EH-01-CORE-ERROR-INFRASTRUCTURE.md) | Core error infrastructure |
| EH-02 | [PHASE-EH-02-TOAST-NOTIFICATION-SYSTEM.md](PHASE-EH-02-TOAST-NOTIFICATION-SYSTEM.md) | Toast notification system |
| EH-03 | [PHASE-EH-03-FORM-VALIDATION-UI.md](PHASE-EH-03-FORM-VALIDATION-UI.md) | Form validation UI |
| EH-04 | [PHASE-EH-04-LOADING-EMPTY-STATES.md](PHASE-EH-04-LOADING-EMPTY-STATES.md) | Loading & empty states |
| EH-05 | [PHASE-EH-05-DIALOGS-WARNINGS.md](PHASE-EH-05-DIALOGS-WARNINGS.md) | Dialogs & warnings |
| EH-06 | [PHASE-EH-06-OFFLINE-RATE-LIMITING.md](PHASE-EH-06-OFFLINE-RATE-LIMITING.md) | Offline & rate limiting |

---

### 🏢 Enterprise Modules (EM)
**Folder**: [`enterprise-modules/`](enterprise-modules/)

Enterprise-level module implementations.

---

### 📋 General Documents

| File | Description |
|------|-------------|
| [MASTER-BUILD-PROMPT-V2.md](MASTER-BUILD-PROMPT-V2.md) | Master build prompt for AI agents |
| [PLATFORM-DISCOVERY-PROMPT.md](PLATFORM-DISCOVERY-PROMPT.md) | Platform discovery prompt |

---

## 🚀 Quick Start

### For UI/Layout Fixes
1. Navigate to [`ui-sidebar-spacing/`](ui-sidebar-spacing/)
2. Start with [PHASE-UI-00-MASTER-INDEX.md](ui-sidebar-spacing/PHASE-UI-00-MASTER-INDEX.md)
3. Execute phases in order: 01A → 01B → 01C → ...

### For Other Phases
- Read the phase document thoroughly
- Check dependencies (previous phases)
- Execute tasks in order
- Run TypeScript check: `npx tsc --noEmit --skipLibCheck`
- Commit if zero errors

---

## 📝 Phase Naming Convention

| Prefix | Category |
|--------|----------|
| `UI` | User Interface / Layout |
| `DS` | Dashboard / Analytics |
| `EH` | Error Handling |
| `EM` | Enterprise Modules |

| Suffix | Meaning |
|--------|---------|
| `A`, `B`, `C` | Sequential sub-phases |
| `01`, `02`, etc. | Phase group number |

**Example**: `PHASE-UI-01B` = UI category, group 01, sub-phase B

---

**Last Updated**: February 1, 2026
