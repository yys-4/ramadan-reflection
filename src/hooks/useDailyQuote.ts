import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches the daily spiritual quote based on the current date.
 *
 * Quotes are pre-seeded into the `daily_quotes` table with an `active_date`
 * column, giving full editorial control over which quote appears on which day
 * of Ramadan. This avoids random selection, which could surface an irrelevant
 * quote (e.g., a Laylatul Qadr quote on day 2).
 *
 * Note: this query does NOT require auth (`enabled` defaults to true) because
 * the `daily_quotes` table has a public SELECT policy — quotes are not
 * user-specific data.
 */
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
