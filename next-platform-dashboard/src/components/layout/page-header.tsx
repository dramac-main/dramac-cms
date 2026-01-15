import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  backHref?: string;
}

export function PageHeader({
  title,
  description,
  children,
  className,
  backHref,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 pb-6 md:flex-row md:items-center md:justify-between", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          {backHref && (
            <Link href={backHref}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
            </Link>
          )}
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        </div>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
