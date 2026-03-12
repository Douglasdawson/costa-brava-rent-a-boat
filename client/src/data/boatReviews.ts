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
import { REVIEWS_2020 } from "./reviews-2020";
import { REVIEWS_2021 } from "./reviews-2021";
import { REVIEWS_2022 } from "./reviews-2022";
import { REVIEWS_2023 } from "./reviews-2023";
import { REVIEWS_2024_EXTRA } from "./reviews-2024-extra";
import { REVIEWS_2025_EXTRA } from "./reviews-2025-extra";

type ReviewBatch = Record<string, BoatReview[]>;

// Merge all review batches, concatenating reviews for the same boat
function mergeBatches(...batches: ReviewBatch[]): Record<string, BoatReview[]> {
  const result: Record<string, BoatReview[]> = {};
  for (const batch of batches) {
    for (const [boatId, reviews] of Object.entries(batch)) {
      if (!result[boatId]) {
        result[boatId] = [];
      }
      result[boatId].push(...reviews);
    }
  }
  return result;
}

const BOAT_REVIEWS: Record<string, BoatReview[]> = mergeBatches(
  REVIEWS_2020,
  REVIEWS_2021,
  REVIEWS_2022,
  REVIEWS_2023,
  BATCH_1,
  BATCH_2,
  BATCH_3,
  REVIEWS_2024_EXTRA,
  REVIEWS_2025_EXTRA,
);

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
