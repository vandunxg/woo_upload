import { lazy, Suspense } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";

import { usePostStore } from "@/store/postStore";

const MDEditor = lazy(() => import("@uiw/react-md-editor"));

const DescriptionCard = () => {
  const { description, setField } = usePostStore();

  return (
    <Card className="w-full">
      <CardHeader>
        <h3 className="text-lg font-semibold">Description</h3>
      </CardHeader>
      <CardBody>
        <Suspense
          fallback={
            <div className="rounded-md border p-3 text-sm text-muted-foreground">
              Loading editor...
            </div>
          }
        >
          <MDEditor
            data-color-mode="light"
            value={description}
            onChange={(val) => setField("description", val ?? "")}
          />
        </Suspense>
      </CardBody>
    </Card>
  );
};

export default DescriptionCard;
