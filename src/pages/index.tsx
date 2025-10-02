import { Button } from "@heroui/button";

import DefaultLayout from "@/layouts/default";
import CategoryCard from "@/components/CategoryCard";
import UploadCard from "@/components/UploadCard";
import DescriptionCard from "@/components/DescriptionCard";
import TitleCard from "@/components/TitleCard";
import { usePostStore } from "@/store/postStore";
import {
  useCreateProductMutation,
  useUploadImageMutation,
} from "@/services/wooApi";
import { pushNotification } from "@/lib/utils";

export default function IndexPage() {
  const { title, description, image, categories, reset } = usePostStore();

  const [uploadImage, { isLoading: loadingUploadImage }] =
    useUploadImageMutation();
  const [createProduct, { isLoading }] = useCreateProductMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let imageId: number | undefined;

      // 1. Upload image nếu có
      if (image) {
        const imageRes = await uploadImage(image).unwrap();

        imageId = imageRes.id;
      }

      // 2. Create product
      await createProduct({
        name: title,
        description,
        categories: categories.map((id) => ({ id })),
        imageId,
      }).unwrap();

      // 3. Reset form store
      reset();

      pushNotification("Created successfully", "success");

      // 4. Scroll to top sau khi submit
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
