import type { ComponentType } from "react";
import { StackedCarousel } from "./stacked-carousel";
import { meta as stackedCarouselMeta } from "./stacked-carousel/meta";
import { PriceRange } from "./price-range";
import { meta as priceRangeMeta } from "./price-range/meta";
import { PriceRangeV2 } from "./price-range-v2";
import { meta as priceRangeV2Meta } from "./price-range-v2/meta";
import { ImageGeneration } from "./image-generation";
import { meta as imageGenerationMeta } from "./image-generation/meta";

export interface PrototypeMeta {
  title: string;
  tags?: string[];
}

export interface PrototypeEntry {
  component: ComponentType;
  meta: PrototypeMeta;
}

export const registry: Record<string, PrototypeEntry> = {
  "stacked-carousel": {
    component: StackedCarousel,
    meta: stackedCarouselMeta,
  },
  "price-range": {
    component: PriceRange,
    meta: priceRangeMeta,
  },
  "price-range-v2": {
    component: PriceRangeV2,
    meta: priceRangeV2Meta,
  },
  "image-generation": {
    component: ImageGeneration,
    meta: imageGenerationMeta,
  },
};
