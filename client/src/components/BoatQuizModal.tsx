import { Dialog, DialogContent } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogTitle } from "@/components/ui/dialog";
import { useTranslations } from "@/lib/translations";
import BoatQuiz from "./BoatQuiz";

interface BoatQuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBoatSelect: (boatId: string) => void;
}

export default function BoatQuizModal({ open, onOpenChange, onBoatSelect }: BoatQuizModalProps) {
  const t = useTranslations();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        tabIndex={-1}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).focus();
        }}
        className="!max-w-none sm:!max-w-md !w-full !h-[100dvh] sm:!h-auto !rounded-none sm:!rounded-2xl p-0 border-0 bg-transparent shadow-none !left-0 sm:!left-1/2 !top-0 sm:!top-1/2 !translate-x-0 sm:!-translate-x-1/2 !translate-y-0 sm:!-translate-y-1/2 flex items-center justify-center pt-safe pb-safe [&>button]:text-foreground [&>button]:hover:text-foreground/80"
      >
        <VisuallyHidden>
          <DialogTitle>{t.boatQuiz!.dialogTitle}</DialogTitle>
        </VisuallyHidden>
        <BoatQuiz source="hero" onBoatSelect={onBoatSelect} />
      </DialogContent>
    </Dialog>
  );
}
