import { useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Photo {
  id: string;
  imageUrl: string;
  caption: string | null;
  customerName: string;
  boatName: string | null;
}

interface PhotoLightboxProps {
  photos: Photo[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PhotoLightbox({ photos, initialIndex, open, onOpenChange }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  if (!photos.length) return null;

  const photo = photos[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 gap-0 bg-black/95 border-none [&>button]:hidden">
        <div className="relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Image */}
          <div className="flex items-center justify-center min-h-[50vh] max-h-[80vh]">
            <img
              src={photo.imageUrl}
              alt={photo.caption || `Photo by ${photo.customerName}`}
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>

          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 active:bg-white/20"
                onClick={goPrev}
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 active:bg-white/20"
                onClick={goNext}
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </Button>
            </>
          )}

          {/* Caption */}
          <div className="p-4 text-white">
            {photo.caption && <p className="text-sm mb-1">{photo.caption}</p>}
            <p className="text-xs text-white/70">
              {photo.customerName}
              {photo.boatName && ` - ${photo.boatName}`}
            </p>
            <p className="text-xs text-white/50 mt-1">
              {currentIndex + 1} / {photos.length}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
