# Midday API Architecture - Complete File Tree Explainer

This document provides a comprehensive overview of every file in the `apps/api` directory, explaining the purpose and role of each component in the Midday API architecture.

## Root Level Configuration

```
apps/api/
├── Dockerfile                          # Container deployment configuration for production builds
├── README.md                          # API documentation and setup instructions
├── drizzle.config.ts                  # Drizzle ORM configuration for database migrations and introspection
├── fly-preview.yml                    # Fly.io preview environment deployment configuration
├── fly.toml                          # Fly.io production deployment configuration with scaling rules
├── package.json                      # Node.js dependencies: Hono, Drizzle, tRPC, Supabase, OpenAPI tools
├── tsconfig.json                     # TypeScript compiler configuration with strict type checking
└── migrations/                       # Database schema migration files managed by Drizzle
    ├── 0000_bumpy_chat.sql          # Initial database schema migration with all tables and policies
    └── meta/                        # Drizzle migration metadata and snapshots
```

## Source Code Architecture (`src/`)

### Main Entry Point

```
src/
├── index.ts                          # Main application entry point - configures Hono app with tRPC, CORS, OpenAPI docs
```

### Database Layer (`src/db/`)

The database layer implements a sophisticated multi-region PostgreSQL setup with Drizzle ORM:

```
src/db/
├── index.ts                          # Database connection factory with multi-region read replica routing
├── replicas.ts                       # Smart read/write routing logic - reads from regional replicas, writes to primary
├── schema.ts                         # Complete Drizzle schema definitions with RLS policies and indexes
└── queries/                          # Domain-specific database query functions organized by business domain
    ├── api-keys.ts                   # API key CRUD operations with secure token hashing
    ├── apps.ts                       # Application management queries for third-party integrations
    ├── bank-accounts.ts              # Bank account management with provider-specific logic
    ├── bank-connections.ts           # Bank connection status tracking and health monitoring
    ├── customers.ts                  # Customer relationship management queries
    ├── document-tag-assignments.ts   # Document tagging relationship management
    ├── document-tag-embedings.ts     # Vector embeddings for document classification using pgvector
    ├── document-tags.ts              # Document tag management with hierarchical support
    ├── documents.ts                  # Document storage and processing status tracking
    ├── inbox-accounts.ts             # Email account integration for automated document processing
    ├── inbox.ts                      # Email inbox processing and document extraction
    ├── invoice-templates.ts          # Invoice template management with customization options
    ├── invoices.ts                   # Invoice generation, tracking, and payment status
    ├── metrics.ts                    # Business analytics and reporting aggregations
    ├── search.ts                     # Full-text search across transactions and documents using PostgreSQL tsvector
    ├── tags.ts                       # General tagging system for categorization
    ├── teams.ts                      # Team management with role-based access control
    ├── tracker-entries.ts            # Time tracking entry management with billing integration
    ├── tracker-projects.ts           # Project management for time tracking
    ├── transaction-attachments.ts    # File attachments linked to financial transactions
    ├── transaction-categories.ts     # Transaction categorization with custom and default categories
    ├── transaction-tags.ts           # Transaction tagging for advanced filtering and reporting
    ├── transactions.ts               # Core financial transaction management with reconciliation
    ├── user-invites.ts               # Team invitation system with expiration and role assignment
    ├── users-on-team.ts              # Team membership management with role permissions
    └── users.ts                      # User profile management with preferences and settings
```

### REST API Layer (`src/rest/`)

Built with Hono framework providing OpenAPI-compliant REST endpoints for external integrations:

```
src/rest/
├── types.ts                          # TypeScript context types for Hono middleware and request handling
├── middleware/                       # Request processing middleware for cross-cutting concerns
│   ├── index.ts                     # Middleware composition - defines public and protected endpoint stacks
│   ├── auth.ts                      # API key authentication with LRU caching and scope validation
│   ├── db.ts                        # Database connection injection middleware
│   ├── scope.ts                     # Permission scope validation for granular API access control
│   └── primary-read-after-write.ts  # Ensures read consistency after write operations
└── routers/                         # Domain-specific REST endpoints with OpenAPI documentation
    ├── index.ts                     # Router composition with protected middleware application
    ├── bank-accounts.ts             # Banking API endpoints for account management and transactions
    ├── customers.ts                 # Customer management REST endpoints with CRUD operations
    ├── documents.ts                 # Document processing endpoints with upload and OCR integration
    ├── inbox.ts                     # Email integration endpoints for automated document processing
    ├── invoices.ts                  # Invoice management endpoints with PDF generation and sending
    ├── metrics.ts                   # Analytics and reporting REST endpoints with aggregated data
    ├── search.ts                    # Search API endpoints with filtering and pagination
    ├── tags.ts                      # Tagging system REST endpoints for organization
    ├── teams.ts                     # Team management endpoints with member invitation and roles
    ├── tracker-entries.ts           # Time tracking entry endpoints with billing calculations
    ├── tracker-projects.ts          # Project management endpoints for time tracking organization
    ├── transactions.ts              # Financial transaction REST endpoints with categorization
    └── users.ts                     # User management endpoints for profile and preferences
```

