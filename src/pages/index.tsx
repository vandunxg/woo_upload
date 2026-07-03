import { useMemo, useState } from "react";
import { Button } from "@heroui/button";

import JsonImport from "./JsonImport";

import DefaultLayout from "@/layouts/default";
import CategoryCard from "@/components/CategoryCard";
import UploadCard from "@/components/UploadCard";
import DescriptionCard from "@/components/DescriptionCard";
import ShortDescriptionCard from "@/components/ShortDescriptionCard";
import TitleCard from "@/components/TitleCard";
import { useSiteCategories } from "@/hooks/useSiteCategories";
import { usePostStore } from "@/store/postStore";
import {
  useCreateProductMutation,
  useUploadImageMutation,
} from "@/services/wooApi";
import { pushNotification } from "@/lib/utils";
import { processProductImage } from "@/lib/imageProcessing";
import { useWatermarkSettingsStore } from "@/store/watermarkSettingsStore";

export default function IndexPage() {
  const [jsonImportKey, setJsonImportKey] = useState(0);
  const { categories: siteCategories } = useSiteCategories();
  const {
    title,
    short_description,
    description,
    image,
    categories: selectedCategoryIds,
    reset,
  } = usePostStore();
  const categoriesById = useMemo(
    () => new Map(siteCategories.map((category) => [category.id, category])),
    [siteCategories],
  );

  const [uploadImage, { isLoading: loadingUploadImage }] =
    useUploadImageMutation();
  const [createProduct, { isLoading }] = useCreateProductMutation();
  const isSubmitting = loadingUploadImage || isLoading;
  const missingFields = useMemo(() => {
    const missing: string[] = [];

    if (!title) {
      missing.push("Title");
    }

    if (!image) {
      missing.push("Image");
    }

    if (!description) {
      missing.push("Description");
    }

    if (selectedCategoryIds.length === 0) {
      missing.push("Category");
    }

    return missing;
  }, [description, image, selectedCategoryIds.length, title]);
  const isReadyToSubmit = missingFields.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // validate
    if (!image) {
      pushNotification("Image is required", "danger");

      return;
    }

    if (!title) {
      pushNotification("Title is required", "danger");

      return;
    }

    if (selectedCategoryIds.length === 0) {
      pushNotification("Please select at least one category", "danger");

      return;
    }

    if (!description) {
      pushNotification("Description is required", "danger");

      return;
    }

    try {
      let imageId: number | undefined;
      const categoryIds = new Set<number>(selectedCategoryIds);

      selectedCategoryIds.forEach((categoryId) => {
        const parentId = categoriesById.get(categoryId)?.parent;

        if (parentId) {
          categoryIds.add(parentId);
        }
      });

      if (image) {
        const processedImage = await processProductImage(
          image,
          title,
          useWatermarkSettingsStore.getState(),
        );
        const imageRes = await uploadImage({
          file: processedImage,
          title,
        }).unwrap();

        imageId = imageRes.id;
      }

      await createProduct({
        name: title,
        short_description,
        description,
        categories: [...categoryIds].map((id) => ({ id })),
        imageId,
      }).unwrap();

      reset();
      setJsonImportKey((prev) => prev + 1);

      pushNotification("Created successfully", "success");

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      pushNotification((err as Error).message, "danger");
    }
  };

  const handleReset = () => {
    reset();
    setJsonImportKey((prev) => prev + 1);
    pushNotification("Form reset", "default");
  };

  return (
    <DefaultLayout>
      <form className="pb-8 pt-4 md:pt-6" onSubmit={handleSubmit}>
        <div className="mb-4 rounded-xl border bg-content1 p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-semibold">Fast Product Upload</h1>
              <p className="text-sm text-muted-foreground">
                Follow the fast lane: paste JSON, upload image, check
                categories, then finish description.
              </p>
            </div>
            <div
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isReadyToSubmit
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {isReadyToSubmit ? "Ready to publish" : "Incomplete"}
            </div>
          </div>
          {!isReadyToSubmit && (
            <p className="mt-2 text-xs text-muted-foreground">
              Missing: {missingFields.join(", ")}
            </p>
          )}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="space-y-4">
            <JsonImport
              key={jsonImportKey}
              onImport={(data) => {
                usePostStore.setState({
                  title: data.title,
                  short_description: data.short_description,
                  description: data.description,
                  categories: data.categories,
                  empty: false,
                });
              }}
            />

            <TitleCard />

            <ShortDescriptionCard />

            <DescriptionCard />
          </section>

          <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
            <div className="rounded-xl border bg-content1 p-4">
              <h3 className="text-sm font-semibold">Publish Action</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Workflow: paste JSON, image, categories, description, then
                publish.
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md border p-2">
                  Title: {title ? "OK" : "-"}
                </div>
                <div className="rounded-md border p-2">
                  Image: {image ? "OK" : "-"}
                </div>
                <div className="rounded-md border p-2">
                  Category: {selectedCategoryIds.length ? "OK" : "-"}
                </div>
                <div className="rounded-md border p-2">
                  Short Desc: {short_description ? "OK" : "-"}
                </div>
                <div className="rounded-md border p-2 col-span-2">
                  Description: {description ? "OK" : "-"}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Button
                  className="w-full"
                  color="primary"
                  isLoading={isSubmitting}
                  type="submit"
                >
                  Publish Product
                </Button>
                <Button
                  className="w-full"
                  type="button"
                  variant="bordered"
                  onPress={handleReset}
                >
                  Reset Form
                </Button>
              </div>
            </div>

            <UploadCard />

            <CategoryCard />
          </aside>
        </div>
      </form>
    </DefaultLayout>
  );
}
