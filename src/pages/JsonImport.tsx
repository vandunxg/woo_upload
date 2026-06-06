import { lazy, Suspense, useMemo, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Textarea } from "@heroui/input";

import { useSiteCategories } from "@/hooks/useSiteCategories";
import { pushNotification } from "@/lib/utils";

const JsonEditor = lazy(() =>
  import("json-edit-react").then((module) => ({ default: module.JsonEditor })),
);

interface JsonImportProps {
  onImport: (data: {
    title: string;
    short_description: string;
    description: string;
    categories: number[];
  }) => void;
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const JsonImport = ({ onImport }: JsonImportProps) => {
  const { categories } = useSiteCategories();
  const [jsonData, setJsonData] = useState({
    title: "Title",
    short_description: "",
    content: "Content",
    hashtag: "Hashtag",
  });
  const [rawJson, setRawJson] = useState("");

  const normalizedCategories = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        normalizedName: normalize(category.name),
      })),
    [categories],
  );

  const findCategoryByHashtag = (hashtag: string) => {
    if (!hashtag) {
      return null;
    }

    const normalizedHashtag = normalize(hashtag);

    const exactMatch = normalizedCategories.find(
      (category) => category.normalizedName === normalizedHashtag,
    );

    if (exactMatch) {
      return exactMatch;
    }

    return (
      normalizedCategories.find((category) =>
        category.normalizedName.includes(normalizedHashtag),
      ) ?? null
    );
  };

  const handleImport = () => {
    const { title, short_description, content, hashtag } = jsonData;

    if (!title || !content) {
      pushNotification("Title and content are required", "danger");

      return;
    }

    const matchedCategory = findCategoryByHashtag(hashtag);
    const categoryIds = new Set<number>();

    if (matchedCategory) {
      categoryIds.add(matchedCategory.id);
    } else if (hashtag) {
      pushNotification(`Hashtag "${hashtag}" not found`, "warning");
    }

    onImport({
      title,
      short_description: short_description ?? "",
      description: content,
      categories: [...categoryIds],
    });
  };

  return (
    <Card className="w-full">
      <CardBody className="space-y-5 p-2">
        <Textarea
          placeholder="Paste JSON here"
          value={rawJson}
          onChange={(event) => {
            const input = event.target.value;

            setRawJson(input);

            if (!input.trim()) {
              return;
            }

            try {
              setJsonData(JSON.parse(input));
            } catch {}
          }}
        />
        <Suspense
          fallback={
            <div className="rounded-md border p-3 text-sm text-muted-foreground">
              Loading JSON editor...
            </div>
          }
        >
          <JsonEditor
            className="w-full"
            data={jsonData}
            setData={(value: any) => setJsonData(value)}
          />
        </Suspense>
      </CardBody>
      <CardFooter>
        <Button className="w-full" color="primary" onPress={handleImport}>
          Import from JSON
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JsonImport;
