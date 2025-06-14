# Data Fetching Architecture Guide - Midday Project

## Overview

The Midday project implements a sophisticated data fetching architecture using **tRPC** (TypeScript Remote Procedure Call) with **React Query** (TanStack Query) for type-safe, efficient client-server communication. This architecture provides end-to-end type safety, automatic caching, optimistic updates, and seamless integration with Supabase authentication.

## Architecture Components

### 1. Core Technologies
- **tRPC**: Type-safe API layer with automatic TypeScript inference
- **React Query**: Powerful data synchronization and caching
- **Supabase**: Authentication and database management
- **SuperJSON**: Enhanced serialization for complex data types
- **Next.js**: Full-stack React framework with SSR/SSG support

### 2. Project Structure
```
apps/
├── dashboard/src/trpc/          # Client-side tRPC setup
│   ├── client.tsx               # Browser tRPC client
│   ├── server.tsx               # Server-side tRPC utilities
│   └── query-client.ts          # React Query configuration
├── api/src/trpc/                # Server-side tRPC setup
│   ├── init.ts                  # tRPC initialization
│   ├── routers/                 # API route definitions
│   └── middleware/              # Authentication & permissions
```

## Client-Side Implementation

### tRPC Client Setup

The client-side tRPC setup provides type-safe API calls with automatic authentication:

```typescript
// apps/dashboard/src/trpc/client.tsx
"use client";

import type { AppRouter } from "@midday/api/trpc/routers/_app";
import { createClient } from "@midday/supabase/client";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import superjson from "superjson";

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
          transformer: superjson,
          async headers() {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            
            return {
              Authorization: `Bearer ${session?.access_token}`,
            };
          },
        }),
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
```

### Query Client Configuration

The React Query client is configured with optimized defaults and SuperJSON serialization:

```typescript
// apps/dashboard/src/trpc/query-client.ts
import { QueryClient, defaultShouldDehydrateQuery } from "@tanstack/react-query";
import superjson from "superjson";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
}
```

## Server-Side Implementation

### tRPC Server Setup

The server-side setup includes authentication, geo-context, and database connections:

```typescript
// apps/dashboard/src/trpc/server.tsx
import "server-only";

import type { AppRouter } from "@midday/api/trpc/routers/_app";
import { createClient } from "@midday/supabase/server";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";

// Stable query client for server-side rendering
export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy<AppRouter>({
  queryClient: getQueryClient,
  client: createTRPCClient({
    links: [
      httpBatchLink({
        url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
        transformer: superjson,
        async headers() {
          const supabase = await createClient();
          const { data: { session } } = await supabase.auth.getSession();

          return {
            Authorization: `Bearer ${session?.access_token}`,
            "x-user-timezone": await getTimezone(),
            "x-user-locale": await getLocale(),
            "x-user-country": await getCountryCode(),
          };
        },
      }),
    ],
  }),
});
```

### API Router Structure

The main API router aggregates all feature-specific routers:

```typescript
// apps/api/src/trpc/routers/_app.ts
import { createTRPCRouter } from "../init";
import { transactionsRouter } from "./transactions";
import { userRouter } from "./user";
// ... other routers

export const appRouter = createTRPCRouter({
  transactions: transactionsRouter,
  user: userRouter,
  bankAccounts: bankAccountsRouter,
  // ... other routes
});

export type AppRouter = typeof appRouter;
```

## Authentication Integration

### Supabase Authentication

The architecture seamlessly integrates Supabase authentication across client and server:

#### Client-Side Authentication
```typescript
// Automatic token injection in client requests
async headers() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    Authorization: `Bearer ${session?.access_token}`,
  };
}
```

