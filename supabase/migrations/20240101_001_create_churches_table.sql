-- --- MIGRATION: Create churches table
-- ----------------------------
-- Table: churches
-- ----------------------------
CREATE TABLE IF NOT EXISTS churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  city TEXT,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  social_links JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  setup_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on slug for lookups
CREATE INDEX IF NOT EXISTS idx_churches_slug ON churches (slug);

-- Enable RLS
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view active churches
CREATE POLICY "Public churches are viewable" ON churches FOR
SELECT
  USING (is_active = true);

-- Comment: Church admins will be linked through admin_church_association table
-- Policy for admin access will be set up after admin linkage is established
