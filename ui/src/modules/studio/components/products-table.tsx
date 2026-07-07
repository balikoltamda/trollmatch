"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { bulkProductAction } from "@/modules/studio/actions/bulk-actions";
import { TrustScorePill } from "@/modules/trust/components/trust-summary";
import { EditorialStatusBadge } from "@/modules/studio/components/editorial-status-badge";
import {
  StudioTable,
  StudioTd,
  StudioTh,
  StudioSelect,
} from "@/modules/studio/components/studio-ui";
import type { ProductListRow } from "@/modules/studio/types";

type ProductsTableProps = {
  rows: ProductListRow[];
  speciesOptions: { id: string; nameEn: string }[];
  techniqueOptions: { id: string; nameEn: string }[];
};

export function ProductsTable({
  rows,
  speciesOptions,
  techniqueOptions,
}: ProductsTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [speciesId, setSpeciesId] = useState("");
  const [techniqueId, setTechniqueId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const allSelected = selected.size === rows.length && rows.length > 0;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function run(
    action: Parameters<typeof bulkProductAction>[1],
    payload?: Parameters<typeof bulkProductAction>[2],
  ) {
    startTransition(async () => {
      const result = await bulkProductAction(Array.from(selected), action, payload);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      if (result.csv) {
        const blob = new Blob([result.csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "products-export.csv";
        a.click();
        URL.revokeObjectURL(url);
      }
      setMessage(result.message);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={pending || selected.size === 0}
          className={buttonVariants({ size: "sm" })}
          onClick={() => run("publish")}
        >
          Publish
        </button>
        <button
          type="button"
          disabled={pending || selected.size === 0}
          className={buttonVariants({ size: "sm", variant: "outline" })}
          onClick={() => run("unpublish")}
        >
          Unpublish
        </button>
        <button
          type="button"
          disabled={pending || selected.size === 0}
          className={buttonVariants({ size: "sm", variant: "outline" })}
          onClick={() => run("reject")}
        >
          Reject
        </button>
        <button
          type="button"
          disabled={pending || selected.size === 0}
          className={buttonVariants({ size: "sm", variant: "outline" })}
          onClick={() => run("archive")}
        >
          Archive
        </button>
        <button
          type="button"
          disabled={pending || selected.size === 0}
          className={buttonVariants({ size: "sm", variant: "outline" })}
          onClick={() => run("restore")}
        >
          Restore
        </button>
        <button
          type="button"
          disabled={pending || selected.size === 0}
          className={buttonVariants({ size: "sm", variant: "ghost" })}
          onClick={() => {
            if (
              !window.confirm(
                `Soft-delete ${selected.size} selected product(s)?`,
              )
            ) {
              return;
            }
            run("delete");
          }}
        >
          Delete
        </button>
        <button
          type="button"
          disabled={pending || selected.size === 0}
          className={buttonVariants({ size: "sm", variant: "outline" })}
          onClick={() => run("export")}
        >
          Export
        </button>
        <button
          type="button"
          disabled={pending || selected.size === 0}
          className={buttonVariants({ size: "sm", variant: "outline" })}
          onClick={() => run("delete_editor_note")}
        >
          Delete editor note
        </button>
        <StudioSelect
          className="h-8 w-44"
          value={speciesId}
          onChange={(e) => setSpeciesId(e.target.value)}
        >
          <option value="">Assign species…</option>
          {speciesOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nameEn}
            </option>
          ))}
        </StudioSelect>
        <button
          type="button"
          disabled={pending || selected.size === 0 || !speciesId}
          className={buttonVariants({ size: "sm", variant: "secondary" })}
          onClick={() => run("assign_species", { speciesIds: [speciesId] })}
        >
          Apply
        </button>
        <StudioSelect
          className="h-8 w-44"
          value={techniqueId}
          onChange={(e) => setTechniqueId(e.target.value)}
        >
          <option value="">Assign technique…</option>
          {techniqueOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nameEn}
            </option>
          ))}
        </StudioSelect>
        <button
          type="button"
          disabled={pending || selected.size === 0 || !techniqueId}
          className={buttonVariants({ size: "sm", variant: "secondary" })}
          onClick={() =>
            run("assign_techniques", { techniqueIds: [techniqueId] })
          }
        >
          Apply
        </button>
        {selected.size > 0 ? (
          <span className="text-muted-foreground text-sm">
            {selected.size} selected
          </span>
        ) : null}
      </div>

      {message ? (
        <p className="text-muted-foreground text-sm">{message}</p>
      ) : null}

      <StudioTable>
        <thead>
          <tr>
            <StudioTh className="w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Select all"
              />
            </StudioTh>
            <StudioTh>Product</StudioTh>
            <StudioTh>Manufacturer</StudioTh>
            <StudioTh>Trust</StudioTh>
            <StudioTh>State</StudioTh>
            <StudioTh>Feed</StudioTh>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <StudioTd colSpan={6} className="text-muted-foreground">
                No products match these filters.
              </StudioTd>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/30">
                <StudioTd>
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleOne(row.id)}
                    aria-label={`Select ${row.nameEn}`}
                  />
                </StudioTd>
                <StudioTd>
                  <Link
                    href={`/studio/products/${row.id}`}
                    className="hover:text-ocean font-medium"
                  >
                    {row.nameEn}
                  </Link>
                  <p className="text-muted-foreground text-xs">{row.slug}</p>
                </StudioTd>
                <StudioTd>{row.manufacturerName}</StudioTd>
                <StudioTd>
                  <TrustScorePill score={row.trustScore} />
                </StudioTd>
                <StudioTd>
                  <EditorialStatusBadge state={row.lifecycleState} />
                </StudioTd>
                <StudioTd>
                  <Badge variant="ocean">{row.manufacturerStatus}</Badge>
                </StudioTd>
              </tr>
            ))
          )}
        </tbody>
      </StudioTable>
    </div>
  );
}
