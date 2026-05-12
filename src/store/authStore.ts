import { create } from "zustand";
import { persist } from "zustand/middleware";

import { useSiteStore } from "@/store/siteStore";
import { User } from "@/types/User";

type AuthSession = {
  token: string;
  user: User;
  expiresAt: number | null;
  createdAt: number;
};

type AuthState = {
  sessionsBySiteId: Record<string, AuthSession>;
  setAuth: (siteId: string, token: string, user: User) => void;
  logoutSite: (siteId: string) => void;
  logoutAll: () => void;
  getSession: (siteId: string | null | undefined) => AuthSession | null;
  getToken: (siteId: string | null | undefined) => string | null;
  hasValidSession: (siteId: string | null | undefined) => boolean;
  clearExpiredSessions: () => void;
};

const parseJwtExpiry = (token: string) => {
  const parts = token.split(".");

  if (parts.length < 2) {
    return null;
  }

  try {
    const base64Url = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64Url.padEnd(
      base64Url.length + ((4 - (base64Url.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(atob(padded));

    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

const isExpired = (session: AuthSession) =>
  session.expiresAt !== null && Date.now() >= session.expiresAt;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      sessionsBySiteId: {},
      setAuth: (siteId, token, user) => {
        const now = Date.now();

        set((state) => ({
          sessionsBySiteId: {
            ...state.sessionsBySiteId,
            [siteId]: {
              token,
              user,
              expiresAt: parseJwtExpiry(token),
              createdAt: now,
            },
          },
        }));
      },
      logoutSite: (siteId) => {
        set((state) => {
          const sessionsBySiteId = { ...state.sessionsBySiteId };

          delete sessionsBySiteId[siteId];

          return { sessionsBySiteId };
        });
      },
      logoutAll: () => set({ sessionsBySiteId: {} }),
      getSession: (siteId) => {
        if (!siteId) {
          return null;
        }

        const session = get().sessionsBySiteId[siteId];

        if (!session) {
          return null;
        }

        if (isExpired(session)) {
          return null;
        }

        return session;
      },
      getToken: (siteId) => {
        const session = get().getSession(siteId);

        return session?.token ?? null;
      },
      hasValidSession: (siteId) => !!get().getSession(siteId),
      clearExpiredSessions: () => {
        set((state) => {
          const sessionsBySiteId = Object.fromEntries(
            Object.entries(state.sessionsBySiteId).filter(
              ([, session]) => !isExpired(session),
            ),
          );

          return { sessionsBySiteId };
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        sessionsBySiteId: state.sessionsBySiteId,
      }),
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as AuthState | undefined;

        if (!state || !state.sessionsBySiteId) {
          return { sessionsBySiteId: {} };
        }

        return state;
      },
    },
  ),
);

export const getActiveSession = () => {
  const siteId = useSiteStore.getState().activeSiteId;

  if (!siteId) {
    return null;
  }

  return useAuthStore.getState().getSession(siteId);
};

export const getActiveToken = () => {
  const siteId = useSiteStore.getState().activeSiteId;

  if (!siteId) {
    return null;
  }

  const store = useAuthStore.getState();
  const token = store.getToken(siteId);

  if (token) {
    return token;
  }

  if (store.sessionsBySiteId[siteId]) {
    store.logoutSite(siteId);
  }

  return null;
};
