-- Add processed_hash column to images table for deduplication of processed images
ALTER TABLE images
ADD COLUMN IF NOT EXISTS processed_hash VARCHAR(128);

-- Add index to speed lookups
CREATE INDEX IF NOT EXISTS idx_images_processed_hash ON images(processed_hash);