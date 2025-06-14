# TypeScript Configuration in Midday

This document explains how TypeScript configuration works across the Midday monorepo, including the inheritance patterns, configuration files, and their outputs.

## TypeScript Configuration File Tree

```
midday/
├── tsconfig.json                      # Root tsconfig (extends base)
├── packages/
│   ├── tsconfig/                      # Shared TypeScript configurations
│   │   ├── package.json               # Package metadata
│   │   ├── base.json                  # Base configuration
│   │   ├── nextjs.json                # Next.js specific config (extends base)
│   │   └── react-library.json         # React library config (extends base)
│   ├── ui/
│   │   └── tsconfig.json              # UI package config (extends react-library)
│   ├── utils/
│   │   └── tsconfig.json              # Utils package config (extends base)
│   ├── documents/
│   │   └── tsconfig.json              # Documents package config (extends nextjs)
│   ├── jobs/
│   │   └── tsconfig.json              # Jobs package config (extends base)
│   └── ...other packages
├── apps/
│   ├── dashboard/
│   │   └── tsconfig.json              # Dashboard app config (extends nextjs)
│   ├── website/
│   │   └── tsconfig.json              # Website app config (extends nextjs)
│   ├── engine/
│   │   ├── tsconfig.json              # Engine app config (custom)
│   │   └── tsconfig.build.json        # Engine build config (extends engine tsconfig)
│   ├── api/
│   │   └── tsconfig.json              # API app config (custom)
│   └── ...other apps
```

## Configuration Inheritance

The TypeScript configuration in Midday follows a hierarchical inheritance pattern:

1. **Base Configuration**: `packages/tsconfig/base.json` defines the core TypeScript settings
2. **Specialized Configurations**: Extend the base config with specific settings for different project types
3. **Project Configurations**: Each project extends one of the specialized configs and adds project-specific settings

```
base.json ──────┬─────► nextjs.json ─────┬─────► dashboard/tsconfig.json
                │                        ├─────► website/tsconfig.json
                │                        └─────► documents/tsconfig.json
                │
                └─────► react-library.json ──► ui/tsconfig.json
                │
                └─────► utils/tsconfig.json
                └─────► jobs/tsconfig.json
                └─────► ...other packages
```

## Configuration Details

### 1. Base Configuration (`packages/tsconfig/base.json`)

This is the foundation for all TypeScript configurations in the project.

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Default",
  "compilerOptions": {
    "esModuleInterop": true,
    "incremental": false,
    "isolatedModules": true,
    "lib": ["es2022", "DOM", "DOM.Iterable"],
    "module": "NodeNext",
    "moduleDetection": "force",
    "moduleResolution": "NodeNext",
    "noUncheckedIndexedAccess": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true,
    "target": "ES2022",
    "baseUrl": "."
  }
}
```

**Key Settings**:

- Modern JavaScript target (`ES2022`)
- Strict type checking enabled
- Node.js module resolution
- DOM libraries included for browser compatibility

**Output**: No direct output; this is a template for other configs to extend.

### 2. Next.js Configuration (`packages/tsconfig/nextjs.json`)

Extends the base configuration with Next.js-specific settings.

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Next.js",
  "extends": "./base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowJs": true,
    "jsx": "preserve",
    "noEmit": true
  }
}
```

**Key Settings**:

- Next.js plugin enabled
- JSX preserved for Next.js transformation
- No direct TypeScript output (`noEmit: true`)
- ESNext module format
- Bundler module resolution

**Output**: No TypeScript output files; Next.js handles the compilation.

### 3. React Library Configuration (`packages/tsconfig/react-library.json`)

