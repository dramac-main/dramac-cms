# PHASE LAUNCH-11: Website Creation E2E Lifecycle

**User Journeys Covered**: Journey 9.4 (Website Creation Lifecycle — All Users)  
**Independence**: Fully independent — no other phase required first  
**Connection Points**: AI Designer (LAUNCH-05 Task 6), DRAMAC Studio (LAUNCH-05 Task 7), Published Sites (LAUNCH-01)

---

## Pre-Implementation: Read These Files First

```
memory-bank/systemPatterns.md (DRAMAC Studio Architecture, AI Website Designer)
memory-bank/progress.md (Studio phases, AI Designer phases, AWD status)
docs/USER-JOURNEYS.md (Journey 9.4 — Website Creation Lifecycle)
```

---

## Context

The website creation lifecycle is the core value prop of DRAMAC CMS:
1. **Agency Owner/Admin** → Choose creation path (AI Designer or Manual)
2. **AI Designer** → Prompt → AI generates pages with components
3. **Manual** → DRAMAC Studio drag-and-drop editor
4. **Modules** → Install modules → Module blocks available in Studio
5. **SEO** → Configure meta, sitemap, analytics
6. **Domain** → Connect custom domain
7. **Publish** → Site goes live on subdomain or custom domain

---

## Task 1: Site Creation & AI Designer Path

### Files to Audit
- `src/app/(dashboard)/dashboard/sites/new/page.tsx`
- `src/app/(dashboard)/dashboard/sites/[siteId]/ai-designer/page.tsx`
- `src/lib/actions/ai-designer-actions.ts`
- `src/components/ai-designer/*`
- AI generation with Claude API

### Requirements
1. **Create new site**: Name, description, template selection
2. **AI Designer entry**: Prompt-based website generation
3. **AI generation**: Claude generates page structure with real components
4. **Component selection**: AI picks from available Studio components
5. **Design system**: AI applies brand colors, fonts from agency branding
6. **Content generation**: AI generates real content based on prompt
7. **Preview**: Preview generated design before accepting
8. **Iteration**: Refine design with additional prompts
9. **Accept**: Save generated pages to site
10. **No placeholder content**: AI generates contextual content, not lorem ipsum

### What to Fix
- If AI designer shows "coming soon" → verify AWD phases are working
- If AI generates placeholder text → improve prompt engineering
- If design doesn't use brand colors → pass branding context to AI
- If preview doesn't render → verify Studio renderer
- If accept doesn't save → wire save action to DB

### Verification
```
□ Create new site works
□ AI Designer generates real page structure
□ AI uses available Studio components
□ Brand colors/fonts applied
□ Content is contextual (not lorem ipsum)
□ Preview renders correctly
□ Iteration works (refine with follow-up prompts)
□ Accept saves to DB
```

---

## Task 2: DRAMAC Studio Manual Editing

### Files to Audit
- `src/app/(dashboard)/dashboard/sites/[siteId]/editor/page.tsx`
- `src/app/(dashboard)/dashboard/sites/[siteId]/builder/page.tsx`
- `src/components/studio/*`
- Studio component library
- `src/modules/*/studio/*` (module Studio components)

### Requirements
1. **Studio loads**: Page editor opens with dnd-kit canvas
2. **Component palette**: All available components listed
3. **Drag and drop**: Components can be placed on canvas
4. **Component settings**: Each component has editable properties
5. **Module blocks**: Installed module blocks available (product grid, booking form, etc.)
6. **Rich text**: TipTap editor for text content
7. **Media**: Upload and embed images/videos
8. **Undo/Redo**: Zustand + zundo history works
9. **Save**: Save page to DB
10. **Multi-page**: Create and manage multiple pages
11. **Responsive preview**: Mobile/tablet/desktop preview modes

### What to Fix
- If Studio doesn't load → check component imports
- If drag-drop doesn't work → verify dnd-kit setup
- If module blocks missing → check module registration in Studio
- If undo/redo broken → verify zundo middleware
- If save doesn't persist → wire to DB save action
- If responsive preview broken → verify viewport switching

