import { create } from "zustand";
import { persist } from "zustand/middleware";

import { WooCategory } from "@/types/woo";

const SOFT_TTL_MS = 30 * 60 * 1000;
const HARD_TTL_MS = 24 * 60 * 60 * 1000;
const SCHEMA_VERSION = 1;

export type CategoryCacheEntry = {
  key: string;
  siteId: string;
  userId: number;
  data: WooCategory[];
  fetchedAt: number;
  softExpiresAt: number;
  hardExpiresAt: number;
  schemaVersion: number;
};

type SetCategoryCacheInput = {
  siteId: string;
  userId: number;
  categories: WooCategory[];
};

type CategoryCacheState = {
  entries: Record<string, CategoryCacheEntry>;
  setCategories: (input: SetCategoryCacheInput) => void;
  clearForSite: (siteId: string) => void;
  clearExpiredEntries: () => void;
};

export const buildCategoryCacheKey = (siteId: string, userId: number) =>
  `${siteId}:${userId}`;

export const isCategoryCacheSoftExpired = (
  entry: CategoryCacheEntry,
  now = Date.now(),
) => now >= entry.softExpiresAt;

export const isCategoryCacheHardExpired = (
  entry: CategoryCacheEntry,
  now = Date.now(),
) => now >= entry.hardExpiresAt;

const sortCategoriesByName = (categories: WooCategory[]) =>
  [...categories].sort((a, b) => a.name.localeCompare(b.name, "vi"));

export const useCategoryCacheStore = create<CategoryCacheState>()(
  persist(
    (set) => ({
      entries: {},
      setCategories: ({ siteId, userId, categories }) => {
        const now = Date.now();
        const key = buildCategoryCacheKey(siteId, userId);

        set((state) => ({
          entries: {
            ...state.entries,
            [key]: {
              key,
              siteId,
              userId,
              data: sortCategoriesByName(categories),
              fetchedAt: now,
              softExpiresAt: now + SOFT_TTL_MS,
              hardExpiresAt: now + HARD_TTL_MS,
              schemaVersion: SCHEMA_VERSION,
            },
          },
        }));
      },
      clearForSite: (siteId) => {
        set((state) => {
          const entries = Object.fromEntries(
            Object.entries(state.entries).filter(
              ([, entry]) => entry.siteId !== siteId,
            ),
          );

          return { entries };
        });
      },
      clearExpiredEntries: () => {
        const now = Date.now();

        set((state) => {
          const entries = Object.fromEntries(
            Object.entries(state.entries).filter(
              ([, entry]) =>
                entry.schemaVersion === SCHEMA_VERSION &&
                !isCategoryCacheHardExpired(entry, now),
            ),
          );

          return { entries };
        });
      },
    }),
    {
      name: "category-cache-storage",
      partialize: (state) => ({
        entries: state.entries,
      }),
    },
  ),
);
