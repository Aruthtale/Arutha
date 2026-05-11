-- JALANKAN INI DI SQL EDITOR SUPABASE KAMU --
-- 1. Buat Tabel Quest Log (Sejarah Perjalanan Pahlawan)
-- Pastikan tabel lama dihapus jika ingin reset skema yang salah tipe
-- DROP TABLE IF EXISTS public.arutha_quest_log;

CREATE TABLE IF NOT EXISTS public.arutha_quest_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.arutha_user(id) ON DELETE CASCADE,
    quest_id TEXT NOT NULL,
    -- ID unik dari AI (daily_xxx, weekly_xxx)
    quest_type TEXT NOT NULL CHECK (
        quest_type IN ('DAILY', 'WEEKLY', 'RECOVERY', 'GLOBAL', 'WORLD')
    ),
    title TEXT NOT NULL,
    stat_type TEXT NOT NULL,
    -- JIWA, RAGA, HARTA, ILMU, KARMA
    xp_reward INTEGER NOT NULL DEFAULT 0,
    proof_note TEXT,
    proof_photo_url TEXT,
    ai_feedback TEXT,
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED')),
    current_step INTEGER DEFAULT 0,
    -- Untuk Misi Mingguan bertahap
    total_steps INTEGER DEFAULT 1,
    -- Default 1 untuk Misi Harian
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.arutha_quest_log ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan Keamanan (Policies)
-- User hanya bisa melihat log miliknya sendiri
CREATE POLICY "Users can view their own quest logs" ON public.arutha_quest_log FOR
SELECT TO authenticated USING (
        auth.uid()::text IN (
            SELECT supabase_id::text
            FROM public.arutha_user
            WHERE id = user_id
        )
    );

-- User bisa mencatat log baru
CREATE POLICY "Users can insert their own quest logs" ON public.arutha_quest_log FOR
INSERT TO authenticated WITH CHECK (
        auth.uid()::text IN (
            SELECT supabase_id::text
            FROM public.arutha_user
            WHERE id = user_id
        )
    );

-- User bisa memperbarui progres misinya (terutama untuk Weekly)
CREATE POLICY "Users can update their own quest logs" ON public.arutha_quest_log FOR
UPDATE TO authenticated USING (
        auth.uid()::text IN (
            SELECT supabase_id::text
            FROM public.arutha_user
            WHERE id = user_id
        )
    );

-- 4. Indeks untuk Performa (Biar query riwayat cepet)
CREATE INDEX IF NOT EXISTS idx_quest_log_user_id ON public.arutha_quest_log(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_log_created_at ON public.arutha_quest_log(created_at);

-- 5. Trigger untuk mengupdate updated_at secara otomatis
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ 
BEGIN 
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_arutha_quest_log_updated_at BEFORE
UPDATE ON public.arutha_quest_log FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.arutha_quest_log IS 'Tabel pusat untuk mencatat semua progres dan riwayat misi pahlawan Arutha.';