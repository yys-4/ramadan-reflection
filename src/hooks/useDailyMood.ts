import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type MoodType = "Happy" | "Tired" | "Blessed";

/**
 * Manages the daily mood check-in feature.
 *
 * Each user can log one mood per day (constrained by a UNIQUE index on
 * `user_id, mood_date`). The upsert pattern means tapping a different mood
 * button simply overwrites the existing entry rather than failing — this lets
 * users change their mind without friction, which is important because mood
 * can shift between Sahur and Iftar.
 */
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
      // Upsert: INSERT if no row exists for today, UPDATE if one does.
      // Avoids the need for a separate "check then insert" pattern.
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