### tRPC Layer (`src/trpc/`)

Type-safe RPC layer for internal application communication with the dashboard:

```
src/trpc/
├── init.ts                          # tRPC context creation with Supabase authentication and database injection
├── middleware/                      # tRPC-specific middleware for authorization and consistency
│   ├── primary-read-after-write.ts  # Database read consistency middleware for tRPC procedures
│   └── team-permission.ts           # Team-based authorization middleware with role checking
└── routers/                         # Type-safe procedure definitions organized by domain
    ├── _app.ts                      # Main tRPC router composition - aggregates all domain routers
    ├── api-keys.ts                  # API key management procedures for developer access
    ├── apps.ts                      # Application management procedures for third-party integrations
    ├── bank-accounts.ts             # Banking integration procedures with real-time sync
    ├── bank-connections.ts          # Bank connection management with status monitoring
    ├── customers.ts                 # Customer relationship management procedures
    ├── document-tag-assignments.ts  # Document tagging procedures with bulk operations
    ├── document-tags.ts             # Document tag management with hierarchical operations
    ├── documents.ts                 # Document processing procedures with OCR and classification
    ├── inbox-accounts.ts            # Email account integration procedures
    ├── inbox.ts                     # Email inbox processing procedures with automation
    ├── institutions.ts              # Financial institution data procedures
    ├── invoice-template.ts          # Invoice template management procedures
    ├── invoice.ts                   # Invoice generation and management procedures
    ├── metrics.ts                   # Analytics and reporting procedures with real-time data
    ├── search.ts                    # Search procedures with advanced filtering
    ├── tags.ts                      # General tagging procedures for organization
    ├── team.ts                      # Team management procedures with invitation system
    ├── tracker-entries.ts           # Time tracking procedures with real-time updates
    ├── tracker-projects.ts          # Project management procedures for time tracking
    ├── transaction-attachments.ts   # Transaction attachment procedures with file handling
    ├── transaction-categories.ts    # Transaction categorization procedures with ML suggestions
    ├── transaction-tags.ts          # Transaction tagging procedures for advanced organization
    ├── transactions.ts              # Core transaction management procedures with reconciliation
    └── user.ts                      # User management procedures with preference handling
```

### Schema Validation (`src/schemas/`)

Zod schemas for request/response validation and OpenAPI documentation generation. **Important**: These are NOT database primitives but API contract definitions that represent the external interface of the application.

```
src/schemas/
├── api-keys.ts                      # API key validation schemas with scope definitions
├── apps.ts                          # Application integration schemas for third-party connections
├── bank-accounts.ts                 # Bank account data validation schemas
├── bank-connections.ts              # Bank connection status and configuration schemas
├── customers.ts                     # Customer data validation with contact information schemas
├── document-tag-assignments.ts      # Document tagging relationship validation schemas
├── document-tags.ts                 # Document tag validation with hierarchical structure schemas
├── documents.ts                     # Document upload and processing validation schemas
├── inbox-accounts.ts                # Email account integration validation schemas
├── inbox.ts                         # Email inbox processing validation schemas
├── institutions.ts                  # Financial institution data validation schemas
├── invoice.ts                       # Invoice generation and management validation schemas
├── metrics.ts                       # Analytics query and response validation schemas
├── search.ts                        # Search request and response validation schemas
├── tags.ts                          # General tagging system validation schemas
├── team.ts                          # Team management and invitation validation schemas
├── tracker-entries.ts               # Time tracking entry validation schemas
├── tracker-projects.ts              # Project management validation schemas
├── transaction-attachments.ts       # Transaction attachment validation schemas
├── transaction-categories.ts        # Transaction categorization validation schemas
├── transaction-tags.ts              # Transaction tagging validation schemas
├── transactions.ts                  # Financial transaction validation with amount and currency schemas
└── users.ts                         # User profile and preferences validation schemas
```

#### Schema Organization Pattern

The schema organization follows a sophisticated pattern based on **API surface area** and **data flow boundaries**, not database primitives:

**1. API Endpoint Boundaries**
Every entity with REST endpoints or tRPC procedures gets multiple schema variants:
- Request validation schemas (query parameters, path parameters, request bodies)
- Response schemas (API return values)
- Operation-specific schemas (create, update, delete variations)

