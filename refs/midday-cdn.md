# Midday Image Optimization and CDN Analysis

## Overview

This document analyzes how the Midday Next.js project handles image optimization and CDN delivery across its multiple applications (website, dashboard, engine).

## 1. Custom Image Loader Implementation

### Website Image Loader

The website app uses a simple Cloudflare image optimization integration:

```typescript
interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

export default function imageLoader({
  src,
  width,
  quality = 80,
}: ImageLoaderParams): string {
  return `https://midday.ai/cdn-cgi/image/width=${width},quality=${quality}/${src}`;
}
```

### Dashboard Image Loader

The dashboard app includes additional logic for handling Next.js assets:

```typescript
const CDN_URL = "https://midday.ai";

export default function imageLoader({
  src,
  width,
  quality = 80,
}: ImageLoaderParams): string {
  if (src.startsWith("/_next")) {
    return `${CDN_URL}/cdn-cgi/image/width=${width},quality=${quality}/https://app.midday.ai${src}`;
  }
  return `${CDN_URL}/cdn-cgi/image/width=${width},quality=${quality}/${src}`;
}
```

## 2. CDN Service Identification

**Cloudflare Image Resizing** is the primary CDN service, identified by the `cdn-cgi/image` URL pattern.

### Features:
- Automatic format optimization (WebP, AVIF when supported)
- On-the-fly resizing based on width parameter
- Quality compression (default 80%)
- Edge caching for improved performance

### URL Structure:
```
https://midday.ai/cdn-cgi/image/width={width},quality={quality}/{original-path}
```

## 3. Next.js Image Configuration

Both apps use identical custom image loader configurations:

```javascript
images: {
  loader: "custom",
  loaderFile: "./image-loader.ts",
  remotePatterns: [
    {
      protocol: "https",
      hostname: "**",
    },
  ],
},
```

## 4. Multiple CDN Endpoints

The project uses several CDN endpoints for different purposes:

- **`https://midday.ai/cdn-cgi/image/`** - Main Cloudflare image optimization
- **`https://cdn.midday.ai/`** - Static assets (fonts, OpenGraph images)
- **`https://cdn-engine.midday.ai/`** - Bank logos and engine assets

### Engine Logo Service

```typescript
export function getLogoURL(id: string, ext?: string) {
  return `https://cdn-engine.midday.ai/${id}.${ext || "jpg"}`;
}
```

## 5. Image Loading Strategies

### Dynamic Theme-Based Images

The website implements a component for serving different images based on theme:

```typescript
export function DynamicImage({
  lightSrc,
  darkSrc,
  alt,
  className,
  ...props
}: DynamicImageProps) {
  return (
    <>
      <Image
        src={lightSrc}
        alt={alt}
        className={cn("dark:hidden", className)}
        {...props}
      />
      <Image
        src={darkSrc}
        alt={alt}
        className={cn("hidden dark:block", className)}
        {...props}
      />
    </>
  );
}
```

### Error Handling and Fallbacks

Bank logos implement comprehensive error handling:

```typescript
export function BankLogo({ src, alt, size = 34 }: Props) {
  const [hasError, setHasError] = useState(false);

  return (
    <Avatar style={{ width: size, height: size }}>
      {src && !hasError && (
        <Image
          src={src}
          alt={alt}
          quality={100}
          onError={() => setHasError(true)}
        />
      )}
      <Image
        src="https://cdn-engine.midday.ai/default.jpg"
        alt={alt}
        className={cn(!src || hasError ? "" : "-z-10")}
      />
    </Avatar>
  );
}
```

### Image Viewer with Loading States

```typescript
export function ImageViewer({ url }: { url: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {isLoading && !isError && (
        <Skeleton className="absolute inset-0 h-full w-full" />
      )}
      {isError && <ErrorImage />}
      <img
        src={url}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsError(true)}
      />
    </div>
  );
}
```

## 6. Image Processing Pipeline

### Upload and Storage
- **Supabase Storage** for file uploads with resumable uploads via tus protocol
- **Sharp** for server-side image processing
- **HEIC conversion** to JPEG for compatibility

### HEIC Processing Example

```typescript
const image = await sharp(decodedImage)
  .rotate()
  .resize({ width: MAX_SIZE })
  .toFormat("jpeg")
  .toBuffer();

await supabase.storage
  .from("vault")
  .upload(filePath.join("/"), image, {
    contentType: "image/jpeg",
    upsert: true,
  });
```

## 7. Optimization Parameters

### Available Parameters:
- **Width**: Dynamic resizing based on component needs
- **Quality**: Default 80%, configurable (up to 100% for logos)
- **Format**: Automatic WebP/AVIF optimization by Cloudflare
- **Caching**: 3600 seconds cache control for uploads

### Quality Settings by Use Case:
- Marketing images: 80-90%
- Bank logos: 100%
- User uploads: 80% (default)

## 8. App-Specific Strategies

### Website App
- Simple Cloudflare optimization
- High quality marketing images (80-90%)
- Theme-based image switching
- Focus on performance and visual quality

### Dashboard App  
- Complex routing for `/_next` assets
- Comprehensive error handling
- Multiple fallback mechanisms
- Resumable uploads for user content
- Business-focused image handling

### Engine App
- Dedicated CDN for bank logos
- Logo matching and fallback systems
- Cloudflare R2 storage integration
- Institution-specific image serving

## 9. Complete Image Optimization Pipeline

```
1. Image Upload → Supabase Storage (with Sharp processing)
2. Image Request → Custom Image Loader
3. URL Generation → Cloudflare cdn-cgi/image service
4. Optimization → Automatic format/quality optimization
5. Delivery → Edge-cached optimized images
6. Fallback → Error handling with default images
```

## 10. Usage Examples

### Basic Optimized Image
```typescript
<DynamicImage
  lightSrc={heroImageLight}
  darkSrc={heroImageDark}
  width={1141}
  height={641}
  quality={80}
  priority
  alt="Dashboard interface"
