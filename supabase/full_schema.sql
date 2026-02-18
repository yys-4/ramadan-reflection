-- ============================================================
-- Ramadan Reflection — Full Database Schema
-- Run this ENTIRE script in Supabase SQL Editor on a NEW project
-- ============================================================

-- ========================
-- 1. TABLES
-- ========================

-- Profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Habits
CREATE TABLE public.habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  point_value INTEGER DEFAULT 10,
  icon_name TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view habits" ON public.habits FOR SELECT USING (true);

-- Habit Logs
CREATE TABLE public.habit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES public.habits(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  status BOOLEAN DEFAULT false,
  notes TEXT,
  completed_at DATE DEFAULT CURRENT_DATE
);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own logs" ON public.habit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs" ON public.habit_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own logs" ON public.habit_logs FOR DELETE USING (auth.uid() = user_id);

-- Achievements
CREATE TABLE public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  badge_url TEXT,
  requirement_type TEXT,
  requirement_value INTEGER,
  is_secret BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view achievements" ON public.achievements FOR SELECT USING (true);

-- User Achievements
CREATE TABLE public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  achievement_id UUID NOT NULL REFERENCES public.achievements(id),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily Quotes
CREATE TABLE public.daily_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_text TEXT NOT NULL,
  author TEXT,
  active_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view daily quotes" ON public.daily_quotes FOR SELECT USING (true);
CREATE UNIQUE INDEX idx_daily_quotes_active_date ON public.daily_quotes (active_date);

-- Daily Moods
CREATE TABLE public.daily_moods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mood TEXT NOT NULL CHECK (mood IN ('Happy', 'Tired', 'Blessed')),
  mood_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, mood_date)
);

ALTER TABLE public.daily_moods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own moods" ON public.daily_moods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own moods" ON public.daily_moods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own moods" ON public.daily_moods FOR UPDATE USING (auth.uid() = user_id);


-- ========================
-- 2. RPC FUNCTIONS
-- ========================

-- increment_points (with auth check & floor at 0)
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

-- update_streak (with auth check)
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

-- check_achievements (with auth check, uses DISTINCT days)
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
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access other users data';
  END IF;

  SELECT COALESCE(total_points, 0), COALESCE(current_streak, 0)
  INTO v_total_points, v_current_streak
  FROM profiles WHERE id = p_user_id;

  SELECT COUNT(DISTINCT completed_at) INTO v_total_habit_days
  FROM habit_logs WHERE user_id = p_user_id AND status = true;

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


-- ========================
-- 3. SEED DATA
-- ========================

-- Default habits (adjust category to Morning/Evening/All Day as needed)
INSERT INTO public.habits (name, category, point_value, icon_name, is_default) VALUES
  ('Fajr Prayer', 'Morning', 15, 'Sun', true),
  ('Dhuhr Prayer', 'Morning', 15, 'Sun', true),
  ('Asr Prayer', 'Evening', 10, 'Sun', true),
  ('Maghrib Prayer', 'Evening', 10, 'Sun', true),
  ('Isha Prayer', 'Evening', 10, 'Sun', true),
  ('Taraweeh Prayer', 'Evening', 20, 'Moon', true),
  ('Tahajjud Prayer', 'Morning', 30, 'Moon', true),
  ('Quran Reading', 'All Day', 15, 'BookOpen', true),
  ('Tilawah Quran (1 Juz)', 'All Day', 50, 'BookOpen', true),
  ('Morning Adhkar', 'Morning', 10, 'Heart', true),
  ('Evening Adhkar', 'Evening', 10, 'Heart', true),
  ('Sunnah Fasting', 'All Day', 20, 'Utensils', true),
  ('Charity / Sadaqah', 'All Day', 20, 'HandHeart', true),
  ('Dua Before Iftar', 'Evening', 5, 'Star', true),
  ('Reading Hadith', 'All Day', 10, 'BookOpen', true);

