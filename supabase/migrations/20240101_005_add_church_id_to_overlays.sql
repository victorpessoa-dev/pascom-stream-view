-- --- MIGRATION: Add church_id to overlays table
-- ----------------------------
-- Adds church isolation to overlays
-- ----------------------------
ALTER TABLE overlays
ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES churches (id) ON DELETE SET NULL;

-- Create index for church lookups
CREATE INDEX IF NOT EXISTS idx_overlays_church_id ON overlays (church_id);

-- Comment: Existing records will be updated via migration 002
