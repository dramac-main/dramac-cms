# PHASE-UI-11B: Social Calendar & Composer UI Enhancement

## Overview
Enhance the Content Calendar and Post Composer components with modern, enterprise-grade UI patterns including smooth animations, improved UX workflows, and advanced scheduling visualization.

## Goals
1. **Calendar Enhancement**: Add drag-and-drop, visual indicators, time-slot view
2. **Composer Enhancement**: Improve media handling, add platform previews, AI suggestions
3. **Animation**: Framer Motion transitions for better UX
4. **Accessibility**: Keyboard navigation, ARIA labels, focus management

## Files to Create/Modify

### New UI Components (`src/modules/social-media/components/ui/`)

#### 1. `calendar-day-cell.tsx`
- Individual day cell with hover states
- Post count indicators
- Click-to-create functionality
- Drag-drop target

#### 2. `calendar-post-card.tsx`
- Compact post preview for calendar
- Platform icons
- Status indicators
- Quick actions on hover

#### 3. `calendar-week-view.tsx`
- Week view with time slots
- Visual time blocks for posts
- Better scheduling visualization

#### 4. `composer-platform-preview.tsx`
- Live preview for each platform
- Character count with warning states
- Platform-specific formatting

#### 5. `composer-media-uploader.tsx`
- Drag-and-drop media zone
- Upload progress indicators
- Media preview grid

#### 6. `composer-scheduling-panel.tsx`
- Visual time picker
- Best time suggestions
- Timezone selector

### Enhanced Components

#### `ContentCalendarEnhanced.tsx`
- Framer Motion animations
- Drag-and-drop post rescheduling
- Quick filters with animation
- Mini post preview on hover

#### `PostComposerEnhanced.tsx`
- Multi-step wizard for first-time users
- Platform-specific previews
- Media management improvements
- AI content suggestions panel

## Component Specifications

### CalendarDayCell
```tsx
interface CalendarDayCellProps {
  date: Date
  posts: SocialPost[]
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  onSelect: (date: Date) => void
  onCreatePost: (date: Date) => void
  onDropPost?: (postId: string, date: Date) => void
}
```

### CalendarPostCard
```tsx
interface CalendarPostCardProps {
  post: SocialPost
  compact?: boolean
  draggable?: boolean
  onEdit: (post: SocialPost) => void
  onDelete: (postId: string) => void
  onDuplicate: (post: SocialPost) => void
  onPublishNow?: (postId: string) => void
}
```

### ComposerPlatformPreview
```tsx
interface ComposerPlatformPreviewProps {
  platform: SocialPlatform
  content: string
  media: PostMedia[]
  account: SocialAccount
}
```

### ComposerMediaUploader
```tsx
interface ComposerMediaUploaderProps {
  media: PostMedia[]
  onUpload: (files: File[]) => Promise<void>
  onRemove: (mediaId: string) => void
  onReorder: (startIndex: number, endIndex: number) => void
  maxFiles?: number
  acceptedTypes?: string[]
}
```

### ComposerSchedulingPanel
```tsx
interface ComposerSchedulingPanelProps {
  scheduledAt?: Date
  timezone: string
  onSchedule: (date: Date, time: string) => void
  onTimezoneChange: (tz: string) => void
  suggestedTimes?: { time: string; engagement: number }[]
}
```

## Implementation Order

1. Create `calendar-day-cell.tsx` - Foundation for calendar
2. Create `calendar-post-card.tsx` - Post display in calendar
3. Create `calendar-week-view.tsx` - Alternative view
4. Create `ContentCalendarEnhanced.tsx` - Integrate calendar components
5. Create `composer-platform-preview.tsx` - Platform previews
6. Create `composer-media-uploader.tsx` - Media handling
7. Create `composer-scheduling-panel.tsx` - Scheduling UI
8. Create `PostComposerEnhanced.tsx` - Integrate composer components
9. Update wrappers and exports

## Animation Patterns

### Calendar Animations
- Day cells: Stagger reveal on mount
- Posts: Scale animation on hover
- View switch: Slide transitions
- Drag ghost: Follow cursor with opacity

### Composer Animations
- Step transitions: Slide left/right
- Media preview: Scale in from center
- Platform tabs: Underline slide animation
- Submit: Button morphing animation

## Success Criteria

- [ ] Calendar supports drag-and-drop rescheduling
- [ ] Week view shows time-slot-based scheduling
- [ ] Post cards show platform-specific previews
- [ ] Composer has live platform previews
- [ ] Media uploader supports drag-and-drop
- [ ] Scheduling panel shows best time suggestions
- [ ] All interactions have smooth animations
- [ ] TypeScript compiles without errors
- [ ] Build succeeds
