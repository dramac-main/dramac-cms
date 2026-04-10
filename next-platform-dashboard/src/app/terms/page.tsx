/**
 * Terms of Service Page
 *
 * Public terms of service for DRAMAC CMS platform.
 * Required for Google OAuth consent screen publication.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { identity } from "@/config/brand";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${identity.name} - Rules and guidelines for using our platform.`,
};

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <p className="mt-2 text-muted-foreground">
            Effective date: {effectiveDate}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <p className="text-lg leading-relaxed">
              These Terms of Service (&quot;Terms&quot;) govern your access to
              and use of the {platformName} platform operated by {companyName}{" "}
              (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), available at{" "}
              <strong>{domain}</strong> and all related services, subdomains,
              and storefronts. By using {platformName}, you agree to these
              Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">1. Definitions</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>&quot;Platform&quot;</strong> refers to the{" "}
                {platformName} software, website, APIs, and all related
                services.
              </li>
              <li>
                <strong>&quot;Agency&quot;</strong> refers to a business or
                individual that creates an account to manage clients and
                websites on the Platform.
              </li>
              <li>
                <strong>&quot;Client&quot;</strong> refers to an Agency&apos;s
                customer who may access the Platform through a Client Portal.
              </li>
              <li>
                <strong>&quot;Storefront Customer&quot;</strong> refers to an
                end-user who interacts with a storefront hosted on the Platform
                (placing orders, making bookings, etc.).
              </li>
              <li>
                <strong>&quot;Module&quot;</strong> refers to any software
                extension, app, widget, or integration available through the
                Platform&apos;s marketplace.
              </li>
              <li>
                <strong>&quot;Content&quot;</strong> refers to text, images,
                media, data, and other materials created, uploaded, or displayed
                through the Platform.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">2. Account Registration</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                You must provide accurate and complete information when creating
                an account.
              </li>
              <li>
                You are responsible for maintaining the security of your account
                credentials.
              </li>
              <li>
                You must be at least 16 years old to use the Platform.
              </li>
              <li>
                One person or entity may not maintain more than one free
                account.
              </li>
              <li>
                You are responsible for all activity that occurs under your
                account.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              3. Acceptable Use
            </h2>
            <p>You agree not to use the Platform to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Violate any applicable law, regulation, or third-party rights.
              </li>
              <li>
                Distribute malware, spam, or any form of malicious content.
              </li>
              <li>
                Attempt to gain unauthorized access to the Platform, other
                accounts, or connected systems.
              </li>
              <li>
                Scrape, crawl, or use automated means to access the Platform
                without our written consent.
              </li>
              <li>
                Host content that is defamatory, obscene, illegal, or promotes
                violence or discrimination.
              </li>
              <li>
                Impersonate another person or misrepresent your affiliation
                with any entity.
              </li>
              <li>
                Use the Platform to build a competing product or service.
              </li>
              <li>
                Exceed reasonable usage limits or intentionally overload our
                infrastructure.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              4. Agency Responsibilities
            </h2>
            <p>
              Agencies using {platformName} to manage client websites and
              storefronts are additionally responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Ensuring their own compliance with applicable data protection
                regulations (GDPR, CCPA, etc.) for the data they collect
                through their storefronts.
              </li>
              <li>
                Providing their own privacy policies and terms to their
                storefront customers where required by law.
              </li>
              <li>
                Managing their team members&apos; access and permissions
                appropriately.
              </li>
              <li>
                Maintaining the accuracy of their storefront content, product
                listings, pricing, and business information.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              5. Intellectual Property
            </h2>
            <h3 className="text-lg font-medium mt-4">5.1 Platform Ownership</h3>
            <p>
              The Platform, including its code, design, features, documentation,
              and branding, is owned by {companyName} and protected by
              intellectual property laws. These Terms do not grant you any
              rights to our trademarks, logos, or brand assets.
            </p>

            <h3 className="text-lg font-medium mt-4">5.2 Your Content</h3>
            <p>
              You retain ownership of Content you create or upload to the
              Platform. By using the Platform, you grant us a limited license
              to host, display, and transmit your Content solely to provide the
              services you have requested.
            </p>

            <h3 className="text-lg font-medium mt-4">5.3 Modules</h3>
            <p>
              Module developers retain ownership of their modules. Installing
              a module grants you a license to use it according to the
              module&apos;s own terms and the Platform marketplace guidelines.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              6. Payment &amp; Billing
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Paid plans are billed in advance on a monthly or annual basis.
              </li>
              <li>
                All fees are non-refundable unless otherwise stated or required
                by law.
              </li>
              <li>
                We reserve the right to change pricing with 30 days&apos;
                notice. Existing subscriptions will honor the current price
                until renewal.
              </li>
              <li>
                Module marketplace purchases follow the individual pricing set
                by module developers.
              </li>
              <li>
                Payment processing is handled by third-party providers (Stripe,
                Paddle). Your payment information is subject to their respective
                privacy policies.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">7. Service Availability</h2>
            <p>
              We strive to maintain high availability but do not guarantee
              uninterrupted service. The Platform may be temporarily
              unavailable for maintenance, updates, or circumstances beyond our
              control. We are not liable for any loss or damage resulting from
              service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">8. Data &amp; Privacy</h2>
            <p>
              Your use of the Platform is also governed by our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              , which explains how we collect, use, and protect your
              information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              9. Third-Party Services
            </h2>
            <p>
              The Platform integrates with third-party services (domain
              registrars, payment processors, authentication providers, email
              services, etc.). We are not responsible for the availability,
              accuracy, or practices of these third-party services. Your use
              of third-party services is subject to their own terms and
              policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              10. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, {companyName} shall not
              be liable for any indirect, incidental, special, consequential,
              or punitive damages, including but not limited to loss of profits,
              data, business opportunities, or goodwill, arising from your use
              of the Platform.
            </p>
            <p>
              Our total liability for any claim arising from these Terms or
              your use of the Platform shall not exceed the amount you paid us
              in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              11. Disclaimer of Warranties
            </h2>
            <p>
              The Platform is provided &quot;as is&quot; and &quot;as
              available&quot; without warranties of any kind, whether express
              or implied, including but not limited to warranties of
              merchantability, fitness for a particular purpose, and
              non-infringement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">12. Termination</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                You may close your account at any time by contacting support.
              </li>
              <li>
                We may suspend or terminate your account for violation of these
                Terms, with notice where practicable.
              </li>
              <li>
                Upon termination, your right to access the Platform ceases
                immediately. We will retain your data for 30 days to allow
                export, after which it will be deleted.
              </li>
              <li>
                Sections that by their nature should survive termination
                (intellectual property, limitation of liability, dispute
                resolution) will survive.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              13. Changes to These Terms
            </h2>
            <p>
              We may update these Terms from time to time. We will notify you
              of material changes by posting the updated Terms on this page
              and updating the effective date. Continued use of the Platform
              after changes take effect constitutes acceptance of the revised
              Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              14. Governing Law
            </h2>
            <p>
              These Terms are governed by and construed in accordance with the
              laws of the jurisdiction in which {companyName} is registered,
              without regard to conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">15. Contact Us</h2>
            <p>
              If you have questions about these Terms, contact us at:
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
            href="/privacy"
            className="hover:text-foreground transition-colors"
          >
            Privacy Policy
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
