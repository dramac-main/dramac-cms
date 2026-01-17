import { Metadata } from "next";
import AuditLogsClient from "./audit-client";

export const metadata: Metadata = {
  title: "Audit Logs | Admin | DRAMAC",
  description: "View system audit logs and activity history",
};

export default function AuditLogsPage() {
  return <AuditLogsClient />;
}
