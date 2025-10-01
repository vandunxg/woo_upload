import { Route, Routes } from "react-router-dom";

import AuthLayout from "./layouts/AuthLayout";
import { LoginForm } from "./components/login-form";
import ProtectedRoute from "./routes/ProtectedRoute";

import IndexPage from "@/pages/index";

function App() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<IndexPage />} path="/" />
      </Route>
      <Route
        element={
          <AuthLayout>
            <LoginForm />
          </AuthLayout>
        }
        path="/login"
      />
    </Routes>
  );
}
export default App;
