import { Metadata } from "next";
import AuditLogsClient from "./audit-client";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Audit Logs | Admin | ${PLATFORM.name}`,
  description: "View system audit logs and activity history",
};

export default function AuditLogsPage() {
  return <AuditLogsClient />;
}
