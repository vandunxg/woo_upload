import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.tsx";
import { ProviderCustom } from "./provider.tsx";
import "@/styles/globals.css";
import { Provider } from "react-redux";
import { store } from "./store/store.ts";
import { useAuthStore } from "@/store/authStore";
import { useCategoryCacheStore } from "@/store/categoryCacheStore";

useAuthStore.getState().clearExpiredSessions();
useCategoryCacheStore.getState().clearExpiredEntries();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProviderCustom>
        <Provider store={store}>
          <App />
        </Provider>
      </ProviderCustom>
    </BrowserRouter>
  </React.StrictMode>,
);
