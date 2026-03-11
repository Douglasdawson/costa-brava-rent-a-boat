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
import { Upload, X, GripVertical, ImageIcon, Monitor, Tablet, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import ImageCropDialog from "./ImageCropDialog";

interface ImageGalleryUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  onMainImageChange?: (mainImageUrl: string | null) => void;
  maxImages?: number;
  imagesTablet?: string[];
  onImagesTabletChange?: (images: string[]) => void;
  imagesMobile?: string[];
  onImagesMobileChange?: (images: string[]) => void;
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
  const [cropQueue, setCropQueue] = useState<{ file: File; dataUrl: string }[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Upload a single blob (cropped image) to object storage
  const uploadBlob = useCallback(async (blob: Blob): Promise<string> => {
    const adminToken = sessionStorage.getItem("adminToken");
    if (!adminToken) throw new Error("Admin token not found. Please login again.");

    const urlResponse = await fetch("/api/admin/boat-images/upload", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
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
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
      body: JSON.stringify({ imageUrl: uploadURL }),
    });
    if (!normalizeResponse.ok) throw new Error("Failed to normalize image URL");

    const { normalizedPath } = await normalizeResponse.json();
    return normalizedPath;
  }, []);

  // When user confirms crop, upload and move to next in queue
  const handleCropConfirm = useCallback(async (croppedBlob: Blob) => {
    setUploading(true);
    try {
      const normalizedPath = await uploadBlob(croppedBlob);
      const newImages = [...images, normalizedPath];
      onImagesChange(newImages);
      if (onMainImageChange && newImages.length > 0) {
        onMainImageChange(newImages[0]);
      }
    } catch (error) {
      console.error("Error uploading cropped image:", error);
      alert("Error al subir la imagen. Por favor, intenta de nuevo.");
    } finally {
      setUploading(false);
      setCropQueue(prev => prev.slice(1));
    }
  }, [images, onImagesChange, onMainImageChange, uploadBlob]);

  const handleCropCancel = useCallback(() => {
    setCropQueue(prev => prev.slice(1));
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

      // Read files as data URLs and queue them for cropping
      const items: { file: File; dataUrl: string }[] = [];
      for (const file of filesToProcess) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        items.push({ file, dataUrl });
      }
      setCropQueue(prev => [...prev, ...items]);
    },
    [images, maxImages]
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
      {/* Crop dialog */}
      {cropQueue.length > 0 && (
        <ImageCropDialog
          imageSrc={cropQueue[0].dataUrl}
          aspect={4 / 3}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}

export function ImageGalleryUploader({
  images,
  onImagesChange,
  onMainImageChange,
  maxImages = 10,
  imagesTablet,
  onImagesTabletChange,
  imagesMobile,
  onImagesMobileChange,
}: ImageGalleryUploaderProps) {
  const hasResponsiveTabs = onImagesTabletChange || onImagesMobileChange;

  // Backward compatible: no tabs, render single gallery directly
  if (!hasResponsiveTabs) {
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

  return (
    <Tabs defaultValue="desktop" className="w-full">
      <TabsList className="grid grid-cols-3">
        <TabsTrigger value="desktop" className="flex items-center gap-2">
          <Monitor className="w-4 h-4" />
          <span className="hidden sm:inline">Desktop</span>
        </TabsTrigger>
        <TabsTrigger value="tablet" className="flex items-center gap-2">
          <Tablet className="w-4 h-4" />
          <span className="hidden sm:inline">Tablet</span>
        </TabsTrigger>
        <TabsTrigger value="mobile" className="flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          <span className="hidden sm:inline">Movil</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="desktop">
        <GalleryTab
          images={images}
          onImagesChange={onImagesChange}
          maxImages={maxImages}
          showCoverBadge={true}
          onMainImageChange={onMainImageChange}
        />
      </TabsContent>

      <TabsContent value="tablet">
        <GalleryTab
          images={imagesTablet ?? []}
          onImagesChange={onImagesTabletChange ?? (() => {})}
          maxImages={maxImages}
          showCoverBadge={false}
        />
      </TabsContent>

      <TabsContent value="mobile">
        <GalleryTab
          images={imagesMobile ?? []}
          onImagesChange={onImagesMobileChange ?? (() => {})}
          maxImages={maxImages}
          showCoverBadge={false}
        />
      </TabsContent>
    </Tabs>
  );
}
