-- --- MIGRATION: Create admin_church_association table
-- ----------------------------
-- Table linking administrators to their respective churches
-- ----------------------------
CREATE TABLE IF NOT EXISTS admin_church_association (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES churches (id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (admin_id, church_id)
);

-- Enable RLS
ALTER TABLE admin_church_association ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own association
CREATE POLICY "Users can view own association" ON admin_church_association FOR
SELECT
  USING (auth.uid () = admin_id);

-- Policy: Admins can manage their assigned church
CREATE POLICY "Admins can manage own church" ON admin_church_association FOR ALL USING (auth.uid () = admin_id);

-- Comment: Super admin role can be assigned for cross-church management
