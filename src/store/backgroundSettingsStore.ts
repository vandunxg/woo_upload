import { create } from "zustand";
import { persist } from "zustand/middleware";

import { BackgroundSettings } from "@/types/background";

type BackgroundSettingsStore = BackgroundSettings & {
  setEnabled: (enabled: boolean) => void;
  setFit: (fit: boolean) => void;
  setColor: (color: string) => void;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
};

const defaultSettings: BackgroundSettings = {
  enabled: true,
  fit: true,
  color: "#ffffff",
  width: 1000,
  height: 1000,
};

export const useBackgroundSettingsStore = create<BackgroundSettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setEnabled: (enabled) => set({ enabled }),
      setFit: (fit) => set({ fit }),
      setColor: (color) => set({ color }),
      setWidth: (width) => set({ width }),
      setHeight: (height) => set({ height }),
    }),
    {
      name: "background-settings",
    },
  ),
);
