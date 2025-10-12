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

interface ImageGalleryUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

interface SortableImageProps {
  id: string;
  imageUrl: string;
  index: number;
  onRemove: (index: number) => void;
}

function SortableImage({ id, imageUrl, index, onRemove }: SortableImageProps) {
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
          {index === 0 && (
            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md font-medium">
              Portada
            </div>
          )}

          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="absolute top-2 right-2 p-1.5 bg-background/80 hover-elevate active-elevate-2 rounded-md cursor-grab active:cursor-grabbing transition-all"
            data-testid={`drag-handle-${index}`}
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Remove button */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute bottom-2 right-2 h-8 w-8 bg-background/80 hover-elevate"
            onClick={() => onRemove(index)}
            data-testid={`button-remove-image-${index}`}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Image info */}
        <div className="p-2 text-xs text-muted-foreground">
          Imagen {index + 1}
        </div>
      </Card>
    </div>
  );
}

export function ImageGalleryUploader({
  images,
  onImagesChange,
  maxImages = 10,
}: ImageGalleryUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (images.length >= maxImages) {
        alert(`Máximo ${maxImages} imágenes permitidas`);
        return;
      }

      const remainingSlots = maxImages - images.length;
      const filesToUpload = acceptedFiles.slice(0, remainingSlots);

      if (filesToUpload.length < acceptedFiles.length) {
        alert(
          `Solo se subirán ${filesToUpload.length} de ${acceptedFiles.length} archivos (límite: ${maxImages} imágenes)`
        );
      }

      setUploading(true);

      try {
        // Get admin token from sessionStorage
        const adminToken = sessionStorage.getItem("adminToken");
        if (!adminToken) {
          throw new Error("Admin token not found. Please login again.");
        }

        const uploadPromises = filesToUpload.map(async (file) => {
          // Get presigned upload URL
          const urlResponse = await fetch("/api/admin/boat-images/upload", {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${adminToken}`,
            },
          });

          if (!urlResponse.ok) {
            throw new Error("Failed to get upload URL");
          }

          const { uploadURL } = await urlResponse.json();

          // Upload file to object storage
          const uploadResponse = await fetch(uploadURL, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload image");
          }

          // Normalize the uploaded URL
          const normalizeResponse = await fetch(
            "/api/admin/boat-images/normalize",
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`,
              },
              body: JSON.stringify({ imageUrl: uploadURL }),
            }
          );

          if (!normalizeResponse.ok) {
            throw new Error("Failed to normalize image URL");
          }

          const { normalizedPath } = await normalizeResponse.json();
          return normalizedPath;
        });

        const uploadedPaths = await Promise.all(uploadPromises);
        onImagesChange([...images, ...uploadedPaths]);
      } catch (error) {
        console.error("Error uploading images:", error);
        alert("Error al subir las imágenes. Por favor, intenta de nuevo.");
      } finally {
        setUploading(false);
      }
    },
    [images, maxImages, onImagesChange]
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
        onImagesChange(arrayMove(images, oldIndex, newIndex));
      }
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer hover-elevate",
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
              <p className="text-sm text-muted-foreground">Subiendo imágenes...</p>
            </>
          ) : images.length >= maxImages ? (
            <>
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Límite de {maxImages} imágenes alcanzado
              </p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                {isDragActive
                  ? "Suelta las imágenes aquí"
                  : "Arrastra imágenes o haz clic para seleccionar"}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, JPEG o WebP (máx. {maxImages} imágenes)
              </p>
              <p className="text-xs text-muted-foreground">
                {images.length > 0 &&
                  `${images.length} de ${maxImages} imágenes subidas`}
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
              Galería de Imágenes ({images.length})
            </p>
            <p className="text-xs text-muted-foreground">
              Arrastra para reordenar • La primera es la portada
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
