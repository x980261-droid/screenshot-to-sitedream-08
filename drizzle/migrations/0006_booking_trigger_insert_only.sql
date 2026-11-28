DROP TRIGGER bookings_validate_date ON public.bookings;
CREATE TRIGGER bookings_validate_date BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.validate_booking_date();