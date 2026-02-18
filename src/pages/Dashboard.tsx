import { useCallback, useEffect, useRef } from "react";
import { useProfile, useTodayHabits, useRecentAchievements } from "@/hooks/useDashboardData";
import { useQueryClient } from "@tanstack/react-query";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useConfetti } from "@/hooks/useConfetti";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Star, Trophy, BookOpen, Heart, Sun, Download, Loader2 } from "lucide-react";
import { DailyQuoteCard } from "@/components/dashboard/DailyQuoteCard";
import { RamadanCountdown } from "@/components/dashboard/RamadanCountdown";
import { MoodCheck } from "@/components/dashboard/MoodCheck";
import { ShareProgressButton } from "@/components/ShareProgressCard";

// Rotating motivational messages — one per day, deterministic based on day-of-month.
// Using modulo ensures the same message shows all day (no random flicker on re-render)
// but cycles across the month, giving a fresh feel without needing a database query.
const motivationalMessages = [
  "Every good deed is rewarded tenfold in Ramadan 🌙",
  "The best among you are those who learn the Quran and teach it ✨",
  "Ramadan is the month of patience and reward 🤲",
  "Small consistent deeds are beloved to Allah ❤️",
  "Make the most of these blessed nights 🌟",
];

function GreetingCard({ name }: { name: string }) {
  const today = new Date();
  const message = motivationalMessages[today.getDate() % motivationalMessages.length];
  return (
    <Card className="col-span-full lg:col-span-2 bg-gradient-to-br from-primary/5 via-card to-accent/5 border-0 shadow-lg">
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        <h1 className="mt-1 text-2xl font-bold">Assalamualaikum, {name || "Friend"} 👋</h1>
        <p className="mt-2 text-sm text-muted-foreground italic">{message}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Circular progress ring using SVG stroke-dasharray technique.
 * The ring radius is 45 (in a 100×100 viewBox), giving a circumference of ~283.
 * We offset the dash to reveal only the completed portion, animated via CSS transition.
 */
function ProgressCard({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Today's Progress</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-6">
        <div className="relative h-32 w-32">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="animate-progress-fill transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold">{pct}%</span>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{completed}/{total} habits done</p>
      </CardContent>
    </Card>
  );
}

function PointsCard({ points, todayPoints }: { points: number; todayPoints: number }) {
  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="flex flex-col items-center justify-center p-6">
        <Star className="h-8 w-8 text-accent animate-pulse-glow" />
        <span className="mt-2 text-4xl font-bold animate-shimmer bg-clip-text">{points}</span>
        <p className="text-sm font-medium text-muted-foreground">Lifetime Points</p>
        {todayPoints > 0 && <p className="text-xs text-primary font-medium">+{todayPoints} today</p>}
      </CardContent>
    </Card>
  );
}

function StreakCard({ streak }: { streak: number }) {
  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="flex flex-col items-center justify-center p-6">
        <Flame className={`h-8 w-8 ${streak > 0 ? "text-orange-500 animate-pulse-glow" : "text-muted-foreground"}`} />
        <span className="mt-2 text-4xl font-bold">{streak}</span>
        <p className="text-sm font-medium text-muted-foreground">Day Streak</p>
        <p className="text-xs text-muted-foreground">{streak > 0 ? "Keep it going! 🔥" : "Start today!"}</p>
      </CardContent>
    </Card>
  );
}

