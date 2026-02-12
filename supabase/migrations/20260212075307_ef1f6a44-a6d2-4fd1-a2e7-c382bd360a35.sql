
-- Profiles table
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

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

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

-- Habits master table
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

CREATE POLICY "Everyone can view habits"
  ON public.habits FOR SELECT
  USING (true);

-- Daily tracking logs
CREATE TABLE public.habit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  completed_at DATE DEFAULT CURRENT_DATE,
  status BOOLEAN DEFAULT false,
  notes TEXT,
  UNIQUE(user_id, habit_id, completed_at)
);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own logs"
  ON public.habit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs"
  ON public.habit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logs"
  ON public.habit_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own logs"
  ON public.habit_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Achievement system
CREATE TABLE public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  badge_url TEXT,
  requirement_type TEXT,
  requirement_value INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view achievements"
  ON public.achievements FOR SELECT
  USING (true);

-- User earned achievements
CREATE TABLE public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Seed default Ramadan habits
INSERT INTO public.habits (name, category, point_value, icon_name, is_default) VALUES
  ('Fajr Prayer', 'Prayers', 15, 'Sun', true),
  ('Dhuhr Prayer', 'Prayers', 10, 'Sun', true),
  ('Asr Prayer', 'Prayers', 10, 'Sun', true),
  ('Maghrib Prayer', 'Prayers', 10, 'Sun', true),
  ('Isha Prayer', 'Prayers', 10, 'Sun', true),
  ('Taraweeh', 'Prayers', 20, 'Moon', true),
  ('Quran Reading', 'Quran', 15, 'BookOpen', true),
  ('Morning Adhkar', 'Zikr', 10, 'Heart', true),
  ('Evening Adhkar', 'Zikr', 10, 'Heart', true),
  ('Sunnah Fasting', 'Sunnah', 20, 'Utensils', true),
  ('Charity/Sadaqah', 'Sunnah', 15, 'HandHeart', true),
  ('Dua Before Iftar', 'Sunnah', 5, 'Star', true);
