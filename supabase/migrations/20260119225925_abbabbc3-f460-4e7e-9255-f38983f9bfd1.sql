
-- Corrigir search_path nas funções para segurança
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.calculate_loyalty_level(INTEGER) SET search_path = public;
ALTER FUNCTION public.update_loyalty_on_booking() SET search_path = public;
ALTER FUNCTION public.generate_unique_slug(TEXT) SET search_path = public;