function CategoryCard({ habits, completedIds }: { habits: any[]; completedIds: Set<string> }) {
  const categories: Record<string, { total: number; done: number }> = habits.reduce((acc: Record<string, { total: number; done: number }>, h: any) => {
    const cat = h.category || "Other";
    if (!acc[cat]) acc[cat] = { total: 0, done: 0 };
    acc[cat].total++;
    if (completedIds.has(h.id)) acc[cat].done++;
    return acc;
  }, {});
  const catColors: Record<string, string> = { Prayers: "bg-primary", Quran: "bg-accent", Zikr: "bg-primary/60", Sunnah: "bg-accent/60" };
  const catIcons: Record<string, React.ReactNode> = {
    Prayers: <Sun className="h-3.5 w-3.5" />, Quran: <BookOpen className="h-3.5 w-3.5" />,
    Zikr: <Heart className="h-3.5 w-3.5" />, Sunnah: <Star className="h-3.5 w-3.5" />,
  };
  return (
    <Card className="border-0 shadow-lg col-span-1 md:col-span-2 lg:col-span-2">
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle></CardHeader>
      <CardContent className="space-y-3 pb-6">
        {Object.entries(categories).map(([cat, val]) => {
          const { total, done } = val as { total: number; done: number };
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <div key={cat} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">{catIcons[cat]} {cat}</span>
                <span className="font-medium">{pct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className={`h-full rounded-full transition-all duration-700 ${catColors[cat] || "bg-primary"}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function AchievementsCard({ achievements }: { achievements: any[] }) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Recent Achievements</CardTitle></CardHeader>
      <CardContent className="pb-6">
        {achievements.length === 0 ? (
          <div className="flex flex-col items-center py-4 text-center">
            <Trophy className="h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">Complete habits to earn badges!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {achievements.map((ua: any) => (
              <div key={ua.id} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                  {ua.achievements?.badge_url ? <img src={ua.achievements.badge_url} alt="" className="h-6 w-6 object-contain" /> : <Trophy className="h-4 w-4 text-accent" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{ua.achievements?.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(ua.earned_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader that mirrors the exact Bento Grid layout of the real dashboard.
 * Matching the skeleton shape to the actual content prevents layout shift (CLS)
 * when data loads in, which is critical for perceived performance on mobile.
 */
function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Skeleton className="col-span-full lg:col-span-2 h-32 rounded-xl" />
      <Skeleton className="h-56 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="col-span-full h-24 rounded-xl" />
      <Skeleton className="col-span-full lg:col-span-2 h-48 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

/**
 * Main dashboard — Bento Grid layout that adapts from 1 column (mobile)
 * to 3 columns (desktop). The grid structure is intentionally not extracted
 * into a separate layout component because the column span assignments are
 * tightly coupled to each card's content width requirements.
 */
export default function Dashboard() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: todayData, isLoading: habitsLoading } = useTodayHabits();
  const { data: achievements = [], isLoading: achievementsLoading } = useRecentAchievements();
  const { canInstall, install } = usePWAInstall();
  const { checkMilestone, fireConfetti } = useConfetti();
  const queryClient = useQueryClient();
  // Track previous points to detect milestone crossings (not just absolute values)
  const prevPoints = useRef<number>(0);

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries();
    await new Promise((r) => setTimeout(r, 600));
  }, [queryClient]);

  const { containerRef, isRefreshing, pullDistance, threshold } = usePullToRefresh(handleRefresh);

  // Fire confetti when the user crosses a 100-point milestone.
  // The `prevPoints > 0` guard skips the initial load — we only celebrate
  // transitions, not the first render (which would confetti on every page load).
  useEffect(() => {
    const pts = profile?.total_points || 0;
    if (prevPoints.current > 0) {
      checkMilestone(pts);
    }
    prevPoints.current = pts;
  }, [profile?.total_points, checkMilestone]);

  if (profileLoading || habitsLoading || achievementsLoading) {
    return <div className="mx-auto max-w-5xl p-4 pt-6"><DashboardSkeleton /></div>;
  }

  const habits = todayData?.habits || [];
  const completedLogs = todayData?.completedLogs || [];
  const completedIds = new Set(completedLogs.map((l) => l.habit_id));
  const todayPoints = completedLogs.reduce((sum, log) => {
    const habit = habits.find((h) => h.id === log.habit_id);
    return sum + (habit?.point_value || 0);
  }, 0);

  const topHabits = completedLogs
    .map((l) => habits.find((h) => h.id === l.habit_id)?.name)
    .filter(Boolean) as string[];

  return (
    <div ref={containerRef} className="mx-auto max-w-5xl p-4 pt-6">
      {/* Pull-to-refresh indicator */}
      <div className="flex items-center justify-center overflow-hidden transition-all duration-200" style={{ height: pullDistance > 0 ? `${pullDistance}px` : 0 }}>
        <Loader2 className={`h-6 w-6 text-primary transition-transform duration-200 ${isRefreshing ? "animate-spin" : ""}`} style={{ transform: `rotate(${(pullDistance / threshold) * 360}deg)` }} />
      </div>

      {/* Install Banner */}
      {canInstall && (
        <Card className="mb-4 border-0 bg-gradient-to-r from-primary/10 to-accent/10 shadow-lg animate-fade-in">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Install Ramadan Reflection</p>
                <p className="text-xs text-muted-foreground">Add to home screen for the best experience</p>
              </div>
            </div>
            <Button size="sm" onClick={install}>Install</Button>
          </CardContent>
        </Card>
      )}

      {/* Share button row */}
      <div className="flex justify-end mb-2">
        <ShareProgressButton
          name={profile?.full_name || ""}
          todayPoints={todayPoints}
          totalPoints={profile?.total_points || 0}
          streak={profile?.current_streak || 0}
          completed={completedLogs.length}
          total={habits.length}
          topHabits={topHabits}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <GreetingCard name={profile?.full_name || ""} />
        <ProgressCard completed={completedLogs.length} total={habits.length} />
        <PointsCard points={profile?.total_points || 0} todayPoints={todayPoints} />
        <StreakCard streak={profile?.current_streak || 0} />

        {/* Daily Quote */}
        <DailyQuoteCard />

        {/* Ramadan Countdown & Mood */}
        <RamadanCountdown />
        <MoodCheck />

        <CategoryCard habits={habits} completedIds={completedIds} />
        <AchievementsCard achievements={achievements || []} />
      </div>
    </div>
  );
}
