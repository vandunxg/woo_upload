import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

import { buildWpJsonBaseUrl, resolveSiteApiUrl } from "@/lib/site";
import { getActiveToken } from "@/store/authStore";
import { useSiteStore } from "@/store/siteStore";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "",
  prepareHeaders: (headers) => {
    const token = getActiveToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

const buildNoSiteSelectedError = (): { error: FetchBaseQueryError } => ({
  error: {
    status: 400,
    data: { message: "No active site selected" },
  },
});

const withResolvedUrl = (args: string | FetchArgs, wpJsonBaseUrl: string) => {
  if (typeof args === "string") {
    return resolveSiteApiUrl(wpJsonBaseUrl, args);
  }

  return {
    ...args,
    url: resolveSiteApiUrl(wpJsonBaseUrl, args.url),
  };
};

export const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const activeSite = useSiteStore.getState().getActiveSite();

  if (!activeSite) {
    return buildNoSiteSelectedError();
  }

  const wpJsonBaseUrl = buildWpJsonBaseUrl(activeSite.baseUrl);

  if (!wpJsonBaseUrl) {
    return buildNoSiteSelectedError();
  }

  const resolvedArgs = withResolvedUrl(args, wpJsonBaseUrl);

  return rawBaseQuery(resolvedArgs, api, extraOptions);
};
