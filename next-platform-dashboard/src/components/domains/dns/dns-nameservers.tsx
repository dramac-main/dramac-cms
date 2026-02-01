"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DnsNameserversProps {
  current: string[];
  expected: string[];
  configured: boolean;
}

export function DnsNameservers({ current, expected, configured }: DnsNameserversProps) {
  const copyNameservers = () => {
    navigator.clipboard.writeText(expected.join('\n'));
    toast.success('Nameservers copied to clipboard');
  };

  if (!expected.length && !current.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            Nameservers
            {configured ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Configured
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Not Configured
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {configured 
              ? "Your nameservers are correctly pointing to Cloudflare"
              : "Update your nameservers at your domain registrar"
            }
          </CardDescription>
        </div>
        {expected.length > 0 && (
          <Button variant="outline" size="sm" onClick={copyNameservers}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {expected.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Required Nameservers</h4>
              <div className="space-y-1">
                {expected.map((ns, i) => (
                  <div key={i} className="font-mono text-sm bg-muted px-3 py-1.5 rounded">
                    {ns}
                  </div>
                ))}
              </div>
            </div>
          )}
          {current.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Current Nameservers</h4>
              <div className="space-y-1">
                {current.map((ns, i) => (
                  <div 
                    key={i} 
                    className={`font-mono text-sm px-3 py-1.5 rounded flex items-center justify-between ${
                      expected.includes(ns) 
                        ? "bg-green-50 dark:bg-green-950" 
                        : "bg-red-50 dark:bg-red-950"
                    }`}
                  >
                    <span>{ns}</span>
                    {expected.includes(ns) 
                      ? <CheckCircle2 className="h-3 w-3 text-green-600" />
                      : <XCircle className="h-3 w-3 text-red-600" />
                    }
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
