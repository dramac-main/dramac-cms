/**
 * Agent Test Runner Component
 * 
 * Phase EM-58B: UI for running and viewing agent tests
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Zap
} from 'lucide-react';
import type { AgentConfig } from '@/lib/ai-agents/types';
import { 
  AgentTester, 
  TestScenario, 
  TestResult, 
  TestReport,
  generateStandardScenarios 
} from '@/lib/ai-agents/testing/test-utils';

interface AgentTestRunnerProps {
  agent: AgentConfig;
  onTestComplete?: (report: TestReport) => void;
}

export function AgentTestRunner({ agent, onTestComplete }: AgentTestRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentScenario, setCurrentScenario] = useState<string | null>(null);
  const [report, setReport] = useState<TestReport | null>(null);
  const [validationResults, setValidationResults] = useState<Array<{
    name: string;
    passed: boolean;
    expected: unknown;
    actual: unknown;
  }> | null>(null);

  const scenarios = generateStandardScenarios(agent.agentType);

  const runTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setReport(null);

    const tester = new AgentTester(agent);
    const results: TestResult[] = [];
    const startTime = Date.now();

    for (let i = 0; i < scenarios.length; i++) {
      setCurrentScenario(scenarios[i].name);
      const result = await tester.runScenario(scenarios[i]);
      results.push(result);
      setProgress(((i + 1) / scenarios.length) * 100);
    }

    const testReport: TestReport = {
      agentId: agent.id,
      agentName: agent.name,
      totalScenarios: scenarios.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      duration: Date.now() - startTime,
      results,
      createdAt: new Date(),
    };

    setReport(testReport);
    setCurrentScenario(null);
    setIsRunning(false);
    onTestComplete?.(testReport);
  };

  const runValidation = () => {
    const tester = new AgentTester(agent);
    const results = tester.validateConfig();
    setValidationResults(results);
  };

  const getStatusIcon = (passed: boolean) => {
    return passed 
      ? <CheckCircle className="h-4 w-4 text-green-500" />
      : <XCircle className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Test Runner</CardTitle>
              <CardDescription>
                Run tests to validate agent behavior before deployment
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={runValidation}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Validate Config
              </Button>
              <Button onClick={runTests} disabled={isRunning}>
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Running...
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
        </CardHeader>
        
        {isRunning && (
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Running: {currentScenario}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Validation Results */}
      {validationResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Configuration Validation
              <Badge variant={validationResults.every(r => r.passed) ? 'default' : 'destructive'}>
                {validationResults.filter(r => r.passed).length}/{validationResults.length} Passed
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Status</TableHead>
                  <TableHead>Check</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Actual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {validationResults.map((result, i) => (
                  <TableRow key={i}>
                    <TableCell>{getStatusIcon(result.passed)}</TableCell>
                    <TableCell className="font-medium">{result.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {String(result.expected)}
                    </TableCell>
                    <TableCell className={result.passed ? '' : 'text-red-500'}>
                      {String(result.actual)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Test Report */}
      {report && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Test Results</CardTitle>
              <div className="flex items-center gap-4">
                <Badge variant={report.failed === 0 ? 'default' : 'destructive'}>
                  {report.passed}/{report.totalScenarios} Passed
                </Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {(report.duration / 1000).toFixed(1)}s
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary */}
            <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {report.passed}
                </div>
                <p className="text-xs text-muted-foreground">Passed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">
                  {report.failed}
                </div>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.round((report.passed / report.totalScenarios) * 100)}%
                </div>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {report.results.reduce((sum, r) => sum + r.tokensUsed, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Tokens Used</p>
              </div>
            </div>

            {/* Detailed Results */}
            <Accordion type="multiple" className="w-full">
              {report.results.map((result) => (
                <AccordionItem key={result.scenarioId} value={result.scenarioId}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.passed)}
                      <span className="font-medium">{result.scenarioName}</span>
                      <span className="text-sm text-muted-foreground">
                        {result.duration}ms
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {/* Metrics */}
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{result.duration}ms</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                          <span>{result.tokensUsed} tokens</span>
                        </div>
                      </div>

                      {/* Tools Used */}
                      {result.toolsUsed.length > 0 && (
                        <div>
                          <span className="text-sm font-medium">Tools Used:</span>
                          <div className="flex gap-2 mt-1">
                            {result.toolsUsed.map((tool) => (
                              <Badge key={tool} variant="secondary">
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assertions */}
                      <div>
                        <span className="text-sm font-medium">Assertions:</span>
                        <Table className="mt-2">
                          <TableBody>
                            {result.assertions.map((assertion, i) => (
                              <TableRow key={i}>
                                <TableCell className="w-8 py-2">
                                  {getStatusIcon(assertion.passed)}
                                </TableCell>
                                <TableCell className="py-2 font-medium">
                                  {assertion.name}
                                </TableCell>
                                <TableCell className="py-2 text-muted-foreground">
                                  {JSON.stringify(assertion.expected)}
                                </TableCell>
                                <TableCell className={`py-2 ${assertion.passed ? '' : 'text-red-500'}`}>
                                  {JSON.stringify(assertion.actual)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Error */}
                      {result.error && (
                        <div className="p-3 bg-red-500/10 rounded-lg text-red-600 text-sm">
                          <span className="font-medium">Error: </span>
                          {result.error}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Test Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle>Available Test Scenarios</CardTitle>
          <CardDescription>
              {scenarios.length} scenarios configured for {agent.agentType} agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scenarios.map((scenario) => (
              <div 
                key={scenario.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div>
                  <h4 className="font-medium">{scenario.name}</h4>
                  <p className="text-sm text-muted-foreground">{scenario.description}</p>
                </div>
                <Badge variant="outline">
                  {scenario.trigger.type || 'event'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
