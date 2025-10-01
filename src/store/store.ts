// store.ts
import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "@/services/authApi";
import { wooApi } from "@/services/wooApi";

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [wooApi.reducerPath]: wooApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault().concat(authApi.middleware).concat(wooApi.middleware),
});

// types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
