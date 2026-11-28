ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_date_slot_key;
ALTER TABLE public.bookings
  ADD COLUMN city text CHECK (city IN ('moscow','lipetsk','voronezh')),
  ADD COLUMN status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected')),
  ADD COLUMN queue_position int,
  ADD COLUMN action_token uuid NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX bookings_action_token_key ON public.bookings(action_token);
CREATE UNIQUE INDEX bookings_one_phone_per_slot ON public.bookings(date, slot, (regexp_replace(phone, '\D', '', 'g'))) WHERE status <> 'rejected';
CREATE INDEX bookings_date_slot_idx ON public.bookings(date, slot);
GRANT UPDATE ON public.bookings TO service_role;

CREATE OR REPLACE FUNCTION public.validate_booking_date()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE n int; dow int;
BEGIN
 IF NEW.date < (now() AT TIME ZONE 'Europe/Moscow')::date THEN
  RAISE EXCEPTION 'Нельзя выбрать прошедшую дату';
 END IF;
 dow := extract(dow FROM NEW.date);
 IF NEW.city IS NULL OR NOT (
   (NEW.city = 'moscow' AND dow IN (0,1,2)) OR (NEW.city = 'lipetsk' AND dow IN (3,4,5)) OR (NEW.city = 'voronezh' AND dow = 6)) THEN
  RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'CITY_DAY';
 END IF;
 IF EXISTS (SELECT 1 FROM public.blocked_slots b WHERE b.date = NEW.date AND (b.slot IS NULL OR b.slot = NEW.slot)) THEN
  RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SLOT_FULL';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtext(NEW.date::text || NEW.slot));
 IF EXISTS (SELECT 1 FROM public.bookings b WHERE b.date = NEW.date AND b.slot = NEW.slot AND b.status = 'confirmed') THEN
  RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SLOT_FULL';
 END IF;
 SELECT count(*) INTO n FROM public.bookings b WHERE b.date = NEW.date AND b.slot = NEW.slot AND b.status = 'pending';
 IF n >= 3 THEN RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'SLOT_FULL'; END IF;
 NEW.status := 'pending';
 NEW.queue_position := n + 1;
 NEW.action_token := gen_random_uuid();
 RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.get_slot_queue(_from date, _to date)
RETURNS TABLE(date date, slot text, pending int, closed boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
 WITH q AS (
  SELECT b.date, b.slot, count(*) FILTER (WHERE b.status = 'pending')::int AS pending,
         bool_or(b.status = 'confirmed') AS conf
  FROM public.bookings b WHERE b.date BETWEEN _from AND _to AND b.status <> 'rejected' GROUP BY 1,2
 ), bl AS (
  SELECT x.date, s.slot FROM public.blocked_slots x
  CROSS JOIN LATERAL (SELECT unnest(CASE WHEN x.slot IS NULL THEN ARRAY['morning','afternoon','evening'] ELSE ARRAY[x.slot] END) AS slot) s
  WHERE x.date BETWEEN _from AND _to
 )
 SELECT coalesce(q.date, bl.date), coalesce(q.slot, bl.slot), coalesce(q.pending, 0),
        (bl.slot IS NOT NULL OR coalesce(q.conf, false) OR coalesce(q.pending, 0) >= 3)
 FROM q FULL JOIN bl ON q.date = bl.date AND q.slot = bl.slot;
$$;
GRANT EXECUTE ON FUNCTION public.get_slot_queue(date, date) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_taken_slots(_from date, _to date)
RETURNS TABLE(date date, slot text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $$
 SELECT q.date, q.slot FROM public.get_slot_queue(_from, _to) q WHERE q.closed;
$$;