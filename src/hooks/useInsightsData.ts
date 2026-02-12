import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useWeeklyData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["weeklyData", user?.id],
    queryFn: async () => {
      const dates: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split("T")[0]);
      }

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

      // Daily completion data
      const dailyData = dates.map((date) => {
        const dayLogs = logs.filter((l) => l.completed_at === date);
        const completed = dayLogs.length;
        const dayName = new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
        return { date, dayName, completed, total: totalHabits, pct: totalHabits > 0 ? Math.round((completed / totalHabits) * 100) : 0 };
      });

      // Category breakdown — weighted by point_value
      const categories: Record<string, { maxPoints: number; earnedPoints: number }> = {};
      habits.forEach((h) => {
        const cat = h.category || "Other";
        if (!categories[cat]) categories[cat] = { maxPoints: 0, earnedPoints: 0 };
        categories[cat].maxPoints += (h.point_value || 10) * 7; // 7 days × point_value
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

      // Total points earned this week
      const weeklyPoints = logs.reduce((sum, l) => {
        const habit = habits.find((h) => h.id === l.habit_id);
        return sum + (habit?.point_value || 10);
      }, 0);

      // Best day
      const bestDay = dailyData.reduce((best, d) => (d.completed > best.completed ? d : best), dailyData[0]);

      return { dailyData, categoryData, weeklyPoints, bestDay, totalLogs: logs.length };
    },
    enabled: !!user,
  });
}
