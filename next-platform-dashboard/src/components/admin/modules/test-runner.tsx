"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Loader2,
  CircleCheck,
  CircleX,
  AlertTriangle,
  Code,
  Plug,
  Gauge,
  Accessibility,
  Shield,
  RefreshCw,
} from "lucide-react";
import { TestSiteSelector } from "./test-site-selector";
import { TestResultsViewer } from "./test-results-viewer";
import {
  runModuleTests,
  runAllTests,
  getTestTypes,
  type TestType,
  type TestRun,
  type TestTypeInfo,
} from "@/lib/modules/module-testing";

interface TestRunnerProps {
  moduleId: string;
  moduleName: string;
  onTestComplete?: (run: TestRun) => void;
}

const TEST_TYPE_ICONS: Record<TestType, React.ReactNode> = {
  unit: <Code className="h-4 w-4" />,
  integration: <Plug className="h-4 w-4" />,
  performance: <Gauge className="h-4 w-4" />,
  accessibility: <Accessibility className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
};

export function TestRunner({
  moduleId,
  onTestComplete,
}: TestRunnerProps) {
  const [testTypes, setTestTypes] = useState<TestTypeInfo[]>([]);
  const [selectedTestSite, setSelectedTestSite] = useState<string | undefined>();
  const [runningTests, setRunningTests] = useState<Set<TestType>>(new Set());
  const [testResults, setTestResults] = useState<Map<TestType, TestRun>>(
    new Map()
  );
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [activeTab, setActiveTab] = useState<TestType>("unit");

  // Fetch test types on mount
  useEffect(() => {
    getTestTypes().then(setTestTypes);
  }, []);

  const handleRunTest = async (testType: TestType) => {
    if (runningTests.has(testType)) return;

    // Check if integration tests need a test site
    if (testType === "integration" && !selectedTestSite) {
      return;
    }

    setRunningTests((prev) => new Set(prev).add(testType));

    try {
      const result = await runModuleTests(moduleId, testType, selectedTestSite);
      setTestResults((prev) => new Map(prev).set(testType, result));
      onTestComplete?.(result);
    } catch (error) {
      console.error(`Failed to run ${testType} tests:`, error);
    } finally {
      setRunningTests((prev) => {
        const next = new Set(prev);
        next.delete(testType);
        return next;
      });
    }
  };

  const handleRunAllTests = async () => {
    setIsRunningAll(true);
    setTestResults(new Map());

    try {
      const results = await runAllTests(moduleId, selectedTestSite);
      const newResults = new Map<TestType, TestRun>();
      results.forEach((run) => {
        newResults.set(run.testType, run);
        onTestComplete?.(run);
      });
      setTestResults(newResults);
    } catch (error) {
      console.error("Failed to run all tests:", error);
    } finally {
      setIsRunningAll(false);
    }
  };

  const getOverallStatus = (): "passed" | "failed" | "warning" | "none" => {
    if (testResults.size === 0) return "none";

    const statuses = Array.from(testResults.values()).map((r) => r.status);
    if (statuses.some((s) => s === "failed" || s === "error")) return "failed";
    if (
      testResults.size > 0 &&
      Array.from(testResults.values()).some(
        (r) => r.summary && r.summary.warnings > 0
      )
    )
      return "warning";
    if (statuses.every((s) => s === "passed")) return "passed";
    return "none";
  };

  const getOverallProgress = (): number => {
    const totalTests = testTypes.filter(
      (t) => !t.requiresSite || selectedTestSite
    ).length;
    if (totalTests === 0) return 0;
    return Math.round((testResults.size / totalTests) * 100);
  };

  const overallStatus = getOverallStatus();
  const overallProgress = getOverallProgress();

  return (
    <div className="space-y-6">
      {/* Test Site Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test Configuration</CardTitle>
          <CardDescription>
            Select a test site for integration testing (optional for other test
            types)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Test Site (required for integration tests)
              </label>
              <TestSiteSelector
                value={selectedTestSite}
                onChange={setSelectedTestSite}
                showOnlyTestSites={true}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleRunAllTests}
                disabled={isRunningAll || runningTests.size > 0}
                className="w-full"
              >
                {isRunningAll ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running All Tests...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run All Tests
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Overall Progress */}
          {testResults.size > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <div className="flex items-center gap-2">
                  {overallStatus === "passed" && (
                    <CircleCheck className="h-4 w-4 text-green-500" />
                  )}
                  {overallStatus === "failed" && (
                    <CircleX className="h-4 w-4 text-red-500" />
                  )}
                  {overallStatus === "warning" && (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {testResults.size} of{" "}
                    {testTypes.filter((t) => !t.requiresSite || selectedTestSite).length}{" "}
                    test suites complete
                  </span>
                </div>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Type Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TestType)}>
        <TabsList className="grid grid-cols-5 w-full">
          {testTypes.map((test) => (
            <TabsTrigger
              key={test.type}
              value={test.type}
              className="flex items-center gap-2"
              disabled={test.requiresSite && !selectedTestSite}
            >
              {TEST_TYPE_ICONS[test.type]}
              <span className="hidden sm:inline">{test.name.replace(" Tests", "")}</span>
              {testResults.has(test.type) && (
                <Badge
                  variant={
                    testResults.get(test.type)?.status === "passed"
                      ? "default"
                      : testResults.get(test.type)?.status === "failed"
                        ? "destructive"
                        : "secondary"
                  }
                  className="h-5 w-5 p-0 flex items-center justify-center ml-1"
                >
                  {testResults.get(test.type)?.status === "passed" ? (
                    <CircleCheck className="h-3 w-3" />
                  ) : testResults.get(test.type)?.status === "failed" ? (
                    <CircleX className="h-3 w-3" />
                  ) : (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {testTypes.map((test) => (
          <TabsContent key={test.type} value={test.type} className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {TEST_TYPE_ICONS[test.type]}
                    {test.name}
                  </CardTitle>
                  <CardDescription>{test.description}</CardDescription>
                </div>
                <Button
                  onClick={() => handleRunTest(test.type)}
                  disabled={
                    runningTests.has(test.type) ||
                    isRunningAll ||
                    (test.requiresSite && !selectedTestSite)
                  }
                  variant={testResults.has(test.type) ? "outline" : "default"}
                >
                  {runningTests.has(test.type) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : testResults.has(test.type) ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Re-run
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Tests
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {test.requiresSite && !selectedTestSite ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plug className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Test site required</p>
                    <p className="text-sm mt-1">
                      Select a test site above to run integration tests
                    </p>
                  </div>
                ) : testResults.has(test.type) ? (
                  <TestResultsViewer testRun={testResults.get(test.type)!} />
                ) : runningTests.has(test.type) ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">Running {test.name.toLowerCase()}...</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="h-12 w-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-muted">
                      {TEST_TYPE_ICONS[test.type]}
                    </div>
                    <p>Click &quot;Run Tests&quot; to start</p>
                    <p className="text-sm mt-1">{test.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
