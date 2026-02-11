/**
 * Agent Settings Panel
 * 
 * Phase EM-58B: LLM settings and execution limits
 */

'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AgentConfig } from '@/lib/ai-agents/types';
import { Info } from 'lucide-react';

interface AgentSettingsProps {
  settings: {
    llmProvider: string;
    llmModel: string;
    temperature: number;
    maxTokens: number;
    maxStepsPerRun: number;
    timeoutSeconds: number;
    maxRunsPerHour: number;
  };
  onChange: (updates: Partial<AgentConfig>) => void;
}

const LLM_PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
];

const LLM_MODELS = {
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini', cost: 'Low', speed: 'Fast' },
    { value: 'gpt-4o', label: 'GPT-4o', cost: 'Medium', speed: 'Medium' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', cost: 'High', speed: 'Medium' },
  ],
  anthropic: [
    { value: 'claude-3-5-haiku', label: 'Claude 3.5 Haiku', cost: 'Low', speed: 'Fast' },
    { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', cost: 'Medium', speed: 'Medium' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus', cost: 'High', speed: 'Slow' },
  ],
};

export function AgentSettings({ settings, onChange }: AgentSettingsProps) {
  const models = LLM_MODELS[settings.llmProvider as keyof typeof LLM_MODELS] || LLM_MODELS.openai;
  const currentModel = models.find(m => m.value === settings.llmModel);

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold">LLM Configuration</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Configure the AI model and parameters
        </p>
      </div>

      {/* Provider & Model */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Provider</Label>
          <Select
            value={settings.llmProvider}
            onValueChange={(value) => {
              const newModels = LLM_MODELS[value as keyof typeof LLM_MODELS];
              onChange({ 
                llmProvider: value,
                llmModel: newModels?.[0]?.value || 'gpt-4o-mini'
              });
            }}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LLM_PROVIDERS.map((provider) => (
                <SelectItem key={provider.value} value={provider.value}>
                  {provider.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Model</Label>
          <Select
            value={settings.llmModel}
            onValueChange={(value) => onChange({ llmModel: value })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  <div className="flex items-center gap-2">
                    {model.label}
                    <Badge variant="outline" className="text-xs">
                      {model.cost}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Model Info */}
      {currentModel && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
          <Info className="h-4 w-4" />
          <span>
            {currentModel.label}: {currentModel.cost} cost, {currentModel.speed} speed
          </span>
        </div>
      )}

      {/* Temperature */}
      <div>
        <div className="flex justify-between mb-2">
          <Label>Temperature</Label>
          <span className="text-sm text-muted-foreground">{settings.temperature}</span>
        </div>
        <Slider
          value={[settings.temperature]}
          onValueChange={([value]) => onChange({ temperature: value })}
          min={0}
          max={1}
          step={0.1}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Deterministic (0)</span>
          <span>Creative (1)</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Lower values are better for consistent, factual tasks. Higher for creative ones.
        </p>
      </div>

      {/* Max Tokens */}
      <div>
        <Label htmlFor="maxTokens">Max Tokens per Response</Label>
        <Input
          id="maxTokens"
          type="number"
          value={settings.maxTokens}
          onChange={(e) => onChange({ maxTokens: parseInt(e.target.value) || 4096 })}
          className="mt-2"
          min={100}
          max={128000}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Maximum tokens in each LLM response. Higher = more detailed but costlier.
        </p>
      </div>

      <div className="border-t pt-6">
        <Label className="text-base font-semibold">Execution Limits</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Safety limits to prevent runaway costs
        </p>
      </div>

      {/* Max Steps */}
      <div>
        <div className="flex justify-between mb-2">
          <Label>Max Steps per Run</Label>
          <span className="text-sm text-muted-foreground">{settings.maxStepsPerRun}</span>
        </div>
        <Slider
          value={[settings.maxStepsPerRun]}
          onValueChange={([value]) => onChange({ maxStepsPerRun: value })}
          min={1}
          max={50}
          step={1}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Maximum reasoning/action steps before the agent stops.
        </p>
      </div>

      {/* Timeout */}
      <div>
        <Label htmlFor="timeout">Timeout (seconds)</Label>
        <Input
          id="timeout"
          type="number"
          value={settings.timeoutSeconds}
          onChange={(e) => onChange({ timeoutSeconds: parseInt(e.target.value) || 120 })}
          className="mt-2"
          min={10}
          max={600}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Maximum execution time before the agent is stopped.
        </p>
      </div>

      {/* Rate Limiting */}
      <div>
        <Label htmlFor="maxRunsPerHour">Max Runs per Hour</Label>
        <Input
          id="maxRunsPerHour"
          type="number"
          value={settings.maxRunsPerHour}
          onChange={(e) => onChange({ maxRunsPerHour: parseInt(e.target.value) || 60 })}
          className="mt-2"
          min={1}
          max={1000}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Rate limit to prevent excessive API usage.
        </p>
      </div>

      {/* Cost Estimate */}
      <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4">
        <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
          💰 Estimated Cost
        </h4>
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Based on your settings, each run could cost approximately:
        </p>
        <p className="text-lg font-semibold text-amber-900 dark:text-amber-100 mt-1">
          ~K0.05 - K1.50 per run
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
          Actual cost depends on input/output size and number of steps.
        </p>
      </div>
    </div>
  );
}
