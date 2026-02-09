"use client";

import { useNode } from "@craftjs/core";
import { FooterSettings } from "../settings/footer-settings";
import { useIsEditorEnabled } from "../hooks/use-editor-mode";

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface SocialLink {
  platform: string;
  href: string;
}

export interface FooterProps {
  logoText?: string;
  tagline?: string;
  columns?: FooterColumn[];
  socialLinks?: SocialLink[];
  copyright?: string;
  backgroundColor?: string;
  textColor?: string;
}

const defaultColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Integrations", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
];

const defaultSocials: SocialLink[] = [
  { platform: "twitter", href: "#" },
  { platform: "facebook", href: "#" },
  { platform: "linkedin", href: "#" },
];

export function Footer({
  logoText = "Your Brand",
  tagline = "Build beautiful websites with ease",
  columns = defaultColumns,
  socialLinks = defaultSocials,
  copyright = `© ${new Date().getFullYear()} Your Company. All rights reserved.`,
  backgroundColor = "#1a1a2e",
  textColor = "#ffffff",
}: FooterProps) {
  const {
    connectors: { connect, drag },
  } = useNode();
  const isEditorEnabled = useIsEditorEnabled();

  return (
    <footer
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
      className="px-8 py-12"
      style={{ backgroundColor, color: textColor }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Top Section */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <h4 className="text-xl font-bold mb-2">{logoText}</h4>
            <p className="opacity-70 mb-4">{tagline}</p>
            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  onClick={isEditorEnabled ? (e) => e.preventDefault() : undefined}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="text-xs uppercase">{social.platform[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {columns.map((column, index) => (
            <div key={index}>
              <h5 className="font-semibold mb-4">{column.title}</h5>
              <ul className="space-y-2">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      onClick={isEditorEnabled ? (e) => e.preventDefault() : undefined}
                      className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-white/10 text-center text-sm opacity-70">
          {copyright}
        </div>
      </div>
    </footer>
  );
}

Footer.craft = {
  displayName: "Footer",
  props: {
    logoText: "Your Brand",
    tagline: "Build beautiful websites with ease",
    columns: defaultColumns,
    socialLinks: defaultSocials,
    copyright: `© ${new Date().getFullYear()} Your Company. All rights reserved.`,
    backgroundColor: "#1a1a2e",
    textColor: "#ffffff",
  },
  related: {
    settings: FooterSettings,
  },
  rules: {
    canDrag: () => true,
  },
};
