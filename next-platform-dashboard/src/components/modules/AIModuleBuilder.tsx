// AI Module Builder UI Component
// Phase EM-23: AI-powered module generation

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { 
  Send, 
  Sparkles, 
  FileCode, 
  Database, 
  Layout,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Copy,
  Download,
  RefreshCw,
  ArrowLeft,
  Settings,
  Code,
  Folder,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface GeneratedFile {
  path: string;
  type: string;
  content: string;
}

interface ModuleSpec {
  name: string;
  slug: string;
  description: string;
  type: string;
  tier: string;
  features: string[];
  entities: EntitySpec[];
  pages: PageSpec[];
  api_endpoints: EndpointSpec[];
  components: ComponentSpec[];
  permissions: {
    roles: string[];
    default_role: string;
  };
  settings: SettingSpec[];
}

interface EntitySpec {
  name: string;
  displayName: string;
  description: string;
  fields: FieldSpec[];
}

interface FieldSpec {
  name: string;
  type: string;
  required: boolean;
  unique: boolean;
  indexed: boolean;
  default: unknown;
  references: { entity: string; field: string } | null;
}

interface PageSpec {
  name: string;
  title: string;
  path: string;
  description: string;
  components: string[];
}

interface EndpointSpec {
  path: string;
  method: string;
  description: string;
  auth: string;
}

interface ComponentSpec {
  name: string;
  type: string;
  entity: string | null;
  description: string;
}

interface SettingSpec {
  key: string;
  type: string;
  label: string;
  default: unknown;
}

type Step = 'chat' | 'spec' | 'code' | 'review';

export function AIModuleBuilder() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>('chat');
  const [spec, setSpec] = useState<ModuleSpec | null>(null);
  const [specId, setSpecId] = useState<string | null>(null);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when step changes to chat
  useEffect(() => {
    if (step === 'chat') {
      inputRef.current?.focus();
    }
  }, [step]);

  // Start new session
  const startSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/modules/ai-builder/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Module',
          description: 'AI-generated module'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      
      const { sessionId } = await response.json();
      setSessionId(sessionId);
      
      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: `Hi! I'm the AI Module Builder. Tell me what kind of module you want to create.

**Examples:**
- "I need a simple inventory tracking system"
- "Create a customer feedback widget"  
- "Build a booking system for a salon"
- "Make an integration with Paddle for payments"

What would you like to build?`,
        timestamp: new Date()
      }]);
    } catch (err) {
      setError('Failed to start session. Please try again.');
      console.error('Session error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    startSession();
  }, [startSession]);

  // Send chat message
  async function sendMessage() {
    if (!input.trim() || !sessionId || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/modules/ai-builder/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: input
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const { response: aiResponse } = await response.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Generate specification
  async function generateSpec() {
    if (!sessionId || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/modules/ai-builder/generate-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        throw new Error('Failed to generate specification');
      }

      const { spec: generatedSpec, specId: newSpecId } = await response.json();
      
      setSpec(generatedSpec);
      setSpecId(newSpecId);
      setStep('spec');
      toast.success('Specification generated successfully!');
    } catch (err) {
      setError('Failed to generate specification. Please try again.');
      console.error('Spec generation error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Generate code from spec
  async function generateCode() {
    if (!sessionId || !specId || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/modules/ai-builder/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, specId })
      });

      if (!response.ok) {
        throw new Error('Failed to generate code');
      }

      const { files: generatedFiles } = await response.json();
      
      setFiles(generatedFiles);
      setSelectedFile(generatedFiles[0]?.path || null);
      setStep('code');
      toast.success('Code generated successfully!');
    } catch (err) {
      setError('Failed to generate code. Please try again.');
      console.error('Code generation error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Finalize module
  async function finalizeModule() {
    if (!sessionId || !specId || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/modules/ai-builder/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, specId })
      });

      if (!response.ok) {
        throw new Error('Failed to finalize module');
      }

      const { moduleId } = await response.json();
      
      toast.success('Module created successfully!');
      
      // Redirect to module editor
      window.location.href = `/studio/modules/${moduleId}`;
    } catch (err) {
      setError('Failed to finalize module. Please try again.');
      console.error('Finalize error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Copy file content
  function copyFile(content: string) {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  }

  // Download all files as a bundle
  function downloadAll() {
    if (!spec) return;
    
    const bundle = files.map(f => `// ========================================
// File: ${f.path}
// ========================================
${f.content}`).join('\n\n');
    
    const blob = new Blob([bundle], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${spec.slug || 'module'}-generated.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Download started!');
  }

  // Get file icon based on type
  function getFileIcon(type: string) {
    switch (type) {
      case 'sql':
        return <Database className="h-4 w-4" />;
      case 'tsx':
      case 'jsx':
        return <Code className="h-4 w-4 text-blue-500" />;
      case 'ts':
      case 'js':
        return <FileCode className="h-4 w-4 text-yellow-500" />;
      case 'json':
        return <Settings className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  }

  // Get method badge color
  function getMethodColor(method: string) {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-green-500';
      case 'POST':
        return 'bg-blue-500';
      case 'PUT':
        return 'bg-yellow-500';
      case 'DELETE':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }

  const selectedFileContent = files.find(f => f.path === selectedFile);
  const canGenerateSpec = messages.filter(m => m.role === 'user').length >= 1;

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6">
      {/* Main Panel */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Module Builder
              </CardTitle>
              
              {/* Step Indicator */}
              <div className="flex gap-2">
                {(['chat', 'spec', 'code', 'review'] as Step[]).map((s, i) => (
                  <Badge
                    key={s}
                    variant={step === s ? 'default' : 'outline'}
                    className={`cursor-pointer transition-colors ${
                      step === s ? 'bg-purple-500 hover:bg-purple-600' : 'hover:bg-muted'
                    }`}
                    onClick={() => {
                      // Allow going back to previous steps
                      const currentIndex = ['chat', 'spec', 'code', 'review'].indexOf(step);
                      const targetIndex = i;
                      if (targetIndex <= currentIndex) {
                        setStep(s);
                      }
                    }}
                  >
                    {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="m-4 mb-0">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Chat Step */}
            {step === 'chat' && (
              <>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg p-3 ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                          <span className="text-xs opacity-70 mt-1 block">
                            {msg.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    )}
                    
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t flex-shrink-0">
                  <div className="flex gap-2 max-w-3xl mx-auto">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Describe your module idea..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center max-w-3xl mx-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={startSession}
                      disabled={isLoading}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Start Over
                    </Button>
                    
                    <Button 
                      onClick={generateSpec} 
                      disabled={isLoading || !canGenerateSpec}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Generate Specification
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Spec Step */}
            {step === 'spec' && spec && (
              <div className="flex-1 overflow-auto p-4">
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Module Header */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold">{spec.name}</h2>
                      <Badge variant="outline">{spec.type}</Badge>
                      <Badge variant="secondary">{spec.tier}</Badge>
                    </div>
                    <p className="text-muted-foreground">{spec.description}</p>
                  </div>

                  {/* Features */}
                  {spec.features && spec.features.length > 0 && (
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Features
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {spec.features.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  <Tabs defaultValue="entities" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="entities" className="flex items-center gap-1">
                        <Database className="h-4 w-4" />
                        Entities ({spec.entities?.length || 0})
                      </TabsTrigger>
                      <TabsTrigger value="pages" className="flex items-center gap-1">
                        <Layout className="h-4 w-4" />
                        Pages ({spec.pages?.length || 0})
                      </TabsTrigger>
                      <TabsTrigger value="components" className="flex items-center gap-1">
                        <FileCode className="h-4 w-4" />
                        Components ({spec.components?.length || 0})
                      </TabsTrigger>
                      <TabsTrigger value="api" className="flex items-center gap-1">
                        <Code className="h-4 w-4" />
                        API ({spec.api_endpoints?.length || 0})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="entities" className="mt-4 space-y-4">
                      {spec.entities?.map((entity, i) => (
                        <Card key={i}>
                          <CardHeader className="py-3">
                            <CardTitle className="text-base">{entity.displayName}</CardTitle>
                            <p className="text-sm text-muted-foreground">{entity.description}</p>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-2 px-2">Field</th>
                                    <th className="text-left py-2 px-2">Type</th>
                                    <th className="text-left py-2 px-2">Required</th>
                                    <th className="text-left py-2 px-2">Indexed</th>
                                    <th className="text-left py-2 px-2">Reference</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {entity.fields?.map((field, j) => (
                                    <tr key={j} className="border-b last:border-0">
                                      <td className="py-2 px-2 font-mono text-xs">{field.name}</td>
                                      <td className="py-2 px-2">
                                        <Badge variant="outline" className="text-xs">{field.type}</Badge>
                                      </td>
                                      <td className="py-2 px-2">
                                        {field.required && <CheckCircle className="h-4 w-4 text-green-500" />}
                                      </td>
                                      <td className="py-2 px-2">
                                        {field.indexed && <CheckCircle className="h-4 w-4 text-blue-500" />}
                                      </td>
                                      <td className="py-2 px-2 text-xs text-muted-foreground">
                                        {field.references ? `→ ${field.references.entity}.${field.references.field}` : '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {(!spec.entities || spec.entities.length === 0) && (
                        <p className="text-muted-foreground text-center py-8">No database entities defined</p>
                      )}
                    </TabsContent>

                    <TabsContent value="pages" className="mt-4 space-y-2">
                      {spec.pages?.map((page, i) => (
                        <Card key={i} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{page.title}</h4>
                              <p className="text-sm text-muted-foreground font-mono">{page.path}</p>
                              <p className="text-sm text-muted-foreground mt-1">{page.description}</p>
                            </div>
                            <Badge>{page.components?.length || 0} components</Badge>
                          </div>
                        </Card>
                      ))}
                      {(!spec.pages || spec.pages.length === 0) && (
                        <p className="text-muted-foreground text-center py-8">No pages defined</p>
                      )}
                    </TabsContent>

                    <TabsContent value="components" className="mt-4 space-y-2">
                      {spec.components?.map((comp, i) => (
                        <Card key={i} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{comp.name}</h4>
                              <p className="text-sm text-muted-foreground">{comp.description}</p>
                              {comp.entity && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Entity: <span className="font-mono">{comp.entity}</span>
                                </p>
                              )}
                            </div>
                            <Badge variant="outline">{comp.type}</Badge>
                          </div>
                        </Card>
                      ))}
                      {(!spec.components || spec.components.length === 0) && (
                        <p className="text-muted-foreground text-center py-8">No components defined</p>
                      )}
                    </TabsContent>

                    <TabsContent value="api" className="mt-4 space-y-2">
                      {spec.api_endpoints?.map((endpoint, i) => (
                        <Card key={i} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge className={`${getMethodColor(endpoint.method)} text-white`}>
                                {endpoint.method}
                              </Badge>
                              <code className="text-sm font-mono">{endpoint.path}</code>
                            </div>
                            <Badge variant="outline">{endpoint.auth}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">{endpoint.description}</p>
                        </Card>
                      ))}
                      {(!spec.api_endpoints || spec.api_endpoints.length === 0) && (
                        <p className="text-muted-foreground text-center py-8">No API endpoints defined</p>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* Actions */}
                  <div className="flex justify-between pt-4 border-t">
                    <Button variant="outline" onClick={() => setStep('chat')}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Chat
                    </Button>
                    <Button onClick={generateCode} disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileCode className="h-4 w-4 mr-2" />
                      )}
                      Generate Code
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Code Step */}
            {step === 'code' && (
              <div className="flex-1 flex overflow-hidden">
                {/* File Tree */}
                <div className="w-64 border-r flex flex-col flex-shrink-0">
                  <div className="p-3 border-b flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      Files ({files.length})
                    </span>
                    <Button size="sm" variant="ghost" onClick={downloadAll} title="Download all">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                      {files.map((file) => (
                        <button
                          key={file.path}
                          onClick={() => setSelectedFile(file.path)}
                          className={`w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 ${
                            selectedFile === file.path 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'
                          }`}
                        >
                          {getFileIcon(file.type)}
                          <span className="truncate">{file.path}</span>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Code View */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {selectedFileContent ? (
                    <>
                      <div className="p-3 border-b flex items-center justify-between flex-shrink-0">
                        <span className="text-sm font-mono flex items-center gap-2">
                          {getFileIcon(selectedFileContent.type)}
                          {selectedFileContent.path}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyFile(selectedFileContent.content)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <ScrollArea className="flex-1">
                        <pre className="p-4 text-sm font-mono bg-muted/50 min-h-full overflow-x-auto">
                          <code>{selectedFileContent.content}</code>
                        </pre>
                      </ScrollArea>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      Select a file to view its content
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>

          {/* Footer Actions for Code Step */}
          {step === 'code' && (
            <div className="p-4 border-t flex justify-between flex-shrink-0">
              <Button variant="outline" onClick={() => setStep('spec')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Specification
              </Button>
              <Button onClick={finalizeModule} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Create Module
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
