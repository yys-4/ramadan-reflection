import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDailyQuote() {
  const today = new Date().toISOString().split("T")[0];
  return useQuery({
    queryKey: ["dailyQuote", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_quotes")
        .select("*")
        .eq("active_date", today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
