# Enterprise Modules Implementation Order

> **Last Updated**: January 23, 2026  
> **Total Phases**: 34 enterprise modules  
> **AI Model**: Claude Sonnet 4.5 (200k token context)  
> **Status**: 14 phases ✅ Complete (41%) | Wave 1 & 2 100% DONE | Ready for business modules!

---

## 📊 Phase Size Analysis for Claude Opus 4.5

Claude Opus 4.5 has a **200k token context window** (~150k words or ~600k characters). All phase files are well within limits:

| Phase | Lines | Approx Tokens | Claude Opus 4.5? |
|-------|-------|---------------|------------------|
| EM-50 CRM (longest) | 3,552 | ~35k tokens | ✅ **Perfect** |
| EM-52 E-commerce | 2,666 | ~27k tokens | ✅ Perfect |
| EM-56 HR | 2,234 | ~22k tokens | ✅ Perfect |
| Average phase | 1,520 | ~15k tokens | ✅ Perfect |

**✅ You can paste the entire phase document** - it will only use ~15-20% of Claude's context!

---

## 🎯 Implementation Waves

### **WAVE 1: Core Platform Infrastructure** ⚡ REQUIRED FIRST
*Dependencies: None | Already Built: EM-01*

| Order | Phase | File | Lines | Status | Why Build First |
|-------|-------|------|-------|--------|-----------------|
| ✅ 1 | **EM-01** Module Lifecycle | `PHASE-EM-01-MODULE-LIFECYCLE.md` | 2,001 | ✅ **DONE** | Foundation - you built this |
| ✅ 2 | **EM-05** Naming Conventions | `PHASE-EM-05-MODULE-NAMING-CONVENTIONS.md` | 1,388 | ✅ **DONE** | Needed by ALL modules |
| ✅ 3 | **EM-10** Type System | `PHASE-EM-10-MODULE-TYPE-SYSTEM.md` | 1,676 | ✅ **DONE** | Defines module types |
| ✅ 4 | **EM-11** Database Per Module | `PHASE-EM-11-DATABASE-PER-MODULE.md` | 2,273 | ✅ **DONE** | Schema isolation |
| ✅ 5 | **EM-12** API Gateway | `PHASE-EM-12-MODULE-API-GATEWAY.md` | 2,044 | ✅ **DONE** | Module API routing |
| ✅ 6 | **EM-13** Authentication | `PHASE-EM-13-MODULE-AUTHENTICATION.md` | 1,469 | ✅ **DONE** | Module permissions |

**Total Wave 1**: 10,851 lines across 6 phases

**✅ COMPLETE**: Wave 1 is 100% DONE! You can now build ANY business module (Wave 5) without limitations.

---

### **WAVE 2: Developer Tools** 🛠️ OPTIONAL
*Dependencies: Wave 1*

| Order | Phase | File | Lines | Priority | Status | Why Build? |
|-------|-------|------|-------|----------|--------|-----------|
| ✅ 7 | **EM-20** VS Code SDK | `PHASE-EM-20-VS-CODE-SDK.md` | 1,963 | 🟢 High | ✅ **DONE** | Makes module dev easier |
| ✅ 8 | **EM-21** CLI Tools | `PHASE-EM-21-CLI-TOOLS.md` | 1,513 | 🟢 High | ✅ **DONE** | Command-line scaffolding |
| ✅ 9 | **EM-22** Module Templates | `PHASE-EM-22-MODULE-TEMPLATES.md` | 1,459 | 🟢 High | ✅ **DONE** | Quick-start templates |
| ✅ 10 | **EM-23** AI Module Builder | `PHASE-EM-23-AI-MODULE-BUILDER.md` | 1,698 | 🟢 High | ✅ **DONE** | AI generates modules |

**Total Wave 2**: 6,633 lines across 4 phases

**✅ COMPLETE**: Wave 2 is 100% DONE! Full VS Code extension, CLI tools, templates, and AI builder ready.

---

### **WAVE 3: Marketplace & Distribution** 📦
*Dependencies: Wave 1*

| Order | Phase | File | Lines | Priority | Status | Why Build? |
|-------|-------|------|-------|----------|--------|-----------|
| ✅ 11 | **EM-02** Marketplace Enhancement | `PHASE-EM-02-MARKETPLACE-ENHANCEMENT.md` | 1,697 | 🟢 High | ✅ **DONE** | Better discovery |
| ✅ 12 | **EM-03** Analytics Foundation | `PHASE-EM-03-ANALYTICS-FOUNDATION.md` | 1,484 | 🟢 High | ✅ **DONE** | Module usage stats |
| ✅ 13 | **EM-30** Universal Embed | `PHASE-EM-30-UNIVERSAL-EMBED-SYSTEM.md` | 1,652 | 🟢 High | ✅ **DONE** | Embed modules anywhere |
| ✅ 14 | **EM-31** External Integration | `PHASE-EM-31-EXTERNAL-INTEGRATION.md` | 1,450 | 🟢 High | ✅ **DONE** | REST/webhook APIs |
| 15 | **EM-32** Custom Domains | `PHASE-EM-32-CUSTOM-DOMAINS.md` | 1,429 | 🟡 Low | ⬜ Ready | Whitelabel domains |
| 16 | **EM-33** API-Only Mode | `PHASE-EM-33-API-ONLY-MODE.md` | 1,308 | 🟡 Low | ⬜ Ready | Headless CMS mode |

