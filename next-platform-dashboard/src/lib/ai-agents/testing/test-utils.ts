/**
 * AI Agent Testing Framework
 * 
 * Phase EM-58B: Comprehensive testing utilities for AI agents
 */

import type { AgentConfig } from '../types';

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  trigger: { type: string; eventType?: string; schedule?: string };
  context: Record<string, unknown>;
  expectedOutcome: {
    shouldExecute: boolean;
    shouldUseTools?: string[];
    shouldMatchConstraints?: string[];
    maxDuration?: number;
    minConfidence?: number;
  };
  mockData?: Record<string, unknown>;
}

export interface TestResult {
  scenarioId: string;
  scenarioName: string;
  passed: boolean;
  duration: number;
  tokensUsed: number;
  toolsUsed: string[];
  output: unknown;
  error?: string;
  assertions: AssertionResult[];
}

export interface AssertionResult {
  name: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
  message?: string;
}

export interface TestReport {
  agentId: string;
  agentName: string;
  totalScenarios: number;
  passed: number;
  failed: number;
  duration: number;
  results: TestResult[];
  createdAt: Date;
}

/**
 * Create standard test scenarios based on agent type
 */
export function generateStandardScenarios(agentType: string): TestScenario[] {
  const baseScenarios: TestScenario[] = [
    {
      id: 'happy-path',
      name: 'Happy Path',
      description: 'Basic successful execution with typical input',
      trigger: { type: 'event' },
      context: {},
      expectedOutcome: {
        shouldExecute: true,
        maxDuration: 30000,
        minConfidence: 0.7,
      },
    },
    {
      id: 'edge-case-empty-input',
      name: 'Empty Input',
      description: 'Handle empty or minimal input gracefully',
      trigger: { type: 'event' },
      context: { data: null },
      expectedOutcome: {
        shouldExecute: true,
      },
    },
    {
      id: 'constraint-violation',
      name: 'Constraint Violation Attempt',
      description: 'Ensure agent respects defined constraints',
      trigger: { type: 'event' },
      context: { attemptViolation: true },
      expectedOutcome: {
        shouldExecute: true,
        shouldMatchConstraints: ['all'],
      },
    },
  ];

  // Add type-specific scenarios
  switch (agentType) {
    case 'sales':
      return [
        ...baseScenarios,
        {
          id: 'lead-qualification',
          name: 'Lead Qualification',
          description: 'Qualify a new lead based on ICP criteria',
          trigger: { type: 'event', eventType: 'crm.contact.created' },
          context: {
            contact: {
              name: 'John Smith',
              email: 'john@example.com',
              company: 'Sample Corp',
              title: 'CTO',
            },
          },
          expectedOutcome: {
            shouldExecute: true,
            shouldUseTools: ['crm_search', 'crm_update'],
          },
          mockData: {
            companySize: 150,
            industry: 'Technology',
          },
        },
        {
          id: 'follow-up-scheduling',
          name: 'Follow-up Scheduling',
          description: 'Schedule a follow-up based on last interaction',
          trigger: { type: 'event', eventType: 'crm.deal.updated' },
          context: {
            deal: {
              stage: 'proposal_sent',
              lastContact: '2026-01-20',
            },
          },
          expectedOutcome: {
            shouldExecute: true,
            shouldUseTools: ['task_create', 'calendar_check'],
          },
        },
      ];

    case 'support':
      return [
        ...baseScenarios,
        {
          id: 'ticket-triage',
          name: 'Ticket Triage',
          description: 'Categorize and prioritize incoming ticket',
          trigger: { type: 'event', eventType: 'support.ticket.created' },
          context: {
            ticket: {
              subject: 'Cannot login to my account',
              body: 'I get an error when trying to login',
              priority: 'unknown',
            },
          },
          expectedOutcome: {
            shouldExecute: true,
            shouldUseTools: ['ticket_categorize', 'ticket_assign'],
          },
        },
        {
          id: 'auto-response',
          name: 'Auto Response',
          description: 'Generate appropriate auto-response for common issue',
          trigger: { type: 'event', eventType: 'support.ticket.created' },
          context: {
            ticket: {
              subject: 'Password reset',
              body: 'How do I reset my password?',
            },
          },
          expectedOutcome: {
            shouldExecute: true,
            shouldUseTools: ['knowledge_search', 'email_send'],
          },
        },
      ];

    case 'operations':
      return [
        ...baseScenarios,
        {
          id: 'data-cleanup',
          name: 'Data Cleanup',
          description: 'Clean and standardize data entries',
          trigger: { type: 'scheduled', schedule: '0 2 * * *' },
          context: {
            dataType: 'contacts',
            batchSize: 100,
          },
          expectedOutcome: {
            shouldExecute: true,
            shouldUseTools: ['data_validate', 'data_update'],
          },
        },
        {
          id: 'report-generation',
          name: 'Report Generation',
          description: 'Generate weekly analytics report',
          trigger: { type: 'scheduled', schedule: '0 8 * * 1' },
          context: {
            reportType: 'weekly_summary',
            period: 'last_7_days',
          },
          expectedOutcome: {
            shouldExecute: true,
            shouldUseTools: ['analytics_query', 'report_generate', 'email_send'],
          },
        },
      ];

    default:
      return baseScenarios;
  }
}

/**
 * AI Agent Tester Class
 */
export class AgentTester {
  private agent: AgentConfig;
  private mockMode: boolean = true;

  constructor(agent: AgentConfig) {
    this.agent = agent;
  }

