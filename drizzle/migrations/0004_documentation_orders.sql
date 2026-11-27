CREATE TABLE public.documentation_orders (
 id uuid PRIMARY KEY,
 service text NOT NULL CHECK (service IN ('project','working','estimate')),
 project_description text NOT NULL CHECK (length(trim(project_description)) BETWEEN 3 AND 2000),
 client_name text NOT NULL CHECK (length(trim(client_name)) BETWEEN 1 AND 100),
 phone text NOT NULL CHECK (phone ~ '^[0-9\s()+-]{5,30}$'),
 consent boolean NOT NULL CHECK (consent = true),
 files jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(files) = 'array' AND jsonb_array_length(files) <= 5),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.documentation_orders TO anon, authenticated;
GRANT SELECT ON public.documentation_orders TO authenticated;
GRANT ALL ON public.documentation_orders TO service_role;
ALTER TABLE public.documentation_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitors submit documentation orders" ON public.documentation_orders FOR INSERT TO anon, authenticated WITH CHECK (consent = true);
CREATE POLICY "Admins read documentation orders" ON public.documentation_orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE FUNCTION public.validate_documentation_files() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE f jsonb;
BEGIN
 FOR f IN SELECT value FROM jsonb_array_elements(NEW.files) LOOP
  IF jsonb_typeof(f) <> 'object' OR f->>'name' IS NULL OR length(f->>'name') NOT BETWEEN 1 AND 255 OR f->>'path' IS NULL OR (f->>'path') !~ ('^' || NEW.id::text || '/[0-9a-f-]{36}\.(pdf|dwg|xlsx)$') OR NOT EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'documentation-orders' AND o.name = f->>'path') THEN
   RAISE EXCEPTION 'Invalid document attachment' USING ERRCODE = '23514';
  END IF;
 END LOOP;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_documentation_files() FROM PUBLIC;
CREATE TRIGGER validate_documentation_files BEFORE INSERT OR UPDATE ON public.documentation_orders FOR EACH ROW EXECUTE FUNCTION public.validate_documentation_files();
CREATE POLICY "Visitors upload documentation files" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'documentation-orders' AND name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|dwg|xlsx)$');
CREATE POLICY "Admins read documentation files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documentation-orders' AND public.has_role(auth.uid(), 'admin'));