/**
 * Agent Test Panel
 * 
 * Phase EM-58B: Test agent before deployment
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, CircleCheck, CircleX, Clock, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { AgentConfig } from '@/lib/ai-agents/types';
import { TestResult } from './AgentBuilder';

interface AgentTestPanelProps {
  agent: Partial<AgentConfig>;
  isLoading: boolean;
  results: TestResult | null;
  onTest: (scenario?: string) => Promise<void>;
}

const TEST_SCENARIOS = [
  { id: 'default', name: 'Default Trigger', description: 'Test with a typical trigger' },
  { id: 'edge_case', name: 'Edge Case', description: 'Test with unusual input' },
  { id: 'error', name: 'Error Handling', description: 'Test error recovery' },
];

export function AgentTestPanel({ 
  agent, 
  isLoading, 
  results, 
  onTest 
}: AgentTestPanelProps) {
  const [customScenario, setCustomScenario] = useState('');
  const [selectedScenario, setSelectedScenario] = useState('default');
  const [showDetails, setShowDetails] = useState(false);

  const canTest = Boolean(agent.name && agent.systemPrompt);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5" />
          Test Agent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scenario Selection */}
        <div className="flex flex-wrap gap-2">
          {TEST_SCENARIOS.map((scenario) => (
            <Button
              key={scenario.id}
              size="sm"
              variant={selectedScenario === scenario.id ? 'default' : 'outline'}
              onClick={() => setSelectedScenario(scenario.id)}
            >
              {scenario.name}
            </Button>
          ))}
        </div>

        {/* Custom Input */}
        <div>
          <Textarea
            value={customScenario}
            onChange={(e) => setCustomScenario(e.target.value)}
            placeholder="Or describe a custom scenario to test..."
            rows={2}
            className="text-sm"
          />
        </div>

        {/* Run Test */}
        <Button
          onClick={() => onTest(customScenario || selectedScenario)}
          disabled={isLoading || !canTest}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Test...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Test
            </>
          )}
        </Button>

        {!canTest && (
          <p className="text-xs text-muted-foreground text-center">
            Add a name and system prompt to enable testing
          </p>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-3 border-t pt-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              {results.success ? (
                <CircleCheck className="h-5 w-5 text-green-500" />
              ) : (
                <CircleX className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {results.success ? 'Test Passed' : 'Test Failed'}
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-muted/50 rounded p-2 text-center">
                <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <div className="font-medium">{results.durationMs}ms</div>
                <div className="text-xs text-muted-foreground">Duration</div>
              </div>
              <div className="bg-muted/50 rounded p-2 text-center">
                <div className="font-medium">{results.steps}</div>
                <div className="text-xs text-muted-foreground">Steps</div>
              </div>
              <div className="bg-muted/50 rounded p-2 text-center">
                <div className="font-medium">{results.tokensUsed}</div>
                <div className="text-xs text-muted-foreground">Tokens</div>
              </div>
            </div>

            {/* Toggle Details */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show Details
                </>
              )}
            </Button>

            {showDetails && (
              <>
                {/* Actions Taken */}
                {results.actions?.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Actions Taken:</div>
                    <div className="space-y-1">
                      {results.actions.map((action, i) => (
                        <div
                          key={i}
                          className="text-sm bg-muted/30 rounded px-2 py-1 flex items-center gap-2"
                        >
                          <Badge variant="outline" className="text-xs">
                            {action.tool}
                          </Badge>
                          <span className="text-muted-foreground truncate text-xs">
                            {JSON.stringify(action.input).slice(0, 40)}...
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Response */}
                {results.response && (
                  <div>
                    <div className="text-sm font-medium mb-2">Response:</div>
                    <div className="text-sm bg-muted/30 rounded p-2 max-h-32 overflow-auto">
                      {results.response}
                    </div>
                  </div>
                )}

                {/* Error */}
                {results.error && (
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded p-2">
                    {results.error}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