#### Server-Side Authentication
```typescript
// apps/api/src/trpc/init.ts
export const createTRPCContext = async (_, c: Context): Promise<TRPCContext> => {
  const accessToken = c.req.header("Authorization")?.split(" ")[1];
  const session = await verifyAccessToken(accessToken);
  const supabase = await createClient(accessToken);
  
  return {
    session,
    supabase,
    db: await connectDb(),
    geo: getGeoContext(c.req),
  };
};

export const protectedProcedure = t.procedure
  .use(withTeamPermissionMiddleware)
  .use(async (opts) => {
    if (!opts.ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return opts.next({ ctx: opts.ctx });
  });
```

## Data Fetching Patterns

### 1. Server-Side Prefetching

Prefetch data on the server for optimal performance:

```typescript
// apps/dashboard/src/app/[locale]/(app)/(sidebar)/transactions/page.tsx
export default async function Transactions(props: Props) {
  const queryClient = getQueryClient();
  const searchParams = await props.searchParams;
  const filter = loadTransactionFilterParams(searchParams);

  // Prefetch infinite query data
  await queryClient.fetchInfiniteQuery(
    trpc.transactions.get.infiniteQueryOptions({
      ...filter,
      sort: { field: "date", order: "desc" },
    }),
  );

  return (
    <HydrateClient>
      <Suspense fallback={<Loading />}>
        <DataTable />
      </Suspense>
    </HydrateClient>
  );
}
```

### 2. Batch Prefetching

Efficiently prefetch multiple queries:

```typescript
// apps/dashboard/src/app/[locale]/(app)/(sidebar)/layout.tsx
export default async function Layout({ children }: { children: React.ReactNode }) {
  // Batch prefetch common data
  batchPrefetch([
    trpc.team.current.queryOptions(),
    trpc.invoice.defaultSettings.queryOptions(),
    trpc.search.global.queryOptions({ searchTerm: "" }),
  ]);

  const user = await queryClient.fetchQuery(trpc.user.me.queryOptions());
  
  return <>{children}</>;
}
```

### 3. Client-Side Infinite Queries

Implement pagination with infinite scrolling:

```typescript
// apps/dashboard/src/components/inbox/inbox-view.tsx
export function InboxView() {
  const trpc = useTRPC();
  const { params, filter } = useInboxParams();

  const infiniteQueryOptions = trpc.inbox.get.infiniteQueryOptions(
    { order: params.order, ...filter },
    { getNextPageParam: ({ meta }) => meta?.cursor }
  );

  const { data, fetchNextPage, hasNextPage } = 
    useSuspenseInfiniteQuery(infiniteQueryOptions);

  const tableData = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  // Auto-fetch next page when scrolling
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage]);

  return <DataTable data={tableData} />;
}
```

### 4. Mutations with Optimistic Updates

Implement mutations with optimistic UI updates and error handling:

```typescript
// apps/dashboard/src/components/transaction-details.tsx
export function TransactionDetails() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { transactionId } = useTransactionParams();

  const updateTransactionMutation = useMutation(
    trpc.transactions.update.mutationOptions({
      onMutate: async (variables) => {
        // Cancel outgoing refetches
        await Promise.all([
          queryClient.cancelQueries({
            queryKey: trpc.transactions.getById.queryKey({ id: transactionId! }),
          }),
          queryClient.cancelQueries({
            queryKey: trpc.transactions.get.infiniteQueryKey(),
          }),
        ]);

        // Snapshot previous values
        const previousData = {
          details: queryClient.getQueryData(
            trpc.transactions.getById.queryKey({ id: transactionId! })
          ),
          list: queryClient.getQueryData(
            trpc.transactions.get.infiniteQueryKey()
          ),
        };

        // Optimistically update details view
        queryClient.setQueryData(
          trpc.transactions.getById.queryKey({ id: transactionId! }),
          (old: any) => ({ ...old, ...variables })
        );

        // Optimistically update list view
        queryClient.setQueryData(
          trpc.transactions.get.infiniteQueryKey(),
          (old: any) => {
            if (!old?.pages) return old;
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                data: page.data.map((transaction: any) =>
                  transaction.id === transactionId
                    ? { ...transaction, ...variables }
                    : transaction
                ),
              })),
            };
          }
        );

        return { previousData };
      },
      onError: (_, __, context) => {
        // Revert optimistic updates on error
        queryClient.setQueryData(
          trpc.transactions.getById.queryKey({ id: transactionId! }),
          context?.previousData.details
        );
        queryClient.setQueryData(
          trpc.transactions.get.infiniteQueryKey(),
          context?.previousData.list
        );
      },
      onSettled: () => {
        // Invalidate queries after mutation
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.getById.queryKey({ id: transactionId! }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });
      },
    })
  );

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      updateTransactionMutation.mutate({ id: transactionId, ...formData });
    }}>
      {/* Form fields */}
    </form>
  );
}
```