-- Daily quotes for Ramadan 1447H (Feb 17 – Mar 18, 2026)
INSERT INTO public.daily_quotes (quote_text, author, active_date) VALUES
('Whoever fasts during Ramadan with faith and seeking reward, all past sins will be forgiven.', 'Prophet Muhammad ﷺ (Bukhari)', '2026-02-17'),
('The best of you are those who learn the Quran and teach it.', 'Prophet Muhammad ﷺ (Bukhari)', '2026-02-18'),
('When Ramadan begins, the gates of Paradise are opened.', 'Prophet Muhammad ﷺ (Bukhari & Muslim)', '2026-02-19'),
('Fasting is a shield; so when one of you is fasting, let him not be obscene or quarrelsome.', 'Prophet Muhammad ﷺ (Bukhari)', '2026-02-20'),
('Every act of goodness is charity.', 'Prophet Muhammad ﷺ (Bukhari & Muslim)', '2026-02-21'),
('The supplication of a fasting person is never rejected.', 'Prophet Muhammad ﷺ (Ibn Majah)', '2026-02-22'),
('Whoever stands in prayer during Laylatul Qadr with faith, his past sins will be forgiven.', 'Prophet Muhammad ﷺ (Bukhari & Muslim)', '2026-02-23'),
('Allah said: Fasting is for Me, and I shall reward it.', 'Hadith Qudsi (Bukhari)', '2026-02-24'),
('The month of Ramadan is the one in which the Quran was revealed as guidance for humanity.', 'Quran 2:185', '2026-02-25'),
('Be patient, for patience is beautiful.', 'Quran 12:18', '2026-02-26'),
('And He found you lost and guided you.', 'Quran 93:7', '2026-02-27'),
('Verily, with hardship comes ease.', 'Quran 94:6', '2026-02-28'),
('So remember Me; I will remember you.', 'Quran 2:152', '2026-03-01'),
('And whoever puts their trust in Allah, He will be enough for them.', 'Quran 65:3', '2026-03-02'),
('My mercy encompasses all things.', 'Quran 7:156', '2026-03-03'),
('Do not lose hope in the mercy of Allah.', 'Quran 39:53', '2026-03-04'),
('Allah does not burden a soul beyond that it can bear.', 'Quran 2:286', '2026-03-05'),
('The best among you are those who are best to their families.', 'Prophet Muhammad ﷺ (Tirmidhi)', '2026-03-06'),
('Speak good or remain silent.', 'Prophet Muhammad ﷺ (Bukhari & Muslim)', '2026-03-07'),
('Indeed, the patient will be given their reward without account.', 'Quran 39:10', '2026-03-08'),
('And We have certainly made the Quran easy to remember.', 'Quran 54:17', '2026-03-09'),
('Give charity without delay, for it stands in the way of calamity.', 'Prophet Muhammad ﷺ (Tirmidhi)', '2026-03-10'),
('The most beloved deeds to Allah are those done consistently, even if small.', 'Prophet Muhammad ﷺ (Bukhari)', '2026-03-11'),
('Whoever guides someone to goodness will have a reward like the one who did it.', 'Prophet Muhammad ﷺ (Muslim)', '2026-03-12'),
('Make things easy and do not make them difficult.', 'Prophet Muhammad ﷺ (Bukhari)', '2026-03-13'),
('Kindness is a mark of faith; whoever is not kind has no faith.', 'Prophet Muhammad ﷺ (Muslim)', '2026-03-14'),
('Seek Laylatul Qadr in the odd nights of the last ten days.', 'Prophet Muhammad ﷺ (Bukhari)', '2026-03-15'),
('The night of Al-Qadr is better than a thousand months.', 'Quran 97:3', '2026-03-16'),
('O Allah, You are forgiving and love forgiveness, so forgive me.', 'Prophet Muhammad ﷺ (Tirmidhi)', '2026-03-17'),
('And whoever does an atoms weight of good will see it.', 'Quran 99:7', '2026-03-18');
