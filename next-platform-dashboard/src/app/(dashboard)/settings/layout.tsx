import { Metadata } from "next";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";

export const metadata: Metadata = {
  title: "Settings | DRAMAC",
  description: "Manage your account and agency settings",
};

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6">
      <aside className="w-full lg:w-64 shrink-0">
        <SettingsSidebar />
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
