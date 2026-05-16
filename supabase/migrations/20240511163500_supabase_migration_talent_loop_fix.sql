-- Add total_choices_granted to arutha_user to prevent milestone loops
ALTER TABLE arutha_user 
ADD COLUMN IF NOT EXISTS total_choices_granted INTEGER DEFAULT 0;

-- Sync initial value: for existing users, assume they've been granted as many as they have + available
UPDATE arutha_user 
SET total_choices_granted = COALESCE(array_length(talents, 1), 0) + COALESCE(talent_choices_available, 0)
WHERE total_choices_granted = 0;
