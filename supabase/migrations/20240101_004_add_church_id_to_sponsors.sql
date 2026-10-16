-- --- MIGRATION: Add church_id to sponsors table
-- ----------------------------
-- Adds church isolation to sponsors (patrocinadores)
-- ----------------------------
ALTER TABLE sponsors
ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES churches (id) ON DELETE SET NULL;

-- Create index for church lookups
CREATE INDEX IF NOT EXISTS idx_sponsors_church_id ON sponsors (church_id);

-- Update RLS policies for sponsors table
-- These will be set up per church based on admin linkage
-- Placeholder: policies will be created based on admin_church_association
-- Comment: Existing records will be updated via migration 002
