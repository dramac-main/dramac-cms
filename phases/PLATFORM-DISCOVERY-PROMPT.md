# DRAMAC CMS - Platform Discovery Prompt

## PURPOSE

Before implementing any UI/UX improvements, we need a **complete understanding** of:
- Who uses this platform and why
- Every journey a user takes from start to finish
- How features connect and depend on each other
- Where users currently struggle or succeed
- The business logic behind every workflow

This document is a **prompt to run FIRST** to extract comprehensive platform understanding.

---

# 🎯 DISCOVERY PROMPT

## Instructions for AI

You are analyzing the DRAMAC CMS platform - an enterprise multi-tenant SaaS for agencies. Your task is to provide a **comprehensive map** of the entire platform by answering every section below in detail.

**CRITICAL**: Read ALL memory bank files first:
1. `/memory-bank/projectbrief.md`
2. `/memory-bank/productContext.md`
3. `/memory-bank/systemPatterns.md`
4. `/memory-bank/techContext.md`
5. `/memory-bank/activeContext.md`
6. `/memory-bank/progress.md`

Then explore the codebase to answer each section thoroughly.

---

## SECTION 1: USER PERSONAS

### 1.1 Identify All User Types
For each user type, provide:

```
PERSONA: [Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Role Description: [What is this user's job/purpose?]
Business Context: [Why do they use this platform?]
Technical Skill Level: [Beginner/Intermediate/Advanced]
Primary Goals: [What are they trying to achieve?]
Secondary Goals: [Nice-to-haves for them]
Pain Points: [What frustrates them currently?]
Success Metrics: [How do they measure success?]
Frequency of Use: [Daily/Weekly/Monthly]
Access Level: [What can they see/do in the platform?]
```

**Expected personas to identify:**
- Super Admin (platform owner)
- Agency Owner
- Agency Admin
- Agency Team Member
- End Client (client portal user)
- Site Visitor (published website viewer)

### 1.2 Persona Relationships
Map how personas interact with each other:
- Who creates accounts for whom?
- Who approves whose work?
- Who pays whom?
- What communication flows exist?

---

## SECTION 2: COMPLETE USER JOURNEYS

### 2.1 Onboarding Journeys

#### Journey A: New Agency Signup
```
Map every step from first landing to fully operational agency:
1. [Step] → [What happens] → [What user sees] → [What data is created]
2. ...continue for EVERY step
```

Questions to answer:
- How does someone discover DRAMAC?
- What's the signup flow?
- What information is collected?
- What's created automatically vs manually?
- When does billing kick in?
- What's the "aha moment"?
- What makes them stay vs abandon?

#### Journey B: Creating First Site
```
Map every step from "I want a new site" to "Site is live":
1. [Step] → [What happens] → [What user sees] → [What data is created]
```

Questions to answer:
- How do they start a new site?
- What options/templates are available?
- How is the domain handled?
- When do they first see the editor?
- What's the minimum to publish?

#### Journey C: Adding a Client
```
Map every step from "I have a new client" to "Client has access":
1. [Step] → [What happens] → [What user sees] → [What data is created]
```

#### Journey D: Team Member Onboarding
```
Map inviting and onboarding a team member
```

### 2.2 Core Daily Workflows

#### Workflow 1: Building a Website Page
```
WORKFLOW: Page Building
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trigger: [What initiates this workflow?]
Actors: [Who performs it?]
Steps:
  1. Navigate to: [Route]
     Action: [What they do]
     System Response: [What happens]
     Data Changed: [What's created/updated]
  2. ...
End State: [What's the result?]
Success Criteria: [How do they know it worked?]
Error Scenarios: [What could go wrong?]
Time Estimate: [How long does this take?]
```

#### Workflow 2: Publishing a Site
```
Map the entire publish workflow
```

#### Workflow 3: Managing Media/Assets
```
Map uploading, organizing, using media
```

#### Workflow 4: Module Management
```
- Discovering modules in marketplace
- Subscribing to a module
- Enabling module for a site
- Configuring module settings
- Using module features
```

### 2.3 Module-Specific Workflows

#### Social Media Module Workflows
```
1. Connecting a social account
2. Creating and scheduling a post
3. Managing the content calendar
4. Responding to messages (inbox)
5. Creating a campaign
6. Reviewing analytics
7. Approval workflows
```