Example from `transactions.ts`:
- `getTransactionsSchema` - Query parameters for listing transactions
- `transactionResponseSchema` - API response format with nested objects
- `createTransactionSchema` - Transaction creation validation
- `updateTransactionSchema` - Transaction update validation
- `deleteTransactionSchema` - Transaction deletion validation

**2. Data Transformation Points**
Schemas exist where data crosses boundaries:
- External API ↔ Internal Logic
- Database ↔ Application Layer
- tRPC ↔ REST API

**3. OpenAPI Documentation**
Dual-purpose schemas using `@hono/zod-openapi`:
- Runtime validation with Zod
- Automatic OpenAPI documentation generation
- Rich descriptions and examples for API consumers

**4. Key Differences from Database Schema**
- **Computed Fields**: Include calculated values like `isFulfilled` not stored in database
- **Nested Objects**: API responses include joined data (account, category, tags) as nested structures
- **Filtered Fields**: Only expose relevant database fields via API
- **Validation Rules**: Business validation rules (min/max lengths, formats, custom validators)
- **Multiple Variants**: One database table → multiple API schemas for different operations

**5. Schema Reuse Pattern**
Schemas are shared across:
- REST endpoints (Hono with OpenAPI)
- tRPC procedures (type-safe RPC)
- Runtime validation (request/response validation)
- API documentation (auto-generated OpenAPI specs)

This creates a **single source of truth** for API contracts while keeping database schema separate and focused on data storage concerns.

### Services (`src/services/`)

External service integrations and client factories:

```
src/services/
├── resend.ts                        # Email service integration for transactional emails and notifications
└── supabase.ts                      # Supabase client factory with authentication token injection
```

### Utilities (`src/utils/`)

Cross-cutting concerns and helper functions used throughout the application:

```
src/utils/
├── api-keys.ts                      # API key format validation and generation utilities
├── auth.ts                          # JWT token verification and session management utilities
├── cache/                           # In-memory caching utilities for performance optimization
├── geo.ts                           # Geographic context extraction from request headers
├── health.ts                        # Health check utilities for monitoring and alerting
├── logger.ts                        # Structured logging with request correlation and error tracking
├── parse.ts                         # Data parsing and transformation utilities
├── scopes.ts                        # Permission scope management and expansion utilities
├── search-filters.ts                # Search filter parsing and validation utilities
├── search.ts                        # Search functionality with full-text search capabilities
└── validate-response.ts             # Response validation utilities for API consistency
```

## Architectural Patterns & Key Features

### Database Architecture
- **Multi-region read replicas**: FRA, IAD, SJC regions with intelligent routing based on deployment region
- **Primary/replica separation**: All writes go to primary database, reads use regional replicas for performance
- **Read-after-write consistency**: Middleware ensures data consistency after write operations
- **Row Level Security (RLS)**: Comprehensive security policies defined in schema for multi-tenant isolation
- **Full-text search**: PostgreSQL tsvector implementation for transaction and document search
- **Vector embeddings**: Document classification using pgvector for intelligent tagging

### Authentication & Authorization
- **Dual authentication strategy**: API keys for REST endpoints, Supabase JWT for tRPC procedures
- **Scope-based permissions**: Granular API access control with expandable permission scopes
- **Team-based authorization**: Multi-tenant architecture with team-level data isolation
- **Caching layer**: LRU caching for API keys and user data to reduce database load
- **Rate limiting**: 100 requests per 10 minutes per authenticated user

### API Design Patterns
- **OpenAPI compliance**: Automatic documentation generation from Zod schemas
- **Type safety**: End-to-end type safety from database to API responses
- **Domain-driven organization**: Files organized by business domains rather than technical layers
- **Middleware composition**: Layered middleware for cross-cutting concerns
- **Error handling**: Consistent error responses with proper HTTP status codes

### Performance Optimizations
- **Connection pooling**: Efficient database connection management with postgres.js
- **Regional routing**: Automatic routing to nearest database replica
- **Response caching**: Strategic caching of frequently accessed data
- **Lazy loading**: On-demand loading of related data to minimize query overhead
- **Batch operations**: Bulk operations for improved performance on large datasets

### Security Features
- **API key hashing**: Secure storage of API keys with cryptographic hashing
- **Token validation**: JWT signature verification for Supabase authentication
- **Input validation**: Comprehensive request validation using Zod schemas
- **SQL injection prevention**: Parameterized queries through Drizzle ORM
- **CORS configuration**: Proper cross-origin resource sharing setup

This architecture provides a robust, scalable foundation for the Midday financial platform with clear separation of concerns, comprehensive security, and optimized performance for global deployment.
