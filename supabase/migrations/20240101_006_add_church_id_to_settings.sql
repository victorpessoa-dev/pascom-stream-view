-- --- MIGRATION: Add church_id to app_settings table
-- ----------------------------
-- Adds church isolation to application settings
-- ----------------------------
ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES churches (id) ON DELETE SET NULL;

-- Create index for church lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_church_id ON app_settings (church_id);

-- Comment: Existing records will be updated via migration 002
