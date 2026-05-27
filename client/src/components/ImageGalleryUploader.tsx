import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Upload, X, GripVertical, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

async function fileToWebpBlob(file: File): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(img, 0, 0);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob returned null"))),
      "image/webp",
      0.9,
    );
  });
}

interface ImageGalleryUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  onMainImageChange?: (mainImageUrl: string | null) => void;
  maxImages?: number;
}

interface SortableImageProps {
  id: string;
  imageUrl: string;
  index: number;
  onRemove: (index: number) => void;
  showCoverBadge: boolean;
}

function SortableImage({ id, imageUrl, index, onRemove, showCoverBadge }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "z-50 opacity-50"
      )}
    >
      <Card className="relative overflow-hidden">
        <div className="aspect-video relative bg-muted">
          <img
            src={imageUrl}
            alt={`Gallery image ${index + 1}`}
            className="w-full h-full object-cover"
          />

          {/* Cover badge for first image */}
          {showCoverBadge && index === 0 && (
            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md font-medium">
              Portada
            </div>
          )}
        </div>

        {/* Controls bar */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <div
              {...attributes}
              {...listeners}
              className="p-2 rounded cursor-grab active:cursor-grabbing hover:bg-muted transition-colors"
              data-testid={`drag-handle-${index}`}
            >
              <GripVertical className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Imagen {index + 1}</span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 sm:h-7 sm:w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(index)}
            data-testid={`button-remove-image-${index}`}
            aria-label={`Remove image ${index + 1}`}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

interface GalleryTabProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages: number;
  showCoverBadge: boolean;
  onMainImageChange?: (url: string | null) => void;
}

function GalleryTab({
  images,
  onImagesChange,
  maxImages,
  showCoverBadge,
  onMainImageChange,
}: GalleryTabProps) {
  const [uploading, setUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Upload a single blob (cropped image) to object storage
  const uploadBlob = useCallback(async (blob: Blob): Promise<string> => {
    const urlResponse = await fetch("/api/admin/boat-images/upload", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!urlResponse.ok) throw new Error("Failed to get upload URL");
    const { uploadURL } = await urlResponse.json();

    const uploadResponse = await fetch(uploadURL, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": "image/webp" },
    });
    if (!uploadResponse.ok) throw new Error("Failed to upload image");

    const normalizeResponse = await fetch("/api/admin/boat-images/normalize", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: uploadURL }),
    });
    if (!normalizeResponse.ok) throw new Error("Failed to normalize image URL");

    const { normalizedPath } = await normalizeResponse.json();
    return normalizedPath;
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (images.length >= maxImages) {
        alert(`Maximo ${maxImages} imagenes permitidas`);
        return;
      }

      const remainingSlots = maxImages - images.length;
      const filesToProcess = acceptedFiles.slice(0, remainingSlots);

      if (filesToProcess.length < acceptedFiles.length) {
        alert(
          `Solo se subiran ${filesToProcess.length} de ${acceptedFiles.length} archivos (limite: ${maxImages} imagenes)`
        );
      }

      setUploading(true);
      const uploaded: string[] = [];
      try {
        for (const file of filesToProcess) {
          const webpBlob = await fileToWebpBlob(file);
          const normalizedPath = await uploadBlob(webpBlob);
          uploaded.push(normalizedPath);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error("Error uploading image:", error);
        alert("Error al subir la imagen. Por favor, intenta de nuevo.");
      } finally {
        if (uploaded.length > 0) {
          const newImages = [...images, ...uploaded];
          onImagesChange(newImages);
          if (onMainImageChange && newImages.length > 0) {
            onMainImageChange(newImages[0]);
          }
        }
        setUploading(false);
      }
    },
    [images, maxImages, onImagesChange, onMainImageChange, uploadBlob]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    multiple: true,
    disabled: uploading || images.length >= maxImages,
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((_, i) => `image-${i}` === active.id);
      const newIndex = images.findIndex((_, i) => `image-${i}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newImages = arrayMove(images, oldIndex, newIndex);
        onImagesChange(newImages);

        // Notify main image change if first position changed
        if (onMainImageChange && (oldIndex === 0 || newIndex === 0)) {
          onMainImageChange(newImages[0]);
        }
      }
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);

    // Notify main image change if first image was removed or if no images left
    if (onMainImageChange && index === 0) {
      onMainImageChange(newImages.length > 0 ? newImages[0] : null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors cursor-pointer hover-elevate",
          isDragActive && "border-primary bg-primary/5",
          (uploading || images.length >= maxImages) &&
            "opacity-50 cursor-not-allowed"
        )}
        data-testid="dropzone-upload"
      >
        <input {...getInputProps()} data-testid="input-file-upload" />
        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">Subiendo imagenes...</p>
            </>
          ) : images.length >= maxImages ? (
            <>
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Limite de {maxImages} imagenes alcanzado
              </p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                {isDragActive
                  ? "Suelta las imagenes aqui"
                  : "Arrastra imagenes o haz clic para seleccionar"}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, JPEG o WebP (max. {maxImages} imagenes)
              </p>
              <p className="text-xs text-muted-foreground">
                {images.length > 0 &&
                  `${images.length} de ${maxImages} imagenes subidas`}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Image gallery with drag-and-drop reordering */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Galeria de Imagenes ({images.length})
            </p>
            <p className="text-xs text-muted-foreground">
              Arrastra para reordenar{showCoverBadge ? " - La primera es la portada" : ""}
            </p>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map((_, i) => `image-${i}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((imageUrl, index) => (
                  <SortableImage
                    key={`image-${index}`}
                    id={`image-${index}`}
                    imageUrl={imageUrl}
                    index={index}
                    onRemove={handleRemove}
                    showCoverBadge={showCoverBadge}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

export function ImageGalleryUploader({
  images,
  onImagesChange,
  onMainImageChange,
  maxImages = 10,
}: ImageGalleryUploaderProps) {
  return (
    <GalleryTab
      images={images}
      onImagesChange={onImagesChange}
      maxImages={maxImages}
      showCoverBadge={true}
      onMainImageChange={onMainImageChange}
    />
  );
}
