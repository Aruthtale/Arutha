-- Final Migration for Weekly Quests and Milestone Talent System
ALTER TABLE arutha_user 
ADD COLUMN IF NOT EXISTS available_weekly_quests JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS active_weekly_quests JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS last_weekly_reset TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS talent_choices_available INTEGER DEFAULT 0;

ALTER TABLE character_profile 
ADD COLUMN IF NOT EXISTS rationale TEXT;

-- For existing users who are already level 1 or higher but have no talents or choices
-- This ensures they get at least 1 choice to start with if they have 0 talents.
UPDATE arutha_user 
SET talent_choices_available = 1 
WHERE (talents IS NULL OR jsonb_array_length(talents) = 0) 
AND talent_choices_available = 0;
