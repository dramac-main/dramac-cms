"use client"

/**
 * Builder Test Console Component
 * 
 * PHASE-UI-13B: AI Agent Builder UI Enhancement
 * Interactive test execution with live output
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Play,
  Square,
  RotateCcw,
  Send,
  Loader2,
  Terminal,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Trash2,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// =============================================================================
// TYPES
// =============================================================================

export type TestStatus = 'idle' | 'running' | 'success' | 'error' | 'timeout'

export interface TestInput {
  type: 'text' | 'json' | 'variables'
  value: string
  variables?: Record<string, string>
}

export interface TestOutput {
  timestamp: Date
  status: TestStatus
  duration?: number
  tokensUsed?: number
  response?: string
  error?: string
  logs?: LogEntry[]
  toolCalls?: ToolCall[]
}

export interface LogEntry {
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
}

export interface ToolCall {
  name: string
  input: unknown
  output: unknown
  duration: number
}

export interface BuilderTestConsoleProps {
  onRun: (input: TestInput) => Promise<TestOutput>
  defaultInput?: string
  variables?: Record<string, string>
  className?: string
}

// =============================================================================
// STATUS CONFIG
// =============================================================================

const statusConfig: Record<TestStatus, {
  icon: React.ComponentType<{ className?: string }>
  label: string
  color: string
}> = {
  idle: {
    icon: Terminal,
    label: "Ready",
    color: "text-muted-foreground",
  },
  running: {
    icon: Loader2,
    label: "Running...",
    color: "text-blue-500",
  },
  success: {
    icon: CheckCircle2,
    label: "Success",
    color: "text-green-500",
  },
  error: {
    icon: XCircle,
    label: "Error",
    color: "text-red-500",
  },
  timeout: {
    icon: AlertCircle,
    label: "Timeout",
    color: "text-yellow-500",
  },
}

// =============================================================================
// LOG ENTRY COMPONENT
// =============================================================================

interface LogEntryRowProps {
  entry: LogEntry
}

function LogEntryRow({ entry }: LogEntryRowProps) {
  const levelColors = {
    info: "text-blue-500",
    warn: "text-yellow-500",
    error: "text-red-500",
    debug: "text-muted-foreground",
  }

  return (
    <div className="flex items-start gap-2 text-xs font-mono">
      <span className="text-muted-foreground shrink-0">
        {entry.timestamp.toLocaleTimeString()}
      </span>
      <span className={cn("shrink-0 uppercase", levelColors[entry.level])}>
        [{entry.level}]
      </span>
      <span className="text-foreground break-all">{entry.message}</span>
    </div>
  )
}

// =============================================================================
// TOOL CALL COMPONENT
// =============================================================================

interface ToolCallRowProps {
  call: ToolCall
}

function ToolCallRow({ call }: ToolCallRowProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 text-sm">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-medium">{call.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {call.duration}ms
            </Badge>
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-2 space-y-2 text-xs">
          <div>
            <span className="text-muted-foreground">Input:</span>
            <pre className="mt-1 p-2 bg-muted rounded-md overflow-auto">
              {JSON.stringify(call.input, null, 2)}
            </pre>
          </div>
          <div>
            <span className="text-muted-foreground">Output:</span>
            <pre className="mt-1 p-2 bg-muted rounded-md overflow-auto">
              {JSON.stringify(call.output, null, 2)}
            </pre>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// =============================================================================
// TEST HISTORY
// =============================================================================

interface TestHistoryProps {
  outputs: TestOutput[]
  onSelect: (output: TestOutput) => void
  onClear: () => void
}

function TestHistory({ outputs, onSelect, onClear }: TestHistoryProps) {
  if (outputs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Terminal className="h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">No test runs yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">History ({outputs.length})</span>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <Trash2 className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>
      <ScrollArea className="h-[200px]">
        <div className="space-y-2">
          {outputs.map((output, i) => {
            const config = statusConfig[output.status]
            const Icon = config.icon

            return (
              <motion.button
                key={i}
                className="w-full flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 text-left"
                onClick={() => onSelect(output)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", config.color)} />
                  <span className="text-sm">{config.label}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {output.duration && (
                    <span>{output.duration}ms</span>
                  )}
                  <span>{output.timestamp.toLocaleTimeString()}</span>
                </div>
              </motion.button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BuilderTestConsole({
  onRun,
  defaultInput = "",
  variables = {},
  className,
}: BuilderTestConsoleProps) {
  const [inputType, setInputType] = React.useState<'text' | 'json' | 'variables'>('text')
  const [inputValue, setInputValue] = React.useState(defaultInput)
  const [inputVariables, setInputVariables] = React.useState<Record<string, string>>(variables)
  const [status, setStatus] = React.useState<TestStatus>('idle')
  const [currentOutput, setCurrentOutput] = React.useState<TestOutput | null>(null)
  const [history, setHistory] = React.useState<TestOutput[]>([])
  const abortRef = React.useRef<AbortController | null>(null)

  const handleRun = async () => {
    if (status === 'running') return

    setStatus('running')
    abortRef.current = new AbortController()

    try {
      const input: TestInput = {
        type: inputType,
        value: inputValue,
        variables: inputType === 'variables' ? inputVariables : undefined,
      }

      const output = await onRun(input)
      setCurrentOutput(output)
      setHistory(prev => [output, ...prev].slice(0, 10)) // Keep last 10
      setStatus(output.status)
    } catch (error) {
      const output: TestOutput = {
        timestamp: new Date(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
      setCurrentOutput(output)
      setHistory(prev => [output, ...prev].slice(0, 10))
      setStatus('error')
    }
  }

  const handleStop = () => {
    abortRef.current?.abort()
    setStatus('idle')
  }

  const handleCopyOutput = () => {
    if (currentOutput?.response) {
      navigator.clipboard.writeText(currentOutput.response)
    }
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Test Console
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon className={cn(
              "h-4 w-4",
              config.color,
              status === 'running' && "animate-spin"
            )} />
            <span className={cn("text-sm font-normal", config.color)}>
              {config.label}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Section */}
        <div className="space-y-3">
          <Tabs value={inputType} onValueChange={(v) => setInputType(v as 'text' | 'json' | 'variables')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="mt-3">
              <Textarea
                placeholder="Enter test input..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
              />
            </TabsContent>

            <TabsContent value="json" className="mt-3">
              <Textarea
                placeholder='{"key": "value"}'
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
              />
            </TabsContent>

            <TabsContent value="variables" className="mt-3">
              <div className="space-y-2">
                {Object.entries(inputVariables).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <Input
                      value={key}
                      onChange={(e) => {
                        const newVars = { ...inputVariables }
                        delete newVars[key]
                        newVars[e.target.value] = value
                        setInputVariables(newVars)
                      }}
                      placeholder="Variable name"
                      className="w-1/3"
                    />
                    <Input
                      value={value}
                      onChange={(e) => setInputVariables({ ...inputVariables, [key]: e.target.value })}
                      placeholder="Value"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newVars = { ...inputVariables }
                        delete newVars[key]
                        setInputVariables(newVars)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputVariables({ ...inputVariables, [`var${Object.keys(inputVariables).length + 1}`]: '' })}
                >
                  Add Variable
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {status === 'running' ? (
              <Button onClick={handleStop} variant="destructive" className="flex-1">
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            ) : (
              <Button onClick={handleRun} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Run Test
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setInputValue(defaultInput)
                setCurrentOutput(null)
                setStatus('idle')
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Output Section */}
        <Tabs defaultValue="output">
          <TabsList>
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="logs">
              Logs {currentOutput?.logs?.length ? `(${currentOutput.logs.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="tools">
              Tools {currentOutput?.toolCalls?.length ? `(${currentOutput.toolCalls.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="output" className="mt-3">
            {currentOutput ? (
              <div className="space-y-3">
                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  {currentOutput.duration && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {currentOutput.duration}ms
                    </div>
                  )}
                  {currentOutput.tokensUsed && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Zap className="h-3.5 w-3.5" />
                      {currentOutput.tokensUsed} tokens
                    </div>
                  )}
                </div>

                {/* Response */}
                {currentOutput.response && (
                  <div className="relative">
                    <ScrollArea className="h-[200px] rounded-lg border p-4">
                      <pre className="text-sm whitespace-pre-wrap">
                        {currentOutput.response}
                      </pre>
                    </ScrollArea>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={handleCopyOutput}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Error */}
                {currentOutput.error && (
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
                      <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <pre className="text-sm whitespace-pre-wrap">
                        {currentOutput.error}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Terminal className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Run a test to see output</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="logs" className="mt-3">
            <ScrollArea className="h-[200px]">
              {currentOutput?.logs?.length ? (
                <div className="space-y-1 p-2 bg-muted/50 rounded-lg">
                  {currentOutput.logs.map((log, i) => (
                    <LogEntryRow key={i} entry={log} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Terminal className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No logs available</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="tools" className="mt-3">
            <ScrollArea className="h-[200px]">
              {currentOutput?.toolCalls?.length ? (
                <div className="space-y-1">
                  {currentOutput.toolCalls.map((call, i) => (
                    <ToolCallRow key={i} call={call} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Zap className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No tool calls</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="mt-3">
            <TestHistory
              outputs={history}
              onSelect={setCurrentOutput}
              onClear={() => setHistory([])}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default BuilderTestConsole
