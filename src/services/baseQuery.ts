import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { useAuthStore } from "@/store/authStore";

export const baseQuery = fetchBaseQuery({
  baseUrl: "https://dientulvt.com/wp-json",
  prepareHeaders: (headers) => {
    const token = useAuthStore.getState().token;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});