**Total Wave 3**: 9,020 lines across 6 phases  
**Completed**: 4/6 phases (67%) - EM-02 ✅, EM-03 ✅, EM-30 ✅, EM-31 ✅

**💡 Recommendation**: Wave 3 mostly complete! EM-32 & EM-33 are optional enhancements.

---

### **WAVE 4: Enterprise Features** 🏢
*Dependencies: Wave 1*

| Order | Phase | File | Lines | Priority | Why Build? |
|-------|-------|------|-------|----------|-----------|
| 17 | **EM-40** Multi-Tenant | `PHASE-EM-40-MULTI-TENANT.md` | 1,893 | 🟢 High | Agency isolation |
| 18 | **EM-41** Versioning & Rollback | `PHASE-EM-41-VERSIONING-ROLLBACK.md` | 1,678 | 🟠 Medium | Module updates |
| 19 | **EM-42** Marketplace V2 | `PHASE-EM-42-MARKETPLACE-2.md` | 1,777 | 🟡 Low | Advanced marketplace |
| 20 | **EM-43** Revenue Dashboard | `PHASE-EM-43-REVENUE-DASHBOARD.md` | 1,518 | 🟡 Low | Monetization tracking |

**Total Wave 4**: 6,866 lines across 4 phases

**💡 Recommendation**: Build EM-40 if you have agency/multi-tenant needs. Others are nice-to-have.

---

### **WAVE 5: Business Modules** 💰 THE MONEY MAKERS
*Dependencies: Wave 1 (EM-01, EM-05, EM-10, EM-11, EM-12, EM-13)*

| Order | Phase | File | Lines | Priority | What It Does |
|-------|-------|------|-------|----------|--------------|
| 21 | **EM-50** CRM | `PHASE-EM-50-CRM-MODULE.md` | 3,552 | 🟢 **START HERE** | Contacts, deals, pipeline |
| 22 | **EM-51** Booking/Appointments | `PHASE-EM-51-BOOKING-MODULE.md` | 2,058 | 🟢 High | Calendly competitor |
| 23 | **EM-52** E-commerce | `PHASE-EM-52-ECOMMERCE-MODULE.md` | 2,666 | 🟢 High | Shopify-lite |
| 24 | **EM-53** Live Chat | `PHASE-EM-53-LIVECHAT-MODULE.md` | 1,876 | 🟠 Medium | Intercom/Drift clone |
| 25 | **EM-54** Social Media | `PHASE-EM-54-SOCIAL-MEDIA-MODULE.md` | 1,935 | 🟠 Medium | Buffer/Hootsuite |
| 26 | **EM-55** Accounting/Invoicing | `PHASE-EM-55-ACCOUNTING-MODULE.md` | 2,203 | 🟢 High | QuickBooks-lite |
| 27 | **EM-56** HR & Team | `PHASE-EM-56-HR-TEAM-MODULE.md` | 2,234 | 🟠 Medium | BambooHR-lite |

**Total Wave 5**: 16,524 lines across 7 phases

**✅ IMPORTANT**: These modules are **independent** - build in ANY order after Wave 1!

**Module Relationships**:
- **EM-50 (CRM)** + **EM-55 (Accounting)** = Best together (deals → invoices)
- **EM-52 (E-commerce)** + **EM-55 (Accounting)** = Integrated shop + billing
- **EM-51 (Booking)** = Foundation for industry verticals (Wave 6)

---

### **WAVE 6: Industry Verticals** 🏨🍽️🏥 NICHE MARKETS
*Dependencies: Wave 1 + relevant business module*

