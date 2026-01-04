"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";

import { CATEGORY_DATA } from "@/lib/utils";
import { usePostStore } from "@/store/postStore";

export default function CategoryCard() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
  const { empty, categories, setField } = usePostStore();

  useEffect(() => {
    const normalize = (str: string) =>
      str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    setFilteredCategories(
      CATEGORY_DATA.filter((item) =>
        normalize(item.name).includes(normalize(query)),
      ),
    );
  }, [query]);

  useEffect(() => {
    if (empty) {
      setQuery("");
      setSearch("");
    }
  }, [empty]);

  const handleSelection = (newSelected: number[]) => {
      setField("categories", newSelected);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <h3 className="text-lg font-semibold">Search & Select Categories</h3>
      </CardHeader>

      <CardBody className="space-y-4">
        <div className="flex gap-x-2">
          <Input
            placeholder="Type category name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            onPress={() => {
              setQuery(search.trim());
            }}
          >
            Search
          </Button>
        </div>

        {/* Display Selected Categories */}
        {categories.length > 0 && (
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold">Selected Categories:</h4>
             {CATEGORY_DATA.filter((c) => categories.includes(c.id)).map((c) => (
                <Button
                  key={c.id}
                  className="w-full justify-start"
                  color="primary"
                  size="md"
                  variant="solid"
                  onPress={() => {
                      // Allow unselecting from here
                      handleSelection(
                        categories.filter((id) => id !== c.id && id !== c.parent),
                      );
                  }}
                >
                  {c.name}
                </Button>
             ))}
          </div>
        )}

        {/* Search Results */}
        <div className="flex flex-col gap-2">
          {query &&
            filteredCategories?.map((c: any) => {
              const isSelected = categories.includes(c.id);
              // Optional: Don't show if already shown above?
              // For now, let's keep simplistic. If it's already selected, it will show as "Selected" style in the search list too.
              // But strictly speaking if I show a "Selected" list, maybe I don't need to highlight them in search or just leave it.
              
              return (
                <Button
                  key={c.id}
                  className="w-full justify-start"
                  color={isSelected ? "primary" : "default"}
                  size="md"
                  variant={isSelected ? "solid" : "bordered"}
                  onPress={() => {
                    if (isSelected) {
                      handleSelection(
                        categories.filter((id) => id !== c.id && id !== c.parent),
                      );
                    } else {
                      handleSelection([
                        ...new Set([...categories, c.id, c.parent]),
                      ]);
                    }
                  }}
                >
                  {c.name}
                </Button>
              );
            })}
        </div>

        {categories.length > 0 && (
            <div className="text-sm text-neutral-600">
            Selected IDs: {categories.join(", ")}
            </div>
        )}
      </CardBody>
    </Card>
  );
}
