# Server Structure

This is a clean Express + TypeScript backend following the MVC pattern.

## Folder Structure

```
server/
├── src/
│   ├── controllers/     # Handle HTTP requests/responses
│   │   └── projectController.ts
│   ├── services/        # Business logic layer
│   │   └── projectService.ts
│   ├── db/             # Database queries and connection
│   │   ├── connection.ts
│   │   └── queries.ts
│   ├── middleware/     # Custom middleware
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── routes/         # API route definitions
│   │   └── index.ts
│   ├── types/          # TypeScript type definitions
│   │   └── index.ts
│   └── index.ts        # Main server entry point
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

## Layer Responsibilities

### Controllers (`controllers/`)
- Handle HTTP requests and responses
- Call service layer methods
- Return appropriate HTTP status codes
- Format API responses

### Services (`services/`)
- Business logic
- Data validation
- Coordinate between controllers and database
- Transform data if needed

### Database (`db/`)
- Database connection setup
- Raw database queries
- Data access layer
- No business logic

### Middleware (`middleware/`)
- Error handling
- Request validation
- Authentication/Authorization (when needed)
- Logging

### Routes (`routes/`)
- API endpoint definitions
- Route-specific middleware
- Map endpoints to controllers

### Types (`types/`)
- TypeScript interfaces
- Type definitions
- Shared types across the application
