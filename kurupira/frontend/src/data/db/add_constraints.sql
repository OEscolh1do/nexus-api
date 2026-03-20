-- 🔑 ADD UNIQUE CONSTRAINTS FOR UPSERT 🔑

-- This is required for the "onConflict: 'model'" logic to work.
-- Without this, the database doesn't know how to handle duplicates.

ALTER TABLE public.inverters
ADD CONSTRAINT inverters_model_key UNIQUE (model);

ALTER TABLE public.modules
ADD CONSTRAINT modules_model_key UNIQUE (model);