#### CRM Module Workflows
```
1. Adding a contact
2. Creating a deal/pipeline
3. Logging an interaction
4. Sending an email
5. Setting up automation
6. Viewing reports
```

#### E-Commerce Module Workflows
```
1. Adding a product
2. Setting up categories
3. Configuring payment
4. Processing an order
5. Managing inventory
6. Handling refunds
```

#### Automation Module Workflows
```
1. Creating an automation
2. Setting triggers
3. Defining actions
4. Testing an automation
5. Monitoring runs
6. Debugging failures
```

#### Booking Module Workflows
```
1. Setting availability
2. Creating service types
3. Customer booking flow
4. Managing appointments
5. Sending reminders
6. Handling cancellations
```

### 2.4 Administrative Workflows

#### Billing & Subscriptions
```
1. Viewing current subscription
2. Upgrading/downgrading plan
3. Managing payment methods
4. Viewing invoices
5. Handling failed payments
```

#### Team Management
```
1. Inviting team members
2. Assigning roles
3. Managing permissions
4. Removing access
```

#### Settings Management
```
1. Agency branding
2. White labeling
3. Custom domains
4. Integration setup
```

---

## SECTION 3: DATA ARCHITECTURE & FLOWS

### 3.1 Entity Relationship Map
```
Diagram the relationships between all major entities:
- Users ↔ Agencies ↔ Sites ↔ Pages
- Modules ↔ Subscriptions ↔ Installations
- Media ↔ Sites
- Each module's data model
```

### 3.2 Data Creation Points
For each major entity, document:
- When is it created?
- Who creates it?
- What triggers creation?
- What's the lifecycle (created → updated → archived → deleted)?

### 3.3 Permission Model
```
Map exactly what each role can do:

                    | Super Admin | Agency Owner | Admin | Member | Client |
--------------------|-------------|--------------|-------|--------|--------|
Create Agency       |     ✓       |      ✗       |   ✗   |   ✗    |   ✗    |
Create Site         |     ✓       |      ✓       |   ✓   |   ✗    |   ✗    |
Edit Site           |     ✓       |      ✓       |   ✓   |   ✓    |   ✗    |
Publish Site        |     ✓       |      ✓       |   ✓   |   ✗    |   ✗    |
...continue for ALL actions
```

### 3.4 State Machines
Document state transitions for key entities:

```
SITE STATES:
draft → building → ready_to_publish → published → archived
  ↑_________|_____________|

PAGE STATES:
draft → published → archived

POST STATES (Social):
draft → scheduled → publishing → published → failed

ORDER STATES (E-Commerce):
pending → paid → processing → shipped → delivered → completed
                    ↓
              cancelled/refunded
```

---

## SECTION 4: FEATURE INTERACTION MAP

### 4.1 Feature Dependencies
Which features depend on other features?
```
Feature A requires Feature B to work
├── Editor requires Media Library
├── Social Post requires Connected Accounts
├── E-Commerce requires Payment Integration
├── Automation requires Trigger Sources
└── ...
```

### 4.2 Cross-Module Interactions
How do modules interact with each other?
```
CRM ↔ E-Commerce: Contacts become customers
Social ↔ CRM: Social interactions create contacts
Automation ↔ All Modules: Triggers from any module
```

### 4.3 Integration Points
What external services are integrated?
```
- Supabase (Auth, Database, Storage)
- Paddle (Billing)
- Resend (Email)
- Social Platforms (Meta, Twitter, LinkedIn, etc.)
- Analytics (?)
- Others (?)
```

---

## SECTION 5: NAVIGATION & INFORMATION ARCHITECTURE

### 5.1 Complete Route Map
List every route with:
```
ROUTE: /path/to/page
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Purpose: [Why does this page exist?]
Who Accesses: [Which personas?]
Entry Points: [How do users get here?]
Exit Points: [Where do users go next?]
Key Actions: [What can they do here?]
Data Displayed: [What information is shown?]
Data Modified: [What can be changed?]
Related Routes: [Connected pages]
```

### 5.2 Navigation Structure
```
Map the complete navigation hierarchy:

Dashboard (/)
├── Sites (/sites)
│   ├── Site Detail (/sites/[id])
│   │   ├── Pages (/sites/[id]/pages)
│   │   ├── Editor (/sites/[id]/editor)
│   │   ├── Settings (/sites/[id]/settings)
│   │   └── Modules...
│   └── New Site (/sites/new)
├── Modules (/modules)
│   └── Module Detail (/modules/[id])
├── Settings (/settings)
│   └── Sub-settings...
└── ...complete the tree
```

