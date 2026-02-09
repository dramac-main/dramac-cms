import { Metadata } from "next";
import AdminUsersPageClient from "./users-client";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `User Management | Admin | ${PLATFORM.name}`,
  description: "Manage all users across the platform",
};

export default function AdminUsersPage() {
  return <AdminUsersPageClient />;
}
