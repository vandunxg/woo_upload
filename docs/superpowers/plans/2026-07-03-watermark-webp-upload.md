# Watermark + WebP Image Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Before a product image is uploaded to the WordPress Media Library, automatically overlay a configurable logo watermark, convert it to WebP, and name the file after a slug of the product title.

**Architecture:** A persisted Zustand store holds watermark settings (logo, opacity, size, position, enabled toggle), edited through a HeroUI modal opened from the navbar. A pure browser-canvas pipeline (`processProductImage`) consumes those settings plus the raw `File` and product title, and returns a processed `File` that the existing upload call sends instead of the original.

**Tech Stack:** React + TypeScript + Vite, Zustand (`persist` middleware), HeroUI (`@heroui/modal`, `@heroui/switch`, `@heroui/button`, `@heroui/image`), browser Canvas 2D API.

## Global Constraints

- This repository has no automated test runner installed (`package.json` only has `dev`/`build`/`lint`/`preview`/`format` scripts). Per the approved spec (`docs/superpowers/specs/2026-07-03-watermark-webp-upload-design.md`, "Testing / verification" section), verification here is `npx tsc --noEmit` per task plus manual browser QA — **not** an automated red/green TDD cycle. Do not introduce a new test framework as part of this plan.
- New dependency: `@heroui/modal@2.2.29` — matches the HeroUI component family already used for `Button`, `Card`, `Switch`, `Image`, `Navbar` elsewhere in this app.
- WebP export quality is fixed at `0.92` and is **not** user-configurable.
- The output filename has no random suffix or timestamp — exactly `${slugify(title)}.webp`. WordPress handles any name collision server-side.
- The canvas draws the source image at its **native** resolution — never upscale or downscale.
- Vietnamese `đ`/`Đ` must be explicitly mapped to `d`/`D` before diacritic stripping — Unicode NFD normalization does not decompose `đ` (it's a distinct base letter, not a combining diacritic).

---

### Task 1: Watermark settings types + persisted store

**Files:**
- Create: `src/types/watermark.ts`
- Create: `src/store/watermarkSettingsStore.ts`

**Interfaces:**
- Consumes: nothing (leaf task)
- Produces:
  - `WatermarkPosition` — union type `"top-left" | "top-center" | "top-right" | "center-left" | "center" | "center-right" | "bottom-left" | "bottom-center" | "bottom-right"`, exported from `src/types/watermark.ts`
  - `WatermarkSettings` — type `{ enabled: boolean; logoDataUrl: string | null; opacity: number; sizePercent: number; position: WatermarkPosition }`, exported from `src/types/watermark.ts`
  - `useWatermarkSettingsStore` — Zustand hook exported from `src/store/watermarkSettingsStore.ts`, returning `WatermarkSettings & { setLogo(dataUrl: string): void; removeLogo(): void; setEnabled(enabled: boolean): void; setOpacity(opacity: number): void; setSizePercent(sizePercent: number): void; setPosition(position: WatermarkPosition): void }`

- [ ] **Step 1: Create the watermark types file**

Create `src/types/watermark.ts`:

```ts
export type WatermarkPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type WatermarkSettings = {
  enabled: boolean;
  logoDataUrl: string | null;
  opacity: number;
  sizePercent: number;
  position: WatermarkPosition;
};
```

- [ ] **Step 2: Create the persisted settings store**

Create `src/store/watermarkSettingsStore.ts`:

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { WatermarkPosition, WatermarkSettings } from "@/types/watermark";

type WatermarkSettingsStore = WatermarkSettings & {
  setLogo: (dataUrl: string) => void;
  removeLogo: () => void;
  setEnabled: (enabled: boolean) => void;
  setOpacity: (opacity: number) => void;
  setSizePercent: (sizePercent: number) => void;
  setPosition: (position: WatermarkPosition) => void;
};

const defaultSettings: WatermarkSettings = {
  enabled: false,
  logoDataUrl: null,
  opacity: 70,
  sizePercent: 15,
  position: "bottom-right",
};

export const useWatermarkSettingsStore = create<WatermarkSettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setLogo: (dataUrl) => set({ logoDataUrl: dataUrl }),
      removeLogo: () => set({ logoDataUrl: null, enabled: false }),
      setEnabled: (enabled) => set({ enabled }),
      setOpacity: (opacity) => set({ opacity }),
      setSizePercent: (sizePercent) => set({ sizePercent }),
      setPosition: (position) => set({ position }),
    }),
    {
      name: "watermark-settings",
    },
  ),
);
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no output (no errors).

- [ ] **Step 4: Commit**

