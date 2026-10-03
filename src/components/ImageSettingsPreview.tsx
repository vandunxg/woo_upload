"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Button } from "@heroui/button";
import { ClipboardPaste } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { useWatermarkSettingsStore } from "@/store/watermarkSettingsStore";
import { useBackgroundSettingsStore } from "@/store/backgroundSettingsStore";
import { usePostStore } from "@/store/postStore";
import { loadImage, renderProductCanvas } from "@/lib/imageProcessing";
import { getClipboardImageFile } from "@/lib/utils";

export const ImageSettingsPreview = () => {
  const watermark = useWatermarkSettingsStore(
    useShallow(({ enabled, logoDataUrl, opacity, sizePercent, position }) => ({
      enabled,
      logoDataUrl,
      opacity,
      sizePercent,
      position,
    })),
  );
  const background = useBackgroundSettingsStore(
    useShallow(({ enabled, fit, color, width, height }) => ({
      enabled,
      fit,
      color,
      width,
      height,
    })),
  );
  const productImage = usePostStore((state) => state.image);
  const [pastedFile, setPastedFile] = useState<File | null>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [outputSize, setOutputSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const previewFile = pastedFile ?? productImage;

  // Capture phase so the preview takes pasted images before UploadCard does.
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const file = event.clipboardData
        ? getClipboardImageFile(event.clipboardData)
        : null;

      if (!file) {
        return;
      }

      event.preventDefault();
      setPastedFile(file);
    };

    window.addEventListener("paste", handlePaste, true);

    return () => {
      window.removeEventListener("paste", handlePaste, true);
    };
  }, []);

  useEffect(() => {
    if (!previewFile) {
      setSourceImage(null);

      return;
    }

    let cancelled = false;
    const objectUrl = URL.createObjectURL(previewFile);

    loadImage(objectUrl)
      .then((image) => {
        if (!cancelled) {
          setSourceImage(image);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
        }
      })
      .finally(() => URL.revokeObjectURL(objectUrl));

    return () => {
      cancelled = true;
    };
  }, [previewFile]);

  useEffect(() => {
    if (!sourceImage) {
      setOutputSize(null);

      return;
    }

    let cancelled = false;

    renderProductCanvas(sourceImage, watermark, background)
      .then((rendered) => {
        const canvas = canvasRef.current;

        if (cancelled || !canvas) {
          return;
        }

        canvas.width = rendered.width;
        canvas.height = rendered.height;
        canvas.getContext("2d")?.drawImage(rendered, 0, 0);
        setOutputSize({ width: rendered.width, height: rendered.height });
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sourceImage, watermark, background]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file?.type.startsWith("image/")) {
      setPastedFile(file);
    }

    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Preview</span>
        {pastedFile && (
          <Button size="sm" variant="light" onPress={() => setPastedFile(null)}>
            Clear
          </Button>
        )}
      </div>

      <div
        className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-default-100/40 p-2 hover:border-blue-500"
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
        <canvas
          ref={canvasRef}
          className={`h-full w-full object-contain ${sourceImage ? "" : "hidden"}`}
        />
        {!sourceImage && (
          <div className="flex flex-col items-center gap-2 p-4 text-center text-xs text-muted-foreground">
            <ClipboardPaste className="h-6 w-6 text-gray-400" />
            <span>Ctrl + V to paste any image, or click to choose a file</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        accept="image/*"
        className="hidden"
        type="file"
        onChange={handleFileChange}
      />

      {error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : (
        outputSize && (
          <p className="text-xs text-muted-foreground">
            Output: {outputSize.width} × {outputSize.height} px ·{" "}
            {pastedFile ? "pasted image" : "product image"}
          </p>
        )
      )}
    </div>
  );
};
