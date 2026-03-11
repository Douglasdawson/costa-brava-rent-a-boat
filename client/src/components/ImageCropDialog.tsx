import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Check, X, RotateCcw } from "lucide-react";

interface ImageCropDialogProps {
  imageSrc: string;
  aspect?: number;
  onConfirm: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop(
      { unit: "%", width: 90 },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export default function ImageCropDialog({
  imageSrc,
  aspect = 4 / 3,
  onConfirm,
  onCancel,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [saving, setSaving] = useState(false);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth, naturalHeight } = e.currentTarget;
      const initialCrop = centerAspectCrop(naturalWidth, naturalHeight, aspect);
      setCrop(initialCrop);
      setCompletedCrop(initialCrop);
    },
    [aspect],
  );

  const handleReset = () => {
    if (imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      const resetCrop = centerAspectCrop(naturalWidth, naturalHeight, aspect);
      setCrop(resetCrop);
      setCompletedCrop(resetCrop);
    }
  };

  const handleConfirm = async () => {
    const image = imgRef.current;
    if (!image || !completedCrop) return;

    setSaving(true);

    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelCrop = {
      x: (completedCrop.x / 100) * image.naturalWidth,
      y: (completedCrop.y / 100) * image.naturalHeight,
      width: (completedCrop.width / 100) * image.naturalWidth,
      height: (completedCrop.height / 100) * image.naturalHeight,
    };

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    canvas.toBlob(
      (blob) => {
        setSaving(false);
        if (blob) onConfirm(blob);
      },
      "image/webp",
      0.9,
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Recortar imagen (4:3)</h3>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-10 w-10 sm:h-9 sm:w-auto" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1" /> Reset
            </Button>
            <Button size="sm" variant="ghost" className="h-10 w-10 sm:h-9 sm:w-auto" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-muted/30">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(_, percentCrop) => setCompletedCrop(percentCrop)}
            aspect={aspect}
            className="max-h-[50vh] sm:max-h-[60vh]"
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Recortar"
              onLoad={onImageLoad}
              className="max-h-[50vh] sm:max-h-[60vh] max-w-full"
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-3 px-4 py-3 border-t">
          <Button variant="outline" className="w-full sm:w-auto" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button className="w-full sm:w-auto text-sm sm:text-base" onClick={handleConfirm} disabled={saving || !completedCrop}>
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Aplicar recorte
          </Button>
        </div>
      </div>
    </div>
  );
}
