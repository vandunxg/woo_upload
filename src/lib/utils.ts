import { addToast } from "@heroui/toast";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type NotificationType =
  | "danger"
  | "default"
  | "foreground"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | undefined;

export function pushNotification(
  message: string,
  type: NotificationType = "default",
) {
  addToast({
    title: message,
    color: type,
  });
}

export const getClipboardImageFile = (
  clipboardData: DataTransfer,
): File | null => {
  for (const item of clipboardData.items) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();

      if (file) {
        return file;
      }
    }
  }

  return null;
};
