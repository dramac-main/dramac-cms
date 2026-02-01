import { Progress } from "@/components/ui/progress";

interface EmailStorageUsageProps {
  used: number; // bytes
  limit: number; // bytes
}

export function EmailStorageUsage({ used, limit }: EmailStorageUsageProps) {
  const usedGB = used / (1024 * 1024 * 1024);
  const limitGB = limit / (1024 * 1024 * 1024);
  const percentage = (used / limit) * 100;

  const getColorClass = () => {
    if (percentage >= 90) return "bg-destructive";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-primary";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{usedGB.toFixed(2)} GB used</span>
        <span className="text-muted-foreground">{limitGB.toFixed(0)} GB total</span>
      </div>
      <Progress 
        value={percentage} 
        className="h-2"
      />
      <p className="text-xs text-muted-foreground">
        {(100 - percentage).toFixed(1)}% storage remaining
      </p>
    </div>
  );
}
