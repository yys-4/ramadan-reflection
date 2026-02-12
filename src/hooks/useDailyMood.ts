import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type MoodType = "Happy" | "Tired" | "Blessed";

export function useDailyMood() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["dailyMood", user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_moods")
        .select("*")
        .eq("user_id", user!.id)
        .eq("mood_date", today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: async (mood: MoodType) => {
      if (!user) throw new Error("Not authenticated");
      // Upsert: insert or update for today
      const { error } = await supabase
        .from("daily_moods")
        .upsert(
          { user_id: user.id, mood, mood_date: today },
          { onConflict: "user_id,mood_date" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyMood"] });
    },
  });

  return { mood: query.data, isLoading: query.isLoading, setMood: mutation.mutate, isSetting: mutation.isPending };
}