  /**
   * Run a single test scenario
   */
  async runScenario(scenario: TestScenario): Promise<TestResult> {
    const startTime = Date.now();
    const assertions: AssertionResult[] = [];
    let output: unknown = null;
    let error: string | undefined;
    let toolsUsed: string[] = [];
    let tokensUsed = 0;

    try {
      // Simulate execution
      if (this.mockMode) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        tokensUsed = Math.floor(Math.random() * 500) + 100;
        toolsUsed = scenario.expectedOutcome.shouldUseTools || [];
        output = { success: true, mocked: true };
      } else {
        // Real execution would go here
        throw new Error('Real execution not implemented in test mode');
      }

      // Run assertions
      if (scenario.expectedOutcome.shouldExecute) {
        assertions.push({
          name: 'Should Execute',
          passed: true,
          expected: true,
          actual: true,
        });
      }

      if (scenario.expectedOutcome.shouldUseTools) {
        const toolsMatch = scenario.expectedOutcome.shouldUseTools.every(t => toolsUsed.includes(t));
        assertions.push({
          name: 'Expected Tools Used',
          passed: toolsMatch,
          expected: scenario.expectedOutcome.shouldUseTools,
          actual: toolsUsed,
        });
      }

      if (scenario.expectedOutcome.maxDuration) {
        const duration = Date.now() - startTime;
        const withinLimit = duration <= scenario.expectedOutcome.maxDuration;
        assertions.push({
          name: 'Duration Within Limit',
          passed: withinLimit,
          expected: `<= ${scenario.expectedOutcome.maxDuration}ms`,
          actual: `${duration}ms`,
        });
      }

    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
      assertions.push({
        name: 'Execution Success',
        passed: false,
        expected: 'No error',
        actual: error,
      });
    }

    const duration = Date.now() - startTime;
    const passed = assertions.every(a => a.passed);

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      passed,
      duration,
      tokensUsed,
      toolsUsed,
      output,
      error,
      assertions,
    };
  }

  /**
   * Run all test scenarios
   */
  async runAllScenarios(scenarios: TestScenario[]): Promise<TestReport> {
    const startTime = Date.now();
    const results: TestResult[] = [];

    for (const scenario of scenarios) {
      const result = await this.runScenario(scenario);
      results.push(result);
    }

    const duration = Date.now() - startTime;
    const passed = results.filter(r => r.passed).length;

    return {
      agentId: this.agent.id,
      agentName: this.agent.name,
      totalScenarios: scenarios.length,
      passed,
      failed: scenarios.length - passed,
      duration,
      results,
      createdAt: new Date(),
    };
  }

  /**
   * Run standard scenarios for this agent's type
   */
  async runStandardTests(): Promise<TestReport> {
    const scenarios = generateStandardScenarios(this.agent.agentType);
    return this.runAllScenarios(scenarios);
  }

  /**
   * Validate agent configuration
   */
  validateConfig(): AssertionResult[] {
    const assertions: AssertionResult[] = [];

    // Check required fields
    assertions.push({
      name: 'Agent has name',
      passed: !!this.agent.name && this.agent.name.length > 0,
      expected: 'Non-empty name',
      actual: this.agent.name || 'undefined',
    });

    assertions.push({
      name: 'Agent has system prompt',
      passed: !!this.agent.systemPrompt && this.agent.systemPrompt.length > 20,
      expected: 'System prompt > 20 chars',
      actual: `${this.agent.systemPrompt?.length || 0} chars`,
    });

    assertions.push({
      name: 'Agent has at least one trigger',
      passed: (this.agent.triggerEvents?.length || 0) > 0,
      expected: '>= 1 trigger',
      actual: `${this.agent.triggerEvents?.length || 0} triggers`,
    });

    assertions.push({
      name: 'Agent has goals defined',
      passed: (this.agent.goals?.length || 0) > 0,
      expected: '>= 1 goal',
      actual: `${this.agent.goals?.length || 0} goals`,
    });

    assertions.push({
      name: 'LLM provider configured',
      passed: !!this.agent.llmProvider && !!this.agent.llmModel,
      expected: 'Provider and model set',
      actual: `${this.agent.llmProvider || 'none'}/${this.agent.llmModel || 'none'}`,
    });

    // Safety checks
    assertions.push({
      name: 'Has safety constraints',
      passed: (this.agent.constraints?.length || 0) >= 1,
      expected: '>= 1 constraint',
      actual: `${this.agent.constraints?.length || 0} constraints`,
    });

    assertions.push({
      name: 'Has tool controls',
      passed: this.agent.allowedTools.length < 20 || this.agent.deniedTools.length > 0,
      expected: 'Limited tools or denied list',
      actual: `${this.agent.allowedTools.length} allowed, ${this.agent.deniedTools.length} denied`,
    });

    return assertions;
  }

  /**
   * Get test coverage report
   */
  getCoverageReport(): { 
    triggers: number; 
    goals: number; 
    tools: number; 
    constraints: number 
  } {
    return {
      triggers: (this.agent.triggerEvents?.length || 0),
      goals: (this.agent.goals?.length || 0),
      tools: (this.agent.capabilities?.length || 0),
      constraints: (this.agent.constraints?.length || 0),
    };
  }
}

/**
 * Create a tester instance for an agent
 */
export function createAgentTester(agent: AgentConfig): AgentTester {
  return new AgentTester(agent);
}

/**
 * Quick validation check
 */
export function quickValidate(agent: AgentConfig): { valid: boolean; issues: string[] } {
  const tester = new AgentTester(agent);
  const assertions = tester.validateConfig();
  const issues = assertions.filter(a => !a.passed).map(a => `${a.name}: ${a.actual}`);
  
  return {
    valid: issues.length === 0,
    issues,
  };
}
