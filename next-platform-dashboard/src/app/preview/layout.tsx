import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preview",
};

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        {children}
      </body>
    </html>
  );
}
