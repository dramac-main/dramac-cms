# PHASE-ED-04B: 3D Components - Spline Integration

## Overview
- **Objective**: Integrate Spline.design for no-code 3D scenes in the Puck editor
- **Scope**: Create 5 Spline-based components for easy 3D integration
- **Dependencies**: PHASE-ED-04A (3D foundation must be in place)
- **Estimated Effort**: 4 hours

## Pre-Implementation Checklist
- [x] Memory bank reviewed
- [x] PHASE-ED-04A completed (React Three Fiber installed)
- [x] Spline component structure planned
- [x] No conflicts detected

## About Spline
Spline (spline.design) is a no-code 3D design tool that lets users create interactive 3D scenes that can be embedded via URL. This is ideal for agencies/users who want 3D content without coding.

## New Dependencies Required
```bash
pnpm add @splinetool/react-spline
```

## Components to Add (5 total)

### 1. **SplineScene** - Basic Spline embed
- Embed any Spline scene via URL
- Configurable height
- Loading states

### 2. **SplineViewer** - Interactive 3D viewer
- Full interactive mode
- Auto-rotate option
- Controls visibility

### 3. **Spline3DCard** - Card with 3D background
- 3D scene as background
- Overlay text/content
- Perfect for hero sections

### 4. **SplineBackground** - Full-width 3D background
- Section background with 3D
- Overlay support
- Children content support

### 5. **SplineProductViewer** - E-commerce product display
- Product scene embed
- Info overlay
- Price display

## Implementation Steps

### Step 1: Install Dependencies
**Command**: Run in terminal
```bash
cd next-platform-dashboard
pnpm add @splinetool/react-spline
```

### Step 2: Type Definitions
**File**: `src/types/puck.ts`
**Status**: ✅ Already added in PHASE-ED-04A

Types added:
- SplineSceneProps
- SplineViewerProps
- Spline3DCardProps
- SplineBackgroundProps
- SplineProductViewerProps

### Step 3: Create Spline Components File
**File**: `src/components/editor/puck/components/spline.tsx`
**Action**: Create new file with all 5 Spline components

See implementation in the actual file.

### Step 4: Update Components Index
**File**: `src/components/editor/puck/components/index.ts`
**Action**: Add exports for Spline components

```typescript
// Spline 3D Components (PHASE-ED-04B)
export {
  SplineSceneRender,
  SplineViewerRender,
  Spline3DCardRender,
  SplineBackgroundRender,
  SplineProductViewerRender,
} from "./spline";
```

### Step 5: Update Puck Config
**File**: `src/components/editor/puck/puck-config.tsx`
**Action**: Add Spline component definitions to config

## Demo Spline Scenes
For testing, users can use these public Spline scenes:
- Abstract shapes: `https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode`
- Product demo: Available on Spline community

Note: In production, users will paste their own Spline scene URLs.

## Verification Steps
1. TypeScript: `npx tsc --noEmit --skipLibCheck`
2. Build: `pnpm build`
3. Manual testing:
   - Open editor at `/dashboard/sites/[siteId]/editor`
   - Check "Spline" category appears in toolbox
   - Add SplineScene component with a valid Spline URL
   - Verify scene loads and is interactive
   - Test SplineBackground with overlay content
   - Verify responsive behavior

## Rollback Plan
If issues arise:
1. Revert files:
   - `src/components/editor/puck/components/spline.tsx`
   - `src/components/editor/puck/components/index.ts`
   - `src/components/editor/puck/puck-config.tsx`
2. Remove dependencies: `pnpm remove @splinetool/react-spline`

## Files Changed Summary
| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Modified | Add Spline dependency |
| `src/components/editor/puck/components/spline.tsx` | Created | Spline component implementations |
| `src/components/editor/puck/components/index.ts` | Modified | Export Spline components |
| `src/components/editor/puck/puck-config.tsx` | Modified | Add Spline component configs |

## User Guide for Spline Components

### Getting a Spline Scene URL
1. Create account at spline.design
2. Create or open a 3D scene
3. Click "Export" → "Web" → "Viewer"
4. Copy the scene URL (ends with .splinecode)

### Performance Tips
- Keep scene polygon count under 50k for best performance
- Use "lazy" loading for below-fold scenes
- Optimize textures in Spline before export
- Consider using static fallback images for mobile

## Technical Notes

### Spline React Integration
- Uses `@splinetool/react-spline` official package
- Supports full interactivity (hover, click, scroll)
- Scenes are loaded from Spline CDN
- No self-hosting required

### Browser Compatibility
- Requires WebGL (same as React Three Fiber)
- Works on all modern browsers
- Mobile: Touch interactions supported
- Fallback shown for unsupported browsers
