// GitLab API types
export interface GitLabProject {
  id: number;
  name: string;
  description: string | null;
  web_url: string;
  default_branch: string;
  visibility: string;
  created_at: string;
  last_activity_at: string;
  namespace: GitLabNamespace;
  star_count: number;
  forks_count: number;
  avatar_url: string | null;
  readme_url?: string;
  http_url_to_repo?: string;
  ssh_url_to_repo?: string;
  path_with_namespace?: string;
  [key: string]: any; // Allow additional GitLab fields

}

export interface GitLabNamespace {
  id: number;
  name: string;
  path: string;
  kind: string;
  full_path?: string;
  avatar_url?: string | null;
}

export interface GitLabUser {
  id: number;
  username: string;
  name: string;
  email?: string;
  avatar_url?: string | null;
  web_url?: string;
}

export interface GitLabCommit {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  committer_name: string;
  committer_email: string;
  committed_date: string;
  web_url: string;
}

export interface GitLabBranch {
  name: string;
  merged: boolean;
  protected: boolean;
  default: boolean;
  developers_can_push: boolean;
  developers_can_merge: boolean;
  can_push: boolean;
  web_url: string;
  commit?: GitLabCommit;
}

export interface GitLabGroup {
  id: number;
  name: string;
  path: string;
  description: string;
  visibility: string;
  web_url: string;
  avatar_url: string | null;
  full_name?: string;
  full_path?: string;
  parent_id?: number;
}

export interface GitLabIssues{
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string;
  state: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  closed_by: GitLabUser | null;
  labels: string[];
  milestone: any; 
  assignees: GitLabUser[];
}

export interface GitLabMergeRequest {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string;
  state: string;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  merged_by: GitLabUser | null;
  closed_at: string | null;
  closed_by: GitLabUser | null;
  target_branch: string;
  source_branch: string;
  upvotes: number;
  downvotes: number;
}