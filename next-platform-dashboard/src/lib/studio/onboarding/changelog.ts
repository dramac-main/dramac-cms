/**
 * DRAMAC Studio Changelog
 * 
 * Changelog data for the What's New panel.
 * 
 * @phase STUDIO-26
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Change type for changelog items
 */
export type ChangeType = "feature" | "improvement" | "fix";

/**
 * Individual change entry
 */
export interface ChangelogEntry {
  type: ChangeType;
  title: string;
  description: string;
}

/**
 * Release version with changes
 */
export interface ChangelogRelease {
  version: string;
  date: string; // ISO date string
  changes: ChangelogEntry[];
}

// =============================================================================
// CHANGELOG DATA
// =============================================================================

/**
 * Changelog data - newest first
 */
export const CHANGELOG: ChangelogRelease[] = [
  {
    version: "1.2.0",
    date: "2026-02-03",
    changes: [
      {
        type: "feature",
        title: "Section Templates",
        description: "Insert pre-designed sections like hero, pricing, and testimonials",
      },
      {
        type: "feature",
        title: "Symbols",
        description: "Create reusable components that sync across all pages",
      },
      {
        type: "feature",
        title: "Onboarding Tutorial",
        description: "New guided tour for first-time users",
      },
      {
        type: "improvement",
        title: "Help Panel",
        description: "Easy access to documentation and resources",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-02-02",
    changes: [
      {
        type: "feature",
        title: "Keyboard Shortcuts",
        description: "Full keyboard navigation and shortcuts for power users",
      },
      {
        type: "feature",
        title: "Command Palette",
        description: "Quick access to all actions with Ctrl+K",
      },
      {
        type: "feature",
        title: "Component States",
        description: "Edit hover, active, and focus states for buttons and links",
      },
      {
        type: "improvement",
        title: "Performance",
        description: "Editor now handles 500+ components smoothly",
      },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-01-28",
    changes: [
      {
        type: "feature",
        title: "DRAMAC Studio Launch",
        description: "Brand new visual editor with drag-and-drop components",
      },
      {
        type: "feature",
        title: "AI Assistant",
        description: "Edit any component using natural language",
      },
      {
        type: "feature",
        title: "Responsive Preview",
        description: "Design for mobile, tablet, and desktop in one place",
      },
      {
        type: "feature",
        title: "Layers Panel",
        description: "Visual page structure with drag-to-reorder",
      },
    ],
  },
];

// =============================================================================
// STORAGE UTILITIES
// =============================================================================

/**
 * Storage key for last seen version
 */
export const CHANGELOG_STORAGE_KEY = "studio-changelog-seen";

/**
 * Get the latest version
 */
export function getLatestVersion(): string {
  return CHANGELOG[0]?.version || "1.0.0";
}

/**
 * Check if there are unread updates
 */
export function hasUnreadUpdates(): boolean {
  if (typeof window === "undefined") return false;
  const lastSeen = localStorage.getItem(CHANGELOG_STORAGE_KEY);
  return lastSeen !== getLatestVersion();
}

/**
 * Mark updates as read
 */
export function markUpdatesAsRead(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHANGELOG_STORAGE_KEY, getLatestVersion());
}

/**
 * Get unread releases
 */
export function getUnreadReleases(): ChangelogRelease[] {
  if (typeof window === "undefined") return [];
  const lastSeen = localStorage.getItem(CHANGELOG_STORAGE_KEY);
  if (!lastSeen) return CHANGELOG;
  
  return CHANGELOG.filter((release) => {
    // Compare version strings (semantic versioning)
    return compareVersions(release.version, lastSeen) > 0;
  });
}

/**
 * Compare semantic versions
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);
  
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  
  return 0;
}
