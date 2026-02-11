"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, CheckCircle2, CircleX, Loader2, Globe } from "lucide-react";
import { checkDnsPropagation } from "@/lib/actions/dns";

interface DnsPropagationCheckerProps {
  domainId: string;
  domainName: string;
}

type PropagationResult = {
  type: string;
  name: string;
  expected: string;
  propagated: boolean;
};

export function DnsPropagationChecker({ domainId, domainName }: DnsPropagationCheckerProps) {
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState<PropagationResult[] | null>(null);
  const [allPropagated, setAllPropagated] = useState<boolean | null>(null);

  function handleCheck() {
    startTransition(async () => {
      const result = await checkDnsPropagation(domainId);
      if (result.success && result.data) {
        setResults(result.data.records);
        setAllPropagated(result.data.allPropagated);
      } else {
        setResults([]);
        setAllPropagated(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          <span>Check propagation status for <strong className="text-foreground">{domainName}</strong></span>
        </div>
        <Button onClick={handleCheck} disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          Check Propagation
        </Button>
      </div>

      {results !== null && (
        <div className="space-y-4">
          {/* Overall Status */}
          <div className="flex items-center gap-2">
            {allPropagated ? (
              <>
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Fully Propagated
                </Badge>
                <span className="text-sm text-muted-foreground">
                  All DNS records have propagated successfully
                </span>
              </>
            ) : allPropagated === false ? (
              <>
                <Badge variant="secondary">
                  <Loader2 className="h-3 w-3 mr-1" />
                  Propagating
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Some records are still propagating (may take up to 48 hours)
                </span>
              </>
            ) : null}
          </div>

          {/* Results Table */}
          {results.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-4 py-2 text-sm font-medium">Type</th>
                    <th className="text-left px-4 py-2 text-sm font-medium">Name</th>
                    <th className="text-left px-4 py-2 text-sm font-medium">Expected Value</th>
                    <th className="text-left px-4 py-2 text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2">
                        <Badge variant="secondary" className="font-mono">
                          {result.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-sm font-mono">
                        {result.name === '@' ? domainName : `${result.name}.${domainName}`}
                      </td>
                      <td className="px-4 py-2 font-mono text-sm text-muted-foreground truncate max-w-[200px]">
                        {result.expected}
                      </td>
                      <td className="px-4 py-2">
                        {result.propagated ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Propagated
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Loader2 className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-4 text-center">
              No DNS records found to check
            </div>
          )}
        </div>
      )}

      {results === null && (
        <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg bg-muted/30">
          Click &quot;Check Propagation&quot; to verify your DNS records have propagated globally
        </div>
      )}
    </div>
  );
}
