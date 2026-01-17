import Link from "next/link";
import { Package, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyAppsStateProps {
  title?: string;
  description?: string;
  showBrowseButton?: boolean;
  showHelpButton?: boolean;
}

export function EmptyAppsState({
  title = "No Apps Yet",
  description = "Your agency can set up powerful tools and applications for your business. Browse available apps to get started!",
  showBrowseButton = true,
  showHelpButton = true,
}: EmptyAppsStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
          <Package className="h-10 w-10 text-primary" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          {description}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          {showBrowseButton && (
            <Button asChild>
              <Link href="/portal/apps/browse">
                <Sparkles className="h-4 w-4 mr-2" />
                Browse Available Apps
              </Link>
            </Button>
          )}
          {showHelpButton && (
            <Button variant="outline" asChild>
              <Link href="/portal/support">
                Learn More
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
