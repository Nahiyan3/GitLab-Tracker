import { useState } from "react";
import { Card } from "@/components/ui/card";
import { InsightRow } from "@/components/InsightRow";

export interface Insight {
  id: string;
  aspect: string;
  currentStatus: {
    value: string;
    type: "good" | "warning" | "critical";
  };
  analysis: string;
  recommendations: string[];
  confidence: "high" | "medium" | "low";
  details: string;
}

const mockInsights: Insight[] = [
  {
    id: "1",
    aspect: "Code Quality",
    currentStatus: { value: "92/100", type: "good" },
    analysis: "Excellent code maintainability with consistent patterns. Low technical debt accumulation.",
    recommendations: [
      "Add unit tests for new utility functions",
      "Consider extracting repeated validation logic",
    ],
    confidence: "high",
    details: "Code complexity metrics show 85% of functions are under recommended cyclomatic complexity threshold. Recent refactoring in authentication module improved maintainability score by 12 points.",
  },
  {
    id: "2",
    aspect: "CI/CD Stability",
    currentStatus: { value: "98.5% uptime", type: "good" },
    analysis: "Highly reliable pipeline with fast build times. Zero failed deployments in the last 30 days.",
    recommendations: [
      "Optimize Docker layer caching",
      "Add canary deployment stage",
    ],
    confidence: "high",
    details: "Average build time: 4m 32s (15% faster than previous month). All critical tests passing consistently. Pipeline has successfully handled 247 deployments with zero rollbacks required.",
  },
  {
    id: "3",
    aspect: "Issue Trends",
    currentStatus: { value: "↓ 15% vs last month", type: "good" },
    analysis: "Bug reports declining steadily. Average resolution time improved to 2.3 days.",
    recommendations: [
      "Implement automated triage for common issues",
      "Create templates for bug reports",
    ],
    confidence: "high",
    details: "P0 issues: 0 open. P1 issues: 2 open (both in progress). Backlog health score: 78/100. Team velocity stable at 42 story points per sprint.",
  },
  {
    id: "4",
    aspect: "Collaboration",
    currentStatus: { value: "High engagement", type: "good" },
    analysis: "Strong team collaboration with balanced code contributions. PR review times averaging 4 hours.",
    recommendations: [
      "Rotate PR review assignments",
      "Schedule async code review sessions",
    ],
    confidence: "medium",
    details: "Average PR size: 156 lines. 94% of PRs receive review within 8 hours. Knowledge sharing score: 82/100 based on documentation contributions and cross-team reviews.",
  },
  {
    id: "5",
    aspect: "Test Coverage",
    currentStatus: { value: "73%", type: "warning" },
    analysis: "Overall coverage adequate but gaps exist in newer modules. Edge cases need attention.",
    recommendations: [
      "Prioritize tests for payment processing module",
      "Add integration tests for API endpoints",
      "Set up mutation testing to verify test quality",
    ],
    confidence: "high",
    details: "Unit test coverage: 78%. Integration tests: 65%. E2E tests: 45%. Recent feature additions in the dashboard module reduced overall coverage by 8%. Critical paths have 95%+ coverage.",
  },
  {
    id: "6",
    aspect: "Security Posture",
    currentStatus: { value: "3 minor vulnerabilities", type: "warning" },
    analysis: "No critical vulnerabilities detected. Dependencies mostly up-to-date with minor version lag.",
    recommendations: [
      "Update lodash to v4.17.21",
      "Enable dependency scanning in CI",
      "Review API authentication flows",
    ],
    confidence: "high",
    details: "Last security audit: 12 days ago. All high-severity findings resolved. JWT implementation follows best practices. Rate limiting active on all public endpoints.",
  },
  {
    id: "7",
    aspect: "Performance",
    currentStatus: { value: "P95: 180ms", type: "good" },
    analysis: "API response times within target ranges. Database queries well-optimized.",
    recommendations: [
      "Add CDN caching for static assets",
      "Implement lazy loading for dashboard widgets",
    ],
    confidence: "medium",
    details: "Average response time: 95ms. Database query efficiency: 92/100. Recent optimization reduced report generation time by 40%. Lighthouse score: 89/100.",
  },
  {
    id: "8",
    aspect: "Documentation",
    currentStatus: { value: "Needs improvement", type: "critical" },
    analysis: "API documentation outdated. Missing setup guides for local development environment.",
    recommendations: [
      "Update API documentation to match v2.4 endpoints",
      "Create video walkthrough for onboarding",
      "Document environment variable requirements",
    ],
    confidence: "high",
    details: "Last doc update: 45 days ago. Developer onboarding time: 3.2 days (target: <2 days). 6 open issues tagged as 'documentation'. README completeness score: 65/100.",
  },
];

export const InsightsTable = () => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr className="border-b">
              <th className="text-left p-4 font-semibold text-sm w-[180px]">Aspect</th>
              <th className="text-left p-4 font-semibold text-sm w-[140px]">Current Status</th>
              <th className="text-left p-4 font-semibold text-sm">LLM Analysis</th>
              <th className="text-left p-4 font-semibold text-sm">Recommendations</th>
              <th className="text-left p-4 font-semibold text-sm w-[120px]">Confidence</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {mockInsights.map((insight) => (
              <InsightRow
                key={insight.id}
                insight={insight}
                isExpanded={expandedRows.has(insight.id)}
                onToggle={() => toggleRow(insight.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
