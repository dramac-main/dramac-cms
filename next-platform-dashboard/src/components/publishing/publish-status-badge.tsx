import { Badge } from "@/components/ui/badge";
import { Globe, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface PublishStatusBadgeProps {
  isPublished: boolean;
  className?: string;
}

export function PublishStatusBadge({ isPublished, className }: PublishStatusBadgeProps) {
  return (
    <Badge
      variant={isPublished ? "default" : "secondary"}
      className={cn(
        isPublished 
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
        className
      )}
    >
      {isPublished ? (
        <>
          <Globe className="h-3 w-3 mr-1" />
          Published
        </>
      ) : (
        <>
          <FileText className="h-3 w-3 mr-1" />
          Draft
        </>
      )}
    </Badge>
  );
}
