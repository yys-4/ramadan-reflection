import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Fetches the current user's profile (points, streak, name).
 *
 * Uses `user.id` as a cache key segment so React Query automatically
 * invalidates stale data when the user signs out and another user signs in
 * on the same device — critical for shared-device scenarios during family
 * Ramadan gatherings.
 */
export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

/**
 * Fetches today's habits and the user's completion logs for the current date.
 *
 * Both queries fire in parallel via `Promise.all` to minimize Supabase round-trips —
 * the habit master list and today's logs are independent datasets that can be fetched
 * concurrently, cutting perceived load time in half on slow connections.
 *
 * The date-based cache key ensures the query automatically refreshes after midnight
 * without requiring a manual invalidation, so the checklist always reflects the
 * current day's progress.
 */
export function useTodayHabits() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["todayHabits", user?.id, today],
    queryFn: async () => {
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from("habits").select("*"),
        supabase
          .from("habit_logs")
          .select("*")
          .eq("user_id", user!.id)
          .eq("completed_at", today)
          .eq("status", true),
      ]);
      if (habitsRes.error) throw habitsRes.error;
      if (logsRes.error) throw logsRes.error;
      // Filter out "Sunnah Fasting" as requested (replaced by "Fasting" for Ramadan)
      // We hide it in the UI but keep the data in DB for future use (Syawal etc).
      const visibleHabits = habitsRes.data.filter((h: any) => h.name !== "Sunnah Fasting");

      return {
        habits: visibleHabits,
        completedLogs: logsRes.data,
      };
    },
    enabled: !!user,
  });
}

/**
 * Fetches the 3 most recent achievements earned by the current user.
 *
 * Uses a join (`achievements(*)`) to avoid a separate query for badge metadata.
 * Limited to 3 results because this feeds the compact dashboard card, not the
 * full achievements page.
 */
export function useRecentAchievements() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["recentAchievements", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("*, achievements(*)")
        .eq("user_id", user!.id)
        .order("earned_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
