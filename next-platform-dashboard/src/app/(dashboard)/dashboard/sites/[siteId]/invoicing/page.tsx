import { redirect } from "next/navigation";

interface InvoicingRootPageProps {
  params: Promise<{ siteId: string }>;
}

export default async function InvoicingRootPage({
  params,
}: InvoicingRootPageProps) {
  const { siteId } = await params;
  redirect(`/dashboard/sites/${siteId}/invoicing/invoices`);
}
