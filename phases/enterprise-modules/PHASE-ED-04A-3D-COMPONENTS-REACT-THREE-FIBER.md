# PHASE-ED-04A: 3D Components - React Three Fiber

## Overview
- **Objective**: Add advanced 3D capabilities to the Puck editor using React Three Fiber (R3F) and Drei
- **Scope**: Create 5 new 3D components that can be used in the visual page builder
- **Dependencies**: PHASE-ED-03C (Puck component system must be in place)
- **Estimated Effort**: 8 hours

## Pre-Implementation Checklist
- [x] Memory bank reviewed
- [x] Affected files identified
- [x] Patterns verified (Puck component structure)
- [x] No conflicts detected

## New Dependencies Required
```bash
pnpm add @react-three/fiber @react-three/drei three
pnpm add -D @types/three
```

## Components to Add (5 total)

### 1. **Scene3D** - Interactive 3D model viewer
- Load .glb/.gltf models
- Auto-rotate option
- Zoom controls
- Custom lighting presets

### 2. **ParticleBackground** - Animated particle system
- Configurable particle count
- Multiple animation styles (float, swarm, galaxy)
- Color customization

### 3. **FloatingCards** - 3D parallax card effect
- Cards that float and rotate on scroll/hover
- Depth effect with multiple layers
- Interactive mouse tracking

### 4. **GlobeVisualization** - Interactive 3D globe
- Earth texture with markers
- Rotation animation
- Highlight locations

### 5. **Animated3DText** - 3D typography
- Extruded 3D text
- Material customization
- Rotation animations

## Implementation Steps

### Step 1: Install Dependencies
**Command**: Run in terminal
```bash
cd next-platform-dashboard
pnpm add @react-three/fiber @react-three/drei three
pnpm add -D @types/three
```

### Step 2: Add Type Definitions
**File**: `src/types/puck.ts`
**Action**: Append new 3D component types

```typescript
// ============================================
// 3D Component Props (PHASE-ED-04A)
// ============================================

export interface Scene3DProps {
  modelUrl?: string;
  autoRotate?: boolean;
  enableZoom?: boolean;
  backgroundColor?: string;
  lighting?: "ambient" | "directional" | "studio" | "dramatic";
  height?: number;
  cameraPosition?: "front" | "angle" | "top";
}

export interface ParticleBackgroundProps {
  particleCount?: number;
  particleColor?: string;
  particleSize?: number;
  animationStyle?: "float" | "swarm" | "galaxy" | "snow" | "rain";
  speed?: number;
  backgroundColor?: string;
  height?: number;
}

export interface FloatingCardsProps {
  cards?: Array<{
    title: string;
    description: string;
    image?: string;
  }>;
  depth?: number;
  rotationIntensity?: number;
  floatIntensity?: number;
  backgroundColor?: string;
  height?: number;
}

export interface GlobeVisualizationProps {
  texture?: "earth" | "wireframe" | "dots" | "custom";
  autoRotate?: boolean;
  rotationSpeed?: number;
  markers?: Array<{
    lat: number;
    lng: number;
    label?: string;
    color?: string;
  }>;
  backgroundColor?: string;
  height?: number;
}

export interface Animated3DTextProps {
  text?: string;
  fontSize?: number;
  color?: string;
  metalness?: number;
  roughness?: number;
  depth?: number;
  animationType?: "rotate" | "float" | "pulse" | "none";
  backgroundColor?: string;
  height?: number;
}
```

### Step 3: Create 3D Components File
**File**: `src/components/editor/puck/components/three-d.tsx`
**Action**: Create new file with all 5 components

See implementation in the actual file.

### Step 4: Update Components Index
**File**: `src/components/editor/puck/components/index.ts`
**Action**: Add exports for 3D components

```typescript
// 3D Components (PHASE-ED-04A)
export {
  Scene3DRender,
  ParticleBackgroundRender,
  FloatingCardsRender,
  GlobeVisualizationRender,
  Animated3DTextRender,
} from "./three-d";
```

### Step 5: Update Puck Config
**File**: `src/components/editor/puck/puck-config.tsx`
**Action**: Add 3D component definitions to config

Add imports and component configurations as specified.

## Verification Steps
1. TypeScript: `npx tsc --noEmit --skipLibCheck`
2. Build: `pnpm build`
3. Manual testing:
   - Open editor at `/dashboard/sites/[siteId]/editor`
   - Check "3D" category appears in toolbox
   - Add Scene3D component, verify canvas renders
   - Add ParticleBackground, verify particles animate
   - Test FloatingCards with sample data
   - Test GlobeVisualization rotation
   - Test Animated3DText with custom text

## Rollback Plan
If issues arise:
1. Revert files:
   - `src/components/editor/puck/components/three-d.tsx`
   - `src/components/editor/puck/components/index.ts`
   - `src/components/editor/puck/puck-config.tsx`
   - `src/types/puck.ts`
2. Remove dependencies: `pnpm remove @react-three/fiber @react-three/drei three @types/three`

## Files Changed Summary
| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Modified | Add R3F dependencies |
| `src/types/puck.ts` | Modified | Add 3D component type definitions |
| `src/components/editor/puck/components/three-d.tsx` | Created | 3D component implementations |
| `src/components/editor/puck/components/index.ts` | Modified | Export 3D components |
| `src/components/editor/puck/puck-config.tsx` | Modified | Add 3D component configs |

## Technical Notes

### React Three Fiber Best Practices
1. Always wrap Canvas in a fixed-height container
2. Use Suspense for async model loading
3. Use `frameloop="demand"` for performance when not animating
4. Implement proper cleanup in useEffect hooks

### Browser Compatibility
- WebGL 2.0 required (95%+ browser support)
- Fallback message shown for unsupported browsers
- Mobile: Touch controls enabled via OrbitControls

### Performance Considerations
- Limit particle count on mobile devices
- Use LOD (Level of Detail) for complex models
- Lazy load 3D components with dynamic imports
