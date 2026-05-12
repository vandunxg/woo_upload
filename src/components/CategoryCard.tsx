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
    const keyword = search.trim();

    if (!keyword) {
      return [];
    }

    const normalizedQuery = normalize(keyword);

    return categories
      .filter((category) => normalize(category.name).includes(normalizedQuery))
      .slice(0, 80);
  }, [categories, search]);

  const handleSelection = (nextSelected: number[]) => {
    setField("categories", nextSelected);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex w-full items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Categories</h3>
          {isFetching && (
            <span className="text-xs text-muted-foreground">Syncing...</span>
          )}
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        <Input
          placeholder="Search category..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        {isLoading && (
          <p className="text-sm text-neutral-500">Loading categories...</p>
        )}

        {selectedCategories.length > 0 && (
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold">Selected</h4>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map((category) => (
                <Button
                  key={category.id}
                  color="primary"
                  size="sm"
                  variant="flat"
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
          </div>
        )}

        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {search.trim() &&
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

          {search.trim() && filteredCategories.length === 0 && (
            <p className="text-sm text-muted-foreground">No category found.</p>
          )}
        </div>

        {selectedCategoryIds.length > 0 && (
          <div className="text-sm text-neutral-600">
            Selected: {selectedCategoryIds.length}
            {isFetching ? " (syncing...)" : ""}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
