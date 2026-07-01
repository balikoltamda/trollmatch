"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AutocompleteField,
  type AutocompleteOption,
} from "@/modules/lure/components/add-lure/autocomplete-field";
import { ImageUploadZone } from "@/modules/lure/components/add-lure/image-upload-zone";
import { LurePreviewCard } from "@/modules/lure/components/add-lure/lure-preview-card";
import {
  ADD_LURE_COLORS,
  ADD_LURE_MANUFACTURERS,
  ADD_LURE_MODELS,
  ADD_LURE_VARIANTS,
  localizeOption,
} from "@/modules/lure/data/mock-add-lure-options";
import type { AppLocale } from "@/i18n/routing";

type AddLureFormLabels = {
  imageTitle: string;
  imageDescription: string;
  imageHint: string;
  manufacturer: string;
  model: string;
  variant: string;
  color: string;
  placeholder: string;
  emptyMessage: string;
  save: string;
  saveDisabledHint: string;
  previewTitle: string;
  previewEmptyTitle: string;
  previewEmptyDescription: string;
  previewImagePlaceholder: string;
  notSelected: string;
  identitySection: string;
  identityDescription: string;
};

type AddLureFormProps = {
  locale: AppLocale;
  labels: AddLureFormLabels;
};

export function AddLureForm({ locale, labels }: AddLureFormProps) {
  const [manufacturer, setManufacturer] = useState<AutocompleteOption | null>(
    null,
  );
  const [model, setModel] = useState<AutocompleteOption | null>(null);
  const [variant, setVariant] = useState<AutocompleteOption | null>(null);
  const [color, setColor] = useState<AutocompleteOption | null>(null);

  const manufacturerOptions = useMemo(
    () =>
      ADD_LURE_MANUFACTURERS.map((item) => ({
        id: item.id,
        label: localizeOption(item.label, locale),
      })),
    [locale],
  );

  const modelOptions = useMemo(() => {
    if (!manufacturer) {
      return [];
    }

    return ADD_LURE_MODELS.filter(
      (item) => item.manufacturerId === manufacturer.id,
    ).map((item) => ({
      id: item.id,
      label: localizeOption(item.label, locale),
    }));
  }, [locale, manufacturer]);

  const variantOptions = useMemo(() => {
    if (!model) {
      return [];
    }

    return ADD_LURE_VARIANTS.filter((item) => item.modelId === model.id).map(
      (item) => ({
        id: item.id,
        label: localizeOption(item.label, locale),
      }),
    );
  }, [locale, model]);

  const colorOptions = useMemo(() => {
    if (!variant) {
      return [];
    }

    return ADD_LURE_COLORS.filter((item) => item.variantId === variant.id).map(
      (item) => ({
        id: item.id,
        label: `${item.code} · ${localizeOption(item.label, locale)}`,
      }),
    );
  }, [locale, variant]);

  function handleManufacturerChange(value: AutocompleteOption | null) {
    setManufacturer(value);
    setModel(null);
    setVariant(null);
    setColor(null);
  }

  function handleModelChange(value: AutocompleteOption | null) {
    setModel(value);
    setVariant(null);
    setColor(null);
  }

  function handleVariantChange(value: AutocompleteOption | null) {
    setVariant(value);
    setColor(null);

    if (value) {
      const matchingColor = ADD_LURE_COLORS.find(
        (item) => item.variantId === value.id,
      );

      if (matchingColor) {
        setColor({
          id: matchingColor.id,
          label: `${matchingColor.code} · ${localizeOption(matchingColor.label, locale)}`,
        });
      }
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
      <div className="order-2 space-y-6 lg:order-1">
        <section
          aria-labelledby="add-lure-identity-heading"
          className="border-border bg-card text-card-foreground rounded-xl border p-4 sm:p-6"
        >
          <header className="mb-5 space-y-1">
            <h2
              id="add-lure-identity-heading"
              className="text-foreground text-lg font-semibold tracking-tight"
            >
              {labels.identitySection}
            </h2>
            <p className="text-muted-foreground text-sm">
              {labels.identityDescription}
            </p>
          </header>

          <div className="space-y-5">
            <ImageUploadZone
              title={labels.imageTitle}
              description={labels.imageDescription}
              hint={labels.imageHint}
            />

            <AutocompleteField
              label={labels.manufacturer}
              placeholder={labels.placeholder}
              emptyMessage={labels.emptyMessage}
              options={manufacturerOptions}
              value={manufacturer}
              onChange={handleManufacturerChange}
            />

            <AutocompleteField
              label={labels.model}
              placeholder={labels.placeholder}
              emptyMessage={labels.emptyMessage}
              options={modelOptions}
              value={model}
              onChange={handleModelChange}
              disabled={!manufacturer}
            />

            <AutocompleteField
              label={labels.variant}
              placeholder={labels.placeholder}
              emptyMessage={labels.emptyMessage}
              options={variantOptions}
              value={variant}
              onChange={handleVariantChange}
              disabled={!model}
            />

            <AutocompleteField
              label={labels.color}
              placeholder={labels.placeholder}
              emptyMessage={labels.emptyMessage}
              options={colorOptions}
              value={color}
              onChange={setColor}
              disabled={!variant}
            />
          </div>
        </section>

        <div className="space-y-2">
          <Button
            type="button"
            size="lg"
            disabled
            className="h-11 w-full text-sm sm:text-base"
            title={labels.saveDisabledHint}
          >
            {labels.save}
          </Button>
          <p className="text-muted-foreground text-center text-xs">
            {labels.saveDisabledHint}
          </p>
        </div>
      </div>

      <div className="order-1 lg:sticky lg:top-20 lg:order-2">
        <LurePreviewCard
          title={labels.previewTitle}
          emptyTitle={labels.previewEmptyTitle}
          emptyDescription={labels.previewEmptyDescription}
          previewImagePlaceholder={labels.previewImagePlaceholder}
          manufacturerLabel={labels.manufacturer}
          modelLabel={labels.model}
          variantLabel={labels.variant}
          colorLabel={labels.color}
          manufacturer={manufacturer?.label ?? null}
          model={model?.label ?? null}
          variant={variant?.label ?? null}
          color={color?.label ?? null}
          notSelectedLabel={labels.notSelected}
        />
      </div>
    </div>
  );
}
