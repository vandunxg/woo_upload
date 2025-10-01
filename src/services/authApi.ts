// services/authApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";

import { baseQuery } from "./baseQuery";

import { useAuthStore } from "@/store/authStore";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery,
  endpoints: (builder) => ({
    login: builder.mutation<
      {
        token: string;
        user_email: string;
        user_display_name: string;
        user_id: number;
      },
      { username: string; password: string }
    >({
      query: ({ username, password }) => ({
        url: "/jwt-auth/v1/token",
        method: "POST",
        body: { username, password },
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          useAuthStore.getState().setAuth(data.token, {
            id: data.user_id,
            email: data.user_email,
            username: data.user_display_name,
            displayName: "",
          });
        } catch {}
      },
    }),
  }),
});

export const { useLoginMutation } = authApi;
