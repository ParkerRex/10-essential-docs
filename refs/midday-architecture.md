# Midday Architecture Guide

## Directory Structure Overview

```
apps/
├── api/
│   ├── db/
│   ├── migrations/
│   ├── rest/
│   ├── schemas/
│   ├── src/
│   └── trpc/
├── dashboard/
│   ├── public/
│   ├── src/
│   └── styles/
├── docs/
│   ├── api-reference/
│   ├── images/
│   └── logos/
├── engine/
│   ├── src/
│   └── tests/
├── mobile/
│   ├── android/
│   ├── ios/
│   └── src/
└── website/
    ├── public/
    └── src/
packages/
├── documents/
├── email/
├── events/
├── import/
├── inbox/
├── jobs/
├── kv/
├── location/
├── notification/
├── supabase/
│   ├── src/
│   │   ├── client/
│   │   ├── mutations/
│   │   ├── queries/
│   │   ├── types/
│   │   └── utils/
├── tsconfig/
├── ui/
└── utils/
```

## Directory Purposes

### Apps

This directory contains the main applications in the Midday ecosystem:

- `api`: Backend API server (Hono.js)
- `dashboard`: Main dashboard application (Next.js)
- `docs`: Documentation site (Mintlify)
- `engine`: Financial data processing engine
- `mobile`: Mobile applications (React Native)
- `website`: Marketing website (Next.js)

### Packages

This directory contains shared libraries and utilities used across multiple apps:

- `documents`: Document processing and management
- `email`: Email templating and sending
- `events`: Event bus and handling
- `import`: Data import utilities
- `inbox`: Email inbox processing
- `jobs`: Background job processing
- `kv`: Key-value storage utilities
- `location`: Location and timezone utilities
- `notification`: Notification system
- `supabase`: Supabase client utilities
- `tsconfig`: Shared TypeScript configurations
- `ui`: Shared UI components
- `utils`: General utilities

## Detailed Directory Reference

### Apps

| Directory                 | Purpose                               | Role in Codebase                                        | Example Usage                                                      |
| ------------------------- | ------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| `apps/api/db`             | Database schema and query definitions | Defines database structure and provides query functions | `import { getDocuments } from "@api/db/queries/documents";`        |
| `apps/api/migrations`     | Database migration files              | Manages database schema changes                         | `drizzle-kit push` applies these migrations                        |
| `apps/api/rest`           | REST API endpoints                    | Provides HTTP API for external consumers                | `fetch('https://api.midday.ai/documents')`                         |
| `apps/api/schemas`        | API request/response schemas          | Defines data validation and OpenAPI specs               | `import { documentResponseSchema } from "@api/schemas/documents";` |
| `apps/api/src`            | Core API source code                  | Entry point and shared utilities for API                | `import { validateResponse } from "@api/utils/validate-response";` |
| `apps/api/trpc`           | tRPC procedure definitions            | Type-safe API for internal consumers                    | `const docs = await trpc.documents.list.query();`                  |
| `apps/dashboard/public`   | Static assets for dashboard           | Hosts images, fonts, and other assets                   | `<img src="/logo.png" />`                                          |
| `apps/dashboard/src`      | Dashboard application code            | Main dashboard application UI and logic                       | `import { DashboardLayout } from "@/components/layouts";`          |
| `apps/dashboard/styles`   | Global CSS and styling                | Defines global styles and themes                        | `import "@/styles/globals.css";`                                   |
| `apps/docs/api-reference` | API documentation                     | Documents API endpoints and schemas                     | Viewed at `midday.ai/docs/api-reference`                           |
| `apps/docs/images`        | Documentation images                  | Hosts images for documentation                          | `<img src="/images/header.png" />`                                 |
| `apps/docs/logos`         | Brand logos                           | Stores brand assets for docs                            | `<img src="/logos/logotype.svg" />`                                |
| `apps/engine/src`         | Financial engine code                 | Processes financial data and transactions               | `import { processTransaction } from "@midday/engine";`             |
| `apps/engine/tests`       | Engine test suite                     | Tests for financial engine                              | `describe('Transaction processing', () => {...})`                  |
| `apps/mobile/android`     | Android-specific code                 | Native Android configuration                            | Android build process uses these files                             |
| `apps/mobile/ios`         | iOS-specific code                     | Native iOS configuration                                | iOS build process uses these files                                 |
| `apps/mobile/src`         | Shared mobile app code                | Cross-platform React Native code                        | `import { HomeScreen } from "./screens/Home";`                     |
| `apps/website/public`     | Static assets for website             | Hosts images and other assets                           | `<img src="/hero.jpg" />`                                          |
| `apps/website/src`        | Website application code              | Marketing site UI and logic                             | `import { PricingSection } from "@/components/pricing";`           |

