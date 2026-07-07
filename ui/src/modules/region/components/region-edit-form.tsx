"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { saveRegion } from "@/modules/region/actions/region-actions";
import {
  StudioField,
  StudioInput,
  StudioTextarea,
} from "@/modules/studio/components/studio-ui";
import type { RegionEditForm } from "@/modules/region/types";

type RegionEditFormProps = {
  slug: string;
  code: string;
  initial: RegionEditForm;
};

export function RegionEditFormPanel({ slug, code, initial }: RegionEditFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState(initial);

  function save() {
    startTransition(async () => {
      const result = await saveRegion(slug, form);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setMessage("Region saved.");
      router.refresh();
    });
  }

  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-sm font-semibold">Edit region</h2>
      <div className="text-muted-foreground grid gap-2 text-sm md:grid-cols-2">
        <p>
          <span className="font-medium">Slug:</span> {slug}
        </p>
        <p>
          <span className="font-medium">Code:</span> {code}
        </p>
      </div>
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
        <div className="md:col-span-2">
          <StudioField label="Description (EN)">
            <StudioTextarea
              value={form.descriptionEn}
              onChange={(e) =>
                setForm({ ...form, descriptionEn: e.target.value })
              }
              rows={4}
            />
          </StudioField>
        </div>
        <div className="md:col-span-2">
          <StudioField label="Description (TR)">
            <StudioTextarea
              value={form.descriptionTr}
              onChange={(e) =>
                setForm({ ...form, descriptionTr: e.target.value })
              }
              rows={4}
            />
          </StudioField>
        </div>
        <StudioField label="Display order">
          <StudioInput
            type="number"
            min={0}
            value={String(form.displayOrder)}
            onChange={(e) =>
              setForm({ ...form, displayOrder: Number(e.target.value) || 0 })
            }
          />
        </StudioField>
        <StudioField label="Active">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Region is active
          </label>
        </StudioField>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={buttonVariants({ size: "sm" })}
          disabled={pending}
          onClick={save}
        >
          {pending ? "Saving…" : "Save region"}
        </button>
        {message ? (
          <p className="text-muted-foreground text-sm">{message}</p>
        ) : null}
      </div>
    </section>
  );
}
