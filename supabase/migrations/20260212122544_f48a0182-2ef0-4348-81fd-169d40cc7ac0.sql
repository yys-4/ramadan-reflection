
-- Fix check_achievements: habit_count now counts DISTINCT completed days (not raw log count)
-- This prevents awarding multi-day badges from a single day of activity
CREATE OR REPLACE FUNCTION public.check_achievements(p_user_id uuid)
 RETURNS TABLE(achievement_name text, achievement_description text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_points integer;
  v_current_streak integer;
  v_total_habit_days bigint;
  rec RECORD;
BEGIN
  -- Auth check
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access other users data';
  END IF;

  -- Get current stats
  SELECT COALESCE(total_points, 0), COALESCE(current_streak, 0)
  INTO v_total_points, v_current_streak
  FROM profiles WHERE id = p_user_id;

  -- Count DISTINCT days where user completed at least one habit
  SELECT COUNT(DISTINCT completed_at) INTO v_total_habit_days
  FROM habit_logs WHERE user_id = p_user_id AND status = true;

  -- Loop only un-earned achievements
  FOR rec IN
    SELECT a.* FROM achievements a
    WHERE NOT EXISTS (
      SELECT 1 FROM user_achievements ua 
      WHERE ua.achievement_id = a.id AND ua.user_id = p_user_id
    )
  LOOP
    IF (rec.requirement_type = 'total_points' AND v_total_points >= rec.requirement_value)
       OR (rec.requirement_type = 'streak' AND v_current_streak >= rec.requirement_value)
       OR (rec.requirement_type = 'habit_count' AND v_total_habit_days >= rec.requirement_value)
    THEN
      INSERT INTO user_achievements (user_id, achievement_id) VALUES (p_user_id, rec.id);
      achievement_name := rec.name;
      achievement_description := rec.description;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$function$;
