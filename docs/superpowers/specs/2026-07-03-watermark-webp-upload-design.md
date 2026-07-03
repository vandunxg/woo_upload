# Auto watermark + WebP conversion for product images

Date: 2026-07-03

## Problem

Product images are currently uploaded to the WordPress Media Library as-is
(whatever format/name the user's file has). For SEO and brand consistency we
want every uploaded image to:

1. Have the shop's logo watermarked onto it (opacity/position/size
   configurable, so it doesn't have to be redone per image).
2. Be converted to WebP (smaller file size, better Core Web Vitals) without
   visibly degrading the image.
3. Be named after the product title as a slug, e.g. `ten-san-pham-la.webp`,
   for image-filename SEO.

This must happen automatically at publish time with no extra manual steps,
matching the app's existing "fast, low-mouse" upload philosophy.

## Scope

In scope:
- Client-side image processing pipeline (watermark + WebP encode + rename)
  that runs right before the existing `uploadImage` call.
- A persisted watermark settings store (logo, opacity, size, position,
  enabled toggle).
- A Settings modal to manage those settings, reachable from the navbar.

Out of scope (explicitly deferred, not needed for this feature):
- Configurable WebP quality (fixed at a sane default).
- Resizing/downscaling images.
- Filename collision handling beyond what WordPress already does
  server-side.
- Free-form drag positioning of the watermark (9 fixed anchor points cover
  the need).

## Data model

### `src/store/watermarkSettingsStore.ts`

Zustand store with `persist` middleware (same pattern as
`src/store/siteStore.ts`), localStorage key `watermark-settings`.

```ts
type WatermarkPosition =
  | "top-left" | "top-center" | "top-right"
  | "center-left" | "center" | "center-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

type WatermarkSettings = {
  enabled: boolean;        // default false; UI keeps it disabled until a logo exists
  logoDataUrl: string | null; // base64 data URL of the uploaded PNG
  opacity: number;         // 10-100, default 70
  sizePercent: number;     // 5-40, default 15 (logo width as % of image width)
  position: WatermarkPosition; // default "bottom-right"
};
```

Actions: `setLogo(dataUrl)`, `removeLogo()`, `setEnabled(bool)`,
`setOpacity(n)`, `setSizePercent(n)`, `setPosition(pos)`.

`removeLogo()` also forces `enabled` back to `false` (no logo → nothing to
toggle on).

## Image processing

### `src/lib/imageProcessing.ts`

`slugify(title: string): string`
- `title.normalize("NFD").replace(/[̀-ͯ]/g, "")` (same technique
  already used in `CategoryCard.tsx` / `JsonImport.tsx`)
- explicit `đ → d`, `Đ → d` replacement first (NFD does not decompose “đ”,
  it's a distinct base letter, not a combining diacritic)
- lowercase, replace runs of non `[a-z0-9]` with `-`, trim/collapse leading,
  trailing and duplicate hyphens
- fallback to `"san-pham"` if the result is empty (e.g. title was only
  emoji/symbols)

`processProductImage(file: File, title: string, settings: WatermarkSettings): Promise<File>`
1. Decode `file` into an `HTMLImageElement` via an object URL.
2. Create an offscreen `<canvas>` sized to the image's **native** width/height
   — no upscaling or downscaling, so no quality loss from resampling.
3. Draw the source image onto the canvas.
4. If `settings.enabled && settings.logoDataUrl`:
   - decode the logo into an `HTMLImageElement`
   - compute `logoWidth = canvas.width * settings.sizePercent / 100`,
     `logoHeight = logoWidth * (logo.naturalHeight / logo.naturalWidth)`
     (aspect ratio preserved)
   - compute `x`/`y` from `settings.position` against a fixed 4% margin from
     each edge (e.g. `bottom-right` → `x = canvas.width - logoWidth - margin`,
     `y = canvas.height - logoHeight - margin`; `center` → centered on both
     axes)
   - `ctx.globalAlpha = settings.opacity / 100`, `ctx.drawImage(logo, x, y,
     logoWidth, logoHeight)`, then reset `ctx.globalAlpha = 1`
5. `canvas.toBlob(cb, "image/webp", 0.92)` — quality fixed at 0.92 (visually
   near-lossless while still meaningfully smaller than the source format).
   If the browser returns `null` (WebP encoding unsupported), reject with a
   descriptive error.
6. Wrap the resulting `Blob` in a `new File([blob], "${slugify(title)}.webp",
   { type: "image/webp" })` and return it.

This function always runs (WebP conversion + rename happen unconditionally);
only step 4 (the logo overlay) is conditional on `enabled`.

## Wiring into the upload flow

`src/pages/index.tsx`, inside `handleSubmit`, replacing the current direct
`uploadImage({ file: image, title })` call:

```ts
const processedImage = await processProductImage(image, title, watermarkSettings);
const imageRes = await uploadImage({ file: processedImage, title }).unwrap();
```

`watermarkSettings` comes from `useWatermarkSettingsStore()`.

If `processProductImage` throws, the catch block already wired in
`handleSubmit` shows the error via `pushNotification(..., "danger")` and the
submit stops — the raw, unprocessed image is never silently uploaded instead.

`wooApi.uploadImage` needs no further changes; it already accepts
`{ file, title }` from the prior change.

## Settings UI

New dependency: `@heroui/modal` (same HeroUI family already used for
`Button`, `Card`, `Switch`, `Image`, `Navbar` elsewhere in the app).

- `src/components/navbar.tsx`: add a gear icon `Button` next to Logout that
  opens the settings modal (local `useState` for open/closed).
- New `src/components/WatermarkSettingsModal.tsx`:
  - HeroUI `Switch` — "Enable watermark", disabled (greyed out) while
    `logoDataUrl` is null
  - File input (`accept="image/png"`) → reads file as data URL via
    `FileReader`, calls `setLogo`; shows a thumbnail preview + "Remove"
    button (calls `removeLogo`)
  - `<input type="range" min={10} max={100}>` for opacity, with a live "%"
    label, wired to `setOpacity`
  - `<input type="range" min={5} max={40}>` for size, with a live "%" label,
    wired to `setSizePercent`
  - A 3×3 grid of small buttons (one per `WatermarkPosition`) with the
    active one highlighted, wired to `setPosition`
  - No explicit "Save" button — every control writes straight to the
    persisted store on change, consistent with how `usePostStore.setField`
    already works elsewhere in this app.

## Error handling

- Corrupt/unreadable image file, or a browser that can't encode WebP via
  canvas → `processProductImage` rejects → `handleSubmit`'s existing
  try/catch surfaces it with `pushNotification` → submit aborts. No silent
  fallback to uploading the original file, since that would silently skip
  the WebP conversion and SEO filename the feature exists to guarantee.
- Logo image failing to decode (corrupt PNG) → same treatment, surfaced as
  an error rather than silently skipping the watermark.

## Testing / verification

Manual, since there's no existing test suite in this project:
1. Open the settings modal, upload a PNG logo, set opacity/size/position,
   confirm the toggle becomes enabled and the choice persists across a page
   reload (localStorage).
2. Fill in a product with a title containing Vietnamese diacritics (e.g.
   "Táo Lá"), upload a product image, publish.
3. Inspect the created WordPress Media Library entry: filename should be
   `tao-la.webp`, MIME type `image/webp`, watermark visible at the chosen
   opacity/position/size, and file size meaningfully smaller than the
   original with no visible banding/artifacting.
4. Toggle the watermark off, publish another product, confirm the image is
   still converted to WebP and named after the title, just without the logo
   overlay.
