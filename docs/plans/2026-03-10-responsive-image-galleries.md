# Responsive Image Galleries Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow admins to upload separate image galleries for desktop, tablet, and mobile per boat, and serve the right gallery based on screen size.

**Architecture:** Add 2 new DB columns (`imageGalleryTablet`, `imageGalleryMobile`) alongside existing `imageGallery` (desktop). Admin UI gets 3 tabs in the gallery uploader. Frontend uses a `useResponsiveGallery` hook with fallback chain: mobile -> tablet -> desktop.

**Tech Stack:** Drizzle ORM, Zod, React, shadcn/ui Tabs, TailwindCSS

---

### Task 1: Add DB columns to schema

**Files:**
- Modify: `shared/schema.ts:265` (boats table)
- Modify: `shared/schema.ts:415` (updateBoatSchema)

**Step 1: Add columns to boats table**

In `shared/schema.ts`, after line 265 (`imageGallery`), add:

```typescript
  imageGalleryTablet: text("image_gallery_tablet").array(), // Tablet-optimized images
  imageGalleryMobile: text("image_gallery_mobile").array(), // Mobile-optimized images
```

**Step 2: Add fields to updateBoatSchema**

In `shared/schema.ts`, after line 415 (`imageGallery` in updateBoatSchema), add:

```typescript
  imageGalleryTablet: z.array(z.string()).nullable().optional(),
  imageGalleryMobile: z.array(z.string()).nullable().optional(),
```

**Step 3: Push schema to DB**

Run: `npm run db:push`
Expected: Schema synced, 2 new columns added to boats table.

**Step 4: Commit**

```bash
git add shared/schema.ts
git commit -m "feat: add imageGalleryTablet and imageGalleryMobile columns to boats table"
```

---

### Task 2: Update CRM types and boat form schema

**Files:**
- Modify: `client/src/components/crm/types.ts:42` (boatSchema)

**Step 1: Add fields to boatSchema**

In `client/src/components/crm/types.ts`, after line 42 (`imageGallery`), add:

```typescript
  imageGalleryTablet: z.array(z.string()).optional(),
  imageGalleryMobile: z.array(z.string()).optional(),
```

**Step 2: Commit**

```bash
git add client/src/components/crm/types.ts
git commit -m "feat: add tablet/mobile gallery fields to CRM boat form schema"
```

---

### Task 3: Add tabs to ImageGalleryUploader

**Files:**
- Modify: `client/src/components/ImageGalleryUploader.tsx`

**Step 1: Update props interface**

Replace the existing `ImageGalleryUploaderProps` interface (lines 25-30):

```typescript
interface ImageGalleryUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  imagesTablet?: string[];
  onImagesTabletChange?: (images: string[]) => void;
  imagesMobile?: string[];
  onImagesMobileChange?: (images: string[]) => void;
  onMainImageChange?: (mainImageUrl: string | null) => void;
  maxImages?: number;
}
```

**Step 2: Add Tabs import**

