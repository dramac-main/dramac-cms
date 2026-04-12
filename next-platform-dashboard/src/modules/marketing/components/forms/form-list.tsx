/**
 * Form List - Server Component
 * Phase MKT-06: Landing Pages & Opt-In Forms
 */
import { getForms } from "../../actions/form-actions";
import { FormListClient } from "./form-list-client";

interface FormListProps {
  siteId: string;
  filters: {
    formType?: string;
    status?: string;
    search?: string;
    page?: string;
  };
}

export async function FormList({ siteId, filters }: FormListProps) {
  const page = parseInt(filters.page || "1", 10);
  const pageSize = 20;

  const { forms, total } = await getForms(siteId, {
    formType: filters.formType || undefined,
    status: filters.status || undefined,
    search: filters.search || undefined,
    page,
    pageSize,
  });

  return (
    <FormListClient
      siteId={siteId}
      forms={forms}
      total={total}
      currentPage={page}
      pageSize={pageSize}
      currentFormType={filters.formType}
      currentStatus={filters.status}
      currentSearch={filters.search}
    />
  );
}
