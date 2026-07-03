import { WatermarkSettings } from "@/types/watermark";

const WATERMARK_MARGIN_RATIO = 0.04;
const WEBP_QUALITY = 0.92;

export const slugify = (title: string): string => {
  const withoutDStroke = title.replace(/đ/g, "d").replace(/Đ/g, "D");

  const slug = withoutDStroke
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "san-pham";
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
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

export const processProductImage = async (
  file: File,
  title: string,
  settings: WatermarkSettings,
): Promise<File> => {
  const objectUrl = URL.createObjectURL(file);

  try {
    const sourceImage = await loadImage(objectUrl);

    const canvas = document.createElement("canvas");

    canvas.width = sourceImage.naturalWidth;
    canvas.height = sourceImage.naturalHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Trình duyệt không hỗ trợ xử lý ảnh (canvas 2d)");
    }

    ctx.drawImage(sourceImage, 0, 0);

    if (settings.enabled && settings.logoDataUrl) {
      const logoImage = await loadImage(settings.logoDataUrl);
      const logoWidth = canvas.width * (settings.sizePercent / 100);
      const logoHeight =
        logoWidth * (logoImage.naturalHeight / logoImage.naturalWidth);
      const { x, y } = getWatermarkPosition(
        settings.position,
        canvas.width,
        canvas.height,
        logoWidth,
        logoHeight,
      );

      ctx.globalAlpha = settings.opacity / 100;
      ctx.drawImage(logoImage, x, y, logoWidth, logoHeight);
      ctx.globalAlpha = 1;
    }

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
