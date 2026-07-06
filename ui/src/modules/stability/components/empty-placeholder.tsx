import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";

type EmptyPlaceholderProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function EmptyPlaceholder({
  title,
  description,
  children,
}: EmptyPlaceholderProps) {
  return (
    <EmptyState title={title} description={description} compact>
      {children}
    </EmptyState>
  );
}
