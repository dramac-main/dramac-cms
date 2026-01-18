import { redirect } from "next/navigation";

// Redirect to clients page with create dialog trigger
// The CreateClientDialog component will need to check for this query param
export default function NewClientPage() {
  redirect("/dashboard/clients?create=true");
}
