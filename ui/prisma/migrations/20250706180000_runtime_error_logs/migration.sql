-- Production Stability Sprint — runtime error logging

CREATE TABLE IF NOT EXISTS "runtime_error_logs" (
    "id" UUID NOT NULL,
    "page" VARCHAR(512) NOT NULL,
    "slug" VARCHAR(256),
    "operation" VARCHAR(128),
    "message" VARCHAR(1024) NOT NULL,
    "stack" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMPTZ(6),
    "resolved_by" VARCHAR(128),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "runtime_error_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "runtime_error_logs_resolved_created_at_idx"
    ON "runtime_error_logs"("resolved", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "runtime_error_logs_page_idx"
    ON "runtime_error_logs"("page");
