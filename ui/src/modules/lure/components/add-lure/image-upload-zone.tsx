"use client";

import { ImageIcon, UploadCloud } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type ImageUploadZoneProps = {
  title: string;
  description: string;
  hint: string;
};

export function ImageUploadZone({
  title,
  description,
  hint,
}: ImageUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  return (
    <div className="space-y-2">
      <p className="text-foreground text-sm font-medium">{title}</p>
      <div
        role="group"
        aria-label={title}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-border bg-muted/30 flex min-h-44 flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 py-8 text-center transition-colors sm:min-h-52",
          isDragging && "border-primary bg-primary/5",
        )}
      >
        <div
          className={cn(
            "bg-background text-muted-foreground flex size-12 items-center justify-center rounded-full border transition-colors",
            isDragging && "border-primary text-primary",
          )}
        >
          {isDragging ? (
            <UploadCloud className="size-5" aria-hidden />
          ) : (
            <ImageIcon className="size-5" aria-hidden />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-foreground text-sm font-medium">{description}</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {hint}
          </p>
        </div>
      </div>
    </div>
  );
}
