// Dev-only test page — prevent static generation
export const dynamic = 'force-dynamic';

export default function TestSafetyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
