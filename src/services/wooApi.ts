import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQuery } from "./baseQuery";

import { useAuthStore } from "@/store/authStore";
import { useCategoryCacheStore } from "@/store/categoryCacheStore";
import { WooCategory } from "@/types/woo";

type WPUser = {
  id: number;
  name: string;
  email?: string;
  roles: string[];
  slug: string;
  avatar_urls?: Record<string, string>;
};

type CreateProductPayload = {
  name: string;
  short_description?: string;
  description: string;
  categories: Array<{ id: number }>;
  imageId?: number;
};

const mergeUniqueCategories = (pages: WooCategory[][]) => {
  const categoryMap = new Map<number, WooCategory>();

  pages.flat().forEach((category) => {
    categoryMap.set(category.id, category);
  });

  return [...categoryMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "vi"),
  );
};

export const wooApi = createApi({
  reducerPath: "wooApi",
  baseQuery,
  endpoints: (builder) => ({
    uploadImage: builder.mutation<
      { id: number; source_url: string },
      { file: File; title: string }
    >({
      query: ({ file, title }) => {
        const formData = new FormData();

        formData.append("file", file);
        formData.append("title", title);
        formData.append("alt_text", title);
        formData.append("caption", title);
        formData.append("description", title);

        return {
          url: "wp/v2/media",
          method: "POST",
          body: formData,
        };
      },
    }),
    getAuthenticatedUser: builder.query<WPUser, void>({
      query: () => "wp/v2/users/me",
    }),
    createProduct: builder.mutation<any, CreateProductPayload>({
      query: ({ name, short_description, description, categories, imageId }) => ({
        url: "wc/v3/products",
        method: "POST",
        body: {
          name,
          short_description: short_description ?? "",
          description,
          categories,
          images: imageId ? [{ id: imageId }] : [],
          status: "publish",
        },
      }),
    }),
    getProductCategories: builder.query<WooCategory[], { siteId: string }>({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
        const firstPageResult: any = await fetchWithBQ(
          "wc/v3/products/categories?per_page=100&page=1&orderby=name&order=asc",
        );

        if (firstPageResult.error) {
          return { error: firstPageResult.error };
        }

        const firstPageCategories = (firstPageResult.data ??
          []) as WooCategory[];
        const totalPagesHeader =
          firstPageResult.meta?.response?.headers?.get("X-WP-TotalPages");
        const totalPages = Number(totalPagesHeader ?? "1");

        if (!Number.isFinite(totalPages) || totalPages <= 1) {
          return { data: mergeUniqueCategories([firstPageCategories]) };
        }

        const remainingPagePromises = Array.from(
          { length: totalPages - 1 },
          (_, index) =>
            fetchWithBQ(
              `wc/v3/products/categories?per_page=100&page=${index + 2}&orderby=name&order=asc`,
            ),
        );

        const remainingResults: any[] = await Promise.all(
          remainingPagePromises,
        );
        const failedResult = remainingResults.find((result) => result.error);

        if (failedResult) {
          return { error: failedResult.error };
        }

        const allPages = [
          firstPageCategories,
          ...remainingResults.map(
            (result) => (result.data ?? []) as WooCategory[],
          ),
        ];

        return { data: mergeUniqueCategories(allPages) };
      },
      async onQueryStarted({ siteId }, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const session = useAuthStore.getState().getSession(siteId);

          if (!session) {
            return;
          }

          useCategoryCacheStore.getState().setCategories({
            siteId,
            userId: session.user.id,
            categories: data,
          });
        } catch {}
      },
    }),
  }),
});

export const {
  useUploadImageMutation,
  useCreateProductMutation,
  useGetProductCategoriesQuery,
  useLazyGetProductCategoriesQuery,
  useGetAuthenticatedUserQuery,
} = wooApi;
