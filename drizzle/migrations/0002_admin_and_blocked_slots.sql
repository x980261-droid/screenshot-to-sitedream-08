CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins read bookings" ON public.bookings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete bookings" ON public.bookings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
GRANT SELECT, DELETE ON public.bookings TO authenticated;

CREATE TABLE public.blocked_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  slot text CHECK (slot IN ('morning','afternoon')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX blocked_slots_unique ON public.blocked_slots (date, COALESCE(slot, 'all'));
GRANT SELECT, INSERT, DELETE ON public.blocked_slots TO authenticated;
GRANT ALL ON public.blocked_slots TO service_role;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage blocks" ON public.blocked_slots FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_taken_slots(_from date, _to date)
RETURNS TABLE(date date, slot text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT b.date, b.slot FROM public.bookings b WHERE b.date BETWEEN _from AND _to
  UNION
  SELECT bl.date, s.slot FROM public.blocked_slots bl
    CROSS JOIN LATERAL (SELECT unnest(CASE WHEN bl.slot IS NULL THEN ARRAY['morning','afternoon'] ELSE ARRAY[bl.slot] END) AS slot) s
  WHERE bl.date BETWEEN _from AND _to;
$$;
GRANT EXECUTE ON FUNCTION public.get_taken_slots(date, date) TO anon, authenticated;