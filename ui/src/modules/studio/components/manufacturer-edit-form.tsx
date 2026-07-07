"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { saveManufacturer } from "@/modules/studio/actions/manufacturer-actions";
import { EntityAiReviewMini } from "@/modules/studio/ai-review/components/entity-ai-review-mini";
import type { AiReviewSessionView } from "@/modules/studio/ai-review/types";
import {
  StudioField,
  StudioInput,
} from "@/modules/studio/components/studio-ui";

type ManufacturerEditFormProps = {
  slug: string;
  aiSession?: AiReviewSessionView | null;
  initial: {
    id: string;
    nameEn: string;
    nameTr: string;
    countryCode: string | null;
    website: string | null;
    logoUrl: string | null;
  };
};

export function ManufacturerEditForm({
  slug,
  aiSession = null,
  initial,
}: ManufacturerEditFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    nameEn: initial.nameEn,
    nameTr: initial.nameTr,
    countryCode: initial.countryCode ?? "",
    website: initial.website ?? "",
    logoUrl: initial.logoUrl ?? "",
  });

  function save() {
    startTransition(async () => {
      const result = await saveManufacturer(slug, form);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage("Manufacturer saved.");
      router.refresh();
    });
  }

  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-sm font-semibold">Edit manufacturer</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <StudioField label="Name (EN)">
          <StudioInput
            value={form.nameEn}
            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
          />
        </StudioField>
        <StudioField label="Name (TR)">
          <StudioInput
            value={form.nameTr}
            onChange={(e) => setForm({ ...form, nameTr: e.target.value })}
          />
        </StudioField>
        <StudioField label="Country code">
          <StudioInput
            value={form.countryCode}
            onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
            maxLength={2}
          />
        </StudioField>
        <StudioField label="Website">
          <StudioInput
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
        </StudioField>
        <div className="md:col-span-2">
          <StudioField label="Logo URL">
            <StudioInput
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
            />
          </StudioField>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending}
          className={buttonVariants({ size: "sm" })}
          onClick={save}
        >
          Save
        </button>
        {message ? (
          <p className="text-muted-foreground text-sm">{message}</p>
        ) : null}
      </div>
      <EntityAiReviewMini
        entityType="MANUFACTURER"
        entityId={initial.id}
        session={aiSession}
        label="Manufacturer name (for AI duplicate check)"
      />
    </section>
  );
}
