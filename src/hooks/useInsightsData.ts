import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Aggregates the past 7 days of habit completion data for the Insights page.
 *
 * This hook performs all data transformation client-side rather than using
 * Supabase SQL views for two reasons:
 *   1. The habit master table is small (~12 rows) and the log volume for 7 days
 *      is bounded (~84 rows max), so the computation cost is negligible.
 *   2. Client-side aggregation lets us leverage React Query's cache — switching
 *      between pages doesn't re-fetch data, keeping the UX snappy.
 *
 * Category percentages are weighted by `point_value` rather than raw counts.
 * This ensures high-value habits (e.g., Taraweeh at 20pts) contribute
 * proportionally more to the radar chart than low-value ones (e.g., Dua at 5pts),
 * giving a more meaningful reflection of spiritual effort balance.
 */
export function useWeeklyData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["weeklyData", user?.id],
    queryFn: async () => {
      // Build an array of the last 7 day strings (YYYY-MM-DD)
      const dates: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split("T")[0]);
      }

      // Parallel fetch: habits master list + user's logs for the date range
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from("habits").select("id, name, category, point_value"),
        supabase
          .from("habit_logs")
          .select("habit_id, completed_at, status")
          .eq("user_id", user!.id)
          .eq("status", true)
          .gte("completed_at", dates[0])
          .lte("completed_at", dates[6]),
      ]);

      if (habitsRes.error) throw habitsRes.error;
      if (logsRes.error) throw logsRes.error;

      const habits = habitsRes.data;
      const logs = logsRes.data;
      const totalHabits = habits.length;

      // Daily completion data for the bar chart
      const dailyData = dates.map((date) => {
        const dayLogs = logs.filter((l) => l.completed_at === date);
        const completed = dayLogs.length;
        const dayName = new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
        return { date, dayName, completed, total: totalHabits, pct: totalHabits > 0 ? Math.round((completed / totalHabits) * 100) : 0 };
      });

      // Category breakdown — weighted by point_value so the radar chart
      // reflects effort balance, not just checkbox counts.
      // Max possible = point_value × 7 days (assumes daily completion target).
      const categories: Record<string, { maxPoints: number; earnedPoints: number }> = {};
      habits.forEach((h) => {
        const cat = h.category || "Other";
        if (!categories[cat]) categories[cat] = { maxPoints: 0, earnedPoints: 0 };
        categories[cat].maxPoints += (h.point_value || 10) * 7;
      });
      logs.forEach((l) => {
        const habit = habits.find((h) => h.id === l.habit_id);
        const cat = habit?.category || "Other";
        if (categories[cat]) categories[cat].earnedPoints += habit?.point_value || 10;
      });

      const categoryData = Object.entries(categories).map(([name, val]) => ({
        name,
        pct: val.maxPoints > 0 ? Math.round((val.earnedPoints / val.maxPoints) * 100) : 0,
        earned: val.earnedPoints,
        max: val.maxPoints,
      }));

      // Total points earned this week (not lifetime — just the current window)
      const weeklyPoints = logs.reduce((sum, l) => {
        const habit = habits.find((h) => h.id === l.habit_id);
        return sum + (habit?.point_value || 10);
      }, 0);

      // Identify the best day by raw completion count
      const bestDay = dailyData.reduce((best, d) => (d.completed > best.completed ? d : best), dailyData[0]);

      return { dailyData, categoryData, weeklyPoints, bestDay, totalLogs: logs.length };
    },
    enabled: !!user,
  });
}
