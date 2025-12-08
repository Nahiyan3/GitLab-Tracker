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
