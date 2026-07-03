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
