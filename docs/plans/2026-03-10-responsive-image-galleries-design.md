# Responsive Image Galleries per Boat

## Goal

Allow admins to upload separate image galleries for desktop, tablet, and mobile per boat, so the frontend serves the optimal images for each screen size.

## Database Changes

Add 2 new columns to `boats` table in `shared/schema.ts`:

```
imageGalleryTablet: text("image_gallery_tablet").array()
imageGalleryMobile: text("image_gallery_mobile").array()
```

`imageGallery` (existing) becomes the **desktop** gallery. No rename needed.

Run `npm run db:push` after schema change.

## Breakpoints

- Mobile: `<768px`
- Tablet: `768px - 1024px`
- Desktop: `>1024px`

## Fallback Chain

mobile -> tablet -> desktop (if a gallery is empty, fall back to the next larger)

## Admin CRM Changes

### ImageGalleryUploader

Add 3 tabs (Desktop / Tablet / Movil) using shadcn Tabs component. Each tab has its own:
- Dropzone for upload
- Drag-and-drop reordering
- Remove buttons
- Image count

The "Portada" badge only shows on the Desktop tab (first image = `imageUrl`).

### BoatFormDialog

Pass 3 arrays to ImageGalleryUploader:
- `imageGallery` (desktop)
- `imageGalleryTablet`
- `imageGalleryMobile`

`imageUrl` stays synced with first image of **desktop** gallery only.

### BoatFormData type

Add `imageGalleryTablet` and `imageGalleryMobile` to the form data type.

## Frontend Changes

### New hook: `useResponsiveGallery`

```ts
function useResponsiveGallery(boat: Boat): string[] {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1024px)");

  if (isMobile && boat.imageGalleryMobile?.length) return boat.imageGalleryMobile;
  if (isTablet && boat.imageGalleryTablet?.length) return boat.imageGalleryTablet;
  return boat.imageGallery || [];
}
```

### BoatCard (fleet section)

Use `<picture>` with `<source>` elements for the card thumbnail:
- `<source media="(max-width: 767px)" srcset="mobile[0]">`
- `<source media="(max-width: 1024px)" srcset="tablet[0]">`
- `<img src="desktop[0]">`

### BoatDetailPage

Use `useResponsiveGallery` hook to select which gallery to show in the carousel/lightbox.

## API Changes

### admin-fleet routes

The existing PUT/POST routes use spread operator on request body, so new array fields will be saved automatically as long as the schema accepts them. Verify the Zod insert schema includes the new fields.

## Files to Modify

| File | Change |
|------|--------|
| `shared/schema.ts` | Add 2 columns + update insert schema |
| `client/src/components/ImageGalleryUploader.tsx` | Add tabs UI |
| `client/src/components/crm/fleet/BoatFormDialog.tsx` | Pass new gallery arrays |
| `client/src/components/crm/types.ts` | Update BoatFormData |
| `client/src/hooks/useResponsiveGallery.ts` | New hook |
| `client/src/components/BoatCard.tsx` | `<picture>` element |
| `client/src/components/BoatDetailPage.tsx` | Use responsive gallery hook |
