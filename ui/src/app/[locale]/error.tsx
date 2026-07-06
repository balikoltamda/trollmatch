"use client";

import { useTranslations } from "next-intl";
import { PageErrorView } from "@/modules/stability/components/page-error-view";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LocaleErrorPage({ error, reset }: ErrorPageProps) {
  const t = useTranslations("Stability");

  return (
    <PageErrorView
      title={t("error.title")}
      description={t("error.description")}
      homeLabel={t("error.home")}
      retryLabel={t("error.retry")}
      reset={reset}
      error={error}
    />
  );
}