/>
```

### Logo with Fallback
```typescript
<BankLogo 
  src="https://cdn-engine.midday.ai/chase.jpg"
  alt="Chase Bank"
  size={34}
/>
```

### File Upload with Processing
```typescript
const { uploadFile } = useUpload();
await uploadFile({
  bucket: "vault",
  path: [teamId, "inbox", filename],
  file: selectedFile,
});
```

## 11. Performance Benefits

- **Global Edge Caching**: Cloudflare's global network
- **Automatic Format Selection**: WebP/AVIF when supported
- **On-demand Resizing**: No pre-processing required
- **Quality Optimization**: Balanced file size vs quality
- **Fallback Mechanisms**: Graceful degradation on errors

## 12. Architecture Summary

This architecture provides a robust, scalable image optimization system that:

- Leverages Cloudflare's global CDN for performance
- Maintains flexibility for different use cases
- Implements comprehensive error handling
- Supports multiple image sources and formats
- Optimizes for both performance and user experience

The system is designed to handle everything from marketing images on the website to user-uploaded documents in the dashboard, with appropriate optimization strategies for each use case.

## 13. Implementation Files

### Core Image Loaders
- `apps/website/image-loader.ts` - Website Cloudflare image optimization
- `apps/dashboard/image-loader.ts` - Dashboard image loader with Next.js asset handling

### Next.js Configuration
- `apps/website/next.config.mjs` - Website image configuration
- `apps/dashboard/next.config.mjs` - Dashboard image configuration

### Image Components
- `apps/website/src/components/dynamic-image.tsx` - Theme-based image switching
- `apps/dashboard/src/components/image-viewer.tsx` - Image viewer with loading states
- `apps/dashboard/src/components/bank-logo.tsx` - Bank logo with fallback handling
- `apps/dashboard/src/components/file-viewer.tsx` - File viewer with dynamic loading
- `apps/website/src/components/hero-image.tsx` - Hero image with animations
- `apps/dashboard/src/components/transaction-bank-account.tsx` - Transaction bank logos

### Upload and Storage
- `apps/dashboard/src/hooks/use-upload.ts` - Upload hook for simple uploads
- `packages/supabase/src/utils/storage.ts` - Supabase storage utilities
- `apps/dashboard/src/utils/upload.ts` - Resumable upload implementation
- `apps/dashboard/src/components/inbox/inbox-upload-zone.tsx` - Inbox file upload
- `apps/dashboard/src/components/vault/vault-upload-zone.tsx` - Vault file upload
- `apps/dashboard/src/components/avatar-upload.tsx` - Avatar upload component

### Image Processing (Sharp)
- `packages/jobs/src/tasks/document/convert-heic.ts` - HEIC to JPEG conversion
- `packages/jobs/src/tasks/document/process-document.ts` - Document processing orchestration
- `packages/jobs/src/tasks/document/classify-image.ts` - Image classification
- `packages/jobs/src/tasks/inbox/process-attachment.ts` - Inbox attachment processing
- `packages/jobs/src/tasks/inbox/slack-upload.ts` - Slack file upload processing

### CDN and Logo Services
- `apps/engine/src/utils/logo.ts` - Engine logo URL generation
- `apps/engine/tasks/utils.ts` - Logo matching and image utilities
- `apps/engine/tasks/download-gocardless.ts` - GoCardless logo downloads
- `apps/engine/tasks/download-teller.ts` - Teller logo downloads
- `packages/utils/src/envs.ts` - CDN URL configuration

### PDF and Document Processing
- `apps/dashboard/src/utils/pdf-to-img.ts` - PDF to image conversion
- `apps/dashboard/src/utils/canvas-factory.ts` - Canvas factory for PDF rendering
- `packages/documents/src/loaders/loader.ts` - Document loading utilities
- `packages/documents/src/utils.ts` - Document utilities and MIME type handling

### OpenGraph and Meta Images
- `apps/dashboard/src/app/[locale]/(public)/i/[token]/opengraph-image.tsx` - Invoice OpenGraph images
- `apps/website/src/app/layout.tsx` - Website meta image configuration

### Package Dependencies
- `packages/jobs/package.json` - Sharp and image processing dependencies
- `apps/website/package.json` - Website Sharp dependency
- `apps/dashboard/package.json` - Dashboard Sharp and image dependencies
- `packages/jobs/trigger.config.ts` - Trigger.dev configuration with Sharp external

### UI Components
- `packages/ui/src/components/avatar.tsx` - Avatar component with Next.js Image
- `apps/dashboard/src/components/bank-connections.tsx` - Bank connection logos

### Document Processors
- `packages/documents/src/processors/receipt/receipt-processor.ts` - Receipt image processing
- `packages/documents/src/processors/invoice/invoice-processor.ts` - Invoice document processing

### Configuration Files
- `midday-cdn.md` - This documentation file
