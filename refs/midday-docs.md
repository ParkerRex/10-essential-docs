# Midday.ai Documentation System Overview

## Mintlify Configuration and Usage

This project uses **Mintlify** as its documentation platform, which is a modern documentation framework that provides:

- **Configuration**: The documentation is configured through `apps/docs/mint.json`, which defines the site structure, navigation, branding, and API integration
- **OpenAPI Integration**: Automatically generates API documentation from the OpenAPI specification at `https://engine.midday.ai/openapi`
- **Development Server**: Local development is available via `mintlify dev --port 3004`
- **Auto-generation**: API endpoint documentation is automatically generated using `@mintlify/scraping` tool from the OpenAPI specification
- **Theming**: Custom branding with Midday's color scheme (#1D1D1D primary, gradient anchors from #FF7F57 to #9563FF)

### Key Mintlify Features Used:

- OpenAPI specification integration for automatic API docs
- Custom navigation structure with grouped sections
- Social links integration (Twitter, GitHub, LinkedIn)
- Feedback system with thumbs rating
- Custom logos and favicon
- Support for MDX files with frontmatter

## Documentation Location

**Primary Documentation Directory**: `apps/docs/`

All documentation files are centralized in the `apps/docs` directory within the monorepo structure. This follows the Turborepo pattern where each app has its own dedicated directory.

## Current Documentation File Tree

```
apps/docs/
├── README.md                           # Basic docs app information
├── package.json                        # Mintlify dependencies and scripts
├── mint.json                          # Main Mintlify configuration file
├── introduction.mdx                   # Getting started guide
├── local-development.mdx              # Local development setup guide
├── self-hosting.mdx                   # Self-hosting instructions
├── integrations.mdx                   # Integration documentation
├── examples.mdx                       # API usage examples
├── images/                            # Documentation assets
│   ├── engine.png                     # Engine API illustration
│   └── header.png                     # Main header image
├── logos/                             # Brand assets
│   ├── favicon.png                    # Site favicon
│   ├── logotype-dark.svg              # Dark theme logo
│   └── logotype.svg                   # Light theme logo
└── api-reference/                     # API documentation
    └── engine/                        # Engine API specific docs
        ├── introduction.mdx           # Engine API overview
        └── endpoint/                  # Auto-generated endpoint docs
            ├── auth-link-gocardless.mdx
            ├── auth-link-plaid.mdx
            ├── exchange-token-gocardless.mdx
            ├── exchange-token-plaid.mdx
            ├── get-account-balance.mdx
            ├── get-accounts.mdx
            ├── get-transactions.mdx
            ├── health.mdx
            ├── search-institutions.mdx
            └── [additional endpoint files...]
```

## Documentation Inventory

| File/Directory Name                     | Purpose                                                                                                 | Relative Path                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `mint.json`                             | Main Mintlify configuration file defining site structure, navigation, branding, and OpenAPI integration | `apps/docs/mint.json`                                             |
| `package.json`                          | Defines Mintlify dependencies and documentation build scripts                                           | `apps/docs/package.json`                                          |
| `introduction.mdx`                      | Main getting started guide and project overview                                                         | `apps/docs/introduction.mdx`                                      |
| `local-development.mdx`                 | Comprehensive guide for setting up local development environment                                        | `apps/docs/local-development.mdx`                                 |
| `self-hosting.mdx`                      | Step-by-step instructions for self-hosting Midday                                                       | `apps/docs/self-hosting.mdx`                                      |
| `integrations.mdx`                      | Documentation for third-party integrations and services                                                 | `apps/docs/integrations.mdx`                                      |
| `examples.mdx`                          | Code examples and usage patterns for the Midday API                                                     | `apps/docs/examples.mdx`                                          |
| `images/`                               | Directory containing documentation images and illustrations                                             | `apps/docs/images/`                                               |
| `logos/`                                | Brand assets including logos and favicon for the documentation site                                     | `apps/docs/logos/`                                                |
| `api-reference/engine/`                 | Engine API documentation directory                                                                      | `apps/docs/api-reference/engine/`                                 |
| `api-reference/engine/introduction.mdx` | Engine API overview, authentication, and base URL information                                           | `apps/docs/api-reference/engine/introduction.mdx`                 |
| `api-reference/engine/endpoint/`        | Auto-generated API endpoint documentation from OpenAPI spec                                             | `apps/docs/api-reference/engine/endpoint/`                        |
| `get-transactions.mdx`                  | API documentation for retrieving transactions                                                           | `apps/docs/api-reference/engine/endpoint/get-transactions.mdx`    |
| `get-accounts.mdx`                      | API documentation for retrieving account information                                                    | `apps/docs/api-reference/engine/endpoint/get-accounts.mdx`        |
| `get-account-balance.mdx`               | API documentation for retrieving account balances                                                       | `apps/docs/api-reference/engine/endpoint/get-account-balance.mdx` |
| `auth-link-*.mdx`                       | Authentication and linking documentation for various providers                                          | `apps/docs/api-reference/engine/endpoint/`                        |
| `exchange-token-*.mdx`                  | Token exchange documentation for different banking providers                                            | `apps/docs/api-reference/engine/endpoint/`                        |
| `health.mdx`                            | API health check endpoint documentation                                                                 | `apps/docs/api-reference/engine/endpoint/health.mdx`              |
| `search-institutions.mdx`               | Documentation for searching financial institutions                                                      | `apps/docs/api-reference/engine/endpoint/search-institutions.mdx` |

## Additional Documentation-Related Files

| File/Directory Name            | Purpose                                                       | Relative Path                  |
| ------------------------------ | ------------------------------------------------------------- | ------------------------------ |
| `README.md`                    | Main project README with overview, features, and architecture | `README.md`                    |
| `SECURITY.md`                  | Security policy and vulnerability reporting guidelines        | `SECURITY.md`                  |
| `apps/website/src/lib/blog.ts` | Blog post management utilities for MDX content on the website | `apps/website/src/lib/blog.ts` |
| `packages/documents/`          | Document processing package with OCR capabilities             | `packages/documents/`          |

## Documentation Build and Development

### Available Scripts:

- **Development**: `bun run dev` (runs on port 3004)
- **API Generation**: `bun run generate:engine` (auto-generates API docs from OpenAPI spec)

### Build Process:

1. Mintlify reads the `mint.json` configuration
2. Processes all `.mdx` files in the docs directory
3. Automatically generates API documentation from the OpenAPI specification
4. Builds a static documentation site with navigation, search, and interactive features

### Integration Points:

- **OpenAPI Spec**: `https://engine.midday.ai/openapi` (live API specification)
- **Auto-generation**: Uses `@mintlify/scraping` to convert OpenAPI to Mintlify format
- **Monorepo Integration**: Part of Turborepo workspace with shared dependencies