### 5. Error Handling Patterns

Comprehensive error handling across the application:

```typescript
// Global error handling in mutations
const createCategoryMutation = useMutation(
  trpc.transactionCategories.create.mutationOptions({
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: trpc.transactionCategories.get.queryKey(),
      });
      toast({ title: "Category created", variant: "success" });
    },
    onError: (error) => {
      toast({
        title: "Failed to create category",
        description: error.message,
        variant: "error",
      });
    },
  })
);

// Query error boundaries
<ErrorBoundary errorComponent={ErrorFallback}>
  <Suspense fallback={<Loading />}>
    <DataComponent />
  </Suspense>
</ErrorBoundary>
```

## Utility Functions

### Server-Side Utilities

The server provides several utility functions for data fetching:

```typescript
// apps/dashboard/src/trpc/server.tsx

// Hydration wrapper for server-rendered components
export function HydrateClient({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}

// Single query prefetching
export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T
) {
  const queryClient = getQueryClient();

  if (queryOptions.queryKey[1]?.type === "infinite") {
    void queryClient.prefetchInfiniteQuery(queryOptions as any);
  } else {
    void queryClient.prefetchQuery(queryOptions);
  }
}

// Batch prefetching for multiple queries
export function batchPrefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptionsArray: T[]
) {
  const queryClient = getQueryClient();

  for (const queryOptions of queryOptionsArray) {
    if (queryOptions.queryKey[1]?.type === "infinite") {
      void queryClient.prefetchInfiniteQuery(queryOptions as any);
    } else {
      void queryClient.prefetchQuery(queryOptions);
    }
  }
}
```

### Client-Side Hooks

Custom hooks for common data fetching patterns:

```typescript
// apps/dashboard/src/hooks/use-user.ts
export function useUserQuery() {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.user.me.queryOptions());
}

export function useUserMutation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.user.update.mutationOptions({
      onMutate: async (newData) => {
        await queryClient.cancelQueries({
          queryKey: trpc.user.me.queryKey(),
        });

        const previousData = queryClient.getQueryData(trpc.user.me.queryKey());

        queryClient.setQueryData(trpc.user.me.queryKey(), (old: any) => ({
          ...old,
          ...newData,
        }));

        return { previousData };
      },
      onError: (_, __, context) => {
        queryClient.setQueryData(
          trpc.user.me.queryKey(),
          context?.previousData
        );
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.user.me.queryKey(),
        });
      },
    })
  );
}
```

## Best Practices and Guidelines

### When to Use Server vs Client Fetching

#### Server-Side Fetching (Recommended for):
- **Initial page data**: Critical data needed for first render
- **SEO-important content**: Data that affects search engine indexing
- **Large datasets**: Heavy queries that benefit from server processing
- **Authentication-dependent data**: User-specific data that requires session validation

```typescript
// Example: Server-side prefetching for dashboard
export default async function Dashboard() {
  const queryClient = getQueryClient();

  // Prefetch critical dashboard data
  await Promise.all([
    queryClient.fetchQuery(trpc.bankAccounts.get.queryOptions({ enabled: true })),
    queryClient.fetchQuery(trpc.metrics.revenue.queryOptions({ from, to })),
  ]);

  return (
    <HydrateClient>
      <DashboardCharts />
    </HydrateClient>
  );
}
```

