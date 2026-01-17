import { Metadata } from "next";
import AdminUsersPageClient from "./users-client";

export const metadata: Metadata = {
  title: "User Management | Admin | DRAMAC",
  description: "Manage all users across the platform",
};

export default function AdminUsersPage() {
  return <AdminUsersPageClient />;
}
