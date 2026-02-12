
-- Fix increment_points: add auth.uid() check
CREATE OR REPLACE FUNCTION public.increment_points(user_row_id uuid, amount integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF user_row_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify other users points';
  END IF;

  UPDATE public.profiles
  SET total_points = GREATEST(COALESCE(total_points, 0) + amount, 0)
  WHERE id = user_row_id;
END;
$function$;

-- Fix update_streak: add auth.uid() check
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_today date := CURRENT_DATE;
  v_yesterday date := CURRENT_DATE - 1;
  v_has_today boolean;
  v_has_yesterday boolean;
  v_current_streak integer;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access other users data';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM habit_logs
    WHERE user_id = p_user_id AND completed_at = v_today AND status = true
  ) INTO v_has_today;

  SELECT EXISTS(
    SELECT 1 FROM habit_logs
    WHERE user_id = p_user_id AND completed_at = v_yesterday AND status = true
  ) INTO v_has_yesterday;

  SELECT COALESCE(current_streak, 0) INTO v_current_streak
  FROM profiles WHERE id = p_user_id;

  IF v_has_today THEN
    IF (SELECT last_active_date FROM profiles WHERE id = p_user_id) = v_yesterday THEN
      UPDATE profiles SET current_streak = v_current_streak + 1, last_active_date = v_today WHERE id = p_user_id;
    ELSIF (SELECT last_active_date FROM profiles WHERE id = p_user_id) IS DISTINCT FROM v_today THEN
      UPDATE profiles SET current_streak = 1, last_active_date = v_today WHERE id = p_user_id;
    END IF;
  ELSE
    IF (SELECT last_active_date FROM profiles WHERE id = p_user_id) = v_today THEN
      IF v_has_yesterday THEN
        UPDATE profiles SET current_streak = GREATEST(v_current_streak - 1, 0), last_active_date = v_yesterday WHERE id = p_user_id;
      ELSE
        UPDATE profiles SET current_streak = 0, last_active_date = NULL WHERE id = p_user_id;
      END IF;
    END IF;
  END IF;
END;
$function$;

-- Fix check_achievements: add auth.uid() check
CREATE OR REPLACE FUNCTION public.check_achievements(p_user_id uuid)
 RETURNS TABLE(achievement_name text, achievement_description text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_points integer;
  v_current_streak integer;
  v_total_habits_done bigint;
  rec RECORD;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access other users data';
  END IF;

  SELECT COALESCE(total_points, 0), COALESCE(current_streak, 0)
  INTO v_total_points, v_current_streak
  FROM profiles WHERE id = p_user_id;

  SELECT COUNT(*) INTO v_total_habits_done
  FROM habit_logs WHERE user_id = p_user_id AND status = true;

  FOR rec IN
    SELECT a.* FROM achievements a
    WHERE a.id NOT IN (SELECT ua.achievement_id FROM user_achievements ua WHERE ua.user_id = p_user_id)
  LOOP
    IF (rec.requirement_type = 'points' AND v_total_points >= rec.requirement_value)
       OR (rec.requirement_type = 'streak' AND v_current_streak >= rec.requirement_value)
       OR (rec.requirement_type = 'habits' AND v_total_habits_done >= rec.requirement_value)
    THEN
      INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, rec.id);
      achievement_name := rec.name;
      achievement_description := rec.description;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$function$;