#### Client-Side Fetching (Recommended for):
- **Interactive data**: Data that changes based on user interactions
- **Real-time updates**: Data that needs frequent refreshing
- **Conditional data**: Data loaded based on user actions or state
- **Background updates**: Non-critical data that can load progressively

```typescript
// Example: Client-side conditional fetching
export function TransactionSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data, isLoading } = useQuery(
    trpc.transactions.search.queryOptions(
      { query: debouncedSearch },
      { enabled: debouncedSearch.length > 2 } // Only fetch when search term is meaningful
    )
  );

  return <SearchResults data={data} loading={isLoading} />;
}
```

### Performance Optimization Strategies

#### 1. Query Key Management
```typescript
// Use consistent query keys for effective caching
const transactionQueryKey = trpc.transactions.get.queryKey({
  filter: { status: "pending" },
  sort: { field: "date", order: "desc" }
});

// Invalidate related queries efficiently
queryClient.invalidateQueries({
  queryKey: trpc.transactions.get.queryKey(), // Invalidates all transaction queries
  exact: false // Partial matching
});
```

#### 2. Stale Time Configuration
```typescript
// Configure appropriate stale times based on data volatility
const { data } = useQuery(
  trpc.user.profile.queryOptions(),
  {
    staleTime: 5 * 60 * 1000, // 5 minutes for user profile
  }
);

const { data: realTimeData } = useQuery(
  trpc.notifications.get.queryOptions(),
  {
    staleTime: 0, // Always fresh for notifications
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  }
);
```

#### 3. Selective Query Invalidation
```typescript
// Invalidate specific queries instead of broad invalidation
const updateTransactionMutation = useMutation(
  trpc.transactions.update.mutationOptions({
    onSuccess: (updatedTransaction) => {
      // Specific invalidation
      queryClient.invalidateQueries({
        queryKey: trpc.transactions.getById.queryKey({ id: updatedTransaction.id }),
      });

      // Update cache directly for better UX
      queryClient.setQueryData(
        trpc.transactions.getById.queryKey({ id: updatedTransaction.id }),
        updatedTransaction
      );
    },
  })
);
```

### Cache Invalidation Strategies

#### 1. Optimistic Updates with Rollback
```typescript
const mutation = useMutation(
  trpc.transactions.update.mutationOptions({
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update
      queryClient.setQueryData(queryKey, (old) => ({ ...old, ...variables }));

      return { previousData };
    },
    onError: (_, __, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKey, context?.previousData);
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey });
    },
  })
);
```

#### 2. Dependent Query Invalidation
```typescript
// Invalidate related queries when data relationships change
const deleteTransactionMutation = useMutation(
  trpc.transactions.delete.mutationOptions({
    onSuccess: () => {
      // Invalidate multiple related queries
      queryClient.invalidateQueries({
        queryKey: trpc.transactions.get.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.metrics.summary.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.bankAccounts.balance.queryKey(),
      });
    },
  })
);
```

### Type Safety Considerations

#### 1. Router Type Inference
```typescript
// Leverage full type inference from the router
type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

// Use inferred types in components
type TransactionData = RouterOutputs['transactions']['getById'];
type CreateTransactionInput = RouterInputs['transactions']['create'];
```

#### 2. Query Options Type Safety
```typescript
// Type-safe query options
const queryOptions = trpc.transactions.get.queryOptions({
  filter: { status: "completed" }, // TypeScript ensures valid filter properties
  sort: { field: "amount", order: "asc" }, // TypeScript ensures valid sort fields
});

// Type-safe infinite query options
const infiniteQueryOptions = trpc.transactions.get.infiniteQueryOptions(
  { pageSize: 20 },
  {
    getNextPageParam: (lastPage) => lastPage.meta?.cursor, // Type-safe cursor access
  }
);
```

## Real-World Implementation Examples

