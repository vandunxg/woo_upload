import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { cn, pushNotification } from "@/lib/utils";
import { useLoginMutation } from "@/services/authApi";
import { useLazyGetProductCategoriesQuery } from "@/services/wooApi";
import { useSiteStore } from "@/store/siteStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SiteMode = "saved" | "new";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const navigate = useNavigate();
  const sites = useSiteStore((state) => state.sites);
  const activeSiteId = useSiteStore((state) => state.activeSiteId);
  const upsertSite = useSiteStore((state) => state.upsertSite);
  const setActiveSite = useSiteStore((state) => state.setActiveSite);

  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [siteMode, setSiteMode] = useState<SiteMode>("new");
  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading }] = useLoginMutation();
  const [fetchCategories] = useLazyGetProductCategoriesQuery();

  useEffect(() => {
    if (!sites.length) {
      setSelectedSiteId("");
      setSiteMode("new");

      return;
    }

    const nextSelectedSiteId =
      activeSiteId && sites.some((site) => site.id === activeSiteId)
        ? activeSiteId
        : sites[0].id;

    setSelectedSiteId(nextSelectedSiteId);
    setSiteMode("saved");
  }, [activeSiteId, sites]);

  const resolveSiteId = () => {
    if (siteMode === "saved") {
      if (!selectedSiteId) {
        pushNotification("Please choose a saved website", "danger");

        return null;
      }

      setActiveSite(selectedSiteId);

      return selectedSiteId;
    }

    if (!siteUrl.trim()) {
      pushNotification("Website URL is required", "danger");

      return null;
    }

    const createdSite = upsertSite({
      name: siteName,
      baseUrl: siteUrl,
    });

    if (!createdSite) {
      pushNotification("Website URL is invalid", "danger");

      return null;
    }

    setActiveSite(createdSite.id);
    setSelectedSiteId(createdSite.id);
    setSiteMode("saved");
    setSiteUrl("");
    setSiteName("");

    return createdSite.id;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const siteId = resolveSiteId();

    if (!siteId) {
      return;
    }

    try {
      await login({
        siteId,
        username,
        password,
      }).unwrap();

      fetchCategories({ siteId });

      pushNotification("Login successfully", "success");
      navigate("/");
    } catch {
      pushNotification("Login failed", "danger");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Connect to WordPress</CardTitle>
          <CardDescription>
            Login with a saved website or add a new website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Website</Label>
                <div className="grid grid-cols-2 gap-2 rounded-md border p-1">
                  <Button
                    type="button"
                    variant={siteMode === "saved" ? "default" : "ghost"}
                    disabled={sites.length === 0}
                    onClick={() => setSiteMode("saved")}
                  >
                    Saved
                  </Button>
                  <Button
                    type="button"
                    variant={siteMode === "new" ? "default" : "ghost"}
                    onClick={() => setSiteMode("new")}
                  >
                    Add New
                  </Button>
                </div>
              </div>

              {siteMode === "saved" ? (
                <div className="grid gap-2">
                  <Label htmlFor="site-select">Saved websites</Label>
                  <select
                    id="site-select"
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={selectedSiteId}
                    onChange={(event) => setSelectedSiteId(event.target.value)}
                  >
                    <option value="">Select website</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name} ({site.baseUrl})
                      </option>
                    ))}
                  </select>
                  {sites.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No saved website yet. Switch to "Add New".
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-md border p-3">
                  <p className="mb-3 text-sm font-medium">Add new website</p>
                  <div className="grid gap-3">
                    <Input
                      id="site-name"
                      placeholder="Site name (optional)"
                      type="text"
                      value={siteName}
                      onChange={(event) => setSiteName(event.target.value)}
                    />
                    <Input
                      id="site-url"
                      placeholder="example.com or https://example.com"
                      type="text"
                      value={siteUrl}
                      onChange={(event) => setSiteUrl(event.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  required
                  id="username"
                  placeholder="admin"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  required
                  id="password"
                  placeholder="********"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              <Button className="w-full" disabled={isLoading} type="submit">
                {isLoading
                  ? "Loading..."
                  : siteMode === "new"
                    ? "Add Website & Login"
                    : "Login"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
