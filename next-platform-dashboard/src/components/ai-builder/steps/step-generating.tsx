import { Sparkles, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface StepGeneratingProps {
  progress: number;
  status: string;
}

export function StepGenerating({ progress, status }: StepGeneratingProps) {
  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        {progress >= 100 ? (
          <Sparkles className="w-10 h-10 text-primary animate-pulse" />
        ) : (
          <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
        )}
      </div>

      <h2 className="text-2xl font-semibold mb-2">
        {progress >= 100 ? "Website Generated!" : "Creating Your Website"}
      </h2>
      
      <p className="text-muted-foreground mb-8">{status}</p>

      <div className="max-w-md mx-auto">
        <Progress value={progress} className="h-2 mb-2" />
        <p className="text-sm text-muted-foreground">{Math.round(progress)}%</p>
      </div>

      {progress < 100 && (
        <p className="text-sm text-muted-foreground mt-8">
          This usually takes 30-60 seconds. Please don&apos;t close this page.
        </p>
      )}
    </div>
  );
}
