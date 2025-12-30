-- Ensure uniqueness of subbox regions per image parent (prevent duplicated python_subbox inserts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uq_image_parent_subbox_region'
  ) THEN
    CREATE UNIQUE INDEX uq_image_parent_subbox_region ON image_annotations (image_id, parent_annotation_id, subbox_region) WHERE subbox_region IS NOT NULL;
  END IF;
END$$;

SELECT 'Migration complete: unique index ensured.' AS message;