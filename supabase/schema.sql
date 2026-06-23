-- ==========================================
-- HMS DATABASE SCHEMA - FULL EXAM CYCLE
-- ==========================================

-- 1. Table Candidates
CREATE TABLE IF NOT EXISTS public.candidates (
    id TEXT PRIMARY KEY, -- Numéro de badge (ex: "405")
    name TEXT NOT NULL,
    phone TEXT,
    photo_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'eliminated', 'qualified')),
    session_arrival INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table Enigmas (Fil rouge)
CREATE TABLE IF NOT EXISTS public.enigmas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    next_location TEXT, -- Sera rempli quand le GM valide une réponse
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table Enigma_Responses (Réponses des candidats)
CREATE TABLE IF NOT EXISTS public.enigma_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enigma_id UUID REFERENCES public.enigmas(id) ON DELETE CASCADE,
    candidate_id TEXT REFERENCES public.candidates(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Table Eggs (Codes œufs cachés - Endurance)
CREATE TABLE IF NOT EXISTS public.eggs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    is_claimed BOOLEAN DEFAULT false,
    claimed_by TEXT REFERENCES public.candidates(id)
);

-- 5. Table Duels (Bandeaux)
CREATE TABLE IF NOT EXISTS public.duels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player1_id TEXT REFERENCES public.candidates(id),
    player2_id TEXT REFERENCES public.candidates(id),
    winner_id TEXT REFERENCES public.candidates(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Table Cuisine_Dishes (Plats soumis par les candidats)
CREATE TABLE IF NOT EXISTS public.cuisine_dishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id TEXT REFERENCES public.candidates(id) ON DELETE CASCADE,
    dish_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'eliminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Table Cuisine_Scores (Notation par les jurés)
CREATE TABLE IF NOT EXISTS public.cuisine_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dish_id UUID REFERENCES public.cuisine_dishes(id) ON DELETE CASCADE,
    judge_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Table Badges_Hunts (Compteur sur 6)
CREATE TABLE IF NOT EXISTS public.badge_hunts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id TEXT REFERENCES public.candidates(id) ON DELETE CASCADE,
    scanned_code TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8b. Table Badge_Targets (Cibles assignées à chaque candidat)
CREATE TABLE IF NOT EXISTS public.badge_targets (
    candidate_id TEXT PRIMARY KEY REFERENCES public.candidates(id) ON DELETE CASCADE,
    target_id TEXT REFERENCES public.candidates(id) ON DELETE CASCADE
);

-- 9. Table Global_Config (Configuration globale du jeu)
CREATE TABLE IF NOT EXISTS public.global_config (
    id INTEGER PRIMARY KEY,
    active_step_id INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insérer la configuration par défaut
INSERT INTO public.global_config (id, active_step_id) VALUES (1, 1) ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- ==========================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enigmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enigma_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eggs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuisine_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuisine_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_hunts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_hunts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_config ENABLE ROW LEVEL SECURITY;

-- Autoriser tout le monde à lire, insérer et modifier pour le développement
-- (À sécuriser pour la production avec des rôles 'authenticated')
DROP POLICY IF EXISTS "Enable all access for dev" ON public.candidates;
DROP POLICY IF EXISTS "Enable all access for dev" ON public.enigmas;
DROP POLICY IF EXISTS "Enable all access for dev" ON public.enigma_responses;
DROP POLICY IF EXISTS "Enable all access for dev" ON public.eggs;
DROP POLICY IF EXISTS "Enable all access for dev" ON public.duels;
DROP POLICY IF EXISTS "Enable all access for dev" ON public.cuisine_dishes;
DROP POLICY IF EXISTS "Enable all access for dev" ON public.cuisine_scores;
DROP POLICY IF EXISTS "Enable all access for dev" ON public.badge_hunts;
DROP POLICY IF EXISTS "Enable all access for dev" ON public.global_config;

CREATE POLICY "Enable all access for dev" ON public.candidates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for dev" ON public.enigmas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for dev" ON public.enigma_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for dev" ON public.eggs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for dev" ON public.duels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for dev" ON public.cuisine_dishes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for all users" ON "public"."cuisine_scores" AS PERMISSIVE FOR DELETE TO public USING (true);

-- Badges_Hunts
CREATE POLICY "Enable read access for all users" ON "public"."badge_hunts" AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON "public"."badge_hunts" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON "public"."badge_hunts" AS PERMISSIVE FOR UPDATE TO public USING (true);
CREATE POLICY "Enable delete for all users" ON "public"."badge_hunts" AS PERMISSIVE FOR DELETE TO public USING (true);

-- Badge_Targets
CREATE POLICY "Enable read access for all users" ON "public"."badge_targets" AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON "public"."badge_targets" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON "public"."badge_targets" AS PERMISSIVE FOR UPDATE TO public USING (true);
CREATE POLICY "Enable delete for all users" ON "public"."badge_targets" AS PERMISSIVE FOR DELETE TO public USING (true);
CREATE POLICY "Enable all access for dev" ON public.badge_hunts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for dev" ON public.global_config FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- ENABLE REALTIME
-- ==========================================

begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table public.candidates;
alter publication supabase_realtime add table public.enigmas;
alter publication supabase_realtime add table public.enigma_responses;
alter publication supabase_realtime add table public.eggs;
alter publication supabase_realtime add table public.duels;
alter publication supabase_realtime add table public.cuisine_dishes;
alter publication supabase_realtime add table public.cuisine_scores;
alter publication supabase_realtime add table public.badge_hunts;
alter publication supabase_realtime add table public.global_config;

-- ==========================================
-- STORAGE BUCKETS
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('candidates_photos', 'candidates_photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Upload Access" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'candidates_photos');
CREATE POLICY "Upload Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'candidates_photos');
