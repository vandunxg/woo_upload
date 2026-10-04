import { useEffect, useRef } from "react";

import { FillableField, usePostStore } from "@/store/postStore";

const FLASH_ID = "fill-flash";
const FLASH_DURATION_MS = 1200;
const FLASH_STAGGER_MS = 90;

// Soft primary glow that fades in and out on top of the element's own shadow,
// so the card ends exactly where it started.
const flashFill = (element: HTMLElement, delay: number) => {
  // Cancel first: a running flash would leak into the computed base shadow.
  element
    .getAnimations()
    .forEach((animation) => animation.id === FLASH_ID && animation.cancel());

  const styles = getComputedStyle(element);
  const primary = styles.getPropertyValue("--heroui-primary").trim();
  const color = (alpha: number) =>
    primary ? `hsl(${primary} / ${alpha})` : `rgb(0 111 238 / ${alpha})`;
  const base = styles.boxShadow === "none" ? "" : `, ${styles.boxShadow}`;
  const frame = (strength: number) => ({
    boxShadow:
      `0 0 0 2px ${color(0.55 * strength)}, ` +
      `0 0 24px 0 ${color(0.3 * strength)}, ` +
      `inset 0 0 0 9999px ${color(0.06 * strength)}${base}`,
  });

  element.animate(
    [
      { ...frame(0), easing: "ease-out" },
      { ...frame(1), offset: 0.18, easing: "ease-in-out" },
      frame(0),
    ],
    { id: FLASH_ID, duration: FLASH_DURATION_MS, delay },
  );
};

// Highlights the element whenever `fill` writes `field`, staggered by the
// field's position in that fill.
export const useFillHighlight = <T extends HTMLElement = HTMLDivElement>(
  field: FillableField,
) => {
  const ref = useRef<T>(null);
  const lastFill = usePostStore((state) => state.lastFill);
  const fillOnMount = useRef(lastFill);

  useEffect(() => {
    const element = ref.current;

    if (!element || !lastFill || lastFill === fillOnMount.current) {
      return;
    }

    const index = lastFill.fields.indexOf(field);

    if (index !== -1) {
      flashFill(element, index * FLASH_STAGGER_MS);
    }
  }, [field, lastFill]);

  return ref;
};
