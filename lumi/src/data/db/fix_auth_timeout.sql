-- =========================================================================================
-- BUGFIX: SUPABASE INFINITE RECURSION / TIMEOUT
-- =========================================================================================
-- O problema de Timeout em AuthProvider.tsx:72 não é rede, mas sim um Deadlock (Loop Infinito) 
-- dentro do banco de dados do Supabase.
--
-- CAUSA: 
-- A função `get_my_tenant_id()` foi criada com `LANGUAGE sql`. O planejador do PostgreSQL
-- faz o "inline" de funções SQL diretamente na query principal, fazendo com que a tag 
-- `SECURITY DEFINER` fosse ignorada. Como resultado, a política de RLS em `user_profiles`
-- chamava a si mesma em um loop recursivo infinito, derrubando o banco e causando Timeout de 8s.
--
-- SOLUÇÃO:
-- Reescrever a função como `LANGUAGE plpgsql`. Funções PL/pgSQL nunca sofrem inline, 
-- garantindo que rodem como `postgres` (admin) e pulem o RLS em segurança.
--
-- 🚀 INSTRUÇÕES:
-- 1. Acesse o SQL Editor do Supabase (miuwuzvucxwfdhfigvdb)
-- 2. Rode o SQL abaixo:

CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM public.user_profiles WHERE id = auth.uid() LIMIT 1;
  RETURN v_tenant_id;
END;
$$;
