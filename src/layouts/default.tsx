import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Navbar } from "@/components/navbar";
import { useAuthStore } from "@/store/authStore";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  return (
    <div className="relative flex h-screen flex-col">
      <Navbar />
      <main className="container mx-auto max-w-7xl flex-grow px-6 ">
        {children}
      </main>
    </div>
  );
}
