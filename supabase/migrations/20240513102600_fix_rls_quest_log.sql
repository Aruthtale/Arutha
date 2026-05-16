-- JALANKAN INI DI SUPABASE SQL EDITOR --

-- 1. Hapus policy lama (jika ada) agar tidak bentrok
DROP POLICY IF EXISTS "Users can insert their own quest logs" ON public.arutha_quest_log;
DROP POLICY IF EXISTS "Users can view their own quest logs" ON public.arutha_quest_log;
DROP POLICY IF EXISTS "Users can update their own quest logs" ON public.arutha_quest_log;

-- 2. Pastikan RLS Aktif
ALTER TABLE public.arutha_quest_log ENABLE ROW LEVEL SECURITY;

-- 3. Buat policy baru yang lebih aman & dijamin lolos
CREATE POLICY "Users can insert their own quest logs"
ON public.arutha_quest_log FOR INSERT TO authenticated
WITH CHECK (
    user_id IN (
        SELECT id FROM public.arutha_user WHERE supabase_id = auth.uid()
    )
);

CREATE POLICY "Users can view their own quest logs"
ON public.arutha_quest_log FOR SELECT TO authenticated
USING (
    user_id IN (
        SELECT id FROM public.arutha_user WHERE supabase_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own quest logs"
ON public.arutha_quest_log FOR UPDATE TO authenticated
USING (
    user_id IN (
        SELECT id FROM public.arutha_user WHERE supabase_id = auth.uid()
    )
);
