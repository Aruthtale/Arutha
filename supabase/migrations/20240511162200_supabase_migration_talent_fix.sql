-- Add pending_talent_pool to arutha_user
ALTER TABLE arutha_user 
ADD COLUMN IF NOT EXISTS pending_talent_pool JSONB DEFAULT '[]';
