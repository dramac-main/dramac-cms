"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CircleCheck,
  CircleX,
  AlertTriangle,
  Clock,
  MinusCircle,
  Info,
} from "lucide-react";
import type { TestRun, TestResult, ResultStatus } from "@/lib/modules/module-testing";

interface TestResultsViewerProps {
  testRun: TestRun;
  showDetails?: boolean;
}

function getStatusIcon(status: ResultStatus, size: "sm" | "md" = "sm") {
  const sizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  switch (status) {
    case "passed":
      return <CircleCheck className={`${sizeClass} text-green-500`} />;
    case "failed":
      return <CircleX className={`${sizeClass} text-red-500`} />;
    case "warning":
      return <AlertTriangle className={`${sizeClass} text-yellow-500`} />;
    case "skipped":
      return <MinusCircle className={`${sizeClass} text-muted-foreground`} />;
    default:
      return <Clock className={`${sizeClass} text-muted-foreground`} />;
  }
}

function getStatusBadge(status: ResultStatus) {
  const variants: Record<
    ResultStatus,
    "default" | "destructive" | "secondary" | "outline"
  > = {
    passed: "default",
    failed: "destructive",
    warning: "secondary",
    skipped: "outline",
  };

  const colors: Record<ResultStatus, string> = {
    passed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    skipped: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  };

  return (
    <Badge variant={variants[status]} className={`capitalize ${colors[status]}`}>
      {status}
    </Badge>
  );
}

export function TestResultsViewer({
  testRun,
  showDetails = true,
}: TestResultsViewerProps) {
  // Group results by category
  const groupedResults = useMemo(() => {
    const groups = new Map<string, TestResult[]>();

    for (const result of testRun.results) {
      const category = result.category || "general";
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(result);
    }

    return groups;
  }, [testRun.results]);

  const { summary } = testRun;

  return (
    <div className="space-y-6">
      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{summary.total}</p>
                <p className="text-xs text-muted-foreground">Total Tests</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{summary.passed}</p>
                <p className="text-xs text-muted-foreground">Passed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{summary.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-500">
                  {summary.warnings}
                </p>
                <p className="text-xs text-muted-foreground">Warnings</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{summary.duration}ms</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results by Category */}
      <Accordion
        type="multiple"
        defaultValue={Array.from(groupedResults.keys())}
        className="space-y-2"
      >
        {Array.from(groupedResults.entries()).map(([category, results]) => {
          const categoryPassed = results.filter((r) => r.status === "passed").length;
          const categoryFailed = results.filter((r) => r.status === "failed").length;
          const categoryWarnings = results.filter((r) => r.status === "warning").length;

          return (
            <AccordionItem
              key={category}
              value={category}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4 w-full">
                  <span className="font-medium capitalize">{category}</span>
                  <div className="flex items-center gap-2 ml-auto mr-4">
                    {categoryPassed > 0 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {categoryPassed} passed
                      </Badge>
                    )}
                    {categoryFailed > 0 && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {categoryFailed} failed
                      </Badge>
                    )}
                    {categoryWarnings > 0 && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        {categoryWarnings} warnings
                      </Badge>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Status</TableHead>
                      <TableHead>Test</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead className="w-20 text-right">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>{getStatusIcon(result.status)}</TableCell>
                        <TableCell className="font-medium">
                          {result.testName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-start gap-2">
                            <span>{result.message}</span>
                            {showDetails &&
                              result.details &&
                              Object.keys(result.details).length > 0 && (
                                <button
                                  className="text-primary hover:underline text-xs"
                                  onClick={() => {
                                    console.log("Test details:", result.details);
                                    alert(
                                      `Details:\n${JSON.stringify(result.details, null, 2)}`
                                    );
                                  }}
                                >
                                  <Info className="h-3 w-3" />
                                </button>
                              )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {result.durationMs !== undefined
                            ? `${result.durationMs}ms`
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* No Results */}
      {testRun.results.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No test results available</p>
        </div>
      )}
    </div>
  );
}

interface TestResultsSummaryProps {
  testRun: TestRun;
}

/**
 * Compact summary view for test results
 */
export function TestResultsSummary({ testRun }: TestResultsSummaryProps) {
  const { summary, status } = testRun;

  if (!summary) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>No results</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {getStatusIcon(status === "passed" ? "passed" : status === "failed" ? "failed" : "warning", "md")}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-green-600">{summary.passed} passed</span>
        {summary.failed > 0 && (
          <span className="text-red-600">{summary.failed} failed</span>
        )}
        {summary.warnings > 0 && (
          <span className="text-yellow-600">{summary.warnings} warnings</span>
        )}
        <span className="text-muted-foreground">({summary.duration}ms)</span>
      </div>
    </div>
  );
}

interface TestResultsCompactProps {
  results: TestResult[];
}

/**
 * Very compact list of results
 */
export function TestResultsCompact({ results }: TestResultsCompactProps) {
  return (
    <div className="space-y-1">
      {results.map((result) => (
        <div
          key={result.id}
          className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-muted/50"
        >
          {getStatusIcon(result.status)}
          <span className={result.status === "failed" ? "text-red-600" : ""}>
            {result.testName}
          </span>
        </div>
      ))}
    </div>
  );
}
