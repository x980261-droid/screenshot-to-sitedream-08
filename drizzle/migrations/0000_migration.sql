CREATE TABLE public.inspection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 3 AND 40),
  object text NOT NULL CHECK (char_length(object) BETWEEN 1 AND 200),
  inspection_date date NOT NULL,
  inspection_time text NOT NULL CHECK (inspection_time IN ('10:00','15:00')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (inspection_date, inspection_time)
);
GRANT INSERT ON public.inspection_requests TO anon, authenticated;
GRANT ALL ON public.inspection_requests TO service_role;
ALTER TABLE public.inspection_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a request" ON public.inspection_requests FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.validate_inspection_date() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.inspection_date < (now() AT TIME ZONE 'Europe/Moscow')::date THEN
    RAISE EXCEPTION 'Нельзя выбрать прошедшую дату';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER inspection_requests_validate_date BEFORE INSERT OR UPDATE ON public.inspection_requests
FOR EACH ROW EXECUTE FUNCTION public.validate_inspection_date();

CREATE OR REPLACE FUNCTION public.get_booked_slots(_date date) RETURNS SETOF text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT inspection_time FROM public.inspection_requests WHERE inspection_date = _date;
$$;
GRANT EXECUTE ON FUNCTION public.get_booked_slots(date) TO anon, authenticated;