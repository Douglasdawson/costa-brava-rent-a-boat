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
      <DialogContent className="sm:max-w-md p-0 border-0 bg-transparent shadow-none [&>button]:text-white [&>button]:hover:text-white/80">
        <VisuallyHidden>
          <DialogTitle>{t.boatQuiz!.dialogTitle}</DialogTitle>
        </VisuallyHidden>
        <BoatQuiz source="hero" onBoatSelect={onBoatSelect} />
      </DialogContent>
    </Dialog>
  );
}
