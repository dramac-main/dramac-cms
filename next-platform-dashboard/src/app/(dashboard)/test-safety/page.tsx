"use client";

import { useState } from "react";
import { ContentWarning, ContentWarningBadge, SafetyStatus } from "@/components/safety";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { checkContent, type SafetyViolation } from "@/lib/safety";

export default function SafetyTestPage() {
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
    <div className="container mx-auto max-w-4xl space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Phase 60: Content Safety Filter Demo</h1>
        <p className="mt-2 text-muted-foreground">
          Test the content safety filter and UI components
        </p>
      </div>

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
            placeholder="Enter content to check... (try: 'Please verify your password' or 'casino online')"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
          <Button onClick={handleCheck} disabled={!content || isChecking}>
            {isChecking ? "Checking..." : "Check Content"}
          </Button>
          
          {content && violations.length > 0 && (
            <ContentWarning violations={violations} showDetails />
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
            <h3 className="mb-2 font-medium">ContentWarning - Low Severity</h3>
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
            <h3 className="mb-2 font-medium">ContentWarning - Medium Severity</h3>
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
            <h3 className="mb-2 font-medium">ContentWarning - High Severity</h3>
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
            <h3 className="mb-2 font-medium">ContentWarning - Critical Severity</h3>
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

      {/* Test Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Test Examples</CardTitle>
          <CardDescription>Try these example inputs in the checker above</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Phishing:</strong> "Please verify your password to secure your account"
            </p>
            <p>
              <strong>Spam:</strong> "Buy cheap pills now! Limited time offer!"
            </p>
            <p>
              <strong>Malware:</strong> {`<script>eval("code")</script>`}
            </p>
            <p>
              <strong>Violence:</strong> "How to kill someone"
            </p>
            <p>
              <strong>Safe:</strong> "Welcome to our bakery! We make fresh bread daily."
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Test */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoint Test</CardTitle>
          <CardDescription>Test the /api/safety/check endpoint</CardDescription>
        </CardHeader>
        <CardContent>
          <code className="block rounded bg-muted p-4 text-sm">
            POST /api/safety/check
            <br />
            Body: {`{ "content": "your content here", "type": "full" }`}
          </code>
          <p className="mt-4 text-sm text-muted-foreground">
            You can test this endpoint using tools like Postman or curl after authentication.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