```bash
git add src/types/watermark.ts src/store/watermarkSettingsStore.ts
git commit -m "feat: add persisted watermark settings store"
```

---

### Task 2: Image processing module (slugify + processProductImage)

**Files:**
- Create: `src/lib/imageProcessing.ts`

**Interfaces:**
- Consumes: `WatermarkSettings` type from `src/types/watermark.ts` (Task 1)
- Produces:
  - `slugify(title: string): string`, exported from `src/lib/imageProcessing.ts`
  - `processProductImage(file: File, title: string, settings: WatermarkSettings): Promise<File>`, exported from `src/lib/imageProcessing.ts`

- [ ] **Step 1: Create the image processing module**

Create `src/lib/imageProcessing.ts`:

```ts
import { WatermarkSettings } from "@/types/watermark";

const WATERMARK_MARGIN_RATIO = 0.04;
const WEBP_QUALITY = 0.92;

export const slugify = (title: string): string => {
  const withoutDStroke = title.replace(/đ/g, "d").replace(/Đ/g, "D");

  const slug = withoutDStroke
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "san-pham";
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Không thể đọc file ảnh"));
    img.src = src;
  });

const getWatermarkPosition = (
  position: WatermarkSettings["position"],
  canvasWidth: number,
  canvasHeight: number,
  logoWidth: number,
  logoHeight: number,
) => {
  const marginX = canvasWidth * WATERMARK_MARGIN_RATIO;
  const marginY = canvasHeight * WATERMARK_MARGIN_RATIO;

  const xByAlign: Record<string, number> = {
    left: marginX,
    center: (canvasWidth - logoWidth) / 2,
    right: canvasWidth - logoWidth - marginX,
  };
  const yByAlign: Record<string, number> = {
    top: marginY,
    center: (canvasHeight - logoHeight) / 2,
    bottom: canvasHeight - logoHeight - marginY,
  };

  const [vertical, horizontal] =
    position === "center" ? ["center", "center"] : position.split("-");

  return {
    x: xByAlign[horizontal],
    y: yByAlign[vertical],
  };
};

export const processProductImage = async (
  file: File,
  title: string,
  settings: WatermarkSettings,
): Promise<File> => {
  const objectUrl = URL.createObjectURL(file);

  try {
    const sourceImage = await loadImage(objectUrl);

    const canvas = document.createElement("canvas");

    canvas.width = sourceImage.naturalWidth;
    canvas.height = sourceImage.naturalHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Trình duyệt không hỗ trợ xử lý ảnh (canvas 2d)");
    }

    ctx.drawImage(sourceImage, 0, 0);

    if (settings.enabled && settings.logoDataUrl) {
      const logoImage = await loadImage(settings.logoDataUrl);
      const logoWidth = canvas.width * (settings.sizePercent / 100);
      const logoHeight =
        logoWidth * (logoImage.naturalHeight / logoImage.naturalWidth);
      const { x, y } = getWatermarkPosition(
        settings.position,
        canvas.width,
        canvas.height,
        logoWidth,
        logoHeight,
      );

      ctx.globalAlpha = settings.opacity / 100;
      ctx.drawImage(logoImage, x, y, logoWidth, logoHeight);
      ctx.globalAlpha = 1;
    }

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
    );

    if (!blob) {
      throw new Error("Trình duyệt không hỗ trợ chuyển đổi ảnh sang WebP");
    }

    return new File([blob], `${slugify(title)}.webp`, { type: "image/webp" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no output (no errors).

Note: `slugify`'s and `processProductImage`'s runtime behavior (correct slug output, correct watermark placement) is verified end-to-end in Task 4's manual QA — there is no automated test runner in this repo to unit-test them in isolation (see Global Constraints).

- [ ] **Step 3: Commit**

```bash
git add src/lib/imageProcessing.ts
git commit -m "feat: add client-side watermark + WebP image processing"
```

---

### Task 3: Settings modal UI + navbar entry point

**Files:**
- Create: `src/components/WatermarkSettingsModal.tsx`
- Modify: `src/components/navbar.tsx`
- Modify: `package.json` (new dependency)

**Interfaces:**
- Consumes: `useWatermarkSettingsStore` from `src/store/watermarkSettingsStore.ts` (Task 1), `WatermarkPosition` from `src/types/watermark.ts` (Task 1), `pushNotification` from `src/lib/utils.ts` (existing)
- Produces: `WatermarkSettingsModal` component with props `{ isOpen: boolean; onClose: () => void }`, exported from `src/components/WatermarkSettingsModal.tsx`

- [ ] **Step 1: Add the `@heroui/modal` dependency**

Run: `npm install @heroui/modal@2.2.29`
Expected: `package.json` gains a `"@heroui/modal": "2.2.29"` entry under `dependencies`.

- [ ] **Step 2: Create the settings modal component**

Create `src/components/WatermarkSettingsModal.tsx`:

```tsx
"use client";

