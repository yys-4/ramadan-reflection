-- 1. Streak update function: call after each habit_log insert/delete
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_yesterday date := CURRENT_DATE - 1;
  v_has_today boolean;
  v_has_yesterday boolean;
  v_current_streak integer;
BEGIN
  -- Check if user has any completed habit today
  SELECT EXISTS(
    SELECT 1 FROM habit_logs
    WHERE user_id = p_user_id AND completed_at = v_today AND status = true
  ) INTO v_has_today;

  -- Check yesterday
  SELECT EXISTS(
    SELECT 1 FROM habit_logs
    WHERE user_id = p_user_id AND completed_at = v_yesterday AND status = true
  ) INTO v_has_yesterday;

  -- Get current streak
  SELECT COALESCE(current_streak, 0) INTO v_current_streak
  FROM profiles WHERE id = p_user_id;

  IF v_has_today THEN
    -- If last_active_date was yesterday or today, increment if needed
    IF (SELECT last_active_date FROM profiles WHERE id = p_user_id) = v_yesterday THEN
      UPDATE profiles SET current_streak = v_current_streak + 1, last_active_date = v_today WHERE id = p_user_id;
    ELSIF (SELECT last_active_date FROM profiles WHERE id = p_user_id) IS DISTINCT FROM v_today THEN
      -- Gap of more than 1 day, reset to 1
      UPDATE profiles SET current_streak = 1, last_active_date = v_today WHERE id = p_user_id;
    END IF;
  ELSE
    -- No habits today; if we just deleted the last one, check if streak should remain from yesterday
    IF (SELECT last_active_date FROM profiles WHERE id = p_user_id) = v_today THEN
      -- Removed all today's habits, revert
      IF v_has_yesterday THEN
        UPDATE profiles SET current_streak = GREATEST(v_current_streak - 1, 0), last_active_date = v_yesterday WHERE id = p_user_id;
      ELSE
        UPDATE profiles SET current_streak = 0, last_active_date = NULL WHERE id = p_user_id;
      END IF;
    END IF;
  END IF;
END;
$$;

-- 2. Check and award achievements function
CREATE OR REPLACE FUNCTION public.check_achievements(p_user_id uuid)
RETURNS TABLE(achievement_name text, achievement_description text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_points integer;
  v_current_streak integer;
  v_total_habits_done bigint;
  rec RECORD;
BEGIN
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
$$;