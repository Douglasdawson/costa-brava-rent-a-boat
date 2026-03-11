export interface BoatReview {
  name: string;
  nationality: string;
  flag: string;
  rating: number;
  text: string;
  date: string;
}

import { BATCH_1 } from "./reviews-batch1";
import { BATCH_2 } from "./reviews-batch2";
import { BATCH_3 } from "./reviews-batch3";

// Merge all review batches into a single record
const BOAT_REVIEWS: Record<string, BoatReview[]> = {
  ...BATCH_1,
  ...BATCH_2,
  ...BATCH_3,
} as Record<string, BoatReview[]>;

export function getBoatReviews(boatId: string): BoatReview[] {
  return BOAT_REVIEWS[boatId] || [];
}

export function getAllReviews(): (BoatReview & { boatId: string })[] {
  const all: (BoatReview & { boatId: string })[] = [];
  for (const [boatId, reviews] of Object.entries(BOAT_REVIEWS)) {
    for (const r of reviews) {
      all.push({ ...r, boatId });
    }
  }
  return all;
}

export function getBoatAverageRating(boatId: string): { average: number; count: number } {
  const reviews = BOAT_REVIEWS[boatId] || [];
  if (reviews.length === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return { average: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
}
