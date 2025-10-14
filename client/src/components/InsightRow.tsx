import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Insight } from "./InsightsTable";

interface InsightRowProps {
  insight: Insight;
  isExpanded: boolean;
  onToggle: () => void;
}

export const InsightRow = ({ insight, isExpanded, onToggle }: InsightRowProps) => {
  const getStatusColor = (type: string) => {
    switch (type) {
      case "good":
        return "text-success";
      case "warning":
        return "text-warning";
      case "critical":
        return "text-destructive";
      default:
        return "";
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "high":
        return <Badge variant="high">High - 95%</Badge>;
      case "medium":
        return <Badge variant="medium">Medium - 75%</Badge>;
      case "low":
        return <Badge variant="low">Low - 50%</Badge>;
      default:
        return null;
    }
  };

  return (
    <>
      <tr className="border-b hover:bg-muted/30 transition-colors">
        <td className="p-4 font-medium">{insight.aspect}</td>
        <td className="p-4">
          <span className={`font-semibold ${getStatusColor(insight.currentStatus.type)}`}>
            {insight.currentStatus.value}
          </span>
        </td>
        <td className="p-4 text-sm text-muted-foreground">
          {insight.analysis}
        </td>
        <td className="p-4">
          <ul className="text-sm space-y-1">
            {insight.recommendations.slice(0, 2).map((rec, idx) => (
              <li key={idx} className="text-foreground">
                • {rec}
              </li>
            ))}
            {insight.recommendations.length > 2 && (
              <li className="text-muted-foreground italic">
                +{insight.recommendations.length - 2} more
              </li>
            )}
          </ul>
        </td>
        <td className="p-4">
          {getConfidenceBadge(insight.confidence)}
        </td>
        <td className="p-4">
          <button
            onClick={onToggle}
            className="hover:bg-muted rounded p-1 transition-colors"
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b bg-muted/20">
          <td colSpan={6} className="p-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Detailed Analysis</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {insight.details}
                </p>
              </div>
              {insight.recommendations.length > 2 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">All Recommendations</h4>
                  <ul className="space-y-2">
                    {insight.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