import { ChangeEvent, useRef } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Switch } from "@heroui/switch";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { Trash2 } from "lucide-react";

import { useWatermarkSettingsStore } from "@/store/watermarkSettingsStore";
import { WatermarkPosition } from "@/types/watermark";
import { pushNotification } from "@/lib/utils";

const POSITION_GRID: WatermarkPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "center-left",
  "center",
  "center-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

const POSITION_LABELS: Record<WatermarkPosition, string> = {
  "top-left": "Top Left",
  "top-center": "Top Center",
  "top-right": "Top Right",
  "center-left": "Center Left",
  center: "Center",
  "center-right": "Center Right",
  "bottom-left": "Bottom Left",
  "bottom-center": "Bottom Center",
  "bottom-right": "Bottom Right",
};

type WatermarkSettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const WatermarkSettingsModal = ({
  isOpen,
  onClose,
}: WatermarkSettingsModalProps) => {
  const {
    enabled,
    logoDataUrl,
    opacity,
    sizePercent,
    position,
    setLogo,
    removeLogo,
    setEnabled,
    setOpacity,
    setSizePercent,
    setPosition,
  } = useWatermarkSettingsStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.type !== "image/png") {
      pushNotification("Chỉ cho phép logo dạng PNG", "danger");

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setLogo(reader.result as string);
      setEnabled(true);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Watermark Settings</ModalHeader>
        <ModalBody className="gap-4 pb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Enable watermark</span>
            <Switch
              isDisabled={!logoDataUrl}
              isSelected={enabled}
              onValueChange={setEnabled}
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Logo (PNG)</span>
            {logoDataUrl ? (
              <div className="flex items-center gap-3">
                <Image
                  alt="Logo preview"
                  className="h-16 w-16 object-contain"
                  src={logoDataUrl}
                />
                <Button
                  color="danger"
                  size="sm"
                  startContent={<Trash2 className="h-4 w-4" />}
                  variant="light"
                  onPress={removeLogo}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="bordered"
                onPress={() => inputRef.current?.click()}
              >
                Upload Logo
              </Button>
            )}
            <input
              ref={inputRef}
              accept="image/png"
              className="hidden"
              type="file"
              onChange={handleLogoUpload}
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Opacity: {opacity}%</span>
            <input
              className="w-full"
              max={100}
              min={10}
              type="range"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Size: {sizePercent}%</span>
            <input
              className="w-full"
              max={40}
              min={5}
              type="range"
              value={sizePercent}
              onChange={(e) => setSizePercent(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Position</span>
            <div className="grid grid-cols-3 gap-2">
              {POSITION_GRID.map((pos) => (
                <Button
                  key={pos}
                  color={position === pos ? "primary" : "default"}
                  size="sm"
                  variant={position === pos ? "solid" : "bordered"}
                  onPress={() => setPosition(pos)}
                >
                  {POSITION_LABELS[pos]}
                </Button>
              ))}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
```

- [ ] **Step 3: Wire a gear button into the navbar**

Replace the full contents of `src/components/navbar.tsx` with:

```tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "@heroui/link";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/navbar";
import { Settings } from "lucide-react";

import { pushNotification } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useSiteStore } from "@/store/siteStore";
import { Logo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { WatermarkSettingsModal } from "@/components/WatermarkSettingsModal";

export const Navbar = () => {
  const navigate = useNavigate();
  const sites = useSiteStore((state) => state.sites);
  const activeSiteId = useSiteStore((state) => state.activeSiteId);
  const setActiveSite = useSiteStore((state) => state.setActiveSite);
  const logoutSite = useAuthStore((state) => state.logoutSite);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const activeSite = useMemo(
    () => sites.find((site) => site.id === activeSiteId) ?? null,
    [activeSiteId, sites],
  );

  const handleLogout = () => {
    if (!activeSiteId) {
      navigate("/login");

      return;
    }

    logoutSite(activeSiteId);
    pushNotification("Logged out successfully", "success");
    navigate("/login");
  };

  return (
    <>
      <HeroUINavbar maxWidth="xl" position="sticky">
        <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
          <NavbarBrand className="max-w-fit gap-3">
            <Link
              className="flex items-center justify-start gap-1"
              color="foreground"
              href="/"
            >
              <Logo />
              <p className="font-bold text-inherit">WOO UPLOAD</p>
            </Link>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent className="basis-full" justify="end">
          <NavbarItem className="flex items-center gap-2">
            <select
              className="h-9 max-w-[280px] rounded-md border border-input bg-background px-3 text-sm"
              value={activeSiteId ?? ""}
              onChange={(event) => setActiveSite(event.target.value)}
            >
              {sites.length === 0 && <option value="">No websites</option>}
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </NavbarItem>
          {activeSite && (
            <NavbarItem className="hidden text-xs text-muted-foreground md:flex">
              {activeSite.baseUrl}
            </NavbarItem>
          )}
        </NavbarContent>
      </HeroUINavbar>

      <WatermarkSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no output (no errors).

- [ ] **Step 5: Manual verification**

Run: `npm run dev`, open `http://localhost:5173`.
1. Click the gear icon in the navbar — the Watermark Settings modal opens.
2. Click "Upload Logo" and pick a PNG file — a thumbnail preview appears and the "Enable watermark" switch turns on automatically.
3. Drag the opacity and size sliders — the "%" labels update live.
4. Click a few of the 9 position buttons — the clicked one highlights as selected.
5. Close the modal, reload the page, reopen the modal — all choices (logo, opacity, size, position, enabled) are still there (confirms `localStorage` persistence under the `watermark-settings` key, visible in DevTools → Application → Local Storage).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/components/WatermarkSettingsModal.tsx src/components/navbar.tsx
git commit -m "feat: add watermark settings modal to navbar"
```

---

### Task 4: Wire image processing into the publish flow

**Files:**
- Modify: `src/pages/index.tsx:1-18` (imports), `src/pages/index.tsx:103-107` (`handleSubmit`)

**Interfaces:**
- Consumes: `processProductImage` from `src/lib/imageProcessing.ts` (Task 2), `useWatermarkSettingsStore` from `src/store/watermarkSettingsStore.ts` (Task 1)
- Produces: nothing new (integration point only)

- [ ] **Step 1: Import the processing function and settings store**

In `src/pages/index.tsx`, change the import block (currently lines 1-18):

```tsx
import { useMemo, useState } from "react";
import { Button } from "@heroui/button";

import JsonImport from "./JsonImport";

import DefaultLayout from "@/layouts/default";
import CategoryCard from "@/components/CategoryCard";
import UploadCard from "@/components/UploadCard";
import DescriptionCard from "@/components/DescriptionCard";
import ShortDescriptionCard from "@/components/ShortDescriptionCard";
import TitleCard from "@/components/TitleCard";
import { useSiteCategories } from "@/hooks/useSiteCategories";
import { usePostStore } from "@/store/postStore";
import {
  useCreateProductMutation,
  useUploadImageMutation,
} from "@/services/wooApi";
import { pushNotification } from "@/lib/utils";
import { processProductImage } from "@/lib/imageProcessing";
import { useWatermarkSettingsStore } from "@/store/watermarkSettingsStore";
```

- [ ] **Step 2: Read the watermark settings in the component**

In `src/pages/index.tsx`, inside `IndexPage`, immediately after the existing `usePostStore()` destructure, add:

```tsx
  const watermarkSettings = useWatermarkSettingsStore();
```

- [ ] **Step 3: Process the image before uploading**

In `src/pages/index.tsx`, replace this block inside `handleSubmit`:

```tsx
      if (image) {
        const imageRes = await uploadImage({ file: image, title }).unwrap();

        imageId = imageRes.id;
      }
```

with:

```tsx
      if (image) {
        const processedImage = await processProductImage(
          image,
          title,
          watermarkSettings,
        );
        const imageRes = await uploadImage({
          file: processedImage,
          title,
        }).unwrap();

        imageId = imageRes.id;
      }
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no output (no errors).

- [ ] **Step 5: Manual end-to-end verification**

Run: `npm run dev`, open `http://localhost:5173`, log in to a real WordPress/WooCommerce site.
1. In the Watermark Settings modal, make sure a logo is uploaded and the watermark is enabled, with a chosen opacity/size/position.
2. Fill in a product with a title containing Vietnamese diacritics (e.g. "Táo Lá"), upload a product image, select a category, fill in description, and click Publish.
3. Open the WordPress admin Media Library and find the newly created image. Confirm:
   - filename is `tao-la.webp` (or `-1`/`-2` suffixed by WordPress if that slug already exists)
   - MIME type is `image/webp`
   - the logo watermark is visible at roughly the chosen opacity/position/size
   - file size is meaningfully smaller than the original upload, with no visible banding or artifacting
4. Toggle the watermark off in Settings, publish a second product, and confirm its image is still renamed and converted to WebP but has no logo overlay.

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.tsx
git commit -m "feat: process product images through watermark + WebP pipeline before upload"
```
