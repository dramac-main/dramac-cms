/**
 * Privacy Policy Page
 *
 * Public privacy policy for DRAMAC CMS platform.
 * Required for Google OAuth consent screen publication.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { identity } from "@/config/brand";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${identity.name} - Learn how we collect, use, and protect your information.`,
};

export default function PrivacyPolicyPage() {
  const effectiveDate = "April 10, 2026";
  const companyName = identity.copyrightName || identity.name;
  const platformName = identity.name;
  const domain = identity.domain;
  const supportEmail = identity.supportEmail;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Back to {platformName}
          </Link>
          <h1 className="mt-6 text-4xl font-bold tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-2 text-muted-foreground">
            Effective date: {effectiveDate}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <p className="text-lg leading-relaxed">
              {companyName} (&quot;{platformName}&quot;, &quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot;) operates the{" "}
              <strong>{domain}</strong> platform and related services. This
              Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our platform, including
              any storefronts, client portals, or services hosted on our
              infrastructure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              1. Information We Collect
            </h2>

            <h3 className="text-lg font-medium mt-4">
              1.1 Information You Provide
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Account Information:</strong> Name, email address,
                password, phone number, and company details when you create an
                account.
              </li>
              <li>
                <strong>Profile Information:</strong> Avatar, display name, and
                other optional details you choose to provide.
              </li>
              <li>
                <strong>Payment Information:</strong> Billing address and
                payment method details, processed securely through our
                third-party payment processors (Stripe, Paddle).
              </li>
              <li>
                <strong>Content:</strong> Website content, media, form
                submissions, and other data you create or upload through the
                platform.
              </li>
              <li>
                <strong>Communications:</strong> Messages sent through our live
                chat, support tickets, or email correspondence.
              </li>
            </ul>

            <h3 className="text-lg font-medium mt-4">
              1.2 Information Collected Through Third-Party Authentication
            </h3>
            <p>
              When you sign in using Google or other third-party authentication
              providers, we receive your name, email address, and profile
              picture from that provider. We use this information solely to
              create or link your account. We do not access your contacts,
              calendar, or any other data from your Google account.
            </p>

            <h3 className="text-lg font-medium mt-4">
              1.3 Information Collected Automatically
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Usage Data:</strong> Pages visited, features used, time
                spent, clicks, and navigation patterns.
              </li>
              <li>
                <strong>Device Information:</strong> Browser type, operating
                system, device type, and screen resolution.
              </li>
              <li>
                <strong>Log Data:</strong> IP address, access times, referring
                URLs, and server logs.
              </li>
              <li>
                <strong>Cookies:</strong> Session cookies for authentication and
                functional cookies for preferences. We do not use third-party
                advertising cookies.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              2. How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide, maintain, and improve our platform and services.</li>
              <li>
                Authenticate your identity and manage your account sessions.
              </li>
              <li>
                Process transactions and send related billing notifications.
              </li>
              <li>
                Communicate with you about updates, security alerts, and support
                messages.
              </li>
              <li>
                Operate the multi-tenant infrastructure that hosts agency sites,
                storefronts, and client portals.
              </li>
              <li>
                Detect, prevent, and address fraud, abuse, and technical issues.
              </li>
              <li>
                Comply with legal obligations and enforce our Terms of Service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              3. Multi-Tenant Architecture &amp; Data Isolation
            </h2>
            <p>
              {platformName} is a multi-tenant platform. Agencies, their
              clients, and storefront customers each have isolated data scopes.
              Data belonging to one agency or storefront is never accessible to
              another. Row-level security policies enforce strict data isolation
              at the database level.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              4. How We Share Your Information
            </h2>
            <p>
              We do not sell your personal information. We may share data with:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Service Providers:</strong> Infrastructure (Vercel,
                Supabase), payment processors (Stripe, Paddle), email delivery
                services, and analytics tools that help us operate the platform.
              </li>
              <li>
                <strong>Agency Operators:</strong> If you are a customer of a
                storefront hosted on {platformName}, the agency operating that
                storefront may access your order history, contact details, and
                communications related to their services.
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law, legal
                process, or to protect the rights, property, or safety of{" "}
                {companyName}, our users, or the public.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">5. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active
              or as needed to provide services. If you delete your account, we
              will delete or anonymize your personal data within 30 days, except
              where retention is required by law or for legitimate business
              purposes (e.g., transaction records, audit logs).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">6. Data Security</h2>
            <p>We implement industry-standard security measures including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Encryption in transit (TLS/HTTPS) and at rest.</li>
              <li>
                Password hashing using bcrypt with appropriate work factors.
              </li>
              <li>
                Row-level security policies for multi-tenant data isolation.
              </li>
              <li>Regular security reviews and dependency updates.</li>
              <li>
                Short-lived authentication tokens and secure session management.
              </li>
            </ul>
            <p>
              No method of transmission or storage is 100% secure. While we
              strive to protect your data, we cannot guarantee absolute
              security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">7. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate or incomplete personal data.</li>
              <li>Request deletion of your personal data.</li>
              <li>Object to or restrict certain processing of your data.</li>
              <li>Export your data in a portable format.</li>
              <li>Withdraw consent where processing is based on consent.</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{" "}
              <a
                href={`mailto:${supportEmail}`}
                className="text-primary hover:underline"
              >
                {supportEmail}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              8. Third-Party Authentication
            </h2>
            <p>
              We offer sign-in through Google and may add other providers in the
              future. When you use third-party authentication:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                We only request basic profile information (name, email, profile
                picture).
              </li>
              <li>
                We do not request access to your contacts, files, calendar, or
                any other sensitive data.
              </li>
              <li>
                You can revoke {platformName}&apos;s access at any time through
                your Google Account settings at{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  myaccount.google.com/permissions
                </a>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              9. Cookies &amp; Local Storage
            </h2>
            <p>
              We use essential cookies and browser local storage for
              authentication and session management. We do not use advertising
              or tracking cookies. Third-party analytics may set their own
              cookies — you can manage these through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              10. Children&apos;s Privacy
            </h2>
            <p>
              Our platform is not directed to individuals under 16. We do not
              knowingly collect personal data from children. If we learn that we
              have collected data from a child under 16, we will delete it
              promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              11. International Data Transfers
            </h2>
            <p>
              Your information may be processed in countries other than your
              country of residence. Our infrastructure providers maintain
              appropriate data protection safeguards compliant with applicable
              regulations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              12. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of material changes by posting the updated policy on
              this page and updating the effective date. Your continued use of
              the platform after changes take effect constitutes acceptance of
              the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">13. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data
              practices, contact us at:
            </p>
            <p className="mt-2">
              <strong>{companyName}</strong>
              <br />
              Email:{" "}
              <a
                href={`mailto:${supportEmail}`}
                className="text-primary hover:underline"
              >
                {supportEmail}
              </a>
              <br />
              Website:{" "}
              <a
                href={`https://${domain}`}
                className="text-primary hover:underline"
              >
                {domain}
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 border-t pt-8 flex items-center justify-between text-sm text-muted-foreground">
          <Link
            href="/terms"
            className="hover:text-foreground transition-colors"
          >
            Terms of Service
          </Link>
          <span>
            &copy; {new Date().getFullYear()} {companyName}. All rights
            reserved.
          </span>
        </div>
      </div>
    </main>
  );
}
