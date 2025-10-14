# Types Directory

This directory contains all TypeScript type definitions organized by domain.

## File Structure

```
types/
├── index.ts              # Central export file
├── response.types.ts     # API response types
├── gitlab.types.ts       # GitLab API-specific types
└── project.types.ts      # Project domain types
```

## Files

### `response.types.ts`
Contains types for API responses:
- `ApiResponse<T>` - Standard API response wrapper
- `PaginatedResponse<T>` - Response with pagination metadata

### `gitlab.types.ts`
Contains types that mirror GitLab API structures:
- `GitLabProject` - GitLab project structure
- `GitLabNamespace` - GitLab namespace/group
- `GitLabUser` - GitLab user information
- `GitLabCommit` - Git commit information
- `GitLabBranch` - Git branch information

### `project.types.ts`
Contains application-specific project types:
- `Project` - Our application's project format
- `ProjectNamespace` - Simplified namespace structure
- `ProjectStatistics` - Project statistics data
- `ProjectWithStats` - Project with statistics included

### `index.ts`
Central export file that re-exports all types from other files.
This allows importing types from a single location:
```typescript
import { Project, GitLabProject, ApiResponse } from '../types';
```

## Usage

### Import from index
```typescript
// Recommended: Import from the types directory
import { Project, ApiResponse, GitLabProject } from '../types';
```

### Import from specific file (if needed)
```typescript
// For specific file imports
import { GitLabProject } from '../types/gitlab.types';
import { Project } from '../types/project.types';
```

## Adding New Types

1. **Domain-specific types**: Create a new file (e.g., `user.types.ts`)
2. **Add your types** in the new file
3. **Export from index.ts**:
   ```typescript
   export * from './user.types';
   ```

## Best Practices

- **Keep types organized by domain** - Don't mix unrelated types
- **Use descriptive names** - `GitLabProject` vs `Project`
- **Document complex types** - Add JSDoc comments for clarity
- **Avoid circular dependencies** - Keep types independent
- **Export through index.ts** - Maintain single import point