### Packages

| Directory                         | Purpose                   | Role in Codebase                               | Example Usage                                              |
| --------------------------------- | ------------------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| `packages/documents`              | Document processing       | Handles document uploads, parsing, and storage | `import { processDocument } from "@midday/documents";`     |
| `packages/email`                  | Email functionality       | Manages email templates and sending            | `import { sendWelcomeEmail } from "@midday/email";`        |
| `packages/events`                 | Event system              | Provides pub/sub event system                  | `import { publishEvent } from "@midday/events";`           |
| `packages/import`                 | Data importing            | Handles importing data from external sources   | `import { importTransactions } from "@midday/import";`     |
| `packages/inbox`                  | Email inbox               | Processes incoming emails                      | `import { syncInbox } from "@midday/inbox";`               |
| `packages/jobs`                   | Background jobs           | Manages scheduled and background tasks         | `import { queueJob } from "@midday/jobs";`                 |
| `packages/kv`                     | Key-value storage         | Provides simple storage abstraction            | `import { setValue } from "@midday/kv";`                   |
| `packages/location`               | Location utilities        | Handles timezones and location data            | `import { formatWithTimezone } from "@midday/location";`   |
| `packages/notification`           | Notification system       | Manages user notifications                     | `import { sendNotification } from "@midday/notification";` |
| `packages/supabase/src/client`    | Supabase client setup     | Configures Supabase clients                    | `import { createClient } from "@midday/supabase/client";`  |
| `packages/supabase/src/mutations` | Database write operations | Provides functions for modifying data          | `import { updateUser } from "@midday/supabase/mutations";` |
| `packages/supabase/src/queries`   | Database read operations  | Provides functions for fetching data           | `import { getUserQuery } from "@midday/supabase/queries";` |
| `packages/supabase/src/types`     | Supabase type definitions | Defines TypeScript types for database          | `import type { User } from "@midday/supabase/types";`      |
| `packages/supabase/src/utils`     | Supabase utilities        | Helper functions for Supabase                  | `import { getFileUrl } from "@midday/supabase/utils";`     |
| `packages/tsconfig`               | TypeScript configs        | Shared TS configuration                        | `"extends": "@midday/tsconfig/nextjs.json"`                |
| `packages/ui`                     | UI component library      | Shared React components                        | `import { Button } from "@midday/ui";`                     |
| `packages/utils`                  | General utilities         | Common utility functions                       | `import { formatCurrency } from "@midday/utils";`          |

## API Layer Architecture

Midday uses a multi-layered approach to data access and API design:

### 1. Supabase Direct Access (`packages/supabase`)

**Purpose**:

- Direct database access for server components
- Authentication and session management
- Storage operations

**When Used**:

- Inside Next.js server components
- For authentication flows
- When working with Supabase-specific features

**Example**:

```typescript
// Server Component
import { getUserQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";

async function ProfileComponent() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { data: user } = await getUserQuery(supabase, session.user.id);

  return <div>Hello, {user.name}</div>;
}
```

### 2. tRPC API (`apps/api/src/trpc`)

**Purpose**:

- Type-safe API layer between frontend and backend
- Business logic encapsulation
- Cross-database operations

**When Used**:

- For complex operations requiring business logic
- When frontend needs type-safe API calls
- For operations spanning multiple data sources

**Example**:

```typescript
// Client Component
import { useTRPC } from "@/trpc/client";

function TransactionList() {
  const { data, isLoading } = useTRPC.transactions.list.useQuery({
    limit: 10,
    offset: 0,
  });

  if (isLoading) return <Spinner />;
  return (
    <div>
      {data.map((t) => (
        <Transaction key={t.id} data={t} />
      ))}
    </div>
  );
}
```

### 3. REST API (`apps/api/src/rest`)

**Purpose**:

- Standard REST API for external consumers
- OpenAPI documentation generation
- API key authentication

**When Used**:

- For third-party integrations
- When clients need a standard REST API
- For public API access

**Example**:

