/**
 * Booking Module Installation Hook
 *
 * Auto-creates the /book page and navigation items when the Booking module
 * is installed on a site. Follows the same pattern as the e-commerce hook.
 *
 * @phase Smart Navigation — booking module hook
 */

import type {
  ModuleInstallationHook,
  InstallHookResult,
  UninstallHookResult,
} from '@/lib/modules/hooks/types';
import { createBookingPages, deleteBookingPages } from '../actions/auto-setup-actions';

// ============================================================================
// BOOKING INSTALLATION HOOK
// ============================================================================

export const bookingInstallationHook: ModuleInstallationHook = {
  moduleId: 'booking',

  /**
   * Handle module installation — create /book page
   */
  async onInstall(
    siteId: string,
    settings?: Record<string, unknown>
  ): Promise<InstallHookResult> {
    console.log(`[BookingHook] Installing booking on site: ${siteId}`);

    const result: InstallHookResult = {
      success: true,
      pagesCreated: [],
      navItemsAdded: [],
      settingsApplied: {},
      errors: [],
    };

    const hookOptions = settings?.__hookOptions as {
      skipPageCreation?: boolean;
    } | undefined;

    // Create the /book page
    if (!hookOptions?.skipPageCreation) {
      try {
        const pagesResult = await createBookingPages(siteId);
        if (pagesResult.success) {
          result.pagesCreated = pagesResult.pages.map((p) => p.slug);
          console.log(`[BookingHook] Created ${result.pagesCreated.length} pages`);
        } else {
          result.errors?.push(...(pagesResult.errors || ['Failed to create pages']));
        }
      } catch (error) {
        console.error('[BookingHook] Page creation failed:', error);
        result.errors?.push(
          error instanceof Error ? error.message : 'Page creation failed'
        );
      }
    }

    // Navigation items are injected at runtime by smart-navigation.ts
    // (BOOKING_NAV_ITEMS, BOOKING_UTILITY_ITEMS, BOOKING_FOOTER_ITEMS)
    // No need to write them to settings — runtime detection handles it.
    result.navItemsAdded = ['Book Now (main)', 'Book Now (utility)', 'Book Appointment (footer)'];

    result.success = (result.errors?.length || 0) === 0;
    return result;
  },

  /**
   * Handle module uninstallation — remove /book page
   */
  async onUninstall(siteId: string): Promise<UninstallHookResult> {
    console.log(`[BookingHook] Uninstalling booking from site: ${siteId}`);

    const result: UninstallHookResult = {
      success: true,
      pagesRemoved: [],
      navItemsRemoved: [],
      settingsCleared: [],
      errors: [],
    };

    try {
      const deleted = await deleteBookingPages(siteId);
      if (deleted) {
        result.pagesRemoved = ['book'];
      }
    } catch (error) {
      console.error('[BookingHook] Page deletion failed:', error);
      result.errors?.push(
        error instanceof Error ? error.message : 'Page deletion failed'
      );
    }

    result.navItemsRemoved = ['Book Now (main)', 'Book Now (utility)', 'Book Appointment (footer)'];
    result.success = (result.errors?.length || 0) === 0;
    return result;
  },
};
