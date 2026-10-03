import { BackgroundSettings } from "@/types/background";
import { WatermarkSettings } from "@/types/watermark";

const WATERMARK_MARGIN_RATIO = 0.04;
const WEBP_QUALITY = 0.92;

export const slugify = (title: string): string => {
  const withoutDStroke = title.replace(/đ/g, "d").replace(/Đ/g, "D");

  const slug = withoutDStroke
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "san-pham";
};

export const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Không thể đọc file ảnh"));
    img.src = src;
  });

const getWatermarkPosition = (
  position: WatermarkSettings["position"],
  canvasWidth: number,
  canvasHeight: number,
  logoWidth: number,
  logoHeight: number,
) => {
  const marginX = canvasWidth * WATERMARK_MARGIN_RATIO;
  const marginY = canvasHeight * WATERMARK_MARGIN_RATIO;

  const xByAlign: Record<string, number> = {
    left: marginX,
    center: (canvasWidth - logoWidth) / 2,
    right: canvasWidth - logoWidth - marginX,
  };
  const yByAlign: Record<string, number> = {
    top: marginY,
    center: (canvasHeight - logoHeight) / 2,
    bottom: canvasHeight - logoHeight - marginY,
  };

  const [vertical, horizontal] =
    position === "center" ? ["center", "center"] : position.split("-");

  return {
    x: xByAlign[horizontal],
    y: yByAlign[vertical],
  };
};

// Draws the final product image (background + centered image + watermark).
// Shared by the upload pipeline and the settings preview.
export const renderProductCanvas = async (
  sourceImage: HTMLImageElement,
  watermark: WatermarkSettings,
  background: BackgroundSettings,
): Promise<HTMLCanvasElement> => {
  if (background.enabled && !(background.width > 0 && background.height > 0)) {
    throw new Error("Kích thước background không hợp lệ");
  }

  const logoImage =
    watermark.enabled && watermark.logoDataUrl
      ? await loadImage(watermark.logoDataUrl)
      : null;

  const canvas = document.createElement("canvas");

  canvas.width = background.enabled
    ? background.width
    : sourceImage.naturalWidth;
  canvas.height = background.enabled
    ? background.height
    : sourceImage.naturalHeight;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Trình duyệt không hỗ trợ xử lý ảnh (canvas 2d)");
  }

  if (background.enabled) {
    ctx.fillStyle = background.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Centered on the canvas; with `fit` the image is scaled (keeping its
  // aspect ratio) to fill the whole background. Overflow is cropped.
  const scale =
    background.enabled && background.fit
      ? Math.max(
          canvas.width / sourceImage.naturalWidth,
          canvas.height / sourceImage.naturalHeight,
        )
      : 1;
  const drawWidth = sourceImage.naturalWidth * scale;
  const drawHeight = sourceImage.naturalHeight * scale;

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    sourceImage,
    (canvas.width - drawWidth) / 2,
    (canvas.height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );

  if (logoImage) {
    const logoWidth = canvas.width * (watermark.sizePercent / 100);
    const logoHeight =
      logoWidth * (logoImage.naturalHeight / logoImage.naturalWidth);
    const { x, y } = getWatermarkPosition(
      watermark.position,
      canvas.width,
      canvas.height,
      logoWidth,
      logoHeight,
    );

    ctx.globalAlpha = watermark.opacity / 100;
    ctx.drawImage(logoImage, x, y, logoWidth, logoHeight);
    ctx.globalAlpha = 1;
  }

  return canvas;
};

export const processProductImage = async (
  file: File,
  title: string,
  watermark: WatermarkSettings,
  background: BackgroundSettings,
): Promise<File> => {
  const objectUrl = URL.createObjectURL(file);

  try {
    const sourceImage = await loadImage(objectUrl);
    const canvas = await renderProductCanvas(
      sourceImage,
      watermark,
      background,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
    );

    if (!blob) {
      throw new Error("Trình duyệt không hỗ trợ chuyển đổi ảnh sang WebP");
    }

    return new File([blob], `${slugify(title)}.webp`, { type: "image/webp" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
