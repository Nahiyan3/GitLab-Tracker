export interface SonarQubeMaintainabilityMetrics {
  project_id: number;
  maintainability_high: number;
  maintainability_blocker: number;
  technical_debt_ratio: number;
  maintainability_rating: string; // A, B, C, D, E
  code_smells_total: number;
  code_smells_new: number;
  cyclomatic_complexity: number;
  cognitive_complexity: number;
  duplicated_code_percentage: number;
  duplicated_lines_new: number;
  calculated_at: Date;
}

export interface SonarQubeMaintainabilityHistory {
  project_id: number;
  technical_debt_ratio: number;
  maintainability_rating: string;
  code_smells_total: number;
  cyclomatic_complexity: number;
  cognitive_complexity: number;
  duplicated_code_percentage: number;
  snapshot_date: Date;
}

export interface SonarQubeMaintainabilityCalculationResult {
  maintainability_high: number;
  maintainability_blocker: number;
  technical_debt_ratio: number;
  maintainability_rating: string;
  code_smells_total: number;
  code_smells_new: number;
  cyclomatic_complexity: number;
  cognitive_complexity: number;
  duplicated_code_percentage: number;
  duplicated_lines_new: number;
}

// SonarQube API response types
export interface SonarQubeMeasure {
  metric: string;
  value?: string;
  bestValue?: boolean;
  period?: {
    index: number;
    value: string;
    bestValue?: boolean;
  };
}

export interface SonarQubeComponentMeasures {
  component: {
    key: string;
    name: string;
    qualifier: string;
    measures: SonarQubeMeasure[];
  };
}

// Reliability Metrics Types
export interface SonarQubeReliabilityMetrics {
  project_id: number;
  bugs_total: number;
  bugs_critical: number;
  bugs_blocker: number;
  bugs_new: number;
  reliability_rating: string; // A, B, C, D, E
  reliability_remediation_effort: number; // in minutes
  calculated_at: Date;
}

export interface SonarQubeReliabilityHistory {
  project_id: number;
  bugs_total: number;
  reliability_rating: string;
  snapshot_date: Date;
}

export interface SonarQubeReliabilityCalculationResult {
  bugs_total: number;
  bugs_critical: number;
  bugs_blocker: number;
  bugs_new: number;
  reliability_rating: string;
  reliability_remediation_effort: number;
}

// Security Metrics Types
export interface SonarQubeSecurityMetrics {
  project_id: number;
  vulnerabilities_total: number;
  vulnerabilities_new: number;
  security_rating: string; // A, B, C, D, E
  security_hotspots_total: number;
  security_hotspots_reviewed: number; // percentage
  security_review_rating: string; // A, B, C, D, E (1-5)
  security_remediation_effort: number; // in minutes
  calculated_at: Date;
}

export interface SonarQubeSecurityHistory {
  project_id: number;
  vulnerabilities_total: number;
  security_rating: string;
  security_hotspots_total: number;
  snapshot_date: Date;
}

export interface SonarQubeSecurityCalculationResult {
  vulnerabilities_total: number;
  vulnerabilities_new: number;
  security_rating: string;
  security_hotspots_total: number;
  security_hotspots_reviewed: number;
  security_review_rating: string;
  security_remediation_effort: number;
}
