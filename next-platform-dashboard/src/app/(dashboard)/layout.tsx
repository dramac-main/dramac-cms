export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar will be added in Phase 9 */}
      <aside className="w-64 border-r bg-card">
        <div className="p-4 font-bold">DRAMAC</div>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
