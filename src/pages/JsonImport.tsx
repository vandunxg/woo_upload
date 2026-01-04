import { useState } from "react";
import { JsonEditor } from "json-edit-react";
import { Button } from "@heroui/button";
import { CATEGORY_DATA, pushNotification } from "@/lib/utils";
import { Textarea } from "@heroui/input";
import { Card, CardBody, CardFooter } from "@heroui/card";

interface JsonImportProps {
  onImport: (data: {
    title: string;
    description: string;
    categories: number[];
  }) => void;
}

const JsonImport = ({ onImport }: JsonImportProps) => {
  const [jsonData, setJsonData] = useState({
    title: "Title",
    content: "Content",
    hashtag: "Hashtag",
  });

  const findCategoryByHashtag = (hashtag: string) => {
    if (!hashtag) return null;
    const normalize = (str: string) =>
      str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
    const normalizedHashtag = normalize(hashtag);
    
    // Try exact match first (normalized)
    const exact = CATEGORY_DATA.find(
      (c) => normalize(c.name) === normalizedHashtag
    );
    if (exact) return exact;
    // Try includes
    const found = CATEGORY_DATA.find((c) =>
      normalize(c.name).includes(normalizedHashtag)
    );
    return found || null;
  };

  const handleImport = () => {


    const { title, content, hashtag } = jsonData as any;

    if (!title || !content) {
        pushNotification("Title and content are required", "danger");
        return;
    }

    const category = findCategoryByHashtag(hashtag);
    const categories: number[] = [];

    if (category) {
      categories.push(category.id);
      if (category.parent) {
         // Also add parent if necessary, but CategoryCard logic 
         // seems to handle multiple selections or just IDs.
         // Based on CategoryCard logic: 
         // setSelected((prev) => [...new Set([...prev, c.id, c.parent])]);
         categories.push(category.parent);
      }
    } else {
        if (hashtag) {
            pushNotification(`Hashtag "${hashtag}" not found`, "warning");
        }
    }
    
    // Remove duplicates
    const uniqueCategories = [...new Set(categories)];

    onImport({
      title,
      description: content,
      categories: uniqueCategories,
    });
    
    pushNotification("Imported successfully", "success");
  };

  return (
    <Card className="w-full ">
      <CardBody className="p-2 space-y-5">
        <Textarea onChange={(e) => setJsonData(JSON.parse(e.target.value))} />
        <JsonEditor
            className="w-full"
            data={jsonData}
            setData={(d: any) => setJsonData(d)}
        />
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