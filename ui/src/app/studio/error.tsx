"use client";

import { useTranslations } from "next-intl";
import { PageErrorView } from "@/modules/stability/components/page-error-view";

type StudioErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function StudioErrorPage({ error, reset }: StudioErrorProps) {
  const t = useTranslations("Stability");

  return (
    <PageErrorView
      title={t("error.title")}
      description={t("error.description")}
      homeLabel={t("notFound.home")}
      retryLabel={t("error.retry")}
      reset={reset}
      error={error}
    />
  );
}
