import { useState, useCallback, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { trackGalleryViewed } from "@/utils/analytics";

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const goNext = useCallback(() => {
    const next = (currentIndex + 1) % photos.length;
    setCurrentIndex(next);
    trackGalleryViewed(photos[next]?.boatName || '', next);
  }, [photos, currentIndex]);

  const goPrev = useCallback(() => {
    const prev = (currentIndex - 1 + photos.length) % photos.length;
    setCurrentIndex(prev);
    trackGalleryViewed(photos[prev]?.boatName || '', prev);
  }, [photos, currentIndex]);

  // Sync index when lightbox opens with a new initialIndex
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex]);

  // Focus management: save previous focus on open, restore on close
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      // Focus the dialog container after render
      requestAnimationFrame(() => {
        dialogRef.current?.focus();
      });
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [open]);

  if (!photos.length) return null;

  const photo = photos[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={dialogRef}
        className="max-w-4xl w-[95vw] p-0 gap-0 bg-slate-950/95 border-none [&>button]:hidden"
        aria-label="Visor de imagenes"
      >
        <DialogTitle className="sr-only">Visor de imagenes</DialogTitle>
        <div className="relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar visor"
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Image */}
          <div className="flex items-center justify-center min-h-[50vh] max-h-[80vh]">
            <img
              src={photo.imageUrl}
              alt={photo.caption || `Foto de experiencia nautica en Costa Brava por ${photo.customerName}${photo.boatName ? ` en ${photo.boatName}` : ""}`}
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
                aria-label="Foto anterior"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 active:bg-white/20"
                onClick={goNext}
                aria-label="Foto siguiente"
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