### 5.3 User Flow Diagrams
For critical flows, create step-by-step flow:
```
[Start] → [Page A] → [Decision?]
                          ↓ Yes        ↓ No
                     [Page B]     [Page C]
                          ↓            ↓
                     [Success]    [Error]
```

---

## SECTION 6: CURRENT STATE ANALYSIS

### 6.1 What Works Well
List features that are solid and don't need major changes:
- Why do they work?
- What patterns do they follow?
- What can we learn from them?

### 6.2 What Needs Improvement
List features/areas that need work:
- What's the current problem?
- Impact on users (high/medium/low)
- Complexity to fix (high/medium/low)
- Dependencies to consider

### 6.3 Missing Features
What's expected but not built?
- Industry standard features missing
- User-requested features
- Competitor features we lack

### 6.4 Technical Debt
- Inconsistent patterns
- Performance issues
- Code quality concerns
- Architectural problems

---

## SECTION 7: BUSINESS LOGIC DOCUMENTATION

### 7.1 Pricing & Billing Logic
```
How does billing work?
- What's free vs paid?
- How are modules priced?
- What triggers a charge?
- What happens on payment failure?
- What are the limits per plan?
```

### 7.2 Access Control Logic
```
Beyond roles, what business rules control access?
- Trial limitations
- Feature flags
- Plan-based restrictions
- Module-based restrictions
```

### 7.3 Validation Rules
```
What validation exists for key actions?
- Site creation requirements
- Publishing requirements
- Module installation requirements
- User invitation requirements
```

---

## SECTION 8: SUCCESS METRICS & KPIs

### 8.1 User Success Metrics
How do we measure if users are succeeding?
- Sites published
- Time to first publish
- Module adoption rate
- User retention
- Client satisfaction

### 8.2 Platform Success Metrics
How do we measure platform health?
- Active agencies
- Revenue per agency
- Feature usage
- Error rates
- Performance metrics

---

## SECTION 9: EDGE CASES & ERROR SCENARIOS

### 9.1 Common Error Scenarios
For each workflow, what errors can occur?
```
WORKFLOW: Publish Site
Possible Errors:
- Missing required content
- Invalid domain configuration
- Exceeded plan limits
- Payment issue
- Technical failure
```

### 9.2 Recovery Paths
How does a user recover from each error?

### 9.3 Boundary Conditions
What happens at limits?
- Maximum sites per agency
- Maximum pages per site
- Maximum media storage
- Maximum team members

---

## SECTION 10: FUTURE CONSIDERATIONS

### 10.1 Scalability Concerns
What might break at scale?
- Database queries
- File storage
- Real-time features
- API rate limits

### 10.2 Feature Roadmap Alignment
What planned features might impact current work?
- Upcoming modules
- Platform changes
- Integration plans

---

# 📋 OUTPUT FORMAT

After analyzing the platform, provide your response in this structure:

```
## EXECUTIVE SUMMARY
[2-3 paragraph overview of the platform]

## USER PERSONAS (Complete for each)
[Detailed persona cards]

## JOURNEY MAPS (Complete for each)
[Step-by-step journey documentation]

## WORKFLOW DOCUMENTATION (Complete for each)
[Detailed workflow maps]

## DATA ARCHITECTURE
[Entity relationships, state machines, permissions]

## NAVIGATION MAP
[Complete route and navigation structure]

## CURRENT STATE ASSESSMENT
[What works, what doesn't, what's missing]

## CRITICAL PATHS
[The most important user journeys that must work perfectly]

## IMPROVEMENT OPPORTUNITIES
[Prioritized list of opportunities]

## QUESTIONS & CLARIFICATIONS
[Anything unclear that needs human input]
```

---

# 🚀 HOW TO USE THIS PROMPT

1. **Copy this entire document** as a prompt to Claude/GPT
2. **Ensure the AI has access** to the codebase (via workspace or uploaded files)
3. **Let it analyze thoroughly** - this may take multiple responses
4. **Save the output** - this becomes your platform bible
5. **Use the output** to update MASTER-BUILD-PROMPT-V2.md with real understanding

---

**Remember**: The goal is UNDERSTANDING first, IMPLEMENTATION second. A complete picture of how everything works will make implementation 10x more effective.