### Verification
```
□ Studio loads with canvas
□ Component palette shows all components
□ Drag and drop works
□ Component properties editable
□ Module blocks available for installed modules
□ Rich text editing works
□ Media upload works
□ Undo/redo works
□ Save persists to DB
□ Multi-page management works
□ Responsive preview works
```

---

## Task 3: SEO Configuration

### Files to Audit
- `src/app/(dashboard)/dashboard/sites/[siteId]/seo/page.tsx`
- `src/lib/actions/seo-actions.ts`
- `src/app/(site)/[domain]/layout.tsx` (meta tags)
- Sitemap generation

### Requirements
1. **Page-level SEO**: Title, description, og:image per page
2. **Site-level SEO**: Default meta, robots.txt, sitemap.xml
3. **Analytics integration**: Google Analytics, custom tracking
4. **Social previews**: og:title, og:description, og:image
5. **Auto-generated sitemap**: From published pages
6. **SEO audit**: Show SEO score/recommendations
7. **Save to DB**: All SEO settings persist

### What to Fix
- If SEO settings don't save → wire to real DB
- If meta tags don't render on published site → check layout.tsx
- If sitemap is empty → generate from real pages
- If analytics code doesn't embed → check script injection

### Verification
```
□ Page SEO settings save
□ Site SEO settings save
□ Meta tags render on published pages
□ Sitemap generates from real pages
□ Social previews work
□ Analytics code embeds
```

---

## Task 4: Domain Management & Publishing

### Files to Audit
- `src/app/(dashboard)/dashboard/sites/[siteId]/settings/page.tsx` (domain section)
- `src/lib/actions/domain-actions.ts`
- `src/lib/services/domain-health.ts`
- `src/lib/services/domain-cascade.ts`
- `src/app/(site)/[domain]/*` (published site routes)
- `middleware.ts` (subdomain routing)

### Requirements
1. **Subdomain**: Auto-generated `slug.dramacagency.com`
2. **Custom domain**: Add custom domain with DNS instructions
3. **DNS verification**: Check DNS propagation status
4. **SSL**: Auto SSL via Vercel
5. **Domain health**: Health check service monitors domain
6. **Publishing toggle**: Publish/unpublish site
7. **Publish flow**: Site visible on domain after publish
8. **Middleware routing**: Subdomain → correct site

### What to Fix
- If subdomain doesn't resolve → check middleware routing
- If custom domain DNS check fails → verify DNS health service
- If publish toggle doesn't work → wire to DB status update
- If published site shows wrong content → verify domain → site mapping

### Verification
```
□ Subdomain auto-generated
□ Custom domain can be added
□ DNS verification works
□ Publishing toggle works
□ Published site loads on subdomain
□ Custom domain routes correctly
□ Domain health monitoring works
```

---

## Task 5: End-to-End Website Creation Flow

### Requirements
This is a cross-task verification that the entire flow works:

1. Create new site → Choose AI Designer
2. AI generates pages → Preview → Accept
3. Open Studio → Edit/refine pages
4. Install module (e.g., booking) → Module blocks available
5. Add module block to page
6. Configure SEO settings
7. Connect domain (subdomain)
8. Publish site
9. Visit published site → All pages render
10. Module blocks work (booking form functional)

### Verification
```
□ Full flow works end-to-end
□ AI Designer → Studio → Publish pipeline seamless
□ Module blocks render on published site
□ Public interactions work (booking form, product grid)
□ SEO meta tags present on published pages
```

---

## Summary: Verification Checklist (Complete Before Commit)
```
□ TypeScript: npx tsc --noEmit --skipLibCheck = 0 errors
□ All 5 tasks verified
□ Complete website creation lifecycle works:
  □ Create new site
  □ AI Designer generates real pages with real content
  □ Studio manual editing works (drag-drop, components, save)
  □ Module blocks available for installed modules
  □ SEO configuration saves and renders
  □ Domain management works (subdomain + custom)
  □ Publishing makes site live
  □ Published site renders all pages correctly
  □ Module blocks functional on published site
□ No placeholder content
□ No mock data
□ Undo/redo works in Studio
```
