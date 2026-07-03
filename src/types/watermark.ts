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
