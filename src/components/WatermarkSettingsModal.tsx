"use client";

import { ChangeEvent, useRef } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Switch } from "@heroui/switch";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { Input } from "@heroui/input";
import { Trash2 } from "lucide-react";

import { useWatermarkSettingsStore } from "@/store/watermarkSettingsStore";
import { useBackgroundSettingsStore } from "@/store/backgroundSettingsStore";
import { ImageSettingsPreview } from "@/components/ImageSettingsPreview";
import { WatermarkPosition } from "@/types/watermark";
import { pushNotification } from "@/lib/utils";

const POSITION_GRID: WatermarkPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "center-left",
  "center",
  "center-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

const POSITION_LABELS: Record<WatermarkPosition, string> = {
  "top-left": "Top Left",
  "top-center": "Top Center",
  "top-right": "Top Right",
  "center-left": "Center Left",
  center: "Center",
  "center-right": "Center Right",
  "bottom-left": "Bottom Left",
  "bottom-center": "Bottom Center",
  "bottom-right": "Bottom Right",
};

const MIN_BACKGROUND_SIZE = 100;
const MAX_BACKGROUND_SIZE = 5000;

const parseSize = (value: string) =>
  Math.max(0, Math.floor(Number(value)) || 0);

const clampSize = (value: number) =>
  Math.min(MAX_BACKGROUND_SIZE, Math.max(MIN_BACKGROUND_SIZE, value));

type WatermarkSettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const WatermarkSettingsModal = ({
  isOpen,
  onClose,
}: WatermarkSettingsModalProps) => {
  const {
    enabled,
    logoDataUrl,
    opacity,
    sizePercent,
    position,
    setLogo,
    removeLogo,
    setEnabled,
    setOpacity,
    setSizePercent,
    setPosition,
  } = useWatermarkSettingsStore();
  const background = useBackgroundSettingsStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.type !== "image/png") {
      pushNotification("Chỉ cho phép logo dạng PNG", "danger");

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setLogo(reader.result as string);
      setEnabled(true);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="3xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader>Image Settings</ModalHeader>
        <ModalBody className="pb-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Enable background</span>
                <Switch
                  isSelected={background.enabled}
                  onValueChange={background.setEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fit to background</span>
                <Switch
                  isDisabled={!background.enabled}
                  isSelected={background.fit}
                  onValueChange={background.setFit}
                />
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Background color</span>
                <div className="flex items-center gap-3">
                  <input
                    aria-label="Background color"
                    className="h-9 w-14 cursor-pointer rounded border"
                    type="color"
                    value={background.color}
                    onChange={(e) => background.setColor(e.target.value)}
                  />
                  <span className="font-mono text-sm">{background.color}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">
                  Background size (px)
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    aria-label="Background width"
                    max={MAX_BACKGROUND_SIZE}
                    min={MIN_BACKGROUND_SIZE}
                    size="sm"
                    startContent={<span className="text-xs">W</span>}
                    type="number"
                    value={background.width ? String(background.width) : ""}
                    onBlur={() =>
                      background.setWidth(clampSize(background.width))
                    }
                    onValueChange={(value) =>
                      background.setWidth(parseSize(value))
                    }
                  />
                  <span className="text-sm">×</span>
                  <Input
                    aria-label="Background height"
                    max={MAX_BACKGROUND_SIZE}
                    min={MIN_BACKGROUND_SIZE}
                    size="sm"
                    startContent={<span className="text-xs">H</span>}
                    type="number"
                    value={background.height ? String(background.height) : ""}
                    onBlur={() =>
                      background.setHeight(clampSize(background.height))
                    }
                    onValueChange={(value) =>
                      background.setHeight(parseSize(value))
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {background.fit
                    ? "Image is scaled to fill the whole background and centered; anything outside is cropped."
                    : "Image keeps its original size and is centered; anything larger than the background is cropped."}
                </p>
              </div>

              <Divider />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Enable watermark</span>
                <Switch
                  isDisabled={!logoDataUrl}
                  isSelected={enabled}
                  onValueChange={setEnabled}
                />
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Logo (PNG)</span>
                {logoDataUrl ? (
                  <div className="flex items-center gap-3">
                    <Image
                      alt="Logo preview"
                      className="h-16 w-16 object-contain"
                      src={logoDataUrl}
                    />
                    <Button
                      color="danger"
                      size="sm"
                      startContent={<Trash2 className="h-4 w-4" />}
                      variant="light"
                      onPress={removeLogo}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="bordered"
                    onPress={() => inputRef.current?.click()}
                  >
                    Upload Logo
                  </Button>
                )}
                <input
                  ref={inputRef}
                  accept="image/png"
                  className="hidden"
                  type="file"
                  onChange={handleLogoUpload}
                />
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Opacity: {opacity}%</span>
                <input
                  className="w-full"
                  max={100}
                  min={10}
                  type="range"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">
                  Size: {sizePercent}%
                </span>
                <input
                  className="w-full"
                  max={40}
                  min={5}
                  type="range"
                  value={sizePercent}
                  onChange={(e) => setSizePercent(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Position</span>
                <div className="grid grid-cols-3 gap-2">
                  {POSITION_GRID.map((pos) => (
                    <Button
                      key={pos}
                      color={position === pos ? "primary" : "default"}
                      size="sm"
                      variant={position === pos ? "solid" : "bordered"}
                      onPress={() => setPosition(pos)}
                    >
                      {POSITION_LABELS[pos]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="md:sticky md:top-0 md:self-start">
              <ImageSettingsPreview />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
