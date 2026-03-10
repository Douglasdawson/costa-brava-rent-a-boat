import { useMemo } from "react";
import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { getBoatReviews, getBoatAverageRating } from "@/data/boatReviews";
import { useTranslations } from "@/lib/translations";

// Convert 2-letter country code to flag emoji
function countryFlag(code: string): string {
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    ...Array.from(upper).map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

interface BoatReviewCarouselProps {
  boatId: string;
}

export default function BoatReviewCarousel({ boatId }: BoatReviewCarouselProps) {
  const t = useTranslations();
  const reviews = useMemo(() => getBoatReviews(boatId), [boatId]);
  const { average, count } = useMemo(() => getBoatAverageRating(boatId), [boatId]);

  if (reviews.length === 0) return null;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center md:justify-center gap-2">
          <Star className="w-5 h-5 text-primary fill-primary" />
          {t.reviews.boatReviewsTitle}
        </CardTitle>
        <div className="flex items-center md:justify-center gap-2 mt-1">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(average)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-foreground">{average}</span>
          <span className="text-sm text-muted-foreground">
            ({count} {t.reviews.reviewCount})
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Carousel
          opts={{ align: "start", loop: true }}
          className="w-full"
        >
          <CarouselContent className="-ml-3">
            {reviews.map((review, index) => (
              <CarouselItem
                key={index}
                className="pl-3 basis-full sm:basis-1/2 lg:basis-1/3"
              >
                <div className="h-full border border-border rounded-xl p-5 flex flex-col">
                  {/* Stars */}
                  <div className="flex mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < review.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  {/* Review text */}
                  <p className="text-sm text-foreground/80 leading-relaxed flex-1 line-clamp-5">
                    "{review.text}"
                  </p>
                  {/* Author */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                    <span className="text-lg" role="img" aria-label={review.nationality}>
                      {countryFlag(review.flag)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{review.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.date).toLocaleDateString("es-ES", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {reviews.length > 1 && (
            <>
              <CarouselPrevious />
              <CarouselNext />
            </>
          )}
        </Carousel>
      </CardContent>
    </Card>
  );
}
