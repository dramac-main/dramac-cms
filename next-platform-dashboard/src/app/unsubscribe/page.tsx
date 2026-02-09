import { Suspense } from "react";
import { UnsubscribeForm } from "./unsubscribe-form";

export const metadata = {
  title: "Email Preferences",
  description: "Manage your email notification preferences",
};

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Suspense fallback={
        <div className="w-full max-w-md text-center p-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }>
        <UnsubscribeForm />
      </Suspense>
    </div>
  );
}
