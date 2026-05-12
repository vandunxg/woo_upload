import { useEffect, useMemo } from "react";

import { useGetProductCategoriesQuery } from "@/services/wooApi";
import {
  buildCategoryCacheKey,
  isCategoryCacheHardExpired,
  isCategoryCacheSoftExpired,
  useCategoryCacheStore,
} from "@/store/categoryCacheStore";
import { useSiteStore } from "@/store/siteStore";
import { useAuthStore } from "@/store/authStore";

export const useSiteCategories = () => {
  const activeSiteId = useSiteStore((state) => state.activeSiteId);
  const clearExpiredEntries = useCategoryCacheStore(
    (state) => state.clearExpiredEntries,
  );

  const session = useAuthStore((state) => state.getSession(activeSiteId));
  const hasValidSession = !!activeSiteId && !!session;
  const cacheKey =
    activeSiteId && session
      ? buildCategoryCacheKey(activeSiteId, session.user.id)
      : null;

  const cacheEntry = useCategoryCacheStore((state) =>
    cacheKey ? state.entries[cacheKey] : undefined,
  );

  useEffect(() => {
    clearExpiredEntries();
  }, [clearExpiredEntries]);

  const shouldFetch =
    hasValidSession &&
    (!cacheEntry ||
      isCategoryCacheHardExpired(cacheEntry) ||
      isCategoryCacheSoftExpired(cacheEntry));

  const query = useGetProductCategoriesQuery(
    { siteId: activeSiteId ?? "" },
    {
      skip: !hasValidSession || !shouldFetch,
      refetchOnMountOrArgChange: true,
    },
  );

  const categories = useMemo(
    () => query.data ?? cacheEntry?.data ?? [],
    [query.data, cacheEntry?.data],
  );

  return {
    categories,
    isLoading: query.isLoading && categories.length === 0,
    isFetching: query.isFetching,
    error: query.error,
  };
};
