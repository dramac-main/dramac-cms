import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserX } from "lucide-react";

export default function ClientNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
        <UserX className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold">Client Not Found</h2>
      <p className="text-muted-foreground mt-2 mb-6">
        The client you're looking for doesn't exist or has been deleted.
      </p>
      <Link href="/dashboard/clients">
        <Button>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
      </Link>
    </div>
  );
}
