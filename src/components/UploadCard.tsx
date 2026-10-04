"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { ClipboardPaste, Upload } from "lucide-react";
import { Image } from "@heroui/image";
import { Button } from "@heroui/button";
import { AnimatePresence, motion } from "framer-motion";

import { usePostStore } from "@/store/postStore";
import { getClipboardImageFile, pushNotification } from "@/lib/utils";

const MAX_SIZE_MB = 20;

const PREVIEW_TRANSITION = {
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1],
} as const;

const extensionFromMime = (mime: string) => {
  const subtype = mime.split("/")[1] ?? "png";

  return subtype === "jpeg" ? "jpg" : subtype;
};

const UploadCard = () => {
  const { image, setField } = usePostStore();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justPasted, setJustPasted] = useState(false);
  const justPastedTimer = useRef<number>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => window.clearTimeout(justPastedTimer.current), []);

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

  const acceptFile = useCallback(
    (file: File) => {
      setError(null);

      if (!file.type.startsWith("image/")) {
        setError("❌ Chỉ cho phép upload ảnh (jpg, png, webp...)");

        return false;
      }

      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`❌ File quá lớn! Giới hạn ${MAX_SIZE_MB}MB`);

        return false;
      }

      setField("image", file);

      return true;
    },
    [setField],
  );

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const clipboardData = event.clipboardData;

      if (!clipboardData || event.defaultPrevented) return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (target?.isContentEditable ?? false);

      const pastedFile = getClipboardImageFile(clipboardData);

      if (!pastedFile) {
        return;
      }

      // If user is pasting inside an editable field and clipboard has text
      // alongside the image, let the default paste handle text and skip image.
      if (isEditable) {
        const hasText = Array.from(clipboardData.items).some(
          (item) => item.kind === "string" && item.type === "text/plain",
        );

        if (hasText) {
          return;
        }
      }

      event.preventDefault();

      const namedFile =
        pastedFile.name && pastedFile.name !== "image.png"
          ? pastedFile
          : new File(
              [pastedFile],
              `pasted-${Date.now()}.${extensionFromMime(pastedFile.type)}`,
              { type: pastedFile.type },
            );

      const ok = acceptFile(namedFile);

      if (ok) {
        setJustPasted(true);
        pushNotification("Đã dán ảnh từ clipboard", "success");
        // Restart the timer so back-to-back pastes keep the highlight on.
        window.clearTimeout(justPastedTimer.current);
        justPastedTimer.current = window.setTimeout(
          () => setJustPasted(false),
          1200,
        );
      }
    };

    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [acceptFile]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    acceptFile(file);
    e.target.value = "";
  };

  const removeImage = () => {
    setField("image", null);
    setError(null);
  };

  return (
    <Card className="w-full" shadow="sm">
      <CardHeader>
        <h3 className="text-lg font-semibold">Image</h3>
      </CardHeader>
      <CardBody className="space-y-3">
        <div
          className={`relative h-[220px] overflow-hidden rounded-lg border-2 border-dashed transition-[border-color,background-color,box-shadow] duration-500 ease-out ${
            justPasted
              ? "border-emerald-500 bg-emerald-50/40 shadow-[0_0_0_4px_rgb(16_185_129/0.15)]"
              : "border-gray-300 hover:border-blue-500"
          }`}
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
          {/* Both layers are absolute so old and new crossfade in place. */}
          <AnimatePresence initial={false}>
            {image && preview ? (
              <motion.div
                key={preview}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-default-100/40 p-3"
                exit={{ opacity: 0, scale: 1.02 }}
                initial={{ opacity: 0, scale: 0.96 }}
                transition={PREVIEW_TRANSITION}
              >
                <Image
                  alt="Preview"
                  className="h-full w-full rounded-lg object-contain"
                  src={preview}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                transition={PREVIEW_TRANSITION}
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Upload product image
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Click to choose image file
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ClipboardPaste className="h-3.5 w-3.5" />
                  <span>
                    or press{" "}
                    <kbd className="rounded border bg-default-100 px-1.5 py-0.5 font-mono text-[10px]">
                      Ctrl
                    </kbd>{" "}
                    +{" "}
                    <kbd className="rounded border bg-default-100 px-1.5 py-0.5 font-mono text-[10px]">
                      V
                    </kbd>{" "}
                    to paste from clipboard
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
