import { BookOpen, Bot, Factory, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { InformationSourceType } from "@/modules/editorial/types";
import { cn } from "@/lib/utils";

type InformationSourceBadgeProps = {
  source: InformationSourceType;
  className?: string;
};

const SOURCE_ICONS = {
  manufacturer: Factory,
  editorial: BookOpen,
  community: Users,
  ai: Bot,
} as const;

export async function InformationSourceBadge({
  source,
  className,
}: InformationSourceBadgeProps) {
  const t = await getTranslations("Editorial.sources");
  const Icon = SOURCE_ICONS[source];

  return (
    <span
      className={cn(
        "border-border/50 bg-muted/30 text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] font-medium tracking-wide uppercase",
        className,
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      {t(source)}
    </span>
  );
}
