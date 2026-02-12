import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PendingAction {
  id: string;
  type: "complete" | "uncomplete";
  habitId: string;
  userId: string;
  date: string;
  points: number;
  timestamp: number;
}

const STORAGE_KEY = "offline_habit_queue";

function getQueue(): PendingAction[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function setQueue(queue: PendingAction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function useOfflineSync() {
  const syncingRef = useRef(false);

  const enqueue = useCallback((action: PendingAction) => {
    const queue = getQueue();
    // Remove conflicting actions for same habit+date
    const filtered = queue.filter(
      (a) => !(a.habitId === action.habitId && a.date === action.date)
    );
    filtered.push(action);
    setQueue(filtered);
  }, []);

  const processQueue = useCallback(async () => {
    if (syncingRef.current) return;
    const queue = getQueue();
    if (queue.length === 0) return;

    syncingRef.current = true;
    const remaining: PendingAction[] = [];

    for (const action of queue) {
      try {
        if (action.type === "complete") {
          const { error } = await supabase.from("habit_logs").insert({
            user_id: action.userId,
            habit_id: action.habitId,
            completed_at: action.date,
            status: true,
          });
          if (error && !error.message.includes("duplicate")) throw error;
          await supabase.rpc("increment_points", { user_row_id: action.userId, amount: action.points } as any);
        } else {
          const { error } = await supabase
            .from("habit_logs")
            .delete()
            .eq("user_id", action.userId)
            .eq("habit_id", action.habitId)
            .eq("completed_at", action.date);
          if (error) throw error;
          await supabase.rpc("increment_points", { user_row_id: action.userId, amount: -action.points } as any);
        }
        await supabase.rpc("update_streak", { p_user_id: action.userId } as any);
      } catch {
        remaining.push(action);
      }
    }

    setQueue(remaining);
    syncingRef.current = false;
  }, []);

  // Sync when coming back online
  useEffect(() => {
    const handler = () => processQueue();
    window.addEventListener("online", handler);
    // Also try on mount
    if (navigator.onLine) processQueue();
    return () => window.removeEventListener("online", handler);
  }, [processQueue]);

  return { enqueue, processQueue, hasPending: () => getQueue().length > 0 };
}
