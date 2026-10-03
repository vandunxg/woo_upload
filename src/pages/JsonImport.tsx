import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Textarea } from "@heroui/input";

import { useSiteCategories } from "@/hooks/useSiteCategories";
import { pushNotification } from "@/lib/utils";

const JsonEditor = lazy(() =>
  import("json-edit-react").then((module) => ({ default: module.JsonEditor })),
);

type ImportJson = {
  title: string;
  short_description: string;
  content: string;
  hashtag: string;
};

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

// Only `{...}` counts as pasted JSON, so plain numbers/strings still paste
// normally into other fields.
const parseJsonObject = (text: string): ImportJson | null => {
  const trimmed = text.trim();

  if (!trimmed.startsWith("{")) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
};

const JsonImport = ({ onImport }: JsonImportProps) => {
  const { categories } = useSiteCategories();
  const [jsonData, setJsonData] = useState<ImportJson>({
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

  const findCategoryByHashtag = useCallback(
    (hashtag: string) => {
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
    },
    [normalizedCategories],
  );

  const importData = useCallback(
    (data: ImportJson) => {
      const { title, short_description, content, hashtag } = data;

      if (!title || !content) {
        pushNotification("Title and content are required", "danger");

        return false;
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

      return true;
    },
    [findCategoryByHashtag, onImport],
  );

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      const text = event.clipboardData?.getData("text/plain");
      const parsed = text ? parseJsonObject(text) : null;

      if (!text || !parsed) {
        return;
      }

      event.preventDefault();
      setRawJson(text.trim());
      setJsonData(parsed);

      if (importData(parsed)) {
        pushNotification("Đã dán JSON từ clipboard", "success");
      }
    };

    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [importData]);

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
        <Button
          className="w-full"
          color="primary"
          onPress={() => importData(jsonData)}
        >
          Import from JSON
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JsonImport;
