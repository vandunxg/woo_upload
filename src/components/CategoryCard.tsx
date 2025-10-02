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
  const [categories, setCategories] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const { empty } = usePostStore();

  useEffect(() => {
    const normalize = (str: string) =>
      str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    setCategories(
      CATEGORY_DATA.filter((item) =>
        normalize(item.name).includes(normalize(query)),
      ),
    );
  }, [query]);

  useEffect(() => {
    usePostStore.setState({
      categories: selected, // lưu sẵn dạng object
    });
  }, [selected]);

  useEffect(() => {
    if (empty) {
      setQuery("");
      setSearch("");
      setSelected([]);
    }
  }, [empty]);

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
              setSelected([]);
            }}
          >
            Search
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {query &&
            categories?.map((c: any) => {
              const isSelected = selected.includes(c.id);

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
                      setSelected(
                        selected.filter((id) => id !== c.id && id !== c.parent),
                      );
                    } else {
                      // Thêm cả id và parent, loại bỏ trùng bằng Set
                      setSelected((prev) => [
                        ...new Set([...prev, c.id, c.parent]),
                      ]);
                    }
                  }}
                >
                  {c.name}
                </Button>
              );
            })}
        </div>

        {selected.length > 0 && (
          <div className="text-sm text-neutral-600">
            Selected IDs: {selected.join(", ")}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
