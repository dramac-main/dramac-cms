/**
 * DRAMAC Studio Layout
 * 
 * Full-screen layout for the editor - no dashboard sidebar/header.
 * Uses the studio-specific styles and providers.
 */

import "@/styles/studio.css";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata = {
  title: `${PLATFORM.name} Studio`,
  description: "Visual website editor",
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="studio-root">
      {children}
    </div>
  );
}
