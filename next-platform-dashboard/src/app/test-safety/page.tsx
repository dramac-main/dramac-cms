"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ContentWarning, ContentWarningBadge, SafetyStatus } from "@/components/safety";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { checkContent, type SafetyViolation } from "@/lib/safety";

export default function SafetyTestPage() {
  const router = useRouter();
  if (process.env.NODE_ENV !== 'development') {
    router.push('/dashboard');
    return null;
  }
  const [content, setContent] = useState("");
  const [violations, setViolations] = useState<SafetyViolation[]>([]);
  const [isSafe, setIsSafe] = useState(true);
  const [confidence, setConfidence] = useState(1.0);
  const [isChecking, setIsChecking] = useState(false);

  const handleCheck = () => {
    setIsChecking(true);
    const result = checkContent(content);
    setViolations(result.violations);
    setIsSafe(result.safe);
    setConfidence(result.confidence);
    setIsChecking(false);
  };

  const loadExample = (example: string) => {
    setContent(example);
    setViolations([]);
  };

  // Example violations for testing
  const exampleViolations: SafetyViolation[] = [
    {
      category: "violence",
      severity: "high",
      description: "Detected violent content",
    },
    {
      category: "spam",
      severity: "low",
      description: "Detected spam patterns",
    },
  ];

  return (
    <div className="container mx-auto max-w-5xl space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Phase 60: Content Safety Filter Demo</h1>
        <p className="mt-2 text-muted-foreground">
          Test the content safety filter and UI components
        </p>
      </div>

      {/* Quick Test Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Test Examples</CardTitle>
          <CardDescription>Click to load example content into the checker</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadExample("Welcome to our bakery! We make fresh bread daily.")}
            >
              ✅ Safe Content
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadExample("Please verify your password to secure your account immediately")}
            >
              ⚠️ Phishing
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadExample("Try our casino online now! Get free bonus!")}
            >
              ⚠️ Spam
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadExample('<script>eval("malicious code")</script>')}
            >
              🚨 Malware
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadExample("How to kill someone in their sleep")}
            >
              🚨 Violence
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Content Checker */}
      <Card>
        <CardHeader>
          <CardTitle>Live Content Checker</CardTitle>
          <CardDescription>
            Enter content to check for safety violations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter content to check, or click an example above..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
          <Button onClick={handleCheck} disabled={!content || isChecking}>
            {isChecking ? "Checking..." : "Check Content"}
          </Button>
          
          {content && violations.length > 0 && (
            <div className="space-y-2">
              <ContentWarning violations={violations} showDetails />
            </div>
          )}
          
          {content && (
            <SafetyStatus safe={isSafe} confidence={confidence} />
          )}
        </CardContent>
      </Card>

      {/* Component Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>Component Showcase</CardTitle>
          <CardDescription>Examples of all safety UI components</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="mb-2 font-medium">ContentWarning - Low Severity (Spam)</h3>
            <ContentWarning
              violations={[
                {
                  category: "spam",
                  severity: "low",
                  description: "Detected spam promotional language",
                },
              ]}
              showDetails
            />
          </div>

          <div>
            <h3 className="mb-2 font-medium">ContentWarning - Medium Severity (Personal Info)</h3>
            <ContentWarning
              violations={[
                {
                  category: "personal_info",
                  severity: "medium",
                  description: "Detected potential personal information",
                },
              ]}
              showDetails
            />
          </div>

          <div>
            <h3 className="mb-2 font-medium">ContentWarning - High Severity (Phishing)</h3>
            <ContentWarning
              violations={[
                {
                  category: "phishing",
                  severity: "high",
                  description: "Detected phishing attempt",
                },
              ]}
              showDetails
            />
          </div>

          <div>
            <h3 className="mb-2 font-medium">ContentWarning - Critical Severity (Malware)</h3>
            <ContentWarning
              violations={[
                {
                  category: "malware",
                  severity: "critical",
                  description: "Detected potentially malicious code",
                },
              ]}
              showDetails
            />
          </div>

          <div>
            <h3 className="mb-2 font-medium">ContentWarning - Multiple Violations</h3>
            <ContentWarning violations={exampleViolations} showDetails />
          </div>

          <div>
            <h3 className="mb-3 font-medium">ContentWarningBadge Examples</h3>
            <div className="flex flex-wrap gap-2">
              <ContentWarningBadge severity="low" count={3} />
              <ContentWarningBadge severity="medium" count={2} />
              <ContentWarningBadge severity="high" count={1} />
              <ContentWarningBadge severity="critical" />
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-medium">SafetyStatus Examples</h3>
            <div className="space-y-2">
              <SafetyStatus safe={true} confidence={1.0} />
              <SafetyStatus safe={false} confidence={0.75} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Safety Categories</CardTitle>
          <CardDescription>10 content categories with severity levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Violence</span>
              <ContentWarningBadge severity="high" />
            </div>
            <div className="flex items-center justify-between">
              <span>Hate Speech</span>
              <ContentWarningBadge severity="critical" />
            </div>
            <div className="flex items-center justify-between">
              <span>Sexual Content</span>
              <ContentWarningBadge severity="high" />
            </div>
            <div className="flex items-center justify-between">
              <span>Self-harm</span>
              <ContentWarningBadge severity="critical" />
            </div>
            <div className="flex items-center justify-between">
              <span>Illegal Activities</span>
              <ContentWarningBadge severity="critical" />
            </div>
            <div className="flex items-center justify-between">
              <span>Spam</span>
              <ContentWarningBadge severity="low" />
            </div>
            <div className="flex items-center justify-between">
              <span>Malware</span>
              <ContentWarningBadge severity="critical" />
            </div>
            <div className="flex items-center justify-between">
              <span>Phishing</span>
              <ContentWarningBadge severity="high" />
            </div>
            <div className="flex items-center justify-between">
              <span>Personal Info</span>
              <ContentWarningBadge severity="medium" />
            </div>
            <div className="flex items-center justify-between">
              <span>Profanity</span>
              <ContentWarningBadge severity="low" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Reference */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoint</CardTitle>
          <CardDescription>POST /api/safety/check (requires authentication)</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="rounded bg-muted p-4 text-xs overflow-x-auto">
{`// Request
POST /api/safety/check
Content-Type: application/json

{
  "content": "your content here",
  "type": "full",  // or "quick" or "prompt"
  "categories": ["violence", "spam"],  // optional
  "includeContext": false  // optional
}

// Response
{
  "safe": false,
  "violations": [
    {
      "category": "phishing",
      "severity": "high",
      "description": "Account verification phishing"
    }
  ],
  "confidence": 0.5,
  "processingTime": 2.5
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