Add to existing imports:

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Tablet, Smartphone } from "lucide-react";
```

**Step 3: Refactor component body**

Destructure new props in the component function signature:

```typescript
export function ImageGalleryUploader({
  images,
  onImagesChange,
  imagesTablet,
  onImagesTabletChange,
  imagesMobile,
  onImagesMobileChange,
  onMainImageChange,
  maxImages = 10,
}: ImageGalleryUploaderProps) {
```

Extract the existing upload zone + gallery grid into a reusable inner component `GalleryTab`:

```typescript
function GalleryTab({
  images,
  onImagesChange,
  maxImages,
  showCoverBadge,
  onMainImageChange,
}: {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages: number;
  showCoverBadge: boolean;
  onMainImageChange?: (url: string | null) => void;
}) {
  // Move ALL existing upload/gallery logic here (useState uploading, useDropzone,
  // DndContext, sensors, handleDragEnd, handleRemove, etc.)
  // The SortableImage component stays as-is but uses showCoverBadge for the "Portada" badge
  // onMainImageChange only fires when showCoverBadge is true
}
```

Then the main component renders:

```typescript
const hasResponsive = onImagesTabletChange || onImagesMobileChange;

if (!hasResponsive) {
  // Backward compatible: render single gallery without tabs
  return (
    <GalleryTab
      images={images}
      onImagesChange={onImagesChange}
      maxImages={maxImages}
      showCoverBadge={true}
      onMainImageChange={onMainImageChange}
    />
  );
}

return (
  <Tabs defaultValue="desktop" className="w-full">
    <TabsList className="grid w-full grid-cols-3">
      <TabsTrigger value="desktop" className="gap-1.5">
        <Monitor className="w-4 h-4" />
        <span className="hidden sm:inline">Desktop</span>
      </TabsTrigger>
      <TabsTrigger value="tablet" className="gap-1.5">
        <Tablet className="w-4 h-4" />
        <span className="hidden sm:inline">Tablet</span>
      </TabsTrigger>
      <TabsTrigger value="mobile" className="gap-1.5">
        <Smartphone className="w-4 h-4" />
        <span className="hidden sm:inline">Movil</span>
      </TabsTrigger>
    </TabsList>
    <TabsContent value="desktop">
      <GalleryTab
        images={images}
        onImagesChange={onImagesChange}
        maxImages={maxImages}
        showCoverBadge={true}
        onMainImageChange={onMainImageChange}
      />
    </TabsContent>
    <TabsContent value="tablet">
      <GalleryTab
        images={imagesTablet || []}
        onImagesChange={onImagesTabletChange!}
        maxImages={maxImages}
        showCoverBadge={false}
      />
    </TabsContent>
    <TabsContent value="mobile">
      <GalleryTab
        images={imagesMobile || []}
        onImagesChange={onImagesMobileChange!}
        maxImages={maxImages}
        showCoverBadge={false}
      />
    </TabsContent>
  </Tabs>
);
```

**Step 4: Commit**

```bash
git add client/src/components/ImageGalleryUploader.tsx
git commit -m "feat: add desktop/tablet/mobile tabs to ImageGalleryUploader"
```

---

### Task 4: Wire new galleries in BoatFormDialog

**Files:**
- Modify: `client/src/components/crm/fleet/BoatFormDialog.tsx:159-176`

**Step 1: Update ImageGalleryUploader usage**

Replace the existing `<ImageGalleryUploader>` block (lines 159-176) with:

```typescript
<ImageGalleryUploader
  images={form.watch("imageGallery") || []}
  onImagesChange={images => {
    form.setValue("imageGallery", images);
    if (images.length > 0) {
      form.setValue("imageUrl", images[0]);
    } else {
      form.setValue("imageUrl", "");
    }
  }}
  imagesTablet={form.watch("imageGalleryTablet") || []}
  onImagesTabletChange={images => {
    form.setValue("imageGalleryTablet", images);
  }}
  imagesMobile={form.watch("imageGalleryMobile") || []}
  onImagesMobileChange={images => {
    form.setValue("imageGalleryMobile", images);
  }}
  onMainImageChange={mainImageUrl => {
    form.setValue("imageUrl", mainImageUrl || "");
  }}
  maxImages={10}
/>
```

**Step 2: Commit**

```bash
git add client/src/components/crm/fleet/BoatFormDialog.tsx
git commit -m "feat: wire tablet/mobile galleries in BoatFormDialog"
```

---

### Task 5: Create useResponsiveGallery hook

**Files:**
- Create: `client/src/hooks/useResponsiveGallery.ts`

**Step 1: Create the hook**

```typescript
import { useState, useEffect } from "react";

const MOBILE_QUERY = "(max-width: 767px)";
const TABLET_QUERY = "(min-width: 768px) and (max-width: 1024px)";

interface BoatGalleryData {
  imageGallery?: string[] | null;
  imageGalleryTablet?: string[] | null;
  imageGalleryMobile?: string[] | null;
  imageUrl?: string | null;
}

export function useResponsiveGallery(boat: BoatGalleryData): string[] {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(MOBILE_QUERY).matches : false
  );
  const [isTablet, setIsTablet] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(TABLET_QUERY).matches : false
  );

  useEffect(() => {
    const mobileQuery = window.matchMedia(MOBILE_QUERY);
    const tabletQuery = window.matchMedia(TABLET_QUERY);

    const handleMobile = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    const handleTablet = (e: MediaQueryListEvent) => setIsTablet(e.matches);

    mobileQuery.addEventListener("change", handleMobile);
    tabletQuery.addEventListener("change", handleTablet);

    return () => {
      mobileQuery.removeEventListener("change", handleMobile);
      tabletQuery.removeEventListener("change", handleTablet);
    };
  }, []);

  const desktop = boat.imageGallery?.length ? boat.imageGallery : (boat.imageUrl ? [boat.imageUrl] : []);
  const tablet = boat.imageGalleryTablet?.length ? boat.imageGalleryTablet : desktop;
  const mobile = boat.imageGalleryMobile?.length ? boat.imageGalleryMobile : tablet;

  if (isMobile) return mobile;
  if (isTablet) return tablet;
  return desktop;
}
```

**Step 2: Commit**

```bash
git add client/src/hooks/useResponsiveGallery.ts
git commit -m "feat: add useResponsiveGallery hook with fallback chain"
```

---

### Task 6: Use responsive gallery in FleetSection + BoatCard

**Files:**
- Modify: `client/src/components/FleetSection.tsx:101-102`
- Modify: `client/src/components/BoatCard.tsx` (props + `<picture>`)

**Step 1: Update BoatCard props**

Add new optional props to `BoatCardProps` interface:

```typescript
  imageTablet?: string;
  imageMobile?: string;
