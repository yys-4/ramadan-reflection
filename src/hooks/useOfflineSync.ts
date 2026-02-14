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

/**
 * Offline-first sync queue for habit completions.
 *
 * When the user is in a mosque with poor connectivity, habit toggles are saved
 * to localStorage and replayed against Supabase once the device regains a stable
 * connection. This prevents data loss during spotty network conditions common
 * in Ramadan congregational settings (Taraweeh, Qiyaam).
 *
 * Conflict resolution: last-write-wins per (habitId, date) pair. If the user
 * toggles a habit on and then off while offline, only the final state is sent
 * upstream, avoiding redundant or contradictory mutations.
 */
export function useOfflineSync() {
  const syncingRef = useRef(false);

  const enqueue = useCallback((action: PendingAction) => {
    const queue = getQueue();
    // Deduplicate: remove any pending action for the same habit on the same day.
    // This implements last-write-wins — only the user's final intent is synced,
    // which avoids wasting bandwidth on intermediate toggles.
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

    // Security gate: re-validate the auth session before syncing.
    // The user may have been offline long enough for their JWT to expire,
    // or they may have signed out on another device. We avoid sending
    // stale or unauthorized mutations to Supabase by checking first.
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      // Session expired or revoked — keep the queue intact for next attempt.
      // The user will be redirected to login on next page load, and the queue
      // will be replayed after re-authentication.
      return;
    }

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
          // Unique constraint on (user_id, habit_id, completed_at) means a
          // duplicate insert fails gracefully — we skip it rather than crashing.
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
        // Recalculate streak after each action so the server-side state stays
        // consistent, even if multiple days accumulated in the offline queue.
        await supabase.rpc("update_streak", { p_user_id: action.userId } as any);
      } catch {
        // Network failure during sync — keep this action for the next attempt.
        remaining.push(action);
      }
    }

    setQueue(remaining);
    syncingRef.current = false;
  }, []);

  // Listen for the device coming back online and flush queued mutations.
  // Also attempt on mount — the app may have been force-closed while offline
  // and reopened with connectivity restored.
  useEffect(() => {
    const handler = () => processQueue();
    window.addEventListener("online", handler);
    if (navigator.onLine) processQueue();
    return () => window.removeEventListener("online", handler);
  }, [processQueue]);

  return { enqueue, processQueue, hasPending: () => getQueue().length > 0 };
}
