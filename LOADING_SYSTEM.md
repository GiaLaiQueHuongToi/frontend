# Loading & Error Handling System

This project includes a comprehensive loading and error handling system with fallbacks for all routes and components.

## Files Created

### UI Components

- `src/components/ui/loading.tsx` - Loading components (Loading, LoadingSpinner, LoadingCard, PageLoading)
- `src/components/ui/error.tsx` - Error components (ErrorPage, ErrorCard, NotFound)
- `src/components/loading-wrapper.tsx` - Wrapper components with Suspense + ErrorBoundary

### Global Next.js Files

- `src/app/loading.tsx` - Global app loading
- `src/app/error.tsx` - Global app error handling
- `src/app/not-found.tsx` - Global 404 page
- `src/app/template.tsx` - Global error boundary template

### Route-Specific Loading & Error Files

#### Authentication Routes

- `src/app/login/loading.tsx` & `src/app/login/error.tsx`
- `src/app/register/loading.tsx` & `src/app/register/error.tsx`
- `src/app/auth/loading.tsx` & `src/app/auth/error.tsx`
- `src/app/auth/grantcode/loading.tsx` & `src/app/auth/grantcode/error.tsx`

#### Dashboard Routes

- `src/app/dashboard/loading.tsx` & `src/app/dashboard/error.tsx`
- `src/app/dashboard/create/loading.tsx` & `src/app/dashboard/create/error.tsx`
- `src/app/dashboard/video/loading.tsx` & `src/app/dashboard/video/error.tsx`
- `src/app/dashboard/video/[id]/loading.tsx` & `src/app/dashboard/video/[id]/error.tsx`
- `src/app/dashboard/video/[id]/edit/loading.tsx` & `src/app/dashboard/video/[id]/edit/error.tsx`

#### Example Route

- `src/app/examples/loading.tsx` & `src/app/examples/error.tsx`
- `src/app/examples/loading/page.tsx` - Comprehensive examples of all loading patterns

## Components Available

### Loading Components

```tsx
import { Loading, LoadingSpinner, LoadingCard, PageLoading } from '@/components/ui/loading';

// Basic loading with text
<Loading text="Loading..." size="md" />

// Just a spinner
<LoadingSpinner size="lg" />

// Loading in a card
<LoadingCard text="Loading data..." />

// Full page loading
<PageLoading text="Loading page..." />
```

### Error Components

```tsx
import { ErrorPage, ErrorCard, NotFound } from '@/components/ui/error';

// Full page error
<ErrorPage
    error={error}
    reset={reset}
    title="Something went wrong"
    description="Please try again"
/>

// Error in card format
<ErrorCard
    title="Error"
    description="Failed to load"
    onRetry={handleRetry}
/>

// 404 page
<NotFound />
```

### Wrapper Components

```tsx
import { LoadingWrapper, LoadingCardWrapper } from '@/components/loading-wrapper';

// Wraps component with Suspense + ErrorBoundary
<LoadingWrapper
    loadingText="Loading..."
    errorTitle="Error"
    errorDescription="Failed to load"
>
    <YourComponent />
</LoadingWrapper>

// Card version
<LoadingCardWrapper loadingText="Loading...">
    <YourComponent />
</LoadingCardWrapper>
```

## Usage Patterns

### 1. Page-Level Loading (Automatic)

Next.js automatically uses `loading.tsx` files when navigating between routes.

### 2. Component-Level Loading

Use hooks like `useVideos` that return `isLoading` state:

```tsx
const { isLoading, videos, error } = useVideos();

if (isLoading) return <Loading text='Loading videos...' />;
if (error)
    return <ErrorCard title='Error' description='Failed to load videos' />;
return <VideoList videos={videos} />;
```

### 3. Async Component Loading

Use Suspense for async components:

```tsx
<Suspense fallback={<Loading text='Loading async data...' />}>
    <AsyncComponent />
</Suspense>
```

### 4. Error Boundaries

Use LoadingWrapper for automatic error handling:

```tsx
<LoadingWrapper errorTitle='Component Error'>
    <ComponentThatMightFail />
</LoadingWrapper>
```

## Features

- ✅ **Route-level loading** - Every route has loading and error pages
- ✅ **Component-level loading** - Reusable loading components
- ✅ **Error boundaries** - Automatic error catching and fallbacks
- ✅ **Customizable** - All components accept custom text and styling
- ✅ **TypeScript** - Full type safety
- ✅ **Accessible** - Screen reader friendly with proper ARIA labels
- ✅ **Consistent design** - Follows your design system

## Testing

Visit `/examples/loading` to see all loading and error patterns in action.

The system automatically handles:

- Network failures
- Component errors
- Route not found
- Slow loading states
- JavaScript errors
- API timeouts

All with user-friendly fallbacks and retry mechanisms.
