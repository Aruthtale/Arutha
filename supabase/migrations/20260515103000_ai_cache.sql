-- ai_cache table
CREATE TABLE IF NOT EXISTS public.ai_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key TEXT NOT NULL UNIQUE,
    model TEXT,
    prompt TEXT,
    response JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Index for fast lookup and cleanup
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON public.ai_cache (cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires_at ON public.ai_cache (expires_at);

-- RLS
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.ai_cache
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.ai_cache
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
