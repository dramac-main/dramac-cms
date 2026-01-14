import { cn } from "@/lib/utils";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface RenderFooterProps {
  logo?: string;
  logoText?: string;
  columns?: FooterColumn[];
  copyright?: string;
  backgroundColor?: string;
  className?: string;
}

export function RenderFooter({
  logo,
  logoText = "Logo",
  columns = [],
  copyright = `© ${new Date().getFullYear()} All rights reserved.`,
  backgroundColor = "#1f2937",
  className,
}: RenderFooterProps) {
  return (
    <footer
      className={cn("px-6 py-12 text-white", className)}
      style={{ backgroundColor }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid gap-8 md:grid-cols-4 mb-8">
          <div>
            {logo ? (
              <img src={logo} alt={logoText} className="h-8 mb-4" />
            ) : (
              <span className="text-xl font-bold">{logoText}</span>
            )}
          </div>

          {columns.map((column, index) => (
            <div key={index}>
              <h4 className="font-semibold mb-4">{column.title}</h4>
              <ul className="space-y-2">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-sm opacity-75 hover:opacity-100 transition-opacity"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/20 text-sm text-center opacity-75">
          {copyright}
        </div>
      </div>
    </footer>
  );
}
