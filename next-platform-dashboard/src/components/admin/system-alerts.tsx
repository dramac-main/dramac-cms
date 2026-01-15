import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSystemAlerts } from "@/lib/actions/admin";
import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const alertIcons = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const alertColors = {
  error: "text-red-600 bg-red-100",
  warning: "text-yellow-600 bg-yellow-100",
  info: "text-blue-600 bg-blue-100",
};

const badgeVariants = {
  error: "bg-red-100 text-red-800 hover:bg-red-100",
  warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  info: "bg-blue-100 text-blue-800 hover:bg-blue-100",
};

export async function SystemAlerts() {
  const alerts = await getSystemAlerts();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          System Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
            <p className="text-sm font-medium">All systems operational</p>
            <p className="text-xs text-muted-foreground">
              No alerts at this time
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => {
              const Icon = alertIcons[alert.type];
              const colorClasses = alertColors[alert.type];

              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      colorClasses
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", badgeVariants[alert.type])}
                      >
                        {alert.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {alert.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