```javascript
// External service
fetch("https://api.midday.ai/transactions", {
  method: "GET",
  headers: {
    Authorization: "Bearer API_KEY_HERE",
  },
})
  .then((response) => response.json())
  .then((data) => console.log(data));
```

## Key Architectural Patterns

### Data Flow

```typescript
// 1. Server Component using tRPC
import { trpc } from "@/trpc/server";

export default async function DocumentsPage() {
  // 2. Fetch data using tRPC
  const documents = await trpc.documents.list.query({
    pageSize: 20,
  });

  return (
    <div>
      <h1>Documents</h1>
      <DocumentList documents={documents.data} />
      <DocumentUploader />
    </div>
  );
}

// 3. Client Component for user interaction
("use client");
function DocumentUploader() {
  // 4. Use mutation to upload document
  const uploadMutation = useTRPC.documents.upload.useMutation();

  const handleUpload = async (file) => {
    // 5. Call mutation with file data
    await uploadMutation.mutateAsync({ file });
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
    </div>
  );
}
```

### API Layer Interaction

```typescript
// 1. REST endpoint definition
app.openapi(
  createRoute({
    method: "get",
    path: "/",
    summary: "List all documents",
    // OpenAPI metadata...
  }),
  async (c) => {
    const db = c.get("db");
    const teamId = c.get("teamId");
    const params = c.req.valid("query");

    // 2. Call database query function
    const data = await getDocuments(db, {
      teamId,
      ...params,
    });

    // 3. Return validated response
    return c.json(validateResponse({ data }, documentsResponseSchema));
  }
);
```

### Database Operations

```typescript
// 1. Database query function
export async function getDocuments(db: Database, params: GetDocumentsParams) {
  const { teamId, cursor, pageSize = 20, q, tags } = params;

  // 2. Build query with filters
  let query = db.select().from(documents).where(eq(documents.teamId, teamId));

  // 3. Add search if provided
  if (q) {
    query = query.where(
      sql`${documents.fts} @@ plainto_tsquery('english', ${q})`
    );
  }

  // 4. Add pagination
  if (cursor) {
    query = query.where(lt(documents.id, cursor));
  }

  // 5. Execute query and return results
  const results = await query
    .limit(pageSize + 1)
    .orderBy(desc(documents.createdAt));

  // 6. Handle pagination metadata
  const hasNextPage = results.length > pageSize;
  if (hasNextPage) {
    results.pop();
  }

  return results;
}
```

## Authentication Flow

```typescript
"use client";

import { createClient } from "@midday/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    // 1. Get Supabase client
    const supabase = createClient();

    // 2. Attempt login
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 3. Handle result
    if (error) {
      console.error("Login failed:", error.message);
    } else {
      // 4. Redirect on success
      window.location.href = "/dashboard";
    }
  };

  return <form onSubmit={handleLogin}>{/* Form fields */}</form>;
}
```

## Background Job Processing

```typescript
import { Queue } from "bullmq";
import { redis } from "./redis";

// 1. Define job queue
export const documentProcessingQueue = new Queue("document-processing", {
  connection: redis,
});

// 2. Function to queue a job
export async function queueDocumentProcessing(documentId: string) {
  // 3. Add job to queue with options
  await documentProcessingQueue.add(
    "process-document",
    { documentId },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    }
  );
}

// 4. Worker definition (in another file)
// import { Worker } from "bullmq";
// new Worker("document-processing", async (job) => {
//   const { documentId } = job.data;
//   await processDocument(documentId);
// });
```

## Technology Stack

- **Frontend**: React, Next.js, TailwindCSS
- **Backend**: Hono.js, tRPC, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Mobile**: React Native, Expo
- **Deployment**: Vercel, Fly.io, Cloudflare
- **Build Tools**: Turborepo, Bun
- **Documentation**: Mintlify
- **Testing**: Bun Test

## Development Workflow

1. **Local Development**:

   - `bun install` to install dependencies
   - `bun run dev` to start all services
   - `bun run dev:dashboard` to start only the dashboard

2. **Testing**:

   - `bun run test` to run all tests
   - `bun run test:watch` for watch mode

3. **Building**:

   - `bun run build` to build all packages
   - `bun run build:dashboard` to build only the dashboard

4. **Deployment**:
   - GitHub Actions for CI/CD
   - Vercel for frontend applications
   - Fly.io for API services
