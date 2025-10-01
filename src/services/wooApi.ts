// services/wooApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQuery } from "./baseQuery";

import { useCategoryStore } from "@/store/categoryStore";

type Category = {
  id: number;
  name: string;
  slug: string;
  parent: number;
};

export const wooApi = createApi({
  reducerPath: "wooApi",
  baseQuery,
  endpoints: (builder) => ({
    // Upload Image
    uploadImage: builder.mutation<{ id: number; source_url: string }, File>({
      query: (file) => {
        const formData = new FormData();

        formData.append("file", file);

        return {
          url: "wp/v2/media",
          method: "POST",
          body: formData,
        };
      },
    }),

    // Create Product
    createProduct: builder.mutation<
      any,
      {
        name: string;
        description: string;
        categories: number[];
        imageId?: number;
      }
    >({
      query: ({ name, description, categories, imageId }) => ({
        url: "wc/v3/products",
        method: "POST",
        body: {
          name,
          description,
          categories,
          images: imageId ? [{ id: imageId }] : [],
          status: "publish",
        },
      }),
    }),

    // Get siblings by child name
    getCategorySiblings: builder.query<Category[], string>({
      async queryFn(name, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          const searchRes: any = await fetchWithBQ(
            `wc/v3/products/categories?search=${encodeURIComponent(name)}`,
          );

          if (searchRes.error) return { error: searchRes.error };

          const categories = searchRes.data as Category[];

          const child =
            categories.find(
              (c) => c.name.toLowerCase() === name.toLowerCase(),
            ) || categories[0];

          if (!child) return { data: [] };

          const siblingsRes: any = await fetchWithBQ(
            `wc/v3/products/categories?parent=${child.parent}`,
          );

          useCategoryStore.getState().setId(child.parent);

          if (siblingsRes.error) return { error: siblingsRes.error };

          return { data: siblingsRes.data as Category[] };
        } catch (err: any) {
          return { error: { status: "CUSTOM_ERROR", error: err.message } };
        }
      },
    }),
  }),
});

export const {
  useUploadImageMutation,
  useCreateProductMutation,
  useGetCategorySiblingsQuery,
} = wooApi;
