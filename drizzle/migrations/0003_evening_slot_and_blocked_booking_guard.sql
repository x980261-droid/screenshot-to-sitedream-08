ALTER TABLE public.bookings DROP CONSTRAINT bookings_slot_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_slot_check CHECK (slot IN ('morning', 'afternoon', 'evening'));
ALTER TABLE public.blocked_slots DROP CONSTRAINT blocked_slots_slot_check;
ALTER TABLE public.blocked_slots ADD CONSTRAINT blocked_slots_slot_check CHECK (slot IN ('morning', 'afternoon', 'evening'));
CREATE OR REPLACE FUNCTION public.get_taken_slots(_from date, _to date)
RETURNS TABLE(date date, slot text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
 SELECT b.date, b.slot FROM public.bookings b WHERE b.date BETWEEN _from AND _to
 UNION
 SELECT bl.date, s.slot FROM public.blocked_slots bl
 CROSS JOIN LATERAL (SELECT unnest(CASE WHEN bl.slot IS NULL THEN ARRAY['morning','afternoon','evening'] ELSE ARRAY[bl.slot] END) AS slot) s
 WHERE bl.date BETWEEN _from AND _to;
$$;
CREATE OR REPLACE FUNCTION public.validate_booking_date()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
BEGIN
 IF NEW.date < (now() AT TIME ZONE 'Europe/Moscow')::date THEN
  RAISE EXCEPTION 'Нельзя выбрать прошедшую дату';
 END IF;
 IF EXISTS (SELECT 1 FROM public.blocked_slots b WHERE b.date = NEW.date AND (b.slot IS NULL OR b.slot = NEW.slot)) THEN
  RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'Это время заблокировано';
 END IF;
 RETURN NEW;
END;
$$;