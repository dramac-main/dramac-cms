import { Metadata } from "next";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { cn } from "@/lib/utils";
import { LAYOUT } from "@/config/layout";

export const metadata: Metadata = {
  title: "Settings | DRAMAC",
  description: "Manage your account and agency settings",
};

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Settings Sidebar - uses unified component with settings variant */}
      <SettingsSidebar />
      
      {/* Main Content Area with responsive padding */}
      <main className={cn(
        "flex-1 overflow-y-auto",
        LAYOUT.PAGE_PADDING // Responsive: p-4 lg:p-6
      )}>
        {children}
      </main>
    </div>
  );
}
