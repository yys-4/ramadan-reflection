import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTodayHabits, useProfile } from "@/hooks/useDashboardData";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useConfetti } from "@/hooks/useConfetti";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Sun, Moon, Clock, Sparkles, Trophy, WifiOff } from "lucide-react";
import { ShareProgressButton } from "@/components/ShareProgressCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Sort morning habits in the logical Islamic prayer sequence (Fajr → Dhuhr).
const morningOrder = ["Fajr Prayer", "Dhuhr Prayer"];

// Sort evening habits in the logical Islamic prayer sequence (Asr → Maghrib → Isha → Taraweeh).
// Without this, habits would appear in database insertion order, which is confusing for users
// who expect prayers listed chronologically as they occur during the day.
const eveningOrder = ["Asr Prayer", "Maghrib Prayer", "Isha Prayer", "Taraweeh Prayer"];

const timeGroups = [
  { key: "Morning", label: "Morning", icon: <Sun className="h-4 w-4" />, gradient: "from-primary/10 to-primary/5" },
  { key: "Evening", label: "Evening", icon: <Moon className="h-4 w-4" />, gradient: "from-accent/10 to-accent/5" },
  { key: "All Day", label: "All Day", icon: <Clock className="h-4 w-4" />, gradient: "from-primary/5 to-accent/5" },
];

interface UnlockedBadge {
  achievement_name: string;
  achievement_description: string;
}

