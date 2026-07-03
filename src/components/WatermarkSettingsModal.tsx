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
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { Trash2 } from "lucide-react";

import { useWatermarkSettingsStore } from "@/store/watermarkSettingsStore";
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
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Watermark Settings</ModalHeader>
        <ModalBody className="gap-4 pb-6">
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
            <span className="text-sm font-medium">Size: {sizePercent}%</span>
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
