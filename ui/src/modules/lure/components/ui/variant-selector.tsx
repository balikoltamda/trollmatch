import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { LureVariant } from "@/modules/lure/types/lure-detail";
import type { AppLocale } from "@/i18n/routing";
import { localize } from "@/modules/lure/services/get-lure-detail";

type VariantSelectorProps = {
  slug: string;
  variants: LureVariant[];
  activeVariantId: string;
  locale: AppLocale;
  label: string;
};

export function VariantSelector({
  slug,
  variants,
  activeVariantId,
  locale,
  label,
}: VariantSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <div
        className="flex flex-wrap gap-2"
        role="listbox"
        aria-label={label}
      >
        {variants.map((variant) => {
          const isActive = variant.id === activeVariantId;
          return (
            <Link
              key={variant.id}
              href={`/lures/${slug}?variant=${variant.id}`}
              scroll={false}
              role="option"
              aria-selected={isActive}
              className={cn(
                "focus-visible:ring-ring rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted text-foreground",
              )}
            >
              {localize(variant.label, locale)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