Specialized for React component libraries.

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "React Library",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "target": "ES2022"
  }
}
```

**Key Settings**:

- React JSX transformation
- ESNext module format
- ES2022 target

**Output**: JavaScript files with React JSX transformed to React.createElement calls.

### 4. Root Configuration (`tsconfig.json`)

The root configuration is minimal and extends the base configuration.

```json
{
  "extends": "@midday/tsconfig/base.json"
}
```

**Purpose**: Provides TypeScript support for files in the root directory.

**Output**: No specific output; used for type checking root-level TypeScript files.

### 5. App-Specific Configurations

#### Dashboard App (`apps/dashboard/tsconfig.json`)

```json
{
  "extends": "@midday/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@api/*": ["../api/src/*"],
      "@engine/*": ["../engine/src/*"],
      "@jobs/*": ["../../packages/jobs/src/*"]
    },
    "strict": true
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "../../types",
    "next-env.d.ts",
    "next.config.js",
    "tailwind.config.ts",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules", ".next"]
}
```

**Key Settings**:

- Path aliases for imports
- Includes Next.js type definitions
- Excludes node_modules and Next.js build output

**Output**: No direct TypeScript output; Next.js handles compilation.

#### Engine App (`apps/engine/tsconfig.json`)

```json
{
  "compilerOptions": {
    "moduleResolution": "Bundler",
    "baseUrl": ".",
    "paths": {
      "@engine/*": ["src/*"]
    },
    "strict": true,
    "types": ["@cloudflare/workers-types", "bun-types"],
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx",
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleDetection": "force",
    "allowJs": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "exclude": ["dist", "node_modules"]
}
```

**Key Settings**:

- Custom configuration (doesn't extend base)
- Cloudflare Workers and Bun types
- Hono JSX support
- ESNext target

**Output**: No direct output in development; used for type checking.

#### Engine Build Configuration (`apps/engine/tsconfig.build.json`)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": true,
    "outDir": "dist",
    "sourceMap": false,
    "removeComments": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

**Key Settings**:

- Generates declaration files only
- Outputs to `dist` directory
- Excludes test files

**Output**: `.d.ts` declaration files in the `dist` directory.

#### API App (`apps/api/tsconfig.json`)

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleDetection": "force",
    "allowJs": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noPropertyAccessFromIndexSignature": false,
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "baseUrl": ".",
    "paths": {
      "@api/*": ["src/*"],
      "@engine/*": ["../engine/src/*"],
      "@jobs/*": ["../../packages/jobs/src/*"]
    },
    "types": ["bun-types"]
  },
  "exclude": ["node_modules"],
  "include": ["src/**/*.ts"]
}
```

**Key Settings**:

- Custom configuration (doesn't extend base)
- Bun types
- No emit (Bun handles compilation)
- Path aliases

**Output**: No TypeScript output; Bun handles the compilation.

### 6. Package-Specific Configurations

#### UI Package (`packages/ui/tsconfig.json`)

```json
{
  "extends": "@midday/tsconfig/react-library.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

**Key Settings**:

- Extends react-library configuration
- Path aliases for imports

**Output**: React component library code.

#### Utils Package (`packages/utils/tsconfig.json`)

```json
{
  "extends": "@midday/tsconfig/base.json",
  "include": ["."],
  "exclude": ["node_modules"]
}
```

**Key Settings**:

- Extends base configuration
- Includes all TypeScript files in the package

**Output**: Utility functions compiled according to base configuration.

## How TypeScript Configuration Works in the Monorepo

### 1. Package Resolution

The `@midday/tsconfig/*` packages are resolved through the Node.js module resolution system. The `package.json` in `packages/tsconfig` specifies which files are included:

```json
{
  "name": "@midday/tsconfig",
  "private": true,
  "version": "1.0.0",
  "files": ["base.json"]
}
```

Note: The `files` field should include all JSON files that need to be published as part of the package.

### 2. Build Process

During the build process:

1. **TypeScript Checking**: `tsc --noEmit` is run to type-check without generating output
2. **Next.js Build**: Next.js apps use their own build process that incorporates TypeScript
3. **Library Builds**: Libraries may use `tsc` to generate output files
4. **Declaration Files**: Some packages generate `.d.ts` files for type definitions

### 3. Development Workflow

During development:

1. **Editor Integration**: VSCode and other editors use the nearest `tsconfig.json` for type checking
2. **Watch Mode**: `tsc --watch` or equivalent may be used for real-time type checking
3. **Type Checking Command**: `bun run typecheck` runs type checking across the monorepo

## Common TypeScript Configuration Patterns

### 1. Path Aliases

Many configurations use path aliases to simplify imports:

```json
"paths": {
  "@/*": ["./src/*"],
  "@api/*": ["../api/src/*"]
}
```

This allows imports like:

```typescript
import { Button } from "@/components/Button";
```

Instead of:

```typescript
import { Button } from "../../components/Button";
```

### 2. Include/Exclude Patterns

Configurations carefully control which files are included:

```json
"include": [
  "src/**/*.ts",
  "src/**/*.tsx"
],
"exclude": [
  "node_modules",
  "dist"
]
```

### 3. Module Resolution Strategies

Different projects use different module resolution strategies:

- **Next.js apps**: `"moduleResolution": "Bundler"`
- **Node.js packages**: `"moduleResolution": "NodeNext"`

### 4. Type Definitions

Projects include specific type definitions:

- **Bun**: `"types": ["bun-types"]`
- **Cloudflare Workers**: `"types": ["@cloudflare/workers-types"]`
- **Next.js**: Includes `"next-env.d.ts"`

## Benefits of This Approach

1. **Consistency**: Shared base configurations ensure consistent TypeScript settings
2. **Specialization**: Different project types can have tailored configurations
3. **DRY Principle**: Avoids repeating the same configuration options
4. **Maintainability**: Changing a setting in one place affects all inheriting configs

## Conclusion

The TypeScript configuration in Midday follows a well-structured inheritance pattern that balances consistency with flexibility. The base configuration provides common settings, while specialized configurations adapt these for different project types. Each project then extends the appropriate specialized configuration and adds project-specific settings.

This approach ensures type safety across the monorepo while allowing for the specific needs of different applications and packages.
