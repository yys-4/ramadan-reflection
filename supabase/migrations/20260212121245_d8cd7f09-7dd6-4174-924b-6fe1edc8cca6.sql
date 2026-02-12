
-- Fix check_achievements to match actual requirement_type values in the DB
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
    IF (rec.requirement_type = 'total_points' AND v_total_points >= rec.requirement_value)
       OR (rec.requirement_type = 'streak' AND v_current_streak >= rec.requirement_value)
       OR (rec.requirement_type = 'habit_count' AND v_total_habits_done >= rec.requirement_value)
    THEN
      INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, rec.id);
      achievement_name := rec.name;
      achievement_description := rec.description;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$function$;