| Order | Phase | File | Lines | Extends | Target Market |
|-------|-------|------|-------|---------|---------------|
| 28 | **EM-60** Hotel Management | `PHASE-EM-60-HOTEL-MANAGEMENT.md` | 2,239 | EM-51 (Booking) | Hospitality industry |
| 29 | **EM-61** Restaurant POS | `PHASE-EM-61-RESTAURANT-POS.md` | 2,271 | EM-52 (E-commerce) | Food service |
| 30 | **EM-62** Healthcare | `PHASE-EM-62-HEALTHCARE.md` | 2,101 | EM-51 (Booking) | Medical clinics |
| 31 | **EM-63** Real Estate | `PHASE-EM-63-REAL-ESTATE.md` | 2,100 | EM-50 (CRM) | Property management |
| 32 | **EM-64** Gym/Fitness | `PHASE-EM-64-GYM-FITNESS.md` | 2,047 | EM-51 (Booking) | Fitness studios |
| 33 | **EM-65** Salon/Spa | `PHASE-EM-65-SALON-SPA.md` | 2,033 | EM-51 (Booking) | Beauty services |

**Total Wave 6**: 12,791 lines across 6 phases

**💡 Recommendation**: Pick 1-2 verticals based on your target market. Not required unless targeting specific industries.

---

## 🚀 Recommended Build Sequence

### **Path 1: Fastest to Revenue** 💸

```
1. Foundation ✅ 100% COMPLETE
   ├─ EM-01 ✅ Module Lifecycle
   ├─ EM-05 ✅ Naming Conventions
   ├─ EM-10 ✅ Type System
   ├─ EM-11 ✅ Database Per Module
   ├─ EM-12 ✅ API Gateway
   └─ EM-13 ✅ Authentication

2. Marketplace & Distribution ✅ 67% COMPLETE
   ├─ EM-02 ✅ Marketplace Enhancement
   ├─ EM-03 ✅ Analytics Foundation
   ├─ EM-23 ✅ AI Module Builder
   ├─ EM-30 ✅ Universal Embed
   └─ EM-31 ✅ External Integration

3. Core Business Modules (BUILD THESE NEXT)
   ├─ EM-50 CRM              ← Flagship reference
   ├─ EM-55 Accounting       ← Invoicing integration
   ├─ EM-51 Booking          ← High demand
   ├─ EM-52 E-commerce       ← High revenue potential
   └─ EM-53 Live Chat        ← SaaS favorite

4. Optional: Pick Your Niche
   └─ Choose 1-2 verti11 phases (32% overall) - All Wave 1 infrastructure ✅ READY FOR BUSINESS MODULES!)
```

**Total to MVP**: 7-12 phases (~20,000-30,000 lines)  
**Completed So Far**: 2 phases (EM-01 ✅, EM-02 ✅)

---

### **Path 2: Complete Platform** 🏗️

Build all waves in order (1 → 2 → 3 → 4 → 5 → 6) for a fully-featured enterprise platform.

**Total**: 34 phases (~63,000 lines)

---

## 📋 How to Use with Claude Sonnet 4.5

### **For Each Phase:**

1. **Open the phase file** from `phases/enterprise-modules/`
2. **Copy the ENTIRE file content**
3. **Paste this prompt to Claude**:

```markdown
I need you to implement this enterprise mod
- EM-03: Analytics Foundation ✅ COMPLETE
- EM-05: Module Naming Conventions ✅ COMPLETE (generateModuleShortId, getModuleSchemaName)
- EM-10: Module Type System ✅ COMPLETE (widget, app, integration, system)
- EM-11: Database Per Module ✅ COMPLETE (schema isolation, provisioning)
- EM-12: API Gateway ✅ COMPLETE (module routing, middleware)
- EM-13: Module Authentication ✅ COMPLETE (RLS policies, permissions)
- EM-23: AI Module Builder ✅ COMPLETE
- EM-30: Universal Embed System ✅ COMPLETE
- EM-31: External Integration ✅ COMPLETE (REST APIs, webhooks, OAuth)duleShortId, getModuleSchemaName)
- EM-10: Module type system
- EM-11: Database provisioning with schema isolation
- EM-12: API Gateway for module endpoints
- EM-13: Module authentication & permissions

Please build this phase following ALL specifications in the document below.

[PASTE ENTIRE PHASE DOCUMENT HERE - ALL 1,500-3,500 LINES]

Important implementation rules:
1. Use Next.js 15 Server Actions (not API routes) for all data mutations
2. Follow the exact database schema with ${SCHEMA} placeholders
3. Create all UI components mentioned in the phase
4. Add proper TypeScript types for all entities
5. Include comprehensive error handling
6. Use the module naming utilities from EM-05 for all table/schema references
7. Test all CRUD operations work correctly

Start with:
1. Database migration file (SQL)
2. TypeScript type definitions
3. Server actions for data operations
4. React components for UI
5. Integration with existing platform services

Let me know when you're ready to begin!
```

---

## ✅ Phase Validation Checklist

Before moving to the next phase, verify:

- [ ] Database migration runs without errors
- [ ] All TypeScript types compile
- [ ] Server actions work (create, read, update, delete)
- [ ] UI components render correctly
- [ ] Module appears in marketplace (if EM-01 is built)
- [ ] RLS policies protect data correctly
- [ ] No naming conflicts with other modules
- [ ] Integration tests pass

