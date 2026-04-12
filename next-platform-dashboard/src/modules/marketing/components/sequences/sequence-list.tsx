/**
 * Sequence List - Server Component
 *
 * Fetches sequence data and passes to client component.
 */
import { getSequences } from "../../actions/sequence-actions";
import { SequenceListClient } from "./sequence-list-client";

interface SequenceListProps {
  siteId: string;
  filters?: { status?: string; search?: string; page?: string };
}

export async function SequenceList({ siteId, filters }: SequenceListProps) {
  const page = parseInt(filters?.page || "1", 10);
  const limit = 12;
  const offset = (page - 1) * limit;

  const { sequences, total } = await getSequences(siteId, {
    status: filters?.status as any,
    search: filters?.search || undefined,
    limit,
    offset,
  });

  return (
    <SequenceListClient
      siteId={siteId}
      sequences={sequences}
      total={total}
      page={page}
      limit={limit}
    />
  );
}
