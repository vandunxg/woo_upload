import { useMemo, useState } from "react";
import { Button } from "@heroui/button";

import JsonImport from "./JsonImport";

import DefaultLayout from "@/layouts/default";
import CategoryCard from "@/components/CategoryCard";
import UploadCard from "@/components/UploadCard";
import DescriptionCard from "@/components/DescriptionCard";
import TitleCard from "@/components/TitleCard";
import { useSiteCategories } from "@/hooks/useSiteCategories";
import { usePostStore } from "@/store/postStore";
import {
  useCreateProductMutation,
  useUploadImageMutation,
} from "@/services/wooApi";
import { pushNotification } from "@/lib/utils";

export default function IndexPage() {
  const [jsonImportKey, setJsonImportKey] = useState(0);
  const { categories: siteCategories } = useSiteCategories();
  const {
    title,
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
        const imageRes = await uploadImage(image).unwrap();

        imageId = imageRes.id;
      }

      await createProduct({
        name: title,
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

  return (
    <DefaultLayout>
      <form
        className="flex flex-col items-center justify-center gap-4 py-8 md:py-10"
        onSubmit={handleSubmit}
      >
        <JsonImport
          key={jsonImportKey}
          onImport={(data) => {
            usePostStore.setState({
              title: data.title,
              description: data.description,
              categories: data.categories,
              empty: false,
            });
          }}
        />
        <TitleCard />
        <DescriptionCard />
        <UploadCard />
        <CategoryCard />

        <div>
          <Button
            color="primary"
            isLoading={loadingUploadImage || isLoading}
            type="submit"
          >
            Submit
          </Button>
        </div>
      </form>
    </DefaultLayout>
  );
}
