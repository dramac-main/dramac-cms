import { Metadata } from "next";
import AdminAgenciesPageClient from "./agencies-client";

export const metadata: Metadata = {
  title: "Agency Management | Admin | DRAMAC",
  description: "View and manage all agencies on the platform",
};

export default function AdminAgenciesPage() {
  return <AdminAgenciesPageClient />;
}
