/**
 * Booking Embed Page
 * 
 * Public-facing embeddable booking widget.
 * This route renders the booking widget without token auth
 * since booking pages are meant to be publicly accessible.
 * 
 * URL: /embed/booking/{siteId}?type=full&color=8B5CF6&...
 */
import { createAdminClient } from '@/lib/supabase/admin'

interface BookingEmbedPageProps {
  params: Promise<{ siteId: string }>
  searchParams: Promise<{
    type?: 'full' | 'calendar-only' | 'button-popup'
    color?: string
    radius?: string
    hideHeader?: string
    hideServices?: string
    hideStaff?: string
    buttonText?: string
    theme?: 'light' | 'dark' | 'auto'
  }>
}

interface BookingService {
  id: string
  name: string
  duration_minutes: number
  price: number
  currency: string
  color: string
  description?: string
}

interface BookingStaff {
  id: string
  name: string
  avatar_url?: string
  title?: string
}

export default async function BookingEmbedPage({ params, searchParams }: BookingEmbedPageProps) {
  const { siteId } = await params
  const {
    type = 'full',
    color = '8B5CF6',
    radius = '8',
    hideHeader,
    hideServices,
    hideStaff,
    buttonText = 'Book Now',
    theme = 'auto',
  } = await searchParams

  // Verify module is installed & enabled
  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  // First find the booking module ID
  const { data: moduleData } = await db
    .from('modules_v2')
    .select('id')
    .eq('slug', 'booking')
    .single()

  let bookingInstallation: {
    id: string
    settings: Record<string, unknown>
    is_enabled: boolean
    module_id: string
  } | null = null

  if (moduleData) {
    const { data: inst } = await db
      .from('site_module_installations')
      .select('id, settings, is_enabled, module_id')
      .eq('site_id', siteId)
      .eq('module_id', moduleData.id)
      .single()
    bookingInstallation = inst
  }

  if (!bookingInstallation || !bookingInstallation.is_enabled) {
    return (
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Booking Not Available</title>
          <style>{`
            html, body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; background: #fafafa; }
          `}</style>
        </head>
        <body>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', padding: '2rem',
          }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>
                Booking Not Available
              </h1>
              <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                The booking module is not enabled for this site.
              </p>
            </div>
          </div>
        </body>
      </html>
    )
  }

  // Load services and staff
  const [servicesResult, staffResult] = await Promise.all([
    db
      .from('mod_bookmod01_services')
      .select('id, name, duration_minutes, price, currency, color, description')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    db
      .from('mod_bookmod01_staff')
      .select('id, name, avatar_url, title')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ])

  const services = (servicesResult.data || []) as BookingService[]
  const staffMembers = (staffResult.data || []) as BookingStaff[]

  const primaryColor = `#${color}`
  const borderRadius = `${radius}px`
  const showHeader = hideHeader !== '1'
  const showServices = hideServices !== '1'
  const showStaff = hideStaff !== '1'

  // Build settings for the booking widget
  const instSettings = (bookingInstallation?.settings || {}) as Record<string, unknown>
  const timezone = (instSettings.timezone as string) || 'Africa/Lusaka'
  const currency = (instSettings.currency as string) || 'USD'
  const dateFormat = (instSettings.date_format as string) || 'MM/DD/YYYY'

  const themeClass = theme === 'dark' ? 'dark' : ''

  return (
    <html lang="en" className={themeClass}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <title>Book an Appointment</title>
        <style>{`
          :root {
            --primary: ${primaryColor};
            --radius: ${borderRadius};
          }
          html, body {
            margin: 0; padding: 0;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #fff;
            color: #111827;
            min-height: 100vh;
          }
          .dark { background: #18181b; color: #fafafa; }
          * { box-sizing: border-box; }
          .embed-container { max-width: 640px; margin: 0 auto; padding: 24px 16px; }
          .embed-header { text-align: center; margin-bottom: 24px; }
          .embed-header h1 { font-size: 1.5rem; font-weight: 700; margin: 0 0 4px; }
          .embed-header p { font-size: 0.875rem; color: #6b7280; margin: 0; }
          .service-list { display: flex; flex-direction: column; gap: 12px; }
          .service-card {
            border: 1px solid #e5e7eb; border-radius: var(--radius);
            padding: 16px; cursor: pointer; transition: all 0.2s;
            display: flex; justify-content: space-between; align-items: center;
          }
          .service-card:hover { border-color: var(--primary); box-shadow: 0 0 0 1px var(--primary); }
          .service-name { font-weight: 600; font-size: 1rem; }
          .service-meta { display: flex; gap: 12px; margin-top: 4px; font-size: 0.875rem; color: #6b7280; }
          .service-price { font-weight: 600; color: var(--primary); font-size: 1rem; }
          .staff-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
          .staff-card {
            border: 1px solid #e5e7eb; border-radius: var(--radius);
            padding: 16px; text-align: center; cursor: pointer; transition: all 0.2s;
          }
          .staff-card:hover { border-color: var(--primary); }
          .staff-avatar {
            width: 48px; height: 48px; border-radius: 50%;
            background: #ddd6fe; display: flex; align-items: center; justify-content: center;
            margin: 0 auto 8px; font-weight: 600; color: #7c3aed;
          }
          .staff-name { font-weight: 600; font-size: 0.875rem; }
          .staff-title { font-size: 0.75rem; color: #6b7280; margin-top: 2px; }
          .powered-by {
            text-align: center; margin-top: 32px; padding-top: 16px;
            border-top: 1px solid #e5e7eb; font-size: 0.75rem; color: #9CA3AF;
          }
          .powered-by a { color: #7c3aed; text-decoration: none; }
          .section-title { font-size: 1rem; font-weight: 600; margin: 24px 0 12px; }
          .no-data { text-align: center; padding: 32px; color: #9CA3AF; }
          @media (max-width: 480px) {
            .embed-container { padding: 16px 12px; }
            .staff-grid { grid-template-columns: repeat(2, 1fr); }
          }
        `}</style>
      </head>
      <body>
        <div className="embed-container">
          {showHeader && (
            <div className="embed-header">
              <h1>Book an Appointment</h1>
              <p>Select a service and time that works for you</p>
            </div>
          )}

          {showServices && (
            <>
              <div className="section-title">Choose a Service</div>
              {services && services.length > 0 ? (
                <div className="service-list">
                  {services.map((service) => (
                    <div key={service.id} className="service-card">
                      <div>
                        <div className="service-name">{service.name}</div>
                        <div className="service-meta">
                          <span>{service.duration_minutes} min</span>
                          {service.description && <span>• {service.description}</span>}
                        </div>
                      </div>
                      <div className="service-price">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: service.currency || currency,
                          minimumFractionDigits: 0,
                        }).format(service.price)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">No services available</div>
              )}
            </>
          )}

          {showStaff && (
            <>
              <div className="section-title">Choose a Staff Member</div>
              {staffMembers && staffMembers.length > 0 ? (
                <div className="staff-grid">
                  {staffMembers.map((member) => (
                    <div key={member.id} className="staff-card">
                      <div className="staff-avatar">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.name}
                            style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          member.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="staff-name">{member.name}</div>
                      {member.title && <div className="staff-title">{member.title}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">Any available staff</div>
              )}
            </>
          )}

          <div className="powered-by">
            Powered by <a href="https://dramac.com" target="_blank" rel="noopener noreferrer">DRAMAC</a>
            {' '}• {timezone} • {dateFormat}
          </div>
        </div>

        {/* PostMessage bridge for parent communication */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            'use strict';
            window.parent.postMessage({
              type: 'DRAMAC_MODULE_READY',
              moduleId: 'booking',
              siteId: '${siteId}'
            }, '*');

            var resizeObserver = new ResizeObserver(function(entries) {
              var height = entries[0].contentRect.height;
              window.parent.postMessage({
                type: 'DRAMAC_RESIZE',
                moduleId: 'booking',
                height: height
              }, '*');
            });
            resizeObserver.observe(document.body);
          })();
        `}} />
      </body>
    </html>
  )
}

export const dynamic = 'force-dynamic'

// Note: X-Frame-Options / frame-ancestors headers are configured in next.config.ts for /embed/* routes
