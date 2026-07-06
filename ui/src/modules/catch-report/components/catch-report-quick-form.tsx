"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitCatchReport } from "@/modules/catch-report/actions/catch-report-actions";
import type { CatchReportFormContext } from "@/modules/catch-report/types";
import type { AppLocale } from "@/i18n/routing";
import { pickLocalized } from "@/modules/home/data/home-content";

const REGIONS = [
  { id: "aegean", label: { en: "Aegean", tr: "Ege" } },
  { id: "bosphorus", label: { en: "Bosphorus & Marmara", tr: "Boğaz & Marmara" } },
  { id: "mediterranean", label: { en: "Mediterranean", tr: "Akdeniz" } },
  { id: "northern-cyprus", label: { en: "Northern Cyprus", tr: "Kıbrıs" } },
] as const;

type CatchReportQuickFormProps = {
  context: CatchReportFormContext;
  locale: AppLocale;
  defaultVariantSlug?: string;
  labels: {
    title: string;
    species: string;
    variant: string;
    region: string;
    when: string;
    boat: string;
    shore: string;
    catchCount: string;
    notes: string;
    notesPlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    errorGeneric: string;
  };
};

export function CatchReportQuickForm({
  context,
  locale,
  defaultVariantSlug,
  labels,
}: CatchReportQuickFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthYear = useMemo(() => {
    const now = new Date();
    return {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    };
  }, []);

  const defaultVariant =
    context.variants.find((v) => v.slug === defaultVariantSlug) ??
    context.variants[0];

  const [speciesId, setSpeciesId] = useState(context.species[0]?.id ?? "");
  const [variantId, setVariantId] = useState(defaultVariant?.id ?? "");
  const [region, setRegion] = useState<string>(REGIONS[0].id);
  const [boatOrShore, setBoatOrShore] = useState<"BOAT" | "SHORE">("SHORE");
  const [catchCount, setCatchCount] = useState(1);
  const [notes, setNotes] = useState("");

  if (context.species.length === 0) {
    return null;
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await submitCatchReport({
        fishSpeciesId: speciesId,
        lureVariantId: variantId,
        country: "TR",
        region,
        month: monthYear.month,
        year: monthYear.year,
        boatOrShore,
        catchCount,
        notes: notes.trim() || null,
      });

      if (result.ok) {
        setDone(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (done) {
    return (
      <p className="text-emerald-700 dark:text-emerald-400 text-sm font-medium">
        {labels.success}
      </p>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <p className="text-foreground text-sm font-medium">{labels.title}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-muted-foreground text-xs font-medium">
            {labels.species}
          </span>
          <select
            value={speciesId}
            onChange={(e) => setSpeciesId(e.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            required
          >
            {context.species.map((s) => (
              <option key={s.id} value={s.id}>
                {pickLocalized(s.name, locale)}
              </option>
            ))}
          </select>
        </label>

        {context.variants.length > 1 ? (
          <label className="block space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">
              {labels.variant}
            </span>
            <select
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              required
            >
              {context.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {pickLocalized(v.label, locale)}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-muted-foreground text-xs font-medium">
            {labels.region}
          </span>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            required
          >
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {pickLocalized(r.label, locale)}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-muted-foreground text-xs font-medium">
            {labels.catchCount}
          </span>
          <Input
            type="number"
            min={1}
            max={99}
            value={catchCount}
            onChange={(e) => setCatchCount(Number(e.target.value) || 1)}
            required
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={boatOrShore === "SHORE" ? "default" : "outline"}
          onClick={() => setBoatOrShore("SHORE")}
        >
          {labels.shore}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={boatOrShore === "BOAT" ? "default" : "outline"}
          onClick={() => setBoatOrShore("BOAT")}
        >
          {labels.boat}
        </Button>
        <span className="text-muted-foreground self-center text-xs">
          {labels.when}: {monthYear.month}/{monthYear.year}
        </span>
      </div>

      <label className="block space-y-1.5">
        <span className="text-muted-foreground text-xs font-medium">
          {labels.notes}
        </span>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={labels.notesPlaceholder}
          maxLength={200}
        />
      </label>

      {error ? (
        <p className="text-destructive text-sm">{error || labels.errorGeneric}</p>
      ) : null}

      <Button type="submit" disabled={pending || !speciesId || !variantId}>
        {pending ? labels.submitting : labels.submit}
      </Button>
    </form>
  );
}
