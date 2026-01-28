/**
 * Agent Goals Panel
 * 
 * Phase EM-58B: Agent goals and success metrics
 */

'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { AgentGoal } from '@/lib/ai-agents/types';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useState } from 'react';

interface AgentGoalsProps {
  goals: AgentGoal[];
  onChange: (goals: AgentGoal[]) => void;
}

const METRIC_TEMPLATES = [
  { value: 'qualification_accuracy', label: 'Qualification Accuracy', type: 'percentage' },
  { value: 'response_rate', label: 'Response Rate', type: 'percentage' },
  { value: 'resolution_time_seconds', label: 'Resolution Time (seconds)', type: 'number' },
  { value: 'customer_satisfaction', label: 'Customer Satisfaction', type: 'percentage' },
  { value: 'completion_rate', label: 'Task Completion Rate', type: 'percentage' },
  { value: 'cost_per_action', label: 'Cost per Action ($)', type: 'currency' },
  { value: 'custom', label: 'Custom Metric', type: 'custom' },
];

export function AgentGoals({ goals, onChange }: AgentGoalsProps) {
  const [newGoal, setNewGoal] = useState<Partial<AgentGoal>>({
    priority: 5,
    comparison: 'gte'
  });

  const addGoal = () => {
    if (newGoal.name && newGoal.successMetric) {
      onChange([
        ...goals,
        {
          name: newGoal.name,
          description: newGoal.description,
          priority: newGoal.priority || 5,
          successMetric: newGoal.successMetric,
          targetValue: newGoal.targetValue,
          comparison: newGoal.comparison || 'gte',
        }
      ]);
      setNewGoal({ priority: 5, comparison: 'gte' });
    }
  };

  const updateGoal = (index: number, updates: Partial<AgentGoal>) => {
    const updated = [...goals];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeGoal = (index: number) => {
    onChange(goals.filter((_, i) => i !== index));
  };

  const moveGoal = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === goals.length - 1)
    ) {
      return;
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...goals];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold">Agent Goals</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Define success metrics and targets for the agent
        </p>
      </div>

      {/* Existing Goals */}
      {goals.length > 0 && (
        <div className="space-y-3">
          {goals.map((goal, index) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-1 pt-2">
                    <button
                      onClick={() => moveGoal(index, 'up')}
                      className="text-muted-foreground hover:text-foreground"
                      disabled={index === 0}
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          value={goal.name}
                          onChange={(e) => updateGoal(index, { name: e.target.value })}
                          placeholder="Goal name"
                          className="font-medium"
                        />
                      </div>
                      <div className="flex items-center gap-2 w-32">
                        <span className="text-sm text-muted-foreground">Priority:</span>
                        <span className="font-semibold">{goal.priority}</span>
                      </div>
                    </div>
                    
                    <Input
                      value={goal.description || ''}
                      onChange={(e) => updateGoal(index, { description: e.target.value })}
                      placeholder="Description (optional)"
                      className="text-sm"
                    />
                    
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Select
                          value={goal.successMetric}
                          onValueChange={(value) => updateGoal(index, { successMetric: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select metric" />
                          </SelectTrigger>
                          <SelectContent>
                            {METRIC_TEMPLATES.map((metric) => (
                              <SelectItem key={metric.value} value={metric.value}>
                                {metric.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Select
                        value={goal.comparison}
                        onValueChange={(value) => updateGoal(index, { comparison: value as AgentGoal['comparison'] })}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gt">&gt;</SelectItem>
                          <SelectItem value="gte">≥</SelectItem>
                          <SelectItem value="eq">=</SelectItem>
                          <SelectItem value="lte">≤</SelectItem>
                          <SelectItem value="lt">&lt;</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Input
                        type="number"
                        value={goal.targetValue || ''}
                        onChange={(e) => updateGoal(index, { targetValue: parseFloat(e.target.value) || 0 })}
                        placeholder="Target"
                        className="w-24"
                      />
                    </div>
                    
                    <Slider
                      value={[goal.priority]}
                      onValueChange={([value]) => updateGoal(index, { priority: value })}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low Priority</span>
                      <span>High Priority</span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeGoal(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Goal */}
      <Card className="border-dashed">
        <CardContent className="pt-4 space-y-3">
          <div className="text-sm font-medium text-muted-foreground">Add New Goal</div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Goal Name *</Label>
              <Input
                value={newGoal.name || ''}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                placeholder="e.g., Qualification Accuracy"
              />
            </div>
            <div>
              <Label className="text-xs">Priority (1-10)</Label>
              <Slider
                value={[newGoal.priority || 5]}
                onValueChange={([value]) => setNewGoal({ ...newGoal, priority: value })}
                min={1}
                max={10}
                step={1}
              />
            </div>
          </div>
          
          <div>
            <Label className="text-xs">Description</Label>
            <Input
              value={newGoal.description || ''}
              onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
              placeholder="What does success look like?"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-xs">Metric *</Label>
              <Select
                value={newGoal.successMetric || ''}
                onValueChange={(value) => setNewGoal({ ...newGoal, successMetric: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {METRIC_TEMPLATES.map((metric) => (
                    <SelectItem key={metric.value} value={metric.value}>
                      {metric.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs">Comparison</Label>
              <Select
                value={newGoal.comparison || 'gte'}
                onValueChange={(value) => setNewGoal({ ...newGoal, comparison: value as AgentGoal['comparison'] })}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gt">&gt;</SelectItem>
                  <SelectItem value="gte">≥</SelectItem>
                  <SelectItem value="eq">=</SelectItem>
                  <SelectItem value="lte">≤</SelectItem>
                  <SelectItem value="lt">&lt;</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs">Target</Label>
              <Input
                type="number"
                value={newGoal.targetValue || ''}
                onChange={(e) => setNewGoal({ ...newGoal, targetValue: parseFloat(e.target.value) || 0 })}
                placeholder="0.85"
                className="w-24"
              />
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={addGoal}
            disabled={!newGoal.name || !newGoal.successMetric}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Goal
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
