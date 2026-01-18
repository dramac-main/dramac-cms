import { redirect } from "next/navigation";

export default function NewSitePage() {
  redirect("/dashboard/sites/new");
}
