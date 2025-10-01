"use client";

import React, { useState, ChangeEvent } from "react";
import { Card, CardBody } from "@heroui/card";
import { Upload } from "lucide-react";
import { Image } from "@heroui/image";
import { Button } from "@heroui/button";
import { usePostStore } from "@/store/postStore";

const UploadCard = () => {
  const { image, setField } = usePostStore();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("❌ Chỉ cho phép upload ảnh (jpg, png, webp...)");
      return;
    }

    const maxSizeMB = 2;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`❌ File quá lớn! Giới hạn ${maxSizeMB}MB`);
      return;
    }

    setField("image", file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setField("image", null);
    setPreview(null);
  };

  return (
    <Card shadow="sm" className="w-full">
      <CardBody>
        <div className="cursor-pointer min-h-[200px] flex justify-center items-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition hover:border-blue-500">
          <label className="flex flex-col items-center justify-center space-y-2">
            <Upload className="h-10 w-10 text-gray-400" />
            <span className="text-gray-500">
              Click hoặc kéo thả ảnh vào đây
            </span>
            <input
              accept="image/*"
              className="hidden"
              type="file"
              onChange={handleImageUpload}
            />
          </label>
        </div>

        {error && (
          <p className="mt-2 text-center text-sm text-red-500">{error}</p>
        )}

        {image && preview && (
          <div className="mt-4 flex flex-col items-center gap-3">
            <Image
              alt="Preview"
              className="max-h-60 rounded-lg object-contain shadow-md"
              src={preview}
            />
            <Button
              size="sm"
              color="danger"
              variant="light"
              onPress={removeImage}
            >
              Xóa ảnh
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default UploadCard;
