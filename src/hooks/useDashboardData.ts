import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
      return {
        habits: habitsRes.data,
        completedLogs: logsRes.data,
      };
    },
    enabled: !!user,
  });
}

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
