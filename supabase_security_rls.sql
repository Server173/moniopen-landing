-- ============================================================================
-- MIGRACIÓN DE SEGURIDAD: ROW LEVEL SECURITY (RLS) ESTRICTO (SUPABASE / POSTGRES)
-- Propósito: Proteger todas las tablas frente a accesos no autorizados con `anon`
-- o `authenticated` keys, garantizando aislamiento por usuario y cumplimiento GDPR/TCPA.
-- ============================================================================

-- 1. Crear tablas base (si aún no existen en el esquema public)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    email TEXT,
    consent_given BOOLEAN NOT NULL DEFAULT FALSE,
    consent_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'web',
    consent_given BOOLEAN NOT NULL CHECK (consent_given = TRUE),
    consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending',
    consent_given BOOLEAN NOT NULL DEFAULT TRUE,
    consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bots (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    runtime TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'healthy',
    consent_given BOOLEAN NOT NULL CHECK (consent_given = TRUE),
    consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ACTIVAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS + FORZAR RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist FORCE ROW LEVEL SECURITY;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;

ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bots FORCE ROW LEVEL SECURITY;

-- 3. REVOCAR PERMISOS EXCESIVOS POR DEFECTO A ANÓNIMOS
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.orders FROM anon;
REVOKE ALL ON public.bots FROM anon;
-- En waitlist, anon SOLO puede insertar registros con consentimiento explícito (NUNCA leer, actualizar ni borrar)
REVOKE ALL ON public.waitlist FROM anon, authenticated;
GRANT INSERT (email, source, consent_given, consent_timestamp) ON public.waitlist TO anon, authenticated;

-- 4. POLÍTICAS RLS ESTRICTAS PARA `profiles`
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id AND consent_given = TRUE);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Bloqueo explícito de DELETE desde cliente para profiles
DROP POLICY IF EXISTS "profiles_no_client_delete" ON public.profiles;
CREATE POLICY "profiles_no_client_delete"
    ON public.profiles FOR DELETE
    TO authenticated, anon
    USING (false);

-- 5. POLÍTICAS RLS ESTRICTAS PARA `waitlist` (Anti-Exfiltración de Correos)
-- Nadie con anon_key o authenticated puede hacer SELECT/UPDATE/DELETE sobre la waitlist
DROP POLICY IF EXISTS "waitlist_insert_with_consent" ON public.waitlist;
CREATE POLICY "waitlist_insert_with_consent"
    ON public.waitlist FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        consent_given = TRUE
        AND consent_timestamp IS NOT NULL
        AND length(email) BETWEEN 5 AND 254
    );

DROP POLICY IF EXISTS "waitlist_deny_select" ON public.waitlist;
CREATE POLICY "waitlist_deny_select"
    ON public.waitlist FOR SELECT
    TO anon, authenticated
    USING (false);

-- 6. POLÍTICAS RLS ESTRICTAS PARA `orders`
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
CREATE POLICY "orders_select_own"
    ON public.orders FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
CREATE POLICY "orders_insert_own"
    ON public.orders FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id AND consent_given = TRUE);

DROP POLICY IF EXISTS "orders_deny_modify_delete" ON public.orders;
CREATE POLICY "orders_deny_modify_delete"
    ON public.orders FOR DELETE
    TO anon, authenticated
    USING (false);

-- 7. POLÍTICAS RLS ESTRICTAS PARA `bots` (MoniOpen)
DROP POLICY IF EXISTS "bots_select_own" ON public.bots;
CREATE POLICY "bots_select_own"
    ON public.bots FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bots_insert_own" ON public.bots;
CREATE POLICY "bots_insert_own"
    ON public.bots FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id AND consent_given = TRUE AND consent_timestamp IS NOT NULL);

DROP POLICY IF EXISTS "bots_update_own" ON public.bots;
CREATE POLICY "bots_update_own"
    ON public.bots FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bots_delete_own" ON public.bots;
CREATE POLICY "bots_delete_own"
    ON public.bots FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
