export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Editor has its own layout without the dashboard sidebar
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
