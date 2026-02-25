/**
 * Booking Module Auto-Setup Server Actions
 *
 * Auto-creates the /book page when the Booking module is installed.
 * Follows the same pattern as ecommerce/actions/auto-setup-actions.ts.
 *
 * The page content only includes module-specific components (hero + service selector).
 * The shared Navbar/Footer are auto-injected at render time by page.tsx.
 *
 * @phase Smart Navigation — booking page auto-creation
 */

'use server';

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// BOOKING PAGE CONTENT
// ============================================================================

/**
 * Content JSON for the /book page.
 * Includes a branded hero section and the BookingServiceSelector component.
 * Navbar/Footer are NOT included — they're injected at runtime from the homepage.
 */
const BOOKING_PAGE_CONTENT = {
  root: {
    id: 'root',
    type: 'Root',
    props: {
      title: 'Book Appointment',
      styles: {
        padding: '0',
        maxWidth: '1280px',
        backgroundColor: '#ffffff',
      },
    },
    children: ['section_booking_hero', 'section_booking_main'],
  },
  version: '1.0',
  components: {
    section_booking_hero: {
      id: 'section_booking_hero',
      type: 'Section',
      props: {
        margin: '0 auto',
        padding: '48px 24px 32px',
        maxWidth: '1280px',
        backgroundColor: '#f0fdf4',
      },
      children: ['container_booking_hero'],
      parentId: 'root',
    },
    container_booking_hero: {
      id: 'container_booking_hero',
      type: 'Container',
      props: {
        gap: '16px',
        width: '100%',
        display: 'flex',
        maxWidth: '800px',
        margin: '0 auto',
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
      },
      children: ['heading_booking', 'text_booking_desc'],
      parentId: 'section_booking_hero',
    },
    heading_booking: {
      id: 'heading_booking',
      type: 'Heading',
      props: {
        text: 'Book Your Appointment',
        level: 1,
        fontSize: '40px',
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: '8px',
      },
      parentId: 'container_booking_hero',
    },
    text_booking_desc: {
      id: 'text_booking_desc',
      type: 'RichText',
      props: {
        content:
          '<p style="text-align: center; font-size: 18px; color: #4b5563; max-width: 600px; margin: 0 auto;">Select a service below and choose a convenient time. Our team is ready to help you with personalized care.</p>',
        textAlign: 'center',
      },
      parentId: 'container_booking_hero',
    },
    section_booking_main: {
      id: 'section_booking_main',
      type: 'Section',
      props: {
        margin: '0 auto',
        padding: '32px 24px 64px',
        maxWidth: '1280px',
        backgroundColor: '#ffffff',
      },
      children: ['booking_service_selector'],
      parentId: 'root',
    },
    booking_service_selector: {
      id: 'booking_service_selector',
      type: 'BookingServiceSelector',
      props: {
        layout: 'grid',
        showPricing: true,
        showDuration: true,
        showDescription: true,
        columns: 3,
        bookButtonText: 'Book Now',
        backgroundColor: '#ffffff',
      },
      parentId: 'section_booking_main',
    },
  },
};

// ============================================================================
// PAGE CREATION
// ============================================================================

export interface CreateBookingPagesResult {
  success: boolean;
  pages: Array<{ id: string; slug: string; title: string }>;
  errors?: string[];
}

/**
 * Create the /book page for a site.
 * Skips if the page already exists.
 */
export async function createBookingPages(
  siteId: string
): Promise<CreateBookingPagesResult> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const result: CreateBookingPagesResult = {
    success: true,
    pages: [],
    errors: [],
  };

  // Check if /book page already exists
  const { data: existingPages } = await db
    .from('pages')
    .select('slug')
    .eq('site_id', siteId)
    .in('slug', ['book', '/book']);

  if (existingPages && existingPages.length > 0) {
    console.log('[BookingSetup] /book page already exists, skipping');
    return result;
  }

  try {
    // Create the page
    const { data: page, error } = await db
      .from('pages')
      .insert({
        site_id: siteId,
        slug: 'book',
        name: 'Book Appointment',
        seo_title: 'Book an Appointment',
        seo_description:
          'Schedule your appointment online. Quick and easy online booking for all our services.',
        is_homepage: false,
      })
      .select('id, slug, name')
      .single();

    if (error) {
      console.error('[BookingSetup] Failed to create /book page:', error);
      result.errors?.push(`Failed to create /book: ${error.message}`);
      result.success = false;
      return result;
    }

    // Create the page content
    const { error: contentError } = await db.from('page_content').insert({
      page_id: page.id,
      content: BOOKING_PAGE_CONTENT,
    });

    if (contentError) {
      console.error('[BookingSetup] Failed to save /book content:', contentError);
      result.errors?.push(`Failed to save /book content: ${contentError.message}`);
    }

    result.pages.push({
      id: page.id,
      slug: page.slug,
      title: page.name,
    });
    console.log('[BookingSetup] Created /book page with content');
  } catch (err) {
    console.error('[BookingSetup] Error creating /book page:', err);
    result.errors?.push('Error creating /book page');
    result.success = false;
  }

  return result;
}

/**
 * Delete the /book page for a site (used during module uninstall).
 */
export async function deleteBookingPages(siteId: string): Promise<boolean> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  try {
    const { data: pages } = await db
      .from('pages')
      .select('id')
      .eq('site_id', siteId)
      .in('slug', ['book', '/book']);

    if (pages && pages.length > 0) {
      for (const page of pages) {
        // Delete content first (FK constraint)
        await db.from('page_content').delete().eq('page_id', page.id);
        await db.from('pages').delete().eq('id', page.id);
      }
      console.log('[BookingSetup] Deleted /book page');
    }

    return true;
  } catch (err) {
    console.error('[BookingSetup] Error deleting /book page:', err);
    return false;
  }
}
