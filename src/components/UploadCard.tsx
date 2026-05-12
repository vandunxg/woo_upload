"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Upload } from "lucide-react";
import { Image } from "@heroui/image";
import { Button } from "@heroui/button";

import { usePostStore } from "@/store/postStore";

const UploadCard = () => {
  const { image, setField } = usePostStore();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!image) {
      setPreview(null);

      return;
    }

    const nextPreview = URL.createObjectURL(image);

    setPreview(nextPreview);

    return () => {
      URL.revokeObjectURL(nextPreview);
    };
  }, [image]);

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
  };

  const removeImage = () => {
    setField("image", null);
  };

  return (
    <Card className="w-full" shadow="sm">
      <CardHeader>
        <h3 className="text-lg font-semibold">Image</h3>
      </CardHeader>
      <CardBody className="space-y-3">
        <div
          className="overflow-hidden rounded-lg border-2 border-dashed border-gray-300 transition hover:border-blue-500"
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          {image && preview ? (
            <div className="flex h-[220px] items-center justify-center bg-default-100/40 p-3">
              <Image
                alt="Preview"
                className="h-full w-full rounded-lg object-contain"
                src={preview}
              />
            </div>
          ) : (
            <div className="flex h-[220px] flex-col items-center justify-center p-4 text-center">
              <Upload className="h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Upload product image</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Click to choose image file
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1"
            size="sm"
            variant="bordered"
            onPress={() => inputRef.current?.click()}
          >
            {image ? "Replace Image" : "Choose File"}
          </Button>

          {image && (
            <Button
              color="danger"
              size="sm"
              variant="light"
              onPress={removeImage}
            >
              Remove
            </Button>
          )}
        </div>

        <input
          ref={inputRef}
          accept="image/*"
          className="hidden"
          type="file"
          onChange={handleImageUpload}
        />

        {error && (
          <p className="mt-2 text-center text-sm text-red-500">{error}</p>
        )}
      </CardBody>
    </Card>
  );
};

export default UploadCard;
