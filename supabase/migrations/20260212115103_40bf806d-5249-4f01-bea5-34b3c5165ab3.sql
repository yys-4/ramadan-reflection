
-- A. Daily quotes table
CREATE TABLE public.daily_quotes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_text text NOT NULL,
  author text,
  active_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view daily quotes" ON public.daily_quotes FOR SELECT USING (true);
CREATE UNIQUE INDEX idx_daily_quotes_active_date ON public.daily_quotes (active_date);

-- B. is_secret column on achievements
ALTER TABLE public.achievements ADD COLUMN is_secret boolean NOT NULL DEFAULT false;

-- C. Daily moods table
CREATE TABLE public.daily_moods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  mood text NOT NULL CHECK (mood IN ('Happy', 'Tired', 'Blessed')),
  mood_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, mood_date)
);
ALTER TABLE public.daily_moods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own moods" ON public.daily_moods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own moods" ON public.daily_moods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own moods" ON public.daily_moods FOR UPDATE USING (auth.uid() = user_id);

-- Seed some daily quotes for the current Ramadan period
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
