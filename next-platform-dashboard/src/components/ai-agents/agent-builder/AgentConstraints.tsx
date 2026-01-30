/**
 * Agent Constraints Panel
 * 
 * Phase EM-58B: Agent rules and constraints
 */

'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface AgentConstraintsProps {
  constraints: string[];
  onChange: (constraints: string[]) => void;
}

const CONSTRAINT_SUGGESTIONS = [
  'Never send emails without human approval',
  'Do not delete any data without explicit confirmation',
  'Always explain reasoning before taking actions',
  'Respect user privacy - do not share personal information',
  'Maximum of 3 retry attempts before escalating',
  'Do not make promises on behalf of the company',
  'Always include an unsubscribe option in emails',
  'Never store or log sensitive credentials',
  'Escalate billing issues to human agents',
  'Do not contact customers outside business hours',
];

export function AgentConstraints({ constraints, onChange }: AgentConstraintsProps) {
  const [newConstraint, setNewConstraint] = useState('');

  const addConstraint = (constraint: string) => {
    if (constraint.trim() && !constraints.includes(constraint.trim())) {
      onChange([...constraints, constraint.trim()]);
      setNewConstraint('');
    }
  };

  const removeConstraint = (index: number) => {
    onChange(constraints.filter((_, i) => i !== index));
  };

  const unusedSuggestions = CONSTRAINT_SUGGESTIONS.filter(
    s => !constraints.some(c => c.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold">Agent Constraints</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Define rules and boundaries the agent must follow
        </p>
      </div>

      {/* Existing Constraints */}
      {constraints.length > 0 && (
        <div className="space-y-2">
          {constraints.map((constraint, index) => (
            <div 
              key={index} 
              className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
              <span className="flex-1 text-sm">{constraint}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => removeConstraint(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Constraint */}
      <div className="flex gap-2">
        <Input
          value={newConstraint}
          onChange={(e) => setNewConstraint(e.target.value)}
          placeholder="Add a new constraint..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addConstraint(newConstraint);
              e.preventDefault();
            }
          }}
        />
        <Button
          variant="outline"
          onClick={() => addConstraint(newConstraint)}
          disabled={!newConstraint.trim()}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Suggestions */}
      {unusedSuggestions.length > 0 && (
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">
            Suggested Constraints
          </Label>
          <div className="flex flex-wrap gap-2">
            {unusedSuggestions.slice(0, 6).map((suggestion) => (
              <Badge
                key={suggestion}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => addConstraint(suggestion)}
              >
                <Plus className="h-3 w-3 mr-1" />
                {suggestion.length > 40 ? suggestion.slice(0, 40) + '...' : suggestion}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          💡 Tips for Effective Constraints
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Be specific - &quot;Never delete contacts&quot; is clearer than &quot;Be careful&quot;</li>
          <li>• Include approval requirements for risky actions</li>
          <li>• Set limits on quantities (e.g., &quot;Max 10 emails per day&quot;)</li>
          <li>• Define escalation paths for edge cases</li>
        </ul>
      </div>
    </div>
  );
}
