"use client";

import { useMemo, useState } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";

import { useSiteCategories } from "@/hooks/useSiteCategories";
import { usePostStore } from "@/store/postStore";

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const toggleCategorySelection = (selectedIds: number[], categoryId: number) => {
  if (selectedIds.includes(categoryId)) {
    return selectedIds.filter((id) => id !== categoryId);
  }

  return [...selectedIds, categoryId];
};

export default function CategoryCard() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const { categories, isLoading, isFetching } = useSiteCategories();
  const selectedCategoryIds = usePostStore((state) => state.categories);
  const setField = usePostStore((state) => state.setField);

  const selectedCategories = useMemo(
    () =>
      categories.filter((category) =>
        selectedCategoryIds.includes(category.id),
      ),
    [categories, selectedCategoryIds],
  );

  const filteredCategories = useMemo(() => {
    if (!query) {
      return [];
    }

    const normalizedQuery = normalize(query);

    return categories.filter((category) =>
      normalize(category.name).includes(normalizedQuery),
    );
  }, [categories, query]);

  const handleSelection = (nextSelected: number[]) => {
    setField("categories", nextSelected);
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
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button onPress={() => setQuery(search.trim())}>Search</Button>
        </div>

        {isLoading && (
          <p className="text-sm text-neutral-500">Loading categories...</p>
        )}

        {selectedCategories.length > 0 && (
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold">Selected Categories:</h4>
            {selectedCategories.map((category) => (
              <Button
                key={category.id}
                className="w-full justify-start"
                color="primary"
                size="md"
                variant="solid"
                onPress={() =>
                  handleSelection(
                    toggleCategorySelection(selectedCategoryIds, category.id),
                  )
                }
              >
                {category.name}
              </Button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {query &&
            filteredCategories.map((category) => {
              const isSelected = selectedCategoryIds.includes(category.id);

              return (
                <Button
                  key={category.id}
                  className="w-full justify-start"
                  color={isSelected ? "primary" : "default"}
                  size="md"
                  variant={isSelected ? "solid" : "bordered"}
                  onPress={() => {
                    handleSelection(
                      toggleCategorySelection(selectedCategoryIds, category.id),
                    );
                  }}
                >
                  {category.name}
                </Button>
              );
            })}
        </div>

        {selectedCategoryIds.length > 0 && (
          <div className="text-sm text-neutral-600">
            Selected IDs: {selectedCategoryIds.join(", ")}
            {isFetching ? " (syncing...)" : ""}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
