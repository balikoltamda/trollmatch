-- Extend Studio AI Review entity types (Sprint 7.6D)
ALTER TYPE "studio_review_entity_type" ADD VALUE IF NOT EXISTS 'REGION';
ALTER TYPE "studio_review_entity_type" ADD VALUE IF NOT EXISTS 'CATCH_REPORT';
