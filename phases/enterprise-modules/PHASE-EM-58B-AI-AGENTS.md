# Phase EM-58B: AI Agents - Templates, UI & Analytics

> **Continuation of:** PHASE-EM-58A-AI-AGENTS.md  
> **Focus:** Pre-built Agents, Real-World Workflows, UI Components, Analytics

---

## 📋 Table of Contents

1. [Pre-built Agent Templates](#pre-built-agent-templates)
2. [Real-World Workflows by Industry](#real-world-workflows-by-industry)
3. [Real-World Workflows by User Type](#real-world-workflows-by-user-type)
4. [Agent Builder UI](#agent-builder-ui)
5. [Agent Marketplace](#agent-marketplace)
6. [Analytics & Monitoring](#analytics--monitoring)
7. [Pricing & Usage Tiers](#pricing--usage-tiers)
8. [Testing Framework](#testing-framework)
9. [Deployment Checklist](#deployment-checklist)

---

## Pre-built Agent Templates

### Template Categories

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT TEMPLATE LIBRARY                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🎯 SALES & MARKETING                                           │
│  ├─ Lead Qualifier                                              │
│  ├─ Sales Development Rep (SDR)                                 │
│  ├─ Email Campaign Manager                                      │
│  ├─ Social Media Scheduler                                      │
│  └─ Competitor Monitor                                          │
│                                                                  │
│  🤝 CUSTOMER SUCCESS                                            │
│  ├─ Customer Health Monitor                                     │
│  ├─ Onboarding Assistant                                        │
│  ├─ Renewal Manager                                             │
│  ├─ Churn Predictor                                             │
│  └─ NPS Follow-up Agent                                         │
│                                                                  │
│  💬 SUPPORT & SERVICE                                           │
│  ├─ Support Triage Agent                                        │
│  ├─ FAQ Answerer                                                │
│  ├─ Escalation Manager                                          │
│  ├─ Ticket Summarizer                                           │
│  └─ SLA Monitor                                                 │
│                                                                  │
│  📊 OPERATIONS & DATA                                           │
│  ├─ Data Cleaner                                                │
│  ├─ Report Generator                                            │
│  ├─ Anomaly Detector                                            │
│  ├─ Inventory Manager                                           │
│  └─ Compliance Checker                                          │
│                                                                  │
│  📅 SCHEDULING & TASKS                                          │
│  ├─ Meeting Scheduler                                           │
│  ├─ Follow-up Reminder                                          │
│  ├─ Task Prioritizer                                            │
│  ├─ Calendar Optimizer                                          │
│  └─ Deadline Monitor                                            │
│                                                                  │
│  🔒 SECURITY & MONITORING                                       │
│  ├─ Security Guardian                                           │
│  ├─ Access Auditor                                              │
│  ├─ Fraud Detector                                              │
│  └─ Compliance Monitor                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Template: Lead Qualifier Agent

```typescript
// templates/lead-qualifier.ts

export const leadQualifierTemplate: AgentTemplate = {
  id: 'lead-qualifier',
  name: 'Lead Qualifier',
  description: 'Automatically qualifies and scores new leads based on your ICP',
  category: 'sales',
  icon: '🎯',
  
  difficulty: 'beginner',
  setupTime: '5 minutes',
  
  // Default configuration
  defaultConfig: {
    name: 'Lead Qualifier',
    type: 'specialist',
    domain: 'sales',
    
    personality: `You are an expert lead qualifier with deep knowledge of B2B sales.
      You analyze leads quickly and accurately, looking for signals that indicate
      a good fit with your company's ideal customer profile (ICP).
      
      You're thorough but efficient - you gather just enough information to make
      a confident qualification decision.`,
    
    systemPrompt: `
## Your Mission
Qualify every new lead that enters the system by:
1. Researching the lead's company and role
2. Scoring them against the ICP criteria
3. Recommending next actions based on score

## ICP Criteria (customize these)
- Company Size: 50-500 employees = High fit
- Industry: SaaS, Tech, Professional Services = High fit
- Role: Decision maker (CEO, VP, Director) = High fit
- Budget Authority: Can make purchase decisions = Critical
- Timeline: Active buying signals = Bonus points

## Scoring System
- 80-100: Hot lead → Immediate outreach
- 60-79: Warm lead → Nurture sequence
- 40-59: Cold lead → Add to long-term nurture
- 0-39: Unqualified → Archive

## Research Steps
1. Check company website for size, industry, funding
2. Look up contact on LinkedIn (if available)
3. Review any previous interactions in CRM
4. Check for buying signals (pricing page visits, content downloads)

## Output Format
Always provide:
- Lead Score (0-100)
- Confidence Level (Low/Medium/High)
- Key Findings (bullet points)
- Recommended Action
- Reasoning for score
    `,
    
    goals: [
      {
        name: 'Qualification Accuracy',
        description: 'Accurately qualify leads against ICP',
        metric: 'qualification_accuracy',
        target: 0.85
      },
      {
        name: 'Processing Speed',
        description: 'Qualify leads quickly',
        metric: 'avg_qualification_time_seconds',
        target: 30
      }
    ],
    
    triggers: [
      'event:crm.contact.created',
      'event:form.submitted'
    ],
    
    allowedTools: [
      'crm_get_contact',
      'crm_update_contact',
      'crm_add_note',
      'crm_add_tag',
      'web_search',
      'data_query'
    ],
    
    constraints: [
      'Do not send emails directly - only draft or recommend',
      'Do not delete or modify contact information',
      'Always explain your reasoning for the score'
    ],
    
    llmModel: 'gpt-4o-mini', // Cost-effective for qualification
    temperature: 0.3,        // More deterministic for scoring
    maxStepsPerRun: 5
  },
  
  // Setup wizard questions
  setupQuestions: [
    {
      id: 'company_size',
      question: 'What company size is your ideal customer?',
      type: 'multi-select',
      options: ['1-10', '11-50', '51-200', '201-500', '500+']
    },
    {
      id: 'industries',
      question: 'What industries do you target?',
      type: 'tags',
      placeholder: 'e.g., SaaS, Healthcare, Finance'
    },
    {
      id: 'decision_makers',
      question: 'What job titles indicate a decision maker?',
      type: 'tags',
      placeholder: 'e.g., CEO, VP Sales, Marketing Director'
    },
    {
      id: 'hot_threshold',
      question: 'What score should trigger immediate outreach?',
      type: 'slider',
      min: 60,
      max: 100,
      default: 80
    }
  ],
  
  // Customize template based on answers
  customize: (answers: Record<string, any>) => ({
    systemPrompt: `
## Your Mission
Qualify every new lead that enters the system.

## ICP Criteria (Customized)
- Company Size: ${answers.company_size.join(', ')} employees = High fit
- Industries: ${answers.industries.join(', ')} = High fit
- Decision Makers: ${answers.decision_makers.join(', ')} = High fit

## Score Thresholds
- ${answers.hot_threshold}+ = Hot lead → Immediate outreach
- ${answers.hot_threshold - 20}-${answers.hot_threshold - 1} = Warm lead → Nurture
- Below ${answers.hot_threshold - 20} = Cold/Unqualified
    `
  })
};
```

### Template: Customer Health Monitor

```typescript
// templates/customer-health-monitor.ts

export const customerHealthMonitorTemplate: AgentTemplate = {
  id: 'customer-health-monitor',
  name: 'Customer Health Monitor',
  description: 'Monitors customer engagement and predicts churn risk',
  category: 'customer-success',
  icon: '💚',
  
  difficulty: 'intermediate',
  setupTime: '10 minutes',
  
  defaultConfig: {
    name: 'Health Monitor',
    type: 'guardian',
    domain: 'customer-success',
    
    personality: `You are a vigilant customer success monitor who deeply cares
      about customer outcomes. You're proactive in identifying at-risk customers
      and always provide actionable recommendations.
      
      You balance urgency with accuracy - you raise alerts when needed but
      avoid creating unnecessary panic with false alarms.`,
    
    systemPrompt: `
## Your Mission
Monitor all customers daily and:
1. Calculate health scores based on engagement signals
2. Identify at-risk customers early
3. Recommend interventions for declining accounts
4. Celebrate wins with healthy customers

## Health Score Components
Weight each factor:
- Login Frequency (25%): Daily=100, Weekly=70, Monthly=40, None=0
- Feature Usage (25%): Active on core features vs. dormant
- Support Tickets (20%): Frequency and sentiment of tickets
- Billing Status (15%): On-time payments, failed charges
- Engagement Trend (15%): Improving, stable, or declining

## Alert Thresholds
- 80-100: Healthy → Monthly check-in
- 60-79: Needs Attention → Bi-weekly check-in
- 40-59: At Risk → Weekly intervention
- 0-39: Critical → Immediate escalation

## Daily Report Format
Generate a summary with:
1. Customers by health tier (count and names)
2. Biggest movers (improved or declined)
3. Immediate actions required
4. Upcoming renewals with health status
    `,
    
    goals: [
      {
        name: 'Early Detection',
        description: 'Identify at-risk customers before they churn',
        metric: 'early_churn_detection_rate',
        target: 0.90
      },
      {
        name: 'False Positive Rate',
        description: 'Minimize unnecessary alerts',
        metric: 'false_positive_rate',
        target: 0.10
      }
    ],
    
    triggers: [
      'schedule:daily_6am'
    ],
    
    allowedTools: [
      'data_query',
      'data_aggregate',
      'crm_search_contacts',
      'crm_add_note',
      'crm_add_tag',
      'task_create',
      'notify_user'
    ],
    
    constraints: [
      'Never contact customers directly',
      'Always explain the reasoning behind health scores',
      'Escalate critical accounts to humans immediately'
    ]
  }
};
```

### Template: Support Triage Agent

```typescript
// templates/support-triage.ts

export const supportTriageTemplate: AgentTemplate = {
  id: 'support-triage',
  name: 'Support Triage',
  description: 'Automatically categorizes, prioritizes, and routes support tickets',
  category: 'support',
  icon: '🎫',
  
  difficulty: 'beginner',
  setupTime: '5 minutes',
  
  defaultConfig: {
    name: 'Support Triage',
    type: 'specialist',
    domain: 'support',
    
    personality: `You are an efficient support triage specialist who ensures
      every ticket gets to the right person quickly. You're empathetic to
      customer frustration but systematic in your approach.
      
      You prioritize based on impact and urgency, not just who complains loudest.`,
    
    systemPrompt: `
## Your Mission
For every new support ticket:
1. Categorize the issue type
2. Assess priority based on impact and urgency
3. Route to the appropriate team/person
4. Provide initial response if possible

## Categories
- Technical: Bugs, errors, integration issues
- Billing: Invoices, payments, refunds
- Account: Login, permissions, settings
- Feature Request: New features, improvements
- How-To: Usage questions, documentation
- Complaint: Service issues, dissatisfaction

## Priority Matrix
| Impact \\ Urgency | Low | Medium | High |
|-------------------|-----|--------|------|
| Low               | P4  | P3     | P3   |
| Medium            | P3  | P2     | P2   |
| High              | P2  | P1     | P1   |
| Critical (outage) | P1  | P1     | P0   |

## Routing Rules
- P0-P1: Escalate to on-call engineer
- Technical: Engineering team
- Billing: Finance team
- Account: Customer Success
- Feature Request: Product team
- How-To: Auto-respond with docs + CS
- Complaint: Customer Success Manager

## Auto-Response Eligibility
Respond automatically if:
- Issue is a known FAQ (link to documentation)
- Simple how-to question with clear answer
- Status inquiry (provide current status)

Escalate to human if:
- Customer is frustrated/angry
- Issue involves money/billing dispute
- Technical issue you can't diagnose
- VIP customer (flag in CRM)
    `,
    
    goals: [
      {
        name: 'Triage Speed',
        description: 'Triage tickets within 5 minutes',
        metric: 'avg_triage_time_seconds',
        target: 300
      },
      {
        name: 'Routing Accuracy',
        description: 'Route to correct team first time',
        metric: 'first_route_accuracy',
        target: 0.95
      },
      {
        name: 'Auto-Resolution',
        description: 'Resolve simple tickets automatically',
        metric: 'auto_resolution_rate',
        target: 0.30
      }
    ],
    
    triggers: [
      'event:support.ticket.created'
    ],
    
    allowedTools: [
      'data_query',
      'crm_get_contact',
      'crm_add_note',
      'email_draft',
      'task_create',
      'notify_user'
    ],
    
    constraints: [
      'Never close a ticket without resolution',
      'Always be empathetic in responses',
      'Escalate billing disputes to humans',
      'Flag VIP customers for priority handling'
    ]
  }
};
```

---

## Real-World Workflows by Industry

### 🏥 Healthcare Industry

#### Workflow: Smart Patient Intake

```yaml
name: Smart Patient Intake
trigger: event:form.submitted (type: 'patient_intake')
agent: Intake Specialist

steps:
  1. Extract Patient Information:
     - Parse insurance card image (OCR via tool)
     - Validate demographics
     - Check for duplicate records
     
  2. Verify Insurance Eligibility:
     - Call insurance verification API
     - Check coverage for planned services
     - Calculate estimated copay
     - Flag any coverage issues
     
  3. Medical History Review:
     - Scan submitted history for red flags
     - Identify allergies and medications
     - Note conditions requiring special prep
     
  4. Pre-Visit Preparation:
     - Generate personalized intake questions
     - Pull relevant consent forms
     - Schedule interpreter if needed
     
  5. Output Actions:
     - Create patient record in system
     - Send welcome email with prep instructions
     - Alert clinical team of special needs
     - Add copay estimate to billing queue
     - Create follow-up task for insurance issues

success_metrics:
  - Time to complete intake: < 2 minutes
  - Insurance verification accuracy: > 98%
  - Patient record completeness: > 95%
```

#### Workflow: Appointment No-Show Predictor

```yaml
name: No-Show Predictor
trigger: schedule:daily_6am
agent: Scheduling Optimizer

steps:
  1. Analyze Tomorrow's Appointments:
     - Get all scheduled appointments
     - Pull patient attendance history
     - Check recent engagement signals
     
  2. Calculate No-Show Risk:
     factors:
       - Past no-show rate (40% weight)
       - Days since last contact (20%)
       - Appointment type (15%)
       - Weather forecast (10%)
       - Day of week pattern (15%)
     
  3. Risk-Based Actions:
     high_risk (> 70%):
       - Send extra reminder (SMS + Email + Call)
       - Prepare backup patient from waitlist
       - Flag for overbooking consideration
       
     medium_risk (40-70%):
       - Send personalized reminder
       - Offer easy reschedule option
       
     low_risk (< 40%):
       - Standard confirmation only

  4. Waitlist Management:
     - Identify patients who can fill gaps
     - Pre-contact potential fillers
     - Automate slot filling on cancellation

success_metrics:
  - No-show rate reduction: 30%
  - Filled cancellation slots: > 80%
  - Prediction accuracy: > 85%
```

### 🏠 Real Estate Industry

#### Workflow: Automated Listing Presentation

```yaml
name: Listing Presentation Builder
trigger: event:crm.appointment.scheduled (type: 'listing_appointment')
agent: Listing Specialist

steps:
  1. Property Research:
     - Pull tax records and ownership history
     - Get property characteristics from MLS
     - Analyze satellite/street view
     - Check permit history
     
  2. Market Analysis (CMA):
     - Find comparable sales (6 months, 1 mile)
     - Analyze active listings (competition)
     - Calculate price per sqft trends
     - Review DOM (days on market) patterns
     
  3. Generate Recommendations:
     - Suggest listing price with range
     - Identify unique selling points
     - Recommend staging/improvements
     - Estimate time to sell
     
  4. Seller Research:
     - Look up seller on LinkedIn
     - Check if relocating (company research)
     - Identify likely motivations
     - Note any shared connections
     
  5. Create Presentation:
     - Build customized CMA report
     - Generate marketing plan
     - Draft listing description
     - Prepare pricing discussion points
     
  6. Output:
     - PDF presentation ready for meeting
     - Talking points for agent
     - Follow-up email template
     - CRM notes with research findings

success_metrics:
  - Presentation creation time: < 10 minutes
  - Listing win rate: track correlation
  - CMA accuracy vs. sale price: within 5%
```

#### Workflow: Lead Nurture Sequence

```yaml
name: Real Estate Lead Nurture
trigger: event:crm.contact.created (source: 'website')
agent: Lead Nurture Specialist

steps:
  1. Initial Qualification:
     - Analyze inquiry details
     - Determine buyer vs. seller vs. investor
     - Assess timeline and motivation
     - Score lead quality (A/B/C/D)
     
  2. Personalization Research:
     - Check which properties they viewed
     - Analyze search criteria patterns
     - Look up any social profiles
     - Note preferred communication channel
     
  3. Create Nurture Plan:
     A_leads:
       - Immediate personal outreach
       - Schedule showing within 48 hours
       - Daily property alerts
       
     B_leads:
       - Same-day email introduction
       - Weekly personalized property digest
       - Educational content drip
       
     C_leads:
       - Add to monthly newsletter
       - Quarterly market update
       - Re-engage triggers (price drops, new listings)
       
     D_leads:
       - Basic drip campaign only
       - Monitor for activity signals
       
  4. Execute First Touch:
     - Send personalized intro email
     - Include relevant property matches
     - Provide market snapshot
     - Clear call-to-action
     
  5. Set Follow-up Automation:
     - Create task sequence
     - Schedule check-ins
     - Set re-engagement triggers

success_metrics:
  - Response rate by lead grade
  - Time to first showing
  - Conversion rate by nurture path
```

### 🛒 E-Commerce Industry

#### Workflow: Abandoned Cart Recovery

```yaml
name: Smart Cart Recovery
trigger: event:cart.abandoned (after: 30_minutes)
agent: Recovery Specialist

steps:
  1. Analyze Cart & Customer:
     - Get cart contents and value
     - Check customer history (first time vs. repeat)
     - Identify any past purchases
     - Look for patterns (always abandons? first timer?)
     
  2. Determine Recovery Strategy:
     high_value_cart (> $200):
       - Personal outreach tone
       - Offer to answer questions
       - Consider phone call (if repeat customer)
       
     repeat_abandoner:
       - A/B test: discount vs. urgency
       - Try different channel than last time
       - Analyze what finally converted before
       
     first_time_visitor:
       - Educational approach
       - Social proof heavy
       - Trust-building content
       
     price_sensitive_signals:
       - Tiered discount ladder
       - Alternative product suggestions
       - Payment plan offer if available
       
  3. Craft Recovery Message:
     - Personalize based on strategy
     - Include product images
     - Add urgency if inventory low
     - Social proof elements
     
  4. Execute Recovery Sequence:
     - 30 min: Helpful reminder (no discount)
     - 24 hours: Light urgency + reviews
     - 48 hours: Small discount (5-10%)
     - 72 hours: Final offer (if warranted)
     
  5. Track & Learn:
     - Monitor open/click/convert
     - Feed results back for optimization
     - Update customer profile

success_metrics:
  - Cart recovery rate: > 15%
  - Revenue recovered per month
  - Discount efficiency (revenue vs. discount given)
```

#### Workflow: Review Management

```yaml
name: AI Review Manager
trigger: event:review.submitted
agent: Review Specialist

steps:
  1. Analyze Review:
     - Extract sentiment (positive/neutral/negative)
     - Identify specific issues mentioned
     - Check product in review
     - Look up customer history
     
  2. Categorize Response Need:
     positive_review (4-5 stars):
       - Thank customer
       - Highlight specific praise
       - Encourage sharing/referral
       - Ask about other products
       
     neutral_review (3 stars):
       - Acknowledge feedback
       - Address specific concerns
       - Offer to improve experience
       - Provide contact for follow-up
       
     negative_review (1-2 stars):
       - Apologize genuinely
       - Address each complaint
       - Offer resolution
       - Flag for human review if complex
       
  3. Draft Response:
     - Match brand voice
     - Personalize with order details
     - Keep professional but warm
     - Include specific remediation if needed
     
  4. Route for Approval:
     auto_approve:
       - Positive reviews
       - Simple neutral reviews
       
     human_approve:
       - Negative reviews
       - Mentions legal issues
       - Mentions refund/compensation
       - VIP customers
       
  5. Follow-Up Actions:
     - Create task for unresolved issues
     - Update product feedback database
     - Trigger refund workflow if approved
     - Send internal alert for patterns

success_metrics:
  - Response time: < 4 hours
  - Response rate: 100% for negative
  - Review score improvement over time
  - Negative review resolution rate
```

### 💼 Professional Services

#### Workflow: Legal Intake & Conflicts

```yaml
name: Legal Intake Processor
trigger: event:form.submitted (type: 'legal_inquiry')
agent: Legal Intake Specialist

steps:
  1. Initial Case Assessment:
     - Extract case type from inquiry
     - Identify parties involved
     - Note key dates (statute of limitations)
     - Assess urgency level
     
  2. Conflict Check:
     - Search all related parties in system
     - Check adverse party databases
     - Review past matter connections
     - Flag potential conflicts
     
  3. Case Viability Analysis:
     - Research similar case outcomes
     - Estimate case value/complexity
     - Calculate likely fee recovery
     - Assess evidence mentioned
     
  4. Generate Intake Report:
     - Case summary
     - Conflict check results
     - Viability assessment
     - Recommended next steps
     - Appropriate attorney match
     
  5. Route & Schedule:
     viable_case:
       - Assign to matched attorney
       - Schedule consultation
       - Send engagement letter
       - Create matter in system
       
     needs_review:
       - Flag for partner review
       - Prepare questions for follow-up
       
     declined:
       - Polite decline email
       - Referral to appropriate resource
       - Document reason for records

success_metrics:
  - Intake processing time: < 1 hour
  - Conflict detection accuracy: 100%
  - Case viability prediction accuracy: > 80%
```

---

## Real-World Workflows by User Type

### 🏢 Agency Owner Workflows

| Agent | Trigger | What It Does | Value |
|-------|---------|--------------|-------|
| **Revenue Guardian** | Daily 7am | Monitors MRR changes, predicts churn, suggests interventions | Protect revenue |
| **Team Performance** | Weekly | Analyzes productivity, identifies bottlenecks, suggests optimizations | Improve efficiency |
| **Client Health Score** | Daily | Scores each client's engagement, flags at-risk accounts | Reduce churn |
| **Opportunity Spotter** | Weekly | Analyzes client usage, identifies upsell opportunities | Increase revenue |
| **Competitor Monitor** | Weekly | Tracks competitor changes, alerts on market shifts | Stay competitive |
| **Hiring Assistant** | On demand | Screens applicants, schedules interviews, coordinates process | Save time |

#### Sample: Client Health Agent

```
RUNS: Daily at 9 AM for each client

ANALYSIS:
   ├─► Activity metrics (logins, feature usage, tickets)
   ├─► Billing status (on-time, late, declined)
   ├─► Engagement trend (growing, stable, declining)
   ├─► Support sentiment (positive, neutral, negative)
   └─► Contract timeline (renewal approaching?)

CALCULATES: 0-100 Health Score

ACTIONS BY SCORE:
   90-100: "Promoter" 
     → Request testimonial
     → Ask for referral
     → Case study candidate
     
   70-89: "Healthy" 
     → Standard check-in
     → Share new features
     → Collect feedback
     
   50-69: "At Risk" 
     → Schedule urgent check-in
     → Offer training session
     → Review usage patterns
     
   25-49: "Critical" 
     → Executive outreach
     → Create success plan
     → Consider pricing review
     
   0-24: "Emergency" 
     → Immediate intervention
     → CEO involvement
     → Retention offer
```

### 👨‍💻 Site Admin Workflows

| Agent | Trigger | What It Does | Value |
|-------|---------|--------------|-------|
| **Content Calendar** | Daily | Analyzes best posting times, suggests schedule | Consistency |
| **SEO Optimizer** | Weekly | Reviews pages, suggests improvements | Traffic |
| **Data Cleaner** | Weekly | Finds duplicates, fixes formatting, fills gaps | Clean data |
| **Report Builder** | Weekly | Generates summaries, identifies trends | Insights |
| **Security Monitor** | Continuous | Checks for unusual activity, vulnerabilities | Protection |
| **Backup Verifier** | Daily | Confirms backups, tests restoration | Peace of mind |

#### Sample: Weekly SEO Agent

```
RUNS: Every Monday at 8 AM

ANALYSIS:
   ├─► Crawl all published pages
   ├─► Check meta titles/descriptions (length, keywords)
   ├─► Analyze content quality (readability, keyword density)
   ├─► Check image alt tags, broken links
   ├─► Compare to competitor rankings
   └─► Review search console data

GENERATES:
   ├─► SEO health score per page (0-100)
   ├─► Priority fix recommendations
   ├─► Content gap opportunities
   └─► Traffic prediction for next week

ACTIONS:
   ├─► Auto-fix simple issues:
   │     - Meta title length
   │     - Missing alt tags
   │     - Broken internal links
   │
   ├─► Create tasks for:
   │     - Content improvements needed
   │     - New content opportunities
   │     - Technical fixes required
   │
   └─► Send digest email with:
         - This week's score vs. last week
         - Top priorities
         - Quick wins to tackle
```

### 👤 Client User Workflows

| Agent | Trigger | What It Does | Value |
|-------|---------|--------------|-------|
| **Personal Assistant** | On demand | Answers questions, helps navigate | Better UX |
| **Reminder Manager** | Event-based | Proactive reminders for appointments, deadlines | Never miss |
| **Document Helper** | Form interaction | Helps fill forms, validates submissions | Reduce errors |
| **Progress Tracker** | Milestone reached | Shows journey, celebrates achievements | Engagement |
| **Feedback Collector** | After interaction | Gathers feedback, routes complaints | Voice heard |

---

## Agent Builder UI

### Agent Builder Components

```typescript
// src/components/ai-agents/agent-builder/AgentBuilder.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentIdentity } from './AgentIdentity';
import { AgentPersonality } from './AgentPersonality';
import { AgentGoals } from './AgentGoals';
import { AgentTriggers } from './AgentTriggers';
import { AgentTools } from './AgentTools';
import { AgentConstraints } from './AgentConstraints';
import { AgentSettings } from './AgentSettings';
import { AgentPreview } from './AgentPreview';
import { AgentTestPanel } from './AgentTestPanel';

interface AgentBuilderProps {
  initialAgent?: AgentConfig;
  onSave: (agent: AgentConfig) => Promise<void>;
  templates: AgentTemplate[];
}

export function AgentBuilder({ initialAgent, onSave, templates }: AgentBuilderProps) {
  const [agent, setAgent] = useState<AgentConfig>(
    initialAgent || createDefaultAgent()
  );
  const [activeTab, setActiveTab] = useState('identity');
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult | null>(null);

  const updateAgent = (updates: Partial<AgentConfig>) => {
    setAgent(prev => ({ ...prev, ...updates }));
  };

  const handleStartFromTemplate = (template: AgentTemplate) => {
    setAgent({
      ...createDefaultAgent(),
      ...template.defaultConfig,
      name: `${template.name} (Copy)`,
    });
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const result = await testAgent(agent);
      setTestResults(result);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Builder */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{agent.avatar || '🤖'}</span>
              {agent.name || 'New Agent'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-7 w-full">
                <TabsTrigger value="identity">Identity</TabsTrigger>
                <TabsTrigger value="personality">Personality</TabsTrigger>
                <TabsTrigger value="goals">Goals</TabsTrigger>
                <TabsTrigger value="triggers">Triggers</TabsTrigger>
                <TabsTrigger value="tools">Tools</TabsTrigger>
                <TabsTrigger value="constraints">Rules</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="identity">
                <AgentIdentity
                  agent={agent}
                  onChange={updateAgent}
                  templates={templates}
                  onSelectTemplate={handleStartFromTemplate}
                />
              </TabsContent>

              <TabsContent value="personality">
                <AgentPersonality
                  personality={agent.personality}
                  systemPrompt={agent.systemPrompt}
                  examples={agent.examples}
                  onChange={updateAgent}
                />
              </TabsContent>

              <TabsContent value="goals">
                <AgentGoals
                  goals={agent.goals}
                  onChange={(goals) => updateAgent({ goals })}
                />
              </TabsContent>

              <TabsContent value="triggers">
                <AgentTriggers
                  triggers={agent.triggers}
                  schedule={agent.triggerSchedule}
                  conditions={agent.triggerConditions}
                  onChange={updateAgent}
                />
              </TabsContent>

              <TabsContent value="tools">
                <AgentTools
                  allowedTools={agent.allowedTools}
                  deniedTools={agent.deniedTools}
                  onChange={updateAgent}
                />
              </TabsContent>

              <TabsContent value="constraints">
                <AgentConstraints
                  constraints={agent.constraints}
                  onChange={(constraints) => updateAgent({ constraints })}
                />
              </TabsContent>

              <TabsContent value="settings">
                <AgentSettings
                  settings={{
                    llmProvider: agent.llmProvider,
                    llmModel: agent.llmModel,
                    temperature: agent.temperature,
                    maxTokens: agent.maxTokens,
                    maxStepsPerRun: agent.maxStepsPerRun,
                    timeoutSeconds: agent.timeoutSeconds,
                    maxRunsPerHour: agent.maxRunsPerHour,
                  }}
                  onChange={updateAgent}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Preview & Test Panel */}
      <div className="space-y-6">
        <AgentPreview agent={agent} />
        
        <AgentTestPanel
          agent={agent}
          isLoading={isTesting}
          results={testResults}
          onTest={handleTest}
        />

        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onSave({ ...agent, isActive: false })}
              >
                Save Draft
              </Button>
              <Button
                className="flex-1"
                onClick={() => onSave({ ...agent, isActive: true })}
              >
                Activate Agent
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### Agent Identity Panel

```typescript
// src/components/ai-agents/agent-builder/AgentIdentity.tsx

'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmojiPicker } from '@/components/ui/emoji-picker';

const AGENT_TYPES = [
  { value: 'assistant', label: 'Assistant', description: 'General purpose helper' },
  { value: 'specialist', label: 'Specialist', description: 'Domain expert (sales, support, etc.)' },
  { value: 'orchestrator', label: 'Orchestrator', description: 'Manages other agents' },
  { value: 'analyst', label: 'Analyst', description: 'Data analysis and reporting' },
  { value: 'guardian', label: 'Guardian', description: 'Monitoring and alerting' },
];

const DOMAINS = [
  'sales', 'marketing', 'support', 'success', 'operations', 
  'finance', 'hr', 'legal', 'product', 'engineering', 'general'
];

interface AgentIdentityProps {
  agent: AgentConfig;
  onChange: (updates: Partial<AgentConfig>) => void;
  templates: AgentTemplate[];
  onSelectTemplate: (template: AgentTemplate) => void;
}

export function AgentIdentity({ 
  agent, 
  onChange, 
  templates, 
  onSelectTemplate 
}: AgentIdentityProps) {
  return (
    <div className="space-y-6 py-4">
      {/* Quick Start Templates */}
      <div>
        <Label className="text-base font-semibold">Start from Template</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Choose a pre-built agent to customize
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {templates.slice(0, 6).map((template) => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className="p-3 border rounded-lg hover:border-primary hover:bg-primary/5 text-left transition-colors"
            >
              <div className="text-2xl mb-1">{template.icon}</div>
              <div className="font-medium text-sm">{template.name}</div>
              <div className="text-xs text-muted-foreground">
                {template.difficulty} • {template.setupTime}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t pt-6">
        <Label className="text-base font-semibold">Or Build Custom</Label>
      </div>

      {/* Name & Avatar */}
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <Label>Avatar</Label>
          <EmojiPicker
            value={agent.avatar || '🤖'}
            onChange={(emoji) => onChange({ avatar: emoji })}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="name">Agent Name</Label>
          <Input
            id="name"
            value={agent.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g., Sales Assistant, Support Helper"
          />
        </div>
      </div>

      {/* Type & Domain */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Agent Type</Label>
          <Select
            value={agent.agentType}
            onValueChange={(value) => onChange({ agentType: value as any })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {AGENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {type.description}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Domain / Department</Label>
          <Select
            value={agent.domain || ''}
            onValueChange={(value) => onChange({ domain: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select domain" />
            </SelectTrigger>
            <SelectContent>
              {DOMAINS.map((domain) => (
                <SelectItem key={domain} value={domain}>
                  {domain.charAt(0).toUpperCase() + domain.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={agent.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Briefly describe what this agent does..."
          rows={2}
        />
      </div>

      {/* Capabilities */}
      <div>
        <Label>Capabilities</Label>
        <p className="text-sm text-muted-foreground mb-2">
          What can this agent do? (helps with discovery)
        </p>
        <TagInput
          value={agent.capabilities || []}
          onChange={(capabilities) => onChange({ capabilities })}
          suggestions={[
            'lead_qualification', 'email_drafting', 'data_analysis',
            'customer_support', 'scheduling', 'reporting', 'monitoring'
          ]}
          placeholder="Add capability..."
        />
      </div>
    </div>
  );
}
```

### Agent Tools Selection

```typescript
// src/components/ai-agents/agent-builder/AgentTools.tsx

'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Shield, AlertTriangle } from 'lucide-react';
import { getAvailableTools } from '@/lib/ai-agents/tools';

const TOOL_CATEGORIES = [
  { id: 'crm', label: 'CRM', icon: '👥' },
  { id: 'communication', label: 'Communication', icon: '📧' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'data', label: 'Data', icon: '📊' },
  { id: 'web', label: 'Web', icon: '🌐' },
  { id: 'system', label: 'System', icon: '⚙️' },
];

interface AgentToolsProps {
  allowedTools: string[];
  deniedTools: string[];
  onChange: (updates: { allowedTools?: string[]; deniedTools?: string[] }) => void;
}

export function AgentTools({ allowedTools, deniedTools, onChange }: AgentToolsProps) {
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    getAvailableTools().then(setTools);
  }, []);

  const filteredTools = tools.filter(tool => {
    if (search && !tool.name.toLowerCase().includes(search.toLowerCase()) &&
        !tool.description.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (selectedCategory && tool.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const isToolAllowed = (toolName: string) => {
    if (deniedTools.includes(toolName)) return false;
    return allowedTools.some(pattern => {
      if (pattern.endsWith('*')) {
        return toolName.startsWith(pattern.slice(0, -1));
      }
      return pattern === toolName;
    });
  };

  const toggleTool = (toolName: string) => {
    const isCurrentlyAllowed = isToolAllowed(toolName);
    
    if (isCurrentlyAllowed) {
      // Remove from allowed, add to denied
      onChange({
        allowedTools: allowedTools.filter(t => t !== toolName),
        deniedTools: [...deniedTools, toolName]
      });
    } else {
      // Add to allowed, remove from denied
      onChange({
        allowedTools: [...allowedTools, toolName],
        deniedTools: deniedTools.filter(t => t !== toolName)
      });
    }
  };

  const toggleCategoryWildcard = (category: string) => {
    const wildcard = `${category}_*`;
    const hasWildcard = allowedTools.includes(wildcard);
    
    if (hasWildcard) {
      onChange({
        allowedTools: allowedTools.filter(t => t !== wildcard)
      });
    } else {
      // Remove individual tools in category, add wildcard
      const categoryTools = tools
        .filter(t => t.category === category)
        .map(t => t.name);
      
      onChange({
        allowedTools: [
          ...allowedTools.filter(t => !categoryTools.includes(t)),
          wildcard
        ]
      });
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div>
        <Label className="text-base font-semibold">Tool Access</Label>
        <p className="text-sm text-muted-foreground">
          Select which tools this agent can use to complete tasks
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tools..."
          className="pl-9"
        />
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedCategory === null ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Badge>
        {TOOL_CATEGORIES.map((cat) => (
          <Badge
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.icon} {cat.label}
          </Badge>
        ))}
      </div>

      {/* Tool List */}
      <div className="space-y-4">
        {TOOL_CATEGORIES.filter(
          cat => !selectedCategory || cat.id === selectedCategory
        ).map((category) => {
          const categoryTools = filteredTools.filter(t => t.category === category.id);
          if (categoryTools.length === 0) return null;
          
          const wildcard = `${category.id}_*`;
          const hasWildcard = allowedTools.includes(wildcard);
          
          return (
            <div key={category.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.icon}</span>
                  <span className="font-medium">{category.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {categoryTools.length} tools
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">All</span>
                  <Switch
                    checked={hasWildcard}
                    onCheckedChange={() => toggleCategoryWildcard(category.id)}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                {categoryTools.map((tool) => (
                  <div
                    key={tool.name}
                    className={`flex items-start gap-3 p-2 rounded-md border ${
                      isToolAllowed(tool.name)
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-muted/30'
                    }`}
                  >
                    <Checkbox
                      checked={isToolAllowed(tool.name)}
                      onCheckedChange={() => toggleTool(tool.name)}
                      disabled={hasWildcard}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {tool.displayName}
                        </span>
                        {tool.isDangerous && (
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                        )}
                        {tool.requiresPermissions?.length > 0 && (
                          <Shield className="h-3 w-3 text-blue-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="text-sm font-medium mb-2">Access Summary</div>
        <div className="flex flex-wrap gap-2">
          {allowedTools.map((tool) => (
            <Badge key={tool} variant="default">
              {tool}
            </Badge>
          ))}
          {deniedTools.map((tool) => (
            <Badge key={tool} variant="destructive">
              ✗ {tool}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Agent Test Panel

```typescript
// src/components/ai-agents/agent-builder/AgentTestPanel.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

interface AgentTestPanelProps {
  agent: AgentConfig;
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

  return (
    <Card>
      <CardHeader>
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
          />
        </div>

        {/* Run Test */}
        <Button
          onClick={() => onTest(customScenario || selectedScenario)}
          disabled={isLoading || !agent.name}
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

        {/* Results */}
        {results && (
          <div className="space-y-3 border-t pt-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              {results.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {results.success ? 'Test Passed' : 'Test Failed'}
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-muted/50 rounded p-2 text-center">
                <Clock className="h-4 w-4 mx-auto mb-1" />
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
                      <span className="text-muted-foreground truncate">
                        {JSON.stringify(action.input).slice(0, 50)}...
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
              <div className="text-sm text-red-600 bg-red-50 rounded p-2">
                {results.error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Agent Marketplace

### Marketplace Schema Addition

```sql
-- Add to em-58-ai-agents.sql

-- Marketplace Agent Listings
CREATE TABLE IF NOT EXISTS ai_agent_marketplace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template reference
  template_id TEXT NOT NULL UNIQUE,
  
  -- Listing info
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  icon TEXT DEFAULT '🤖',
  screenshots TEXT[] DEFAULT '{}',
  demo_video_url TEXT,
  
  -- Author
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  author_verified BOOLEAN DEFAULT false,
  
  -- Pricing
  pricing_type TEXT CHECK (pricing_type IN ('free', 'one_time', 'subscription')),
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  price_one_time DECIMAL(10,2),
  
  -- Stats
  installs_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  
  -- Metadata
  requirements TEXT[],            -- Required modules, integrations
  version TEXT DEFAULT '1.0.0',
  changelog JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Reviews
CREATE TABLE IF NOT EXISTS ai_agent_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id UUID NOT NULL REFERENCES ai_agent_marketplace(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  
  -- Helpfulness
  helpful_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_verified_purchase BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (marketplace_id, user_id)
);

-- Agent Installations
CREATE TABLE IF NOT EXISTS ai_agent_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  marketplace_id UUID NOT NULL REFERENCES ai_agent_marketplace(id),
  agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
  
  -- Installation info
  installed_version TEXT,
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Licensing
  license_type TEXT,
  license_expires_at TIMESTAMPTZ,
  
  -- Usage
  total_runs INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  
  UNIQUE (site_id, marketplace_id)
);
```

### Marketplace UI Component

```typescript
// src/components/ai-agents/marketplace/AgentMarketplace.tsx

'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Search, Star, Download, Filter } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'sales', label: 'Sales' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'support', label: 'Support' },
  { id: 'operations', label: 'Operations' },
  { id: 'analytics', label: 'Analytics' },
];

interface AgentMarketplaceProps {
  onInstall: (agentId: string) => Promise<void>;
}

export function AgentMarketplace({ onInstall }: AgentMarketplaceProps) {
  const [agents, setAgents] = useState<MarketplaceAgent[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest'>('popular');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMarketplaceAgents().then(setAgents).finally(() => setIsLoading(false));
  }, [category, sortBy]);

  const filteredAgents = agents.filter(agent => {
    if (search && !agent.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (category !== 'all' && agent.category !== category) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Agent Marketplace</h2>
        <p className="text-muted-foreground">
          Browse and install pre-built AI agents for your site
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              size="sm"
              variant={category === cat.id ? 'default' : 'outline'}
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map((agent) => (
          <Card key={agent.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="text-4xl">{agent.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {agent.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{agent.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    ({agent.ratingCount})
                  </span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Download className="h-4 w-4" />
                  <span>{agent.installs.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1 mt-3">
                <Badge variant="secondary">{agent.category}</Badge>
                {agent.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </CardContent>
            
            <CardFooter className="flex items-center justify-between border-t pt-4">
              <div>
                {agent.pricingType === 'free' ? (
                  <span className="font-semibold text-green-600">Free</span>
                ) : (
                  <span className="font-semibold">
                    ${agent.priceMonthly}/mo
                  </span>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => onInstall(agent.id)}
              >
                Install
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredAgents.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="font-semibold mb-2">No agents found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## Analytics & Monitoring

### Agent Analytics Dashboard

```typescript
// src/components/ai-agents/analytics/AgentAnalytics.tsx

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

interface AgentAnalyticsProps {
  siteId: string;
  dateRange: { start: Date; end: Date };
}

export function AgentAnalytics({ siteId, dateRange }: AgentAnalyticsProps) {
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentAnalytics(siteId, dateRange)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [siteId, dateRange]);

  if (loading || !stats) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Runs"
          value={stats.totalRuns.toLocaleString()}
          change={stats.runsChange}
          icon="🚀"
        />
        <StatCard
          title="Success Rate"
          value={`${(stats.successRate * 100).toFixed(1)}%`}
          change={stats.successRateChange}
          icon="✅"
        />
        <StatCard
          title="Tokens Used"
          value={formatTokens(stats.tokensUsed)}
          change={stats.tokensChange}
          icon="🎯"
        />
        <StatCard
          title="Estimated Cost"
          value={`$${stats.estimatedCost.toFixed(2)}`}
          change={stats.costChange}
          icon="💰"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Runs Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Runs Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.runsOverTime}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="runs"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Success vs Failure */}
        <Card>
          <CardHeader>
            <CardTitle>Execution Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Successful', value: stats.successfulRuns },
                    { name: 'Failed', value: stats.failedRuns },
                    { name: 'Cancelled', value: stats.cancelledRuns },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#ef4444" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Agents */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topAgents} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="runs" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tool Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Most Used Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topTools.map((tool, i) => (
                <div key={tool.name} className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-muted-foreground w-6">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{tool.displayName}</span>
                      <span className="text-sm text-muted-foreground">
                        {tool.calls.toLocaleString()} calls
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(tool.calls / stats.topTools[0].calls) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Executions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <ExecutionTable executions={stats.recentExecutions} />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Pricing & Usage Tiers

### AI Agent Pricing Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI AGENT PRICING TIERS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FREE TIER                                                       │
│  └─ Included with any plan                                      │
│     ├─ 2 active agents                                          │
│     ├─ 100 AI runs/month                                        │
│     ├─ Basic templates only                                     │
│     └─ Community support                                        │
│                                                                  │
│  STARTER - $29/month (part of Starter plan)                     │
│  └─ Everything in Free, plus:                                   │
│     ├─ 5 active agents                                          │
│     ├─ 500 AI runs/month                                        │
│     ├─ 500 AI actions/month                                     │
│     ├─ All free templates                                       │
│     ├─ Custom agent builder                                     │
│     └─ Email support                                            │
│                                                                  │
│  PRO - $99/month (part of Pro plan)                             │
│  └─ Everything in Starter, plus:                                │
│     ├─ 25 active agents                                         │
│     ├─ 5,000 AI runs/month                                      │
│     ├─ 5,000 AI actions/month                                   │
│     ├─ Premium templates                                        │
│     ├─ Agent marketplace access                                 │
│     ├─ Priority LLM queue                                       │
│     ├─ Advanced analytics                                       │
│     └─ Priority support                                         │
│                                                                  │
│  ENTERPRISE - Custom pricing                                     │
│  └─ Everything in Pro, plus:                                    │
│     ├─ Unlimited agents                                         │
│     ├─ Unlimited runs                                           │
│     ├─ Custom agent development                                 │
│     ├─ Dedicated LLM capacity                                   │
│     ├─ Custom LLM integration (bring your own)                  │
│     ├─ SLA guarantees                                           │
│     ├─ SSO/SAML                                                 │
│     └─ Dedicated success manager                                │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  OVERAGE PRICING                                                 │
│  ├─ Additional AI runs: $0.005 per run                          │
│  ├─ Additional AI actions: $0.01 per action                     │
│  └─ Premium models (GPT-4): 2x overage rate                     │
│                                                                  │
│  MARKETPLACE ADD-ONS                                             │
│  ├─ Individual premium agents: $5-$49/month                     │
│  └─ Agent packs: $29-$99/month                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Usage Tracking Implementation

```typescript
// src/lib/ai-agents/billing/usage-tracker.ts

import { createClient } from '@/lib/supabase/server';

interface UsageLimits {
  maxAgents: number;
  maxRunsPerMonth: number;
  maxActionsPerMonth: number;
  allowedModels: string[];
}

const PLAN_LIMITS: Record<string, UsageLimits> = {
  free: {
    maxAgents: 2,
    maxRunsPerMonth: 100,
    maxActionsPerMonth: 100,
    allowedModels: ['gpt-4o-mini'],
  },
  starter: {
    maxAgents: 5,
    maxRunsPerMonth: 500,
    maxActionsPerMonth: 500,
    allowedModels: ['gpt-4o-mini', 'gpt-4o'],
  },
  pro: {
    maxAgents: 25,
    maxRunsPerMonth: 5000,
    maxActionsPerMonth: 5000,
    allowedModels: ['gpt-4o-mini', 'gpt-4o', 'claude-3-5-sonnet'],
  },
  enterprise: {
    maxAgents: Infinity,
    maxRunsPerMonth: Infinity,
    maxActionsPerMonth: Infinity,
    allowedModels: ['*'],
  },
};

export class UsageTracker {
  /**
   * Check if site can create more agents
   */
  async canCreateAgent(siteId: string): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    reason?: string;
  }> {
    const supabase = await createClient();
    
    // Get site's plan
    const plan = await this.getSitePlan(siteId);
    const limits = PLAN_LIMITS[plan];
    
    // Count current active agents
    const { count } = await supabase
      .from('ai_agents')
      .select('*', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('is_active', true);
    
    const current = count || 0;
    
    if (current >= limits.maxAgents) {
      return {
        allowed: false,
        current,
        limit: limits.maxAgents,
        reason: `You've reached the maximum of ${limits.maxAgents} active agents on your ${plan} plan.`
      };
    }
    
    return { allowed: true, current, limit: limits.maxAgents };
  }

  /**
   * Check if site can run an agent
   */
  async canRunAgent(siteId: string, model?: string): Promise<{
    allowed: boolean;
    remainingRuns: number;
    reason?: string;
  }> {
    const supabase = await createClient();
    
    const plan = await this.getSitePlan(siteId);
    const limits = PLAN_LIMITS[plan];
    
    // Check model allowance
    if (model && limits.allowedModels[0] !== '*' && 
        !limits.allowedModels.includes(model)) {
      return {
        allowed: false,
        remainingRuns: 0,
        reason: `Model ${model} is not available on your ${plan} plan.`
      };
    }
    
    // Get current period usage
    const usage = await this.getCurrentPeriodUsage(siteId);
    
    if (usage.runs >= limits.maxRunsPerMonth) {
      // Check if overage is allowed/configured
      const overageAllowed = await this.isOverageEnabled(siteId);
      
      if (!overageAllowed) {
        return {
          allowed: false,
          remainingRuns: 0,
          reason: `You've used all ${limits.maxRunsPerMonth} AI runs this month.`
        };
      }
      
      // Allow with overage tracking
      return {
        allowed: true,
        remainingRuns: -1, // Indicates overage mode
      };
    }
    
    return {
      allowed: true,
      remainingRuns: limits.maxRunsPerMonth - usage.runs
    };
  }

  /**
   * Record usage after execution
   */
  async recordUsage(
    siteId: string,
    agentId: string,
    execution: {
      tokens: number;
      toolCalls: number;
      model: string;
      success: boolean;
    }
  ): Promise<void> {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];
    
    // Update daily usage
    await supabase.rpc('increment_ai_usage', {
      p_site_id: siteId,
      p_date: today,
      p_runs: 1,
      p_tokens: execution.tokens,
      p_tool_calls: execution.toolCalls
    });
    
    // Track for billing
    const plan = await this.getSitePlan(siteId);
    const limits = PLAN_LIMITS[plan];
    const usage = await this.getCurrentPeriodUsage(siteId);
    
    // Check if this is overage
    if (usage.runs > limits.maxRunsPerMonth) {
      await this.recordOverage(siteId, {
        type: 'ai_run',
        quantity: 1,
        unitPrice: 0.005,
        model: execution.model
      });
    }
  }

  /**
   * Get usage dashboard data
   */
  async getUsageDashboard(siteId: string): Promise<UsageDashboard> {
    const plan = await this.getSitePlan(siteId);
    const limits = PLAN_LIMITS[plan];
    const usage = await this.getCurrentPeriodUsage(siteId);
    const dailyUsage = await this.getDailyUsage(siteId, 30);
    
    return {
      plan,
      period: this.getCurrentPeriod(),
      runs: {
        used: usage.runs,
        limit: limits.maxRunsPerMonth,
        percentage: Math.min((usage.runs / limits.maxRunsPerMonth) * 100, 100),
        overage: Math.max(0, usage.runs - limits.maxRunsPerMonth)
      },
      actions: {
        used: usage.actions,
        limit: limits.maxActionsPerMonth,
        percentage: Math.min((usage.actions / limits.maxActionsPerMonth) * 100, 100),
        overage: Math.max(0, usage.actions - limits.maxActionsPerMonth)
      },
      tokens: {
        used: usage.tokens,
        estimatedCost: this.calculateTokenCost(usage.tokens)
      },
      agents: {
        active: usage.activeAgents,
        limit: limits.maxAgents
      },
      dailyBreakdown: dailyUsage,
      projectedOverage: this.projectOverage(usage, limits)
    };
  }
}
```

---

## Testing Framework

### Agent Test Utilities

```typescript
// src/lib/ai-agents/testing/test-utils.ts

import { AgentConfig, AgentContext, ExecutionResult } from '../types';
import { AgentExecutor } from '../runtime/agent-executor';

export interface TestScenario {
  name: string;
  description: string;
  trigger: TriggerContext;
  expectedBehavior: {
    shouldSucceed: boolean;
    expectedTools?: string[];
    expectedOutput?: Partial<ExecutionResult>;
    maxSteps?: number;
    maxTokens?: number;
  };
  mockResponses?: Record<string, any>;
}

export class AgentTester {
  private executor: AgentExecutor;
  private mockTools: Map<string, jest.Mock> = new Map();

  constructor() {
    this.executor = new AgentExecutor(
      new MockLLMProvider(),
      new MockToolExecutor(this.mockTools),
      new MockMemoryManager()
    );
  }

  /**
   * Run a single test scenario
   */
  async runScenario(
    agent: AgentConfig,
    scenario: TestScenario
  ): Promise<TestResult> {
    const startTime = Date.now();
    
    // Set up mocks
    if (scenario.mockResponses) {
      for (const [tool, response] of Object.entries(scenario.mockResponses)) {
        this.mockToolResponse(tool, response);
      }
    }
    
    try {
      // Execute agent
      const result = await this.executor.execute(agent, scenario.trigger);
      
      // Validate results
      const validations = this.validateResult(result, scenario.expectedBehavior);
      
      return {
        scenario: scenario.name,
        passed: validations.every(v => v.passed),
        duration: Date.now() - startTime,
        result,
        validations
      };
      
    } catch (error) {
      return {
        scenario: scenario.name,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        validations: []
      };
    }
  }

  /**
   * Run all test scenarios for an agent
   */
  async runAllScenarios(
    agent: AgentConfig,
    scenarios: TestScenario[]
  ): Promise<TestSuiteResult> {
    const results: TestResult[] = [];
    
    for (const scenario of scenarios) {
      const result = await this.runScenario(agent, scenario);
      results.push(result);
    }
    
    return {
      agent: agent.name,
      totalScenarios: scenarios.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      results
    };
  }

  /**
   * Generate test scenarios from agent config
   */
  generateScenarios(agent: AgentConfig): TestScenario[] {
    const scenarios: TestScenario[] = [];
    
    // Generate happy path scenario
    scenarios.push({
      name: 'Happy Path',
      description: 'Agent completes successfully with typical input',
      trigger: this.generateTypicalTrigger(agent),
      expectedBehavior: {
        shouldSucceed: true,
        maxSteps: agent.maxStepsPerRun || 10
      }
    });
    
    // Generate edge case scenarios based on agent type
    if (agent.agentType === 'specialist' && agent.domain === 'sales') {
      scenarios.push({
        name: 'Low Quality Lead',
        description: 'Agent handles low quality lead appropriately',
        trigger: { type: 'event', event: 'crm.contact.created', data: { quality: 'low' } },
        expectedBehavior: {
          shouldSucceed: true,
          expectedTools: ['crm_add_tag']
        }
      });
    }
    
    // Generate error scenarios
    scenarios.push({
      name: 'Tool Failure Recovery',
      description: 'Agent handles tool failure gracefully',
      trigger: this.generateTypicalTrigger(agent),
      mockResponses: {
        [agent.allowedTools[0]]: { success: false, error: 'Service unavailable' }
      },
      expectedBehavior: {
        shouldSucceed: true, // Should recover or fail gracefully
      }
    });
    
    return scenarios;
  }

  private validateResult(
    result: ExecutionResult,
    expected: TestScenario['expectedBehavior']
  ): ValidationResult[] {
    const validations: ValidationResult[] = [];
    
    // Check success
    validations.push({
      name: 'Success Status',
      passed: result.success === expected.shouldSucceed,
      expected: expected.shouldSucceed,
      actual: result.success
    });
    
    // Check tools used
    if (expected.expectedTools) {
      const usedTools = result.actions.map(a => a.tool);
      const allToolsUsed = expected.expectedTools.every(t => usedTools.includes(t));
      validations.push({
        name: 'Expected Tools Used',
        passed: allToolsUsed,
        expected: expected.expectedTools,
        actual: usedTools
      });
    }
    
    // Check step count
    if (expected.maxSteps) {
      validations.push({
        name: 'Step Count',
        passed: result.steps.length <= expected.maxSteps,
        expected: `<= ${expected.maxSteps}`,
        actual: result.steps.length
      });
    }
    
    return validations;
  }
}
```

---

## Deployment Checklist

### Pre-Launch Checklist

```markdown
## AI Agents Deployment Checklist

### Database
- [ ] Run migration: `em-58-ai-agents.sql`
- [ ] Verify RLS policies are active
- [ ] Seed default tools
- [ ] Create indexes
- [ ] Enable pg_vector extension (if not already)

### Environment Variables
- [ ] OPENAI_API_KEY (or ANTHROPIC_API_KEY)
- [ ] AI_AGENT_MAX_CONCURRENT_EXECUTIONS
- [ ] AI_AGENT_DEFAULT_TIMEOUT_SECONDS
- [ ] AI_AGENT_RATE_LIMIT_PER_MINUTE

### Feature Flags
- [ ] AI_AGENTS_ENABLED=true
- [ ] AI_AGENTS_MARKETPLACE_ENABLED=true
- [ ] AI_AGENTS_APPROVALS_ENABLED=true

### Backend
- [ ] Deploy agent runtime service
- [ ] Set up execution queue (Redis/BullMQ)
- [ ] Configure LLM provider failover
- [ ] Set up usage tracking cron job
- [ ] Configure monitoring/alerting

### Frontend
- [ ] Deploy agent builder UI
- [ ] Deploy marketplace UI
- [ ] Deploy analytics dashboard
- [ ] Test all components

### Documentation
- [ ] Update API documentation
- [ ] Create user guides
- [ ] Prepare template library
- [ ] Record demo videos

### Testing
- [ ] Run test suite
- [ ] Load test execution engine
- [ ] Test rate limiting
- [ ] Test approval workflow
- [ ] Test billing integration

### Monitoring
- [ ] Set up execution monitoring
- [ ] Configure cost alerts
- [ ] Set up error tracking
- [ ] Create dashboards

### Launch
- [ ] Enable for beta users first
- [ ] Monitor for issues
- [ ] Gather feedback
- [ ] Gradual rollout
```

---

## Integration with Automation Engine (EM-57)

### How AI Agents & Automation Work Together

```
┌─────────────────────────────────────────────────────────────────┐
│                 AUTOMATION + AI AGENTS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  AUTOMATION ENGINE (EM-57)          AI AGENTS (EM-58)           │
│  ────────────────────────          ──────────────────           │
│  • Deterministic workflows          • Intelligent decisions     │
│  • Fixed trigger → action           • Goal-oriented behavior    │
│  • No reasoning required            • Adaptive responses        │
│  • Predictable execution            • Learning from outcomes    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              INTEGRATION PATTERNS                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Pattern 1: AI as Workflow Action                               │
│  ─────────────────────────────────                              │
│  Workflow: Lead Nurture                                         │
│    Step 1: Wait 24 hours                                        │
│    Step 2: [AI Action] Personalize email based on lead data     │
│    Step 3: Send email                                           │
│    Step 4: Track opens                                          │
│                                                                  │
│  Pattern 2: AI as Workflow Trigger                              │
│  ─────────────────────────────────                              │
│  AI Agent detects churn risk → Triggers retention workflow      │
│  AI Agent qualifies lead → Triggers sales outreach workflow     │
│                                                                  │
│  Pattern 3: AI as Workflow Router                               │
│  ─────────────────────────────────                              │
│  Event occurs → AI Agent analyzes → Chooses which workflow      │
│  Example: Support ticket → AI determines → Bug/Feature/Billing  │
│                                                                  │
│  Pattern 4: Workflow Spawns AI Agent                            │
│  ─────────────────────────────────                              │
│  Complex decision point in workflow → Hand off to AI Agent      │
│  AI Agent resolves → Returns result to workflow                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### AI Action for Workflows

```typescript
// src/lib/ai-agents/actions/ai-workflow-action.ts

import { WorkflowAction, ActionResult } from '@/lib/automation/types';
import { AgentExecutor } from '../runtime/agent-executor';

export const aiDecisionAction: WorkflowAction = {
  type: 'ai_decision',
  name: 'AI Decision',
  description: 'Use AI to make a decision based on context',
  category: 'ai',
  
  parameters: {
    prompt: {
      type: 'text',
      required: true,
      description: 'The decision prompt for the AI'
    },
    options: {
      type: 'array',
      required: true,
      description: 'Possible decision outcomes'
    },
    context_fields: {
      type: 'array',
      required: false,
      description: 'Additional context fields to include'
    }
  },
  
  async execute(params, context): Promise<ActionResult> {
    const executor = new AgentExecutor();
    
    // Build decision prompt
    const fullPrompt = `
Based on the following context, make a decision.

Context:
${JSON.stringify(context.variables, null, 2)}

Question: ${params.prompt}

Possible answers (choose one):
${params.options.map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')}

Respond with ONLY the number of your choice and brief reasoning.
`;
    
    const result = await executor.executeQuickDecision(fullPrompt);
    
    // Parse decision
    const decision = this.parseDecision(result, params.options);
    
    return {
      success: true,
      data: {
        decision: decision.option,
        reasoning: decision.reasoning,
        confidence: decision.confidence
      },
      // Route workflow based on decision
      nextBranch: decision.option
    };
  }
};
```

---

*Document Version: 1.0*  
*Created: 2026-01-24*  
*Phase Status: Specification Complete*  
*Related: PHASE-EM-58A-AI-AGENTS.md, PHASE-EM-57A-AUTOMATION-ENGINE.md*
