CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  slot text NOT NULL CHECK (slot IN ('morning','afternoon')),
  address text NOT NULL CHECK (char_length(address) BETWEEN 3 AND 200),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 5 AND 30),
  client_name text NOT NULL CHECK (char_length(client_name) BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (date, slot)
);
GRANT INSERT ON public.bookings TO anon, authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create a booking" ON public.bookings FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.validate_booking_date() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.date < (now() AT TIME ZONE 'Europe/Moscow')::date THEN
    RAISE EXCEPTION 'Нельзя выбрать прошедшую дату';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER bookings_validate_date BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.validate_booking_date();

CREATE OR REPLACE FUNCTION public.get_taken_slots(_from date, _to date)
RETURNS TABLE(date date, slot text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT b.date, b.slot FROM public.bookings b WHERE b.date BETWEEN _from AND _to;
$$;
GRANT EXECUTE ON FUNCTION public.get_taken_slots(date, date) TO anon, authenticated;

COMMENT ON TABLE public.inspection_requests IS 'DEPRECATED: replaced by bookings';