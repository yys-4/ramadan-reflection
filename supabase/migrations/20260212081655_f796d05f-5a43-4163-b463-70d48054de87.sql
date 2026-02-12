CREATE OR REPLACE FUNCTION public.increment_points(user_row_id uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET total_points = COALESCE(total_points, 0) + amount
  WHERE id = user_row_id;
END;
$$;