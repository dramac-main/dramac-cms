import { Metadata } from "next";
import { ModuleRequestForm } from "@/components/modules/agency/module-request-form";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Request Module | ${PLATFORM.name}`,
  description: "Request a custom module to be built",
};

export default function NewModuleRequestPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Request a Module</h1>
        <p className="text-muted-foreground mt-1">
          Don&apos;t see a module you need? Request it and our team will review.
        </p>
      </div>

      <ModuleRequestForm />
    </div>
  );
}
