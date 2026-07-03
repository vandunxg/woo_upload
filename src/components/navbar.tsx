import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "@heroui/link";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/navbar";
import { Settings } from "lucide-react";

import { pushNotification } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useSiteStore } from "@/store/siteStore";
import { Logo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { WatermarkSettingsModal } from "@/components/WatermarkSettingsModal";

export const Navbar = () => {
  const navigate = useNavigate();
  const sites = useSiteStore((state) => state.sites);
  const activeSiteId = useSiteStore((state) => state.activeSiteId);
  const setActiveSite = useSiteStore((state) => state.setActiveSite);
  const logoutSite = useAuthStore((state) => state.logoutSite);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const activeSite = useMemo(
    () => sites.find((site) => site.id === activeSiteId) ?? null,
    [activeSiteId, sites],
  );

  const handleLogout = () => {
    if (!activeSiteId) {
      navigate("/login");

      return;
    }

    logoutSite(activeSiteId);
    pushNotification("Logged out successfully", "success");
    navigate("/login");
  };

  return (
    <>
      <HeroUINavbar maxWidth="xl" position="sticky">
        <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
          <NavbarBrand className="max-w-fit gap-3">
            <Link
              className="flex items-center justify-start gap-1"
              color="foreground"
              href="/"
            >
              <Logo />
              <p className="font-bold text-inherit">WOO UPLOAD</p>
            </Link>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent className="basis-full" justify="end">
          <NavbarItem className="flex items-center gap-2">
            <select
              className="h-9 max-w-[280px] rounded-md border border-input bg-background px-3 text-sm"
              value={activeSiteId ?? ""}
              onChange={(event) => setActiveSite(event.target.value)}
            >
              {sites.length === 0 && <option value="">No websites</option>}
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </NavbarItem>
          {activeSite && (
            <NavbarItem className="hidden text-xs text-muted-foreground md:flex">
              {activeSite.baseUrl}
            </NavbarItem>
          )}
        </NavbarContent>
      </HeroUINavbar>

      <WatermarkSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};
