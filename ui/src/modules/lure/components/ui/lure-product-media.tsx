"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type WheelEvent,
} from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { localize } from "@/modules/lure/lib/lure-display";
import type { LureVariant, LocalizedString } from "@/modules/lure/types/lure-detail";
import type { AppLocale } from "@/i18n/routing";

const VISIBLE_THUMBS = 8;
const THUMB_GAP_PX = 8;

export type PatternSelectorLabels = {
  patternCount: string;
  scrollPrev: string;
  scrollNext: string;
  patternName: string;
  colorCode: string;
  length: string;
  weight: string;
  buoyancy: string;
  selectorLabel: string;
  galleryLabel: string;
};

type LureProductMediaProps = {
  slug: string;
  variants: LureVariant[];
  activeVariant: LureVariant;
  locale: AppLocale;
  buoyancy?: LocalizedString;
  labels: PatternSelectorLabels;
};

function formatLength(mm: number, locale: AppLocale): string {
  if (locale === "tr") return `${mm} mm`;
  return `${mm} mm (${(mm / 25.4).toFixed(1)} in)`;
}

function formatWeight(g: number, locale: AppLocale): string {
  if (locale === "tr") return `${g} g`;
  return `${g} g (${(g / 28.3495).toFixed(1)} oz)`;
}

export function LureProductMedia({
  slug,
  variants,
  activeVariant,
  locale,
  buoyancy,
  labels,
}: LureProductMediaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [thumbWidth, setThumbWidth] = useState(64);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const galleryImages = useMemo(() => {
    const images =
      activeVariant.galleryImages.length > 0
        ? activeVariant.galleryImages
        : [activeVariant.imageSrc];
    return [...new Set(images)];
  }, [activeVariant.galleryImages, activeVariant.imageSrc]);

  const heroSrc = galleryImages[galleryIndex] ?? activeVariant.imageSrc;
  const patternName = localize(activeVariant.label, locale);
  const buoyancyText = buoyancy ? localize(buoyancy, locale) : "—";

  useEffect(() => {
    setGalleryIndex(0);
  }, [activeVariant.id]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const update = () => {
      const width = viewport.clientWidth;
      const totalGap = THUMB_GAP_PX * (VISIBLE_THUMBS - 1);
      setThumbWidth(Math.max(48, (width - totalGap) / VISIBLE_THUMBS));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const activeEl = container.querySelector<HTMLElement>(
      `[data-variant-id="${activeVariant.id}"]`,
    );
    activeEl?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeVariant.id, thumbWidth]);

  const scrollByPage = useCallback(
    (direction: -1 | 1) => {
      const container = scrollRef.current;
      if (!container) return;
      const page = (thumbWidth + THUMB_GAP_PX) * VISIBLE_THUMBS;
      container.scrollBy({ left: direction * page, behavior: "smooth" });
    },
    [thumbWidth],
  );

  const handleWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!container || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    event.preventDefault();
    container.scrollBy({ left: event.deltaY, behavior: "auto" });
  }, []);

  const handleStripKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollByPage(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollByPage(1);
      }
    },
    [scrollByPage],
  );

  return (
    <div className="space-y-3">
      <div className="border-border/50 bg-card overflow-hidden rounded-2xl border shadow-[0_1px_2px_oklch(0.28_0.04_255/0.04),0_12px_40px_oklch(0.28_0.04_255/0.04)]">
        <div className="bg-surface-muted/60 relative aspect-[5/4]">
          {/* TEMP TEST: bypass next/image optimizer — revert after diagnosis */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={heroSrc}
            src={heroSrc}
            alt={patternName}
            className="absolute inset-0 size-full object-contain p-10 sm:p-12"
          />
        </div>
      </div>

      <div
        className="space-y-2"
        aria-label={labels.selectorLabel}
      >
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {labels.patternCount}
        </p>

        <div className="relative" ref={viewportRef}>
          {variants.length > VISIBLE_THUMBS ? (
            <>
              <button
                type="button"
                aria-label={labels.scrollPrev}
                onClick={() => scrollByPage(-1)}
                className="bg-background/90 border-border hover:bg-muted absolute top-1/2 left-0 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                aria-label={labels.scrollNext}
                onClick={() => scrollByPage(1)}
                className="bg-background/90 border-border hover:bg-muted absolute top-1/2 right-0 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm"
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </>
          ) : null}

          <div
            ref={scrollRef}
            role="listbox"
            aria-label={labels.selectorLabel}
            aria-activedescendant={`pattern-${activeVariant.id}`}
            tabIndex={0}
            onKeyDown={handleStripKeyDown}
            onWheel={handleWheel}
            className={cn(
              "flex gap-2 overflow-x-auto scroll-smooth px-0.5 py-0.5",
              "snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
              variants.length > VISIBLE_THUMBS && "px-9",
            )}
            style={{ touchAction: "pan-x" }}
          >
            {variants.map((variant) => {
              const isActive = variant.id === activeVariant.id;
              const thumbSrc =
                variant.galleryImages[0] ?? variant.imageSrc;
              return (
                <Link
                  key={variant.id}
                  id={`pattern-${variant.id}`}
                  data-variant-id={variant.id}
                  href={`/lures/${slug}?variant=${variant.id}`}
                  scroll={false}
                  role="option"
                  aria-selected={isActive}
                  aria-label={localize(variant.label, locale)}
                  className={cn(
                    "focus-visible:ring-ring relative block shrink-0 snap-start overflow-hidden rounded-lg border-2 transition-colors focus-visible:ring-2 focus-visible:outline-none",
                    isActive
                      ? "border-primary ring-primary/20 ring-2"
                      : "border-border hover:border-primary/40",
                  )}
                  style={{ width: thumbWidth, height: thumbWidth }}
                >
                  <Image
                    src={thumbSrc}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </Link>
              );
            })}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground text-xs">{labels.patternName}</dt>
            <dd className="text-foreground truncate font-medium">{patternName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">{labels.colorCode}</dt>
            <dd className="text-foreground font-medium">{activeVariant.colorCode}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">{labels.length}</dt>
            <dd className="text-foreground font-medium">
              {formatLength(activeVariant.lengthMm, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">{labels.weight}</dt>
            <dd className="text-foreground font-medium">
              {formatWeight(activeVariant.weightG, locale)}
            </dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-muted-foreground text-xs">{labels.buoyancy}</dt>
            <dd className="text-foreground font-medium">{buoyancyText}</dd>
          </div>
        </dl>

        {galleryImages.length > 1 ? (
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {labels.galleryLabel}
            </p>
            <div
              className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label={labels.galleryLabel}
            >
              {galleryImages.map((src, index) => {
                const isActive = index === galleryIndex;
                return (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`${labels.galleryLabel} ${index + 1}`}
                    onClick={() => setGalleryIndex(index)}
                    className={cn(
                      "focus-visible:ring-ring relative size-12 shrink-0 overflow-hidden rounded-md border-2 transition-colors focus-visible:ring-2 focus-visible:outline-none",
                      isActive
                        ? "border-primary"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {patternName}
      </p>
    </div>
  );
}
