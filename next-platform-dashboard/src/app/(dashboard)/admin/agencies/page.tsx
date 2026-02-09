import { Metadata } from "next";
import AdminAgenciesPageClient from "./agencies-client";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Agency Management | Admin | ${PLATFORM.name}`,
  description: "View and manage all agencies on the platform",
};

export default function AdminAgenciesPage() {
  return <AdminAgenciesPageClient />;
}
