# Midday Monorepo Package Architecture

## Overview

This document analyzes the package architecture patterns used in the Midday monorepo, providing a comprehensive guide for implementing similar package structures in other TypeScript monorepos. The analysis covers package classification, entry point patterns, import/export strategies, and architectural principles.

## Workspace Configuration

### Root Package.json Structure

```json
{
  "name": "midday",
  "private": true,
  "workspaces": ["packages/*", "apps/*", "packages/email/*"],
  "packageManager": "bun@1.2.15"
}
```

**Key Patterns:**
- Uses Bun as the package manager
- Workspace pattern includes both `packages/*` and `apps/*`
- Special case for `packages/email/*` (email templates as separate workspace)
- All packages are private (not published to npm)

### Turbo Configuration

The monorepo uses Turborepo for build orchestration with specific task dependencies:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**", "lib/**"]
    },
    "lint": {
      "dependsOn": ["^topo"]
    },
    "typecheck": {
      "dependsOn": ["^topo"]
    }
  }
}
```

## Package Classification System

### 1. Minimal Utility Packages

**Characteristics:**
- Single-purpose functionality
- Minimal dependencies
- Simple exports structure
- Always have an `index.ts` file

**Example: @midday/encryption**

```
packages/encryption/
├── package.json
├── src/
│   ├── index.ts
│   └── index.test.ts
└── tsconfig.json
```

**Package.json Pattern:**
```json
{
  "name": "@midday/encryption",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "scripts": {
    "clean": "rm -rf .turbo node_modules",
    "lint": "biome check .",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit",
    "test": "bun test src"
  }
}
```

**Entry Point (src/index.ts):**
```typescript
// Direct exports of utility functions
export function encrypt(text: string): string { /* ... */ }
export function decrypt(encryptedPayload: string): string { /* ... */ }
export function hash(str: string): string { /* ... */ }
```

### 2. Multi-Export Utility Packages

**Characteristics:**
- Multiple related utilities
- Granular exports for tree-shaking
- May or may not have an `index.ts` file
- Uses `exports` field for specific entry points

**Example: @midday/utils**

```
packages/utils/
├── package.json
├── src/
│   ├── index.ts
│   ├── envs.ts
│   └── format.ts
└── tsconfig.json
```

**Package.json Pattern:**
```json
{
  "name": "@midday/utils",
  "main": "src/index.ts",
  "sideEffects": false,
  "exports": {
    ".": "./src/index.ts",
    "./envs": "./src/envs.ts",
    "./format": "./src/format.ts"
  }
}
```

**Entry Point Strategy:**
- Main export (`index.ts`) contains core utilities
- Specific exports for specialized functionality
- Enables granular imports: `import { stripSpecialCharacters } from "@midday/utils"`

### 3. Service Integration Packages

**Characteristics:**
- External service integrations
- Multiple export paths for different functionality
- May include provider-specific modules
- Often have an `index.ts` for common exports

**Example: @midday/inbox**

```
packages/inbox/
├── package.json
├── src/
│   ├── index.ts
│   ├── connector.ts
│   ├── providers/
│   │   ├── gmail.ts
│   │   ├── outlook.ts
│   │   └── types.ts
│   └── schema.ts
└── tsconfig.json
```

**Package.json Pattern:**
```json
{
  "name": "@midday/inbox",
  "main": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./connector": "./src/connector.ts"
  },
  "dependencies": {
    "@midday/encryption": "workspace:*",
    "@midday/supabase": "workspace:*",
    "googleapis": "^149.0.0",
    "zod": "^3.25.46"
  }
}
```

### 4. Component Library Packages

**Characteristics:**
- No main `index.ts` file
- Extensive `exports` field mapping
- Each component is individually exportable
- Includes non-JS assets (CSS, config files)

**Example: @midday/ui**

```
packages/ui/
├── package.json
├── src/
│   ├── components/
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── utils/
│   │   └── cn.ts
│   └── globals.css
├── tailwind.config.ts
└── postcss.config.js
```

**Package.json Pattern:**
```json
{
  "name": "@midday/ui",
  "sideEffects": false,
  "files": ["tailwind.config.ts", "postcss.config.js", "globals.css"],
  "exports": {
    "./button": "./src/components/button.tsx",
    "./dialog": "./src/components/dialog.tsx",
    "./globals.css": "./src/globals.css",
    "./cn": "./src/utils/cn.ts",
    "./tailwind.config": "./tailwind.config.ts"
  }
}
```

**Import Pattern:**
```typescript
// Granular component imports
import { Button } from "@midday/ui/button";
import { Dialog } from "@midday/ui/dialog";
import { cn } from "@midday/ui/cn";
```

### 5. Multi-Service Packages

**Characteristics:**
- No main `index.ts` file
- Service-specific entry points
- Complex internal structure
- Multiple export paths for different services

**Example: @midday/supabase**

```
packages/supabase/
├── package.json
├── src/
│   ├── client/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── queries/
│   │   └── index.ts
│   └── types/
│       └── index.ts
└── tsconfig.json
```

**Package.json Pattern:**
```json
{
  "name": "@midday/supabase",
  "exports": {
    "./server": "./src/client/server.ts",
    "./client": "./src/client/client.ts",
    "./middleware": "./src/client/middleware.ts",
    "./queries": "./src/queries/index.ts",
    "./types": "./src/types/index.ts"
  }
}
```

### 6. Configuration-Only Packages

**Characteristics:**
- No source code, only configuration files
- Minimal package.json
- Used for sharing configurations across packages

**Example: @midday/tsconfig**

```
packages/tsconfig/
├── package.json
├── base.json
├── nextjs.json
└── react-library.json
```

**Package.json Pattern:**
```json
{
  "name": "@midday/tsconfig",
  "private": true,
  "version": "1.0.0",
  "files": ["base.json"]
}
```

## Entry Point Decision Matrix

### When to Include index.ts

| Package Type | Has index.ts | Reason |
|--------------|-------------|---------|
| Utility packages | ✅ Yes | Single entry point for core functionality |
| Service integrations | ✅ Yes | Common exports and re-exports |
| Simple packages | ✅ Yes | Default export pattern |
| Component libraries | ❌ No | Granular imports preferred |
| Multi-service packages | ❌ No | Service-specific entry points |
| Configuration packages | ❌ No | No executable code |

### Index.ts Patterns

**Re-export Pattern:**
```typescript
// packages/inbox/src/index.ts
export * from "./schema";
export * from "./utils";
```

**Aggregation Pattern:**
```typescript
// packages/app-store/src/index.ts
import calApp from "./cal/config";
import slackApp from "./slack/config";

