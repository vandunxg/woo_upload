import { Link } from "@heroui/link";
import { GalleryVerticalEnd } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

import { useAuthStore } from "@/store/authStore.ts";

export default function AuthLayout({ children }: any) {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, [token, navigate]);

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          className="flex items-center gap-2 self-center font-medium"
          href="#"
        >
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Acme Inc.
        </Link>
        {children}
      </div>
    </div>
  );
}