### 1. Dashboard Page with Multiple Data Sources

```typescript
// apps/dashboard/src/app/[locale]/(app)/(sidebar)/page.tsx
export default async function Dashboard(props: Props) {
  const queryClient = getQueryClient();
  const searchParams = await props.searchParams;
  const { from, to } = loadDateParams(searchParams);

  // Parallel data fetching for dashboard
  const [accounts] = await Promise.all([
    queryClient.fetchQuery(
      trpc.bankAccounts.get.queryOptions({ enabled: true })
    ),
    queryClient.fetchQuery(
      trpc.metrics.revenue.queryOptions({ from, to })
    ),
  ]);

  const isEmpty = !accounts?.length;

  return (
    <HydrateClient>
      <div>
        <ChartSelectors />
        <div className={cn(isEmpty && "blur-[8px] opacity-20")}>
          <Charts disabled={isEmpty} />
        </div>
        <Widgets disabled={false} />
      </div>
      <OverviewModal defaultOpen={isEmpty} />
    </HydrateClient>
  );
}
```

### 2. Data Table with Infinite Scrolling

```typescript
// apps/dashboard/src/components/tables/transactions/data-table.tsx
export function TransactionsDataTable() {
  const trpc = useTRPC();
  const { ref, inView } = useInView();
  const { filter, sort } = useTransactionParams();
  const [deferredSearch] = useDeferredValue(filter.search);

  const infiniteQueryOptions = trpc.transactions.get.infiniteQueryOptions(
    { ...filter, q: deferredSearch, sort },
    { getNextPageParam: ({ meta }) => meta?.cursor }
  );

  const { data, fetchNextPage, hasNextPage, refetch } =
    useSuspenseInfiniteQuery(infiniteQueryOptions);

  const updateTransactionMutation = useMutation(
    trpc.transactions.update.mutationOptions({
      onSuccess: () => {
        refetch();
        toast({ title: "Transaction updated", variant: "success" });
      },
    })
  );

  // Auto-fetch next page when scrolling
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage]);

  const tableData = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  return (
    <div>
      <DataTable
        data={tableData}
        onUpdate={updateTransactionMutation.mutate}
      />
      <div ref={ref} className="h-10" /> {/* Intersection observer trigger */}
    </div>
  );
}
```

### 3. Form with Real-time Validation

```typescript
// apps/dashboard/src/components/create-transaction-form.tsx
export function CreateTransactionForm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateTransactionInput>({});

  // Real-time category search
  const { data: categories } = useQuery(
    trpc.transactionCategories.search.queryOptions(
      { query: formData.categorySearch || "" },
      { enabled: (formData.categorySearch?.length ?? 0) > 1 }
    )
  );

  const createTransactionMutation = useMutation(
    trpc.transactions.create.mutationOptions({
      onMutate: async (newTransaction) => {
        // Optimistically add to the list
        const queryKey = trpc.transactions.get.infiniteQueryKey();
        await queryClient.cancelQueries({ queryKey });

        const previousData = queryClient.getQueryData(queryKey);

        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old?.pages?.[0]) return old;

          return {
            ...old,
            pages: [
              {
                ...old.pages[0],
                data: [{ ...newTransaction, id: 'temp-id' }, ...old.pages[0].data],
              },
              ...old.pages.slice(1),
            ],
          };
        });

        return { previousData };
      },
      onSuccess: (createdTransaction) => {
        // Replace temporary item with real data
        queryClient.setQueryData(
          trpc.transactions.get.infiniteQueryKey(),
          (old: any) => {
            if (!old?.pages) return old;

            return {
              ...old,
              pages: old.pages.map((page: any, index: number) => {
                if (index === 0) {
                  return {
                    ...page,
                    data: page.data.map((item: any) =>
                      item.id === 'temp-id' ? createdTransaction : item
                    ),
                  };
                }
                return page;
              }),
            };
          }
        );

        toast({ title: "Transaction created", variant: "success" });
      },
      onError: (_, __, context) => {
        // Remove optimistic update on error
        queryClient.setQueryData(
          trpc.transactions.get.infiniteQueryKey(),
          context?.previousData
        );
        toast({ title: "Failed to create transaction", variant: "error" });
      },
    })
  );

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      createTransactionMutation.mutate(formData);
    }}>
      {/* Form fields with real-time validation */}
    </form>
  );
}
```