export default function ChecklistPage() {
  const { user } = useAuth();
  const { data: todayData, isLoading } = useTodayHabits();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { enqueue } = useOfflineSync();
  const { checkMilestone, fireConfetti } = useConfetti();
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [confettiHabit, setConfettiHabit] = useState<string | null>(null);
  const [unlockedBadge, setUnlockedBadge] = useState<UnlockedBadge | null>(null);
  const today = new Date().toISOString().split("T")[0];
  const prevPoints = useRef<number>(0);

  // Point milestone confetti — triggers celebration when crossing 100-point boundaries.
  // See useConfetti.ts for the floor-division detection logic.
  useEffect(() => {
    const pts = profile?.total_points || 0;
    if (prevPoints.current > 0) checkMilestone(pts);
    prevPoints.current = pts;
  }, [profile?.total_points, checkMilestone]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4 pt-6">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  const habits = todayData?.habits || [];
  const completedLogs = todayData?.completedLogs || [];
  const completedMap = new Map(completedLogs.map((l) => [l.habit_id, l]));
  const totalDone = completedLogs.length;
  const totalHabits = habits.length;

  // Points bar: earned today vs max possible today
  const todayPoints = completedLogs.reduce((sum, log) => {
    const habit = habits.find((h: any) => h.id === log.habit_id);
    return sum + (habit?.point_value || 10);
  }, 0);
  const maxPoints = habits.reduce((sum: number, h: any) => sum + (h.point_value || 10), 0);

  // Group by time of day — habits whose category doesn't match a known group
  // are placed in "All Day" to prevent silent dropping of data.
  const grouped: Record<string, any[]> = { Morning: [], Evening: [], "All Day": [] };
  habits.forEach((h: any) => {
    const category = h.category || "All Day";
    if (grouped[category]) {
      grouped[category].push(h);
    } else {
      grouped["All Day"].push(h);
    }
  });
  // Sort morning habits in logical prayer order (Fajr → Dhuhr)
  grouped["Morning"].sort((a: any, b: any) => {
    const ai = morningOrder.indexOf(a.name);
    const bi = morningOrder.indexOf(b.name);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
  // Sort evening habits in logical prayer order
  grouped["Evening"].sort((a: any, b: any) => {
    const ai = eveningOrder.indexOf(a.name);
    const bi = eveningOrder.indexOf(b.name);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  /**
   * Toggles a habit between completed/uncompleted with optimistic updates.
   *
   * Performance rationale: Optimistic UI updates are applied BEFORE the network
   * request, maintaining 60fps responsiveness even on poor mosque WiFi where
   * Supabase round-trips can take 2-5 seconds. If the server call fails, we
   * roll back by invalidating the cache to re-fetch the true state.
   *
   * Mutation flow:
   * 1. Optimistically update the React Query cache (instant UI feedback)
   * 2. If offline → enqueue to localStorage for later sync
   * 3. If online → mutate Supabase (insert/delete log, update points/streak)
   * 4. After success → check for newly unlocked achievements
   * 5. Invalidate all related queries to sync derived state
   */
  const toggleHabit = async (habitId: string, currentlyDone: boolean) => {
    if (!user) return;
    const habit = habits.find((h: any) => h.id === habitId);
    const points = habit?.point_value || 10;

    // Guard: prevent the edge case where unchecking would cause negative total points.
    // This can happen if points were adjusted server-side (e.g., admin correction)
    // after the optimistic cache was already set.
    if (currentlyDone && (profile?.total_points || 0) - points < 0) {
      toast({ title: "Cannot undo", description: "This would result in negative points.", variant: "destructive" });
      return;
    }

    setToggling((prev) => new Set(prev).add(habitId));

    // Optimistic cache update for habit logs — toggling the checkbox state
    // instantly without waiting for the network response.
    queryClient.setQueryData(["todayHabits", user.id, today], (old: any) => {
      if (!old) return old;
      const newLogs = currentlyDone
        ? old.completedLogs.filter((l: any) => l.habit_id !== habitId)
        : [...old.completedLogs, { habit_id: habitId, user_id: user.id, completed_at: today, status: true }];
      return { ...old, completedLogs: newLogs };
    });

    // Optimistic cache update for profile points — mirrors what the server will
    // do via `increment_points` RPC, keeping the points counter responsive.
    queryClient.setQueryData(["profile", user.id], (old: any) => {
      if (!old) return old;
      return { ...old, total_points: (old.total_points || 0) + (currentlyDone ? -points : points) };
    });

    // Show toast for completion
    if (!currentlyDone && habit) {
      const isHighValue = points >= 30;
      if (isHighValue) {
        setConfettiHabit(habitId);
        fireConfetti();
        setTimeout(() => setConfettiHabit(null), 1500);
      }
      toast({
        title: isHighValue ? `🎉 +${points} points! MashaAllah!` : `+${points} points! ✨`,
        description: `${habit.name} completed`,
      });
    }

    // Offline-first: if no network, persist the action to localStorage and bail.
    // The useOfflineSync hook will replay these mutations when connectivity returns.
    // This is critical for users checking habits during Taraweeh prayer in mosques
    // with unreliable WiFi.
    if (!navigator.onLine) {
      enqueue({
        id: `${habitId}-${Date.now()}`,
        type: currentlyDone ? "uncomplete" : "complete",
        habitId,
        userId: user.id,
        date: today,
        points,
        timestamp: Date.now(),
      });
      toast({ title: "Saved offline", description: "Will sync when back online", });
      setToggling((prev) => { const next = new Set(prev); next.delete(habitId); return next; });
      return;
    }

    try {
      if (currentlyDone) {
        // UNCHECK path: remove the log and subtract points. No achievement check
        // needed here because unchecking can only reduce stats, never unlock new badges.
        const { error } = await supabase
          .from("habit_logs")
          .delete()
          .eq("user_id", user.id)
          .eq("habit_id", habitId)
          .eq("completed_at", today);
        if (error) throw error;
        await supabase.rpc("increment_points", { user_row_id: user.id, amount: -points } as any);
        await supabase.rpc("update_streak", { p_user_id: user.id } as any);
      } else {
        // CHECK path: insert log, add points, update streak, then check achievements.
        // Achievement check is deliberately the LAST step because it reads the
        // updated points/streak from the profile table — calling it before
        // increment_points would read stale values and miss newly earned badges.
        const { error } = await supabase.from("habit_logs").insert({
          user_id: user.id,
          habit_id: habitId,
          completed_at: today,
          status: true,
        });
        if (error) throw error;
        await supabase.rpc("increment_points", { user_row_id: user.id, amount: points } as any);
        await supabase.rpc("update_streak", { p_user_id: user.id } as any);

        // Server-side achievement check — runs AFTER points and streak are updated
        // so the SECURITY DEFINER function reads the correct current values.
        const { data: newBadges } = await supabase.rpc("check_achievements", { p_user_id: user.id } as any);
        if (newBadges && (newBadges as UnlockedBadge[]).length > 0) {
          setUnlockedBadge((newBadges as UnlockedBadge[])[0]);
          fireConfetti();
        }
      }

      queryClient.invalidateQueries({ queryKey: ["todayHabits"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["weeklyData"] });
      queryClient.invalidateQueries({ queryKey: ["recentAchievements"] });
      queryClient.invalidateQueries({ queryKey: ["allAchievements"] });
    } catch (err: any) {
      // Rollback optimistic update
      queryClient.invalidateQueries({ queryKey: ["todayHabits"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(habitId);
        return next;
      });
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daily Checklist</h1>
          <p className="text-sm text-muted-foreground">
            {totalDone}/{totalHabits} completed today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShareProgressButton
            name=""
            todayPoints={todayPoints}
            totalPoints={profile?.total_points || 0}
            streak={profile?.current_streak || 0}
            completed={totalDone}
            total={totalHabits}
            topHabits={completedLogs.map((l: any) => habits.find((h: any) => h.id === l.habit_id)?.name).filter(Boolean) as string[]}
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <span className="text-lg font-bold text-primary">
              {totalHabits > 0 ? Math.round((totalDone / totalHabits) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Points Bar */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-accent/5 to-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-accent" />
              Daily Points
            </span>
            <span className="text-sm font-bold text-primary">{todayPoints}/{maxPoints}</span>
          </div>
          <Progress
            value={maxPoints > 0 ? (todayPoints / maxPoints) * 100 : 0}
            className="h-3 bg-muted"
          />
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            Total: {profile?.total_points || 0} pts • Streak: {profile?.current_streak || 0} days 🔥
          </p>
        </CardContent>
      </Card>

      {/* Habit progress bar */}
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
          style={{ width: `${totalHabits > 0 ? (totalDone / totalHabits) * 100 : 0}%` }}
        />
      </div>

      {timeGroups.map(({ key, label, icon, gradient }) => {
        const groupHabits = grouped[key] || [];
        if (groupHabits.length === 0) return null;
        const groupDone = groupHabits.filter((h: any) => completedMap.has(h.id)).length;

        return (
          <Card key={key} className={`border-0 shadow-lg bg-gradient-to-br ${gradient} animate-fade-in`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="flex items-center gap-2">
                  {icon}
                  {label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {groupDone}/{groupHabits.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pb-4">
              {groupHabits.map((habit: any, index: number) => {
                const isDone = completedMap.has(habit.id);
                const isLoadingHabit = toggling.has(habit.id);

                return (
                  <button
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id, isDone)}
                    disabled={isLoadingHabit}
                    aria-label={`${isDone ? "Uncheck" : "Complete"} ${habit.name} for ${habit.point_value || 10} points`}
                    aria-pressed={isDone}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-all duration-300 ease-out animate-fade-in hover:bg-card/60"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
                  >
                    <div className={`transition-transform duration-300 ${isDone ? "scale-110" : "scale-100"}`}>
                      <Checkbox checked={isDone} className="pointer-events-none transition-colors duration-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium transition-all duration-300 ${isDone ? "line-through text-muted-foreground" : ""
                          }`}
                      >
                        {habit.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{habit.category}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {confettiHabit === habit.id && (
                        <Sparkles className="h-4 w-4 text-accent animate-scale-in" />
                      )}
                      <span
                        className={`text-xs font-medium transition-all duration-300 ${isDone ? "text-primary" : "text-muted-foreground"
                          }`}
                      >
                        +{habit.point_value || 10}
                      </span>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Badge Unlocked Dialog */}
      <Dialog open={!!unlockedBadge} onOpenChange={() => setUnlockedBadge(null)}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader className="items-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 animate-scale-in">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
            <DialogTitle className="mt-4 text-xl">🎉 Badge Unlocked!</DialogTitle>
            <DialogDescription className="space-y-1">
              <p className="text-base font-semibold text-foreground">{unlockedBadge?.achievement_name}</p>
              <p className="text-sm text-muted-foreground">{unlockedBadge?.achievement_description}</p>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