```

**Step 2: Update BoatCard image rendering**

Replace the `<img>` element (lines 80-88) with a `<picture>` element:

```typescript
<picture>
  {imageMobile && (
    <source media="(max-width: 767px)" srcSet={imageMobile} type="image/webp" />
  )}
  {imageTablet && (
    <source media="(max-width: 1024px)" srcSet={imageTablet} type="image/webp" />
  )}
  <img
    src={image}
    srcSet={imageSrcSet || undefined}
    sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1279px) calc(50vw - 20px), calc(33vw - 24px)"
    alt={imageAlt}
    className="w-full aspect-[4/3] object-cover transition-transform duration-200 group-hover:scale-[1.03]"
    loading="lazy"
    onError={() => setImageError(true)}
  />
</picture>
```

**Step 3: Pass responsive images from FleetSection**

In `FleetSection.tsx`, update the BoatCard rendering (around line 101):

```typescript
image: boat.imageGallery?.[0] || (boat.imageUrl ? getBoatImage(boat.imageUrl) : '/placeholder-boat.jpg'),
imageSrcSet: boat.imageGallery?.[0] ? '' : (boat.imageUrl ? getBoatImageSrcSet(boat.imageUrl) : ''),
imageTablet: boat.imageGalleryTablet?.[0] || undefined,
imageMobile: boat.imageGalleryMobile?.[0] || undefined,
```

**Step 4: Commit**

```bash
git add client/src/components/BoatCard.tsx client/src/components/FleetSection.tsx
git commit -m "feat: use <picture> element for responsive boat card images"
```

---

### Task 7: Use responsive gallery in BoatDetailPage

**Files:**
- Modify: `client/src/components/BoatDetailPage.tsx:155-156`

**Step 1: Import and use the hook**

Add import:

```typescript
import { useResponsiveGallery } from "@/hooks/useResponsiveGallery";
```

**Step 2: Replace displayImages logic**

Replace lines 155-156:

```typescript
const displayImages = boatData.imageGallery && boatData.imageGallery.length > 0
    ? boatData.imageGallery
```

With:

```typescript
const displayImages = useResponsiveGallery(boatData);
```

This uses the hook's fallback chain automatically, so the carousel shows the correct gallery per breakpoint.

**Step 3: Commit**

```bash
git add client/src/components/BoatDetailPage.tsx
git commit -m "feat: use responsive gallery in boat detail page carousel"
```
