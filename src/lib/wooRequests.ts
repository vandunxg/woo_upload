// Direct WooCommerce/WP requests bound to a specific site, used by the
// background upload queue so jobs keep targeting the site they were queued
// for even if the user switches the active site meanwhile.
import { buildWpJsonBaseUrl, resolveSiteApiUrl } from "@/lib/site";
import { useAuthStore } from "@/store/authStore";
import { useSiteStore } from "@/store/siteStore";

const resolveSite = (siteId: string) => {
  const site = useSiteStore.getState().sites.find((s) => s.id === siteId);

  if (!site) {
    throw new Error("Website no longer exists");
  }

  const wpJsonBaseUrl = buildWpJsonBaseUrl(site.baseUrl);

  if (!wpJsonBaseUrl) {
    throw new Error("Website URL is invalid");
  }

  const token = useAuthStore.getState().getToken(siteId);

  if (!token) {
    throw new Error(`Session expired for ${site.name}, please log in again`);
  }

  return { wpJsonBaseUrl, token };
};

const request = async <T>(
  siteId: string,
  endpoint: string,
  init: RequestInit,
): Promise<T> => {
  const { wpJsonBaseUrl, token } = resolveSite(siteId);
  const headers = new Headers(init.headers);

  headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(resolveSiteApiUrl(wpJsonBaseUrl, endpoint), {
    ...init,
    headers,
  });

  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(
      data?.message || `Request failed (${res.status} ${res.statusText})`,
    );
  }

  return data as T;
};

export const uploadMediaToSite = (
  siteId: string,
  file: File,
  title: string,
) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("title", title);
  formData.append("alt_text", title);
  formData.append("caption", title);
  formData.append("description", title);

  return request<{ id: number; source_url: string }>(siteId, "wp/v2/media", {
    method: "POST",
    body: formData,
  });
};

export type CreateProductInput = {
  name: string;
  short_description?: string;
  description: string;
  categories: Array<{ id: number }>;
  imageId?: number;
};

export const createProductOnSite = (
  siteId: string,
  {
    name,
    short_description,
    description,
    categories,
    imageId,
  }: CreateProductInput,
) =>
  request<{ id: number; permalink?: string }>(siteId, "wc/v3/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      short_description: short_description ?? "",
      description,
      categories,
      images: imageId ? [{ id: imageId }] : [],
      status: "publish",
    }),
  });
