-- Add QUEUED and CANCELLED to import batch lifecycle
ALTER TYPE "import_batch_status" ADD VALUE IF NOT EXISTS 'QUEUED';
ALTER TYPE "import_batch_status" ADD VALUE IF NOT EXISTS 'CANCELLED';
