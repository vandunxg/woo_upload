import { create } from "zustand";
import { persist } from "zustand/middleware";

import { getSiteNameFromBaseUrl, normalizeSiteBaseUrl } from "@/lib/site";
import { SiteInput, SiteProfile } from "@/types/site";

type SiteState = {
  sites: SiteProfile[];
  activeSiteId: string | null;
  upsertSite: (input: SiteInput) => SiteProfile | null;
  removeSite: (siteId: string) => void;
  setActiveSite: (siteId: string) => void;
  getActiveSite: () => SiteProfile | null;
};

const buildSiteId = (baseUrl: string) => baseUrl.toLowerCase();

export const useSiteStore = create<SiteState>()(
  persist(
    (set, get) => ({
      sites: [],
      activeSiteId: null,
      upsertSite: ({ name, baseUrl }) => {
        const normalizedBaseUrl = normalizeSiteBaseUrl(baseUrl);

        if (!normalizedBaseUrl) {
          return null;
        }

        const siteId = buildSiteId(normalizedBaseUrl);
        const state = get();
        const now = Date.now();
        const existing = state.sites.find((site) => site.id === siteId);

        const nextSite: SiteProfile = {
          id: siteId,
          baseUrl: normalizedBaseUrl,
          name:
            name?.trim() ||
            existing?.name ||
            getSiteNameFromBaseUrl(normalizedBaseUrl),
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };

        set((current) => {
          const hasExisting = current.sites.some((site) => site.id === siteId);
          const sites = hasExisting
            ? current.sites.map((site) =>
                site.id === siteId ? nextSite : site,
              )
            : [...current.sites, nextSite];

          return {
            sites,
            activeSiteId: current.activeSiteId ?? nextSite.id,
          };
        });

        return nextSite;
      },
      removeSite: (siteId) => {
        set((state) => {
          const sites = state.sites.filter((site) => site.id !== siteId);

          return {
            sites,
            activeSiteId:
              state.activeSiteId === siteId
                ? (sites[0]?.id ?? null)
                : state.activeSiteId,
          };
        });
      },
      setActiveSite: (siteId) => {
        if (!get().sites.some((site) => site.id === siteId)) {
          return;
        }

        set({ activeSiteId: siteId });
      },
      getActiveSite: () => {
        const { sites, activeSiteId } = get();

        if (!activeSiteId) {
          return null;
        }

        return sites.find((site) => site.id === activeSiteId) ?? null;
      },
    }),
    {
      name: "site-storage",
      partialize: (state) => ({
        sites: state.sites,
        activeSiteId: state.activeSiteId,
      }),
    },
  ),
);