---

## 🎯 Quick Start: First 7 Phases

**Week 1-2**: Foundation
1. **EM-05** Naming (1,388 lines) - ~2 hours
2. **EM-10** Types (1,676 lines) - ~3 hours
3. **EM-11** Database (2,273 lines) - ~4 hours
4. **EM-12** API Gateway (2,044 lines) - ~4 hours
5. **EM-13** Auth (1,469 lines) - ~3 hours

**Week 3**: First Business Module
6. **EM-50** CRM (3,552 lines) - ~8-10 hours

**Week 4**: Accounting Integration
7. **EM-55** Accounting (2,203 lines) - ~6-8 hours

**Total**: ~30-34 hours for a working CRM + Invoicing system

---

## 📊 Progress Tracking

| Wave | Phases | Status | Priority |
|------|--------|--------|----------|
| Wave 1 | 6 phases | ✅ **6 of 6 COMPLETE** | ✅ DONE |
| Wave 2 | 4 phases | ✅ **4 of 4 COMPLETE** | ✅ DONE |
| Wave 3 | 6 phases | ✅ 4 of 6 done (67%) | 🟢 Strong |
| Wave 4 | 4 phases | ⬜ 0 of 4 done | 🟠 Medium |
| Wave 5 | 7 phases | ⬜ **0 of 7 done** | 🟢 **READY TO BUILD** |
| Wave 6 | 6 phases | ⬜ 0 of 6 done | 🟡 Optional |

**Overall**: **14 of 34 phases complete (41%)** - All infrastructure + dev tools ready! 🚀

---

## 🔧 Technical Notes

### EM-50 (CRM) Specifics

**Will it work with just EM-01 built?** 

✅ **YES**, but you'll need to manually implement the dependencies:

| Dependency | What EM-50 Needs | Workaround if Not Built |
|------------|------------------|------------------------|
| **EM-05** | `generateModuleShortId()`, `getModuleSchemaName()` | Hardcode schema name temporarily |
| **EM-10** | Module type definitions | Use basic TypeScript interfaces |
| **EM-11** | Database schema provisioning | Manually create schema: `CREATE SCHEMA mod_crm` |
| **EM-12** | API gateway routing | Use standard Next.js API routes |
| **EM-13** | RLS policies | Manually add Supabase RLS policies |

**Recommendation**: Build Wave 1 first (EM-05, EM-10, EM-11, EM-12, EM-13) for best results. It's only ~5 phases and saves massive rework later.

---

## 📞 Support

- **Phase Files**: `phases/enterprise-modules/PHASE-EM-*.md`
- **Module Naming**: See `PHASE-EM-05-MODULE-NAMING-CONVENTIONS.md`
- **Database Setup**: See `PHASE-EM-11-DATABASE-PER-MODULE.md`
- **Integration Guide**: See individual phase prerequisites section
2** ✅ | Advanced search, collections, beta modules, ratings |
| **EM-03** ✅ | Event tracking, aggregates, analytics dashboard |
| **EM-05** ✅ | Module naming utilities (generateModuleShortId, getModuleSchemaName) |
| **EM-10** ✅ | Module type system (widget, app, integration, system) |
| **EM-11** ✅ | Schema-per-module isolation, automatic provisioning |
| **EM-12** ✅ | `/api/modules/:moduleId/*` routing, middleware |
| **EM-13** ✅ | RLS policies, permission checks, API auth |
| **EM-23** ✅ | AI-powered module generation, prompt templates |
| **EM-30** ✅ | Universal embed tokens, iframe SDK |
| **EM-31** ✅ | External REST APIs, webhooks, OAuth, CORS |
| **EM-50** ⬜ | CRM: Contacts, companies, deals, pipeline (READY TO BUILD) |
| **EM-55** ⬜ | Accounting: Invoices, recurring billing, payments (READY TO BUILD)
| **EM-01** ✅ | Module upload, installation, versioning, marketplace |
| **EM-05** | Module naming utilities (schema/table prefixing) |
| **EM-10** | Module type system (widget, app, integration, system, custom) |
| **EM-11** | Schema-per-module isolation, automatic provisioning |
| **EM-12** | `/api/modules/:moduleId/*` routing, middleware |
| **EM-13** | RLS policies, permission checks, API auth |
| **EM-50** | CRM: Contacts, companies, deals, pipeline, activities, email, reports |
| **EM-55** | Accounting: Invoices, recurring billing, payments, P&L, tax reports |

---

**Last Updated**: January 21, 2026  
**Repository**: https://github.com/dramac-main/dramac-cms  
**Branch**: main