## Advanced Patterns

### 1. Dependent Queries

```typescript
// Chain queries where one depends on another
export function UserDashboard() {
  const trpc = useTRPC();

  const { data: user } = useQuery(trpc.user.me.queryOptions());

  const { data: teamData } = useQuery(
    trpc.team.getById.queryOptions({ id: user?.teamId! }),
    { enabled: !!user?.teamId } // Only fetch when user data is available
  );

  const { data: teamMetrics } = useQuery(
    trpc.metrics.team.queryOptions({ teamId: teamData?.id! }),
    { enabled: !!teamData?.id } // Only fetch when team data is available
  );

  return <Dashboard user={user} team={teamData} metrics={teamMetrics} />;
}
```

### 2. Background Data Synchronization

```typescript
// Keep data fresh with background refetching
export function useRealtimeData() {
  const trpc = useTRPC();

  // Refetch notifications every 30 seconds
  const { data: notifications } = useQuery(
    trpc.notifications.get.queryOptions(),
    {
      refetchInterval: 30 * 1000,
      refetchIntervalInBackground: true,
    }
  );

  // Refetch on window focus
  const { data: criticalData } = useQuery(
    trpc.dashboard.critical.queryOptions(),
    {
      refetchOnWindowFocus: true,
      staleTime: 0, // Always consider stale
    }
  );

  return { notifications, criticalData };
}
```

### 3. Error Recovery Strategies

```typescript
// Implement retry logic and error boundaries
export function RobustDataComponent() {
  const trpc = useTRPC();

  const { data, error, refetch } = useQuery(
    trpc.transactions.get.queryOptions(),
    {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error.data?.httpStatus >= 400 && error.data?.httpStatus < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={() => refetch()}
        fallback={<OfflineDataComponent />}
      />
    );
  }

  return <DataComponent data={data} />;
}
```

## Implementation Checklist

### Setting Up a New Feature

1. **Define tRPC Router**
   - [ ] Create router file in `apps/api/src/trpc/routers/`
   - [ ] Define input/output schemas with Zod
   - [ ] Implement procedures with proper authentication
   - [ ] Add router to main app router

2. **Client-Side Integration**
   - [ ] Create custom hooks for common queries
   - [ ] Implement optimistic updates for mutations
   - [ ] Add proper error handling and loading states
   - [ ] Configure appropriate stale times

3. **Server-Side Optimization**
   - [ ] Add prefetching for critical page data
   - [ ] Implement batch prefetching where beneficial
   - [ ] Use HydrateClient wrapper for SSR pages

4. **Performance Considerations**
   - [ ] Implement infinite queries for large datasets
   - [ ] Add proper query key management
   - [ ] Configure cache invalidation strategies
   - [ ] Add loading skeletons and error boundaries

### Testing Strategy

```typescript
// Mock tRPC for testing
import { createTRPCMsw } from 'msw-trpc';
import { rest } from 'msw';

const trpcMsw = createTRPCMsw<AppRouter>();

export const handlers = [
  trpcMsw.transactions.get.query((req, res, ctx) => {
    return res(ctx.data({ data: mockTransactions, meta: { cursor: null } }));
  }),

  trpcMsw.transactions.create.mutation((req, res, ctx) => {
    return res(ctx.data(mockCreatedTransaction));
  }),
];
```

This architecture provides a robust, type-safe, and performant foundation for data fetching in modern React applications. The combination of tRPC and React Query offers excellent developer experience while maintaining optimal user experience through intelligent caching and optimistic updates.
```
