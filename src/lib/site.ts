export const normalizeSiteBaseUrl = (input: string) => {
  const value = input.trim();

  if (!value) {
    return "";
  }

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    const url = new URL(withProtocol);
    let pathname = url.pathname.replace(/\/+$/, "");

    if (pathname.endsWith("/wp-json")) {
      pathname = pathname.slice(0, -"/wp-json".length) || "";
    }

    return `${url.origin}${pathname}`.replace(/\/+$/, "");
  } catch {
    return "";
  }
};

export const getSiteNameFromBaseUrl = (baseUrl: string) => {
  try {
    const url = new URL(baseUrl);

    return url.hostname;
  } catch {
    return baseUrl;
  }
};

export const buildWpJsonBaseUrl = (siteBaseUrl: string) => {
  const normalized = normalizeSiteBaseUrl(siteBaseUrl);

  if (!normalized) {
    return "";
  }

  return `${normalized}/wp-json`;
};

export const resolveSiteApiUrl = (wpJsonBaseUrl: string, endpoint: string) => {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  const normalizedBase = wpJsonBaseUrl.replace(/\/+$/, "");
  const normalizedEndpoint = endpoint.replace(/^\/+/, "");

  return `${normalizedBase}/${normalizedEndpoint}`;
};
