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

        <div className="flex flex-col gap-2">
          {query &&
            filteredCategories?.map((c: any) => {
              const isSelected = categories.includes(c.id);

              return (
                <Button
                  key={c.id}
                  className="w-full justify-start"
                  color={isSelected ? "primary" : "default"}
                  size="md"
                  variant={isSelected ? "solid" : "bordered"}
                  onPress={() => {
                    if (isSelected) {
                      // Bỏ chọn => chỉ lọc ra những id khác
                      handleSelection(
                        categories.filter((id) => id !== c.id && id !== c.parent),
                      );
                    } else {
                      // Thêm cả id và parent, loại bỏ trùng bằng Set
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