export const apps = [slackApp, calApp];
```

**Direct Export Pattern:**
```typescript
// packages/utils/src/index.ts
export function stripSpecialCharacters(inputString: string) {
  // Implementation
}
```

## Import/Export Strategy Analysis

### Export Patterns

#### 1. Granular Exports (Preferred for Large Packages)

**Benefits:**
- Tree-shaking optimization
- Reduced bundle size
- Clear dependency tracking

**Implementation:**
```json
{
  "exports": {
    "./button": "./src/components/button.tsx",
    "./dialog": "./src/components/dialog.tsx",
    "./utils": "./src/utils/index.ts"
  }
}
```

**Usage:**
```typescript
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
```

#### 2. Namespace Exports (For Service Packages)

**Benefits:**
- Logical grouping
- Environment-specific exports
- Clear separation of concerns

**Implementation:**
```json
{
  "exports": {
    "./server": "./src/client/server.ts",
    "./client": "./src/client/client.ts",
    "./queries": "./src/queries/index.ts"
  }
}
```

**Usage:**
```typescript
import { createClient } from "@midday/supabase/server";
import { useQuery } from "@midday/supabase/queries";
```

#### 3. Single Export (For Simple Packages)

**Benefits:**
- Simple import syntax
- Clear package purpose
- Easy to understand

**Implementation:**
```json
{
  "main": "src/index.ts"
}
```

**Usage:**
```typescript
import { encrypt, decrypt } from "@midday/encryption";
```

### Import Patterns in Consumer Applications

#### Next.js App Configuration

```javascript
// next.config.mjs
const config = {
  transpilePackages: [
    "@midday/ui",
    "@midday/invoice",
    "@midday/api",
  ],
};
```

#### TypeScript Configuration

```json
{
  "extends": "@midday/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Dependency Management Patterns

### Workspace Dependencies

**Pattern:**
```json
{
  "dependencies": {
    "@midday/ui": "workspace:*",
    "@midday/utils": "workspace:*",
    "@midday/supabase": "workspace:*"
  }
}
```

**Benefits:**
- Always uses local workspace version
- Automatic dependency resolution
- Simplified version management

### External Dependencies

**Shared Dependencies:**
- `typescript`: Consistent across all packages
- `zod`: Validation library used by multiple packages
- `date-fns`: Date utilities

**Package-Specific Dependencies:**
- UI components: Radix UI, Tailwind CSS
- Database: Supabase client libraries
- External APIs: Service-specific SDKs

## TypeScript Configuration Strategy

### Base Configuration

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "esModuleInterop": true,
    "isolatedModules": true,
    "lib": ["es2022", "DOM", "DOM.Iterable"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "target": "ES2022"
  }
}
```

### Package-Specific Configurations

**React Library Configuration:**
```json
{
  "extends": "@midday/tsconfig/base.json",
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

**Next.js Application Configuration:**
```json
{
  "extends": "@midday/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Package.json Field Analysis

### Essential Fields

| Field | Purpose | Usage Pattern |
|-------|---------|---------------|
| `name` | Package identifier | Always `@midday/package-name` |
| `version` | Package version | Usually `1.0.0` for internal packages |
| `private` | Prevents publishing | Always `true` |
| `main` | Default entry point | Used when package has index.ts |
| `exports` | Modern entry points | Preferred for granular exports |
| `sideEffects` | Bundle optimization | `false` for pure packages |

### Optional Fields

| Field | Purpose | When to Use |
|-------|---------|-------------|
| `files` | Published files | Configuration packages |
| `scripts` | Package commands | All packages (lint, test, etc.) |
| `dependencies` | Runtime deps | When package needs external libraries |
| `devDependencies` | Development deps | TypeScript, testing tools |

## Testing Patterns

### Test Configuration

**Bun Test Integration:**
```json
{
  "scripts": {
    "test": "bun test src"
  }
}
```

**Test File Patterns:**
- `src/index.test.ts` - Unit tests alongside source
- `src/utils.test.ts` - Function-specific tests

### Testing Strategy

1. **Unit Tests**: For utility functions and business logic
2. **Integration Tests**: For service integrations
3. **Type Tests**: For TypeScript type definitions

## Build and Development Workflow

### Development Scripts

**Standard Package Scripts:**
```json
{
  "scripts": {
    "clean": "rm -rf .turbo node_modules",
    "lint": "biome check .",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit",
    "test": "bun test src"
  }
}
```

### Build Process

1. **Type Checking**: `tsc --noEmit` for all packages
2. **Linting**: Biome for code quality
3. **Testing**: Bun test runner
4. **Dependency Resolution**: Turbo handles build order

## Best Practices and Recommendations

### Package Design Principles

1. **Single Responsibility**: Each package should have a clear, focused purpose
2. **Minimal Dependencies**: Only include necessary external dependencies
3. **Tree-Shakable**: Use granular exports for optimal bundle sizes
4. **Type-Safe**: Leverage TypeScript for better developer experience

### Export Strategy Guidelines

1. **Use granular exports** for component libraries and large packages
2. **Provide namespace exports** for service-oriented packages
3. **Include index.ts** for simple utility packages
4. **Avoid index.ts** for packages with many unrelated exports

### Dependency Guidelines

1. **Use workspace dependencies** for internal packages
2. **Pin external dependency versions** for consistency
3. **Share common dependencies** at the root level when possible
4. **Minimize dependency overlap** between packages

### File Organization

1. **Group related functionality** in subdirectories
2. **Use consistent naming conventions** across packages
3. **Separate concerns** (types, utils, components)
4. **Include tests** alongside source code

## Implementation Checklist

When creating a new package in this architecture:

- [ ] Choose appropriate package classification
- [ ] Set up package.json with correct fields
- [ ] Configure TypeScript with appropriate base config
- [ ] Determine export strategy (index.ts vs granular exports)
- [ ] Add standard development scripts
- [ ] Configure workspace dependencies
- [ ] Set up testing framework
- [ ] Add to Turbo configuration if needed
- [ ] Update consuming applications

## Real-World Examples

### Example 1: Creating a New Utility Package

**Scenario**: Adding a new date utilities package

```
packages/date-utils/
├── package.json
├── src/
│   ├── index.ts
│   ├── formatters.ts
│   ├── parsers.ts
│   └── validators.ts
└── tsconfig.json
```

**Package.json:**
```json
{
  "name": "@midday/date-utils",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "sideEffects": false,
  "exports": {
    ".": "./src/index.ts",
    "./formatters": "./src/formatters.ts",
    "./parsers": "./src/parsers.ts",
    "./validators": "./src/validators.ts"
  },
  "dependencies": {
    "date-fns": "^4.1.0"
  }
}
```

### Example 2: Creating a Service Integration Package

**Scenario**: Adding a new payment provider integration

```
packages/payments/
├── package.json
├── src/
│   ├── index.ts
│   ├── providers/
│   │   ├── stripe.ts
│   │   ├── paypal.ts
│   │   └── types.ts
│   └── utils.ts
└── tsconfig.json
```

**Package.json:**
```json
{
  "name": "@midday/payments",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./stripe": "./src/providers/stripe.ts",
    "./paypal": "./src/providers/paypal.ts",
    "./types": "./src/providers/types.ts"
  },
  "dependencies": {
    "@midday/encryption": "workspace:*",
    "stripe": "^14.0.0",
    "zod": "^3.25.46"
  }
}
```

## Conclusion

The Midday monorepo demonstrates a sophisticated package architecture that balances developer experience, build performance, and maintainability. The key insights are:

1. **Package classification drives structure**: Different types of packages require different organizational patterns
2. **Export strategy matters**: Granular exports enable better tree-shaking and clearer dependencies
3. **TypeScript configuration sharing**: Centralized configs ensure consistency
4. **Workspace dependencies**: Simplify internal package management
5. **Build tool integration**: Turbo orchestrates complex dependency graphs

This architecture can be adapted to other TypeScript monorepos by following the classification system, export patterns, and configuration strategies outlined in this document.

## Additional Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Package.json Exports Field](https://nodejs.org/api/packages.html#exports)
- [Bun Workspaces](https://bun.sh/docs/install/workspaces)
