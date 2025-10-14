// Project-related types
export interface Project {
  id: string | number;
  name: string;
  description?: string;
  lastActivity?: string;
  web_url?: string;
  default_branch?: string;
  visibility?: string;
  created_at?: string;
  last_activity_at?: string;
  namespace?: ProjectNamespace;
  star_count?: number;
  forks_count?: number;
  avatar_url?: string;
}

export interface ProjectNamespace {
  id: number;
  name: string;
  path: string;
  kind: string;
  full_path?: string;
}

export interface ProjectStatistics {
  commit_count?: number;
  storage_size?: number;
  repository_size?: number;
  wiki_size?: number;
  lfs_objects_size?: number;
  job_artifacts_size?: number;
  pipeline_artifacts_size?: number;
  packages_size?: number;
  snippets_size?: number;
}

export interface ProjectWithStats extends Project {
  statistics?: ProjectStatistics;
}
