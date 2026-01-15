"use client";

import { useNode } from "@craftjs/core";
import { NavbarSettings } from "../settings/navbar-settings";
import { useState, useEffect, useRef } from "react";

interface NavLink {
  label: string;
  href: string;
}

interface NavbarProps {
  logo?: string;
  logoText?: string;
  links?: NavLink[];
  backgroundColor?: string;
  textColor?: string;
  sticky?: boolean;
}

const defaultLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
];

export function Navbar({
  logo = "",
  logoText = "Logo",
  links = defaultLinks,
  backgroundColor = "#ffffff",
  textColor = "#1f2937",
  sticky = false,
}: NavbarProps) {
  const { connectors: { connect, drag } } = useNode();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setIsMobile(width < 768);
      }
    };

    checkWidth();
    
    const resizeObserver = new ResizeObserver(checkWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <>
      <style>{`
        .navbar-container {
          background-color: ${backgroundColor};
          color: ${textColor};
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: ${sticky ? "sticky" : "relative"};
          top: 0;
          z-index: 50;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        }
        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .navbar-logo-text {
          font-size: clamp(1rem, 2.5vw, 1.25rem);
          font-weight: bold;
        }
        .navbar-links {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }
        .navbar-link {
          color: ${textColor};
          text-decoration: none;
          font-weight: 500;
          font-size: 0.875rem;
          transition: opacity 0.2s;
        }
        .navbar-link:hover {
          opacity: 0.7;
        }
        .navbar-mobile-toggle {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          align-items: center;
          justify-content: center;
        }
        .navbar-mobile-toggle span {
          display: block;
          width: 24px;
          height: 2px;
          background-color: ${textColor};
          transition: all 0.3s;
        }
        .navbar-mobile-menu {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          background-color: ${backgroundColor};
          border-top: 1px solid rgba(0,0,0,0.1);
        }
      `}</style>
      <div ref={(ref) => { 
        if (ref) {
          connect(drag(ref));
          containerRef.current = ref;
        }
      }}>
        <nav className="navbar-container">
          <div className="navbar-logo">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="Logo" style={{ height: "32px" }} />
            ) : (
              <span className="navbar-logo-text">{logoText}</span>
            )}
          </div>
          {!isMobile && (
            <div className="navbar-links">
              {links.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="navbar-link"
                  onClick={(e) => e.preventDefault()}
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
          {isMobile && (
            <button 
              className="navbar-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          )}
        </nav>
        {isMobile && mobileMenuOpen && (
          <div className="navbar-mobile-menu">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="navbar-link"
                onClick={(e) => e.preventDefault()}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

Navbar.craft = {
  displayName: "Navbar",
  props: {
    logo: "",
    logoText: "Logo",
    links: defaultLinks,
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    sticky: false,
  },
  related: {
    settings: NavbarSettings,
  },
};
