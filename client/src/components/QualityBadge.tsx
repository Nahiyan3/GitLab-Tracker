import { Badge } from "@/components/ui/badge";

interface QualityBadgeProps {
  score: number;
  size?: "sm" | "default" | "lg";
}

export const QualityBadge = ({ score, size = "default" }: QualityBadgeProps) => {
  const getVariant = (score: number) => {
    if (score >= 76) return "success";
    if (score >= 51) return "warning";
    return "destructive";
  };

  const getLabel = (score: number) => {
    if (score >= 76) return "High";
    if (score >= 51) return "Medium";
    return "Low";
  };

  const sizeClass = size === "lg" ? "text-base px-4 py-1" : size === "sm" ? "text-xs px-2 py-0.5" : "";

  return (
    <Badge variant={getVariant(score)} className={sizeClass}>
      {score}/100 · {getLabel(score)}
    </Badge>
  );
};
