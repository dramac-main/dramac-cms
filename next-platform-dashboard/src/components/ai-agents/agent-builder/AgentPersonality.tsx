/**
 * Agent Personality Panel
 * 
 * Phase EM-58B: Agent personality, system prompt, and examples
 */

'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AgentConfig, AgentExample } from '@/lib/ai-agents/types';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface AgentPersonalityProps {
  personality: string;
  systemPrompt: string;
  examples: AgentExample[];
  onChange: (updates: Partial<AgentConfig>) => void;
}

const PERSONALITY_TEMPLATES = [
  {
    name: 'Professional',
    value: 'You are a professional and thorough assistant. You communicate clearly and efficiently, focusing on accuracy and actionable insights.'
  },
  {
    name: 'Friendly',
    value: 'You are a friendly and approachable assistant. You communicate in a warm, conversational tone while still being helpful and accurate.'
  },
  {
    name: 'Technical',
    value: 'You are a technical expert who provides detailed, precise information. You use appropriate terminology and explain complex concepts clearly.'
  },
  {
    name: 'Empathetic',
    value: 'You are an empathetic assistant who understands user feelings and responds with care. You prioritize the human element while solving problems.'
  },
];

export function AgentPersonality({ 
  personality, 
  systemPrompt, 
  examples, 
  onChange 
}: AgentPersonalityProps) {
  const [newExample, setNewExample] = useState<Partial<AgentExample>>({});

  const addExample = () => {
    if (newExample.scenario && newExample.input && newExample.expectedOutput) {
      onChange({
        examples: [
          ...examples,
          {
            scenario: newExample.scenario,
            input: newExample.input,
            expectedOutput: newExample.expectedOutput,
            explanation: newExample.explanation,
          }
        ]
      });
      setNewExample({});
    }
  };

  const removeExample = (index: number) => {
    onChange({
      examples: examples.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      {/* Personality */}
      <div>
        <Label className="text-base font-semibold">Personality</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Describe how the agent should behave and communicate
        </p>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {PERSONALITY_TEMPLATES.map((template) => (
            <Button
              key={template.name}
              variant="outline"
              size="sm"
              onClick={() => onChange({ personality: template.value })}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {template.name}
            </Button>
          ))}
        </div>
        
        <Textarea
          value={personality}
          onChange={(e) => onChange({ personality: e.target.value })}
          placeholder="Describe the agent's personality, tone, and communication style..."
          rows={4}
        />
      </div>

      {/* System Prompt */}
      <div>
        <Label className="text-base font-semibold">System Prompt *</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Core instructions that guide the agent&apos;s behavior. Use markdown for structure.
        </p>
        
        <Textarea
          value={systemPrompt}
          onChange={(e) => onChange({ systemPrompt: e.target.value })}
          placeholder={`## Your Mission
Describe what the agent should do...

## Steps
1. First step
2. Second step

## Guidelines
- Guideline 1
- Guideline 2`}
          rows={12}
          className="font-mono text-sm"
        />
        
        <p className="text-xs text-muted-foreground mt-2">
          Tip: Use headings (##), bullet points, and numbered lists for clarity
        </p>
      </div>

      {/* Examples */}
      <div>
        <Label className="text-base font-semibold">Few-Shot Examples</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Provide examples of expected behavior to improve accuracy
        </p>
        
        {examples.length > 0 && (
          <div className="space-y-3 mb-4">
            {examples.map((example, index) => (
              <Card key={index} className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => removeExample(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <CardContent className="pt-4 space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Scenario:</span>{' '}
                    <span className="text-muted-foreground">{example.scenario}</span>
                  </div>
                  <div>
                    <span className="font-medium">Input:</span>{' '}
                    <span className="text-muted-foreground">{example.input}</span>
                  </div>
                  <div>
                    <span className="font-medium">Expected Output:</span>{' '}
                    <span className="text-muted-foreground">{example.expectedOutput}</span>
                  </div>
                  {example.explanation && (
                    <div>
                      <span className="font-medium">Explanation:</span>{' '}
                      <span className="text-muted-foreground">{example.explanation}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <Card className="border-dashed">
          <CardContent className="pt-4 space-y-3">
            <div>
              <Label htmlFor="scenario" className="text-xs">Scenario</Label>
              <Input
                id="scenario"
                value={newExample.scenario || ''}
                onChange={(e) => setNewExample({ ...newExample, scenario: e.target.value })}
                placeholder="e.g., New lead from pricing page"
              />
            </div>
            <div>
              <Label htmlFor="input" className="text-xs">Input</Label>
              <Textarea
                id="input"
                value={newExample.input || ''}
                onChange={(e) => setNewExample({ ...newExample, input: e.target.value })}
                placeholder="What the agent receives..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="output" className="text-xs">Expected Output</Label>
              <Textarea
                id="output"
                value={newExample.expectedOutput || ''}
                onChange={(e) => setNewExample({ ...newExample, expectedOutput: e.target.value })}
                placeholder="What the agent should produce..."
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="explanation" className="text-xs">Explanation (optional)</Label>
              <Input
                id="explanation"
                value={newExample.explanation || ''}
                onChange={(e) => setNewExample({ ...newExample, explanation: e.target.value })}
                placeholder="Why this is the correct response..."
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addExample}
              disabled={!newExample.scenario || !newExample.input || !newExample.expectedOutput}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Example
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
