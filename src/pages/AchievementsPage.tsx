import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useDashboardData";
import { useConfetti } from "@/hooks/useConfetti";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Lock } from "lucide-react";

function useAllAchievements() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["allAchievements", user?.id],
    queryFn: async () => {
      const [achRes, userAchRes] = await Promise.all([
        supabase.from("achievements").select("*").order("requirement_value", { ascending: true }),
        supabase.from("user_achievements").select("*").eq("user_id", user!.id),
      ]);
      if (achRes.error) throw achRes.error;
      if (userAchRes.error) throw userAchRes.error;

      const earnedMap = new Map(userAchRes.data.map((ua) => [ua.achievement_id, ua]));
      // Deduplicate by name (keep first occurrence)
      const seen = new Set<string>();
      return achRes.data
        .map((a: any) => ({
          ...a,
          earned: earnedMap.has(a.id),
          earnedAt: earnedMap.get(a.id)?.earned_at,
        }))
        .filter((a: any) => {
          if (seen.has(a.name)) return false;
          seen.add(a.name);
          return true;
        });
    },
    enabled: !!user,
  });
}

export default function AchievementsPage() {
  const { data: achievements, isLoading } = useAllAchievements();
  const { data: profile } = useProfile();
  const { fireConfetti } = useConfetti();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 pt-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!achievements) return null;

  // Filter: hide secret badges that aren't earned
  const visible = achievements.filter((a: any) => !a.is_secret || a.earned);
  const earned = visible.filter((a: any) => a.earned);
  const locked = visible.filter((a: any) => !a.earned);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 pt-6">
      <div>
        <h1 className="text-2xl font-bold">Achievements</h1>
        <p className="text-sm text-muted-foreground">
          {earned.length}/{visible.length} badges earned
        </p>
      </div>

      {/* Summary */}
      <Card className="border-0 bg-gradient-to-br from-primary/10 via-card to-accent/10 shadow-lg">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
            <Trophy className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <p className="text-3xl font-bold">{profile?.total_points || 0}</p>
            <p className="text-sm text-muted-foreground">Lifetime points earned</p>
          </div>
        </CardContent>
      </Card>

      {/* Earned badges */}
      {earned.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Earned</h2>
          <div className="grid grid-cols-2 gap-3">
            {earned.map((a: any, index: number) => {
              const isSecret = a.is_secret;
              return (
                <Card
                  key={a.id}
                  className={`border-0 shadow-lg bg-gradient-to-br from-primary/5 to-accent/5 animate-fade-in ${
                    isSecret ? "ring-2 ring-yellow-400/50 animate-golden-glow" : ""
                  }`}
                  style={{ animationDelay: `${index * 80}ms`, animationFillMode: "backwards" }}
                >
                  <CardContent className="flex flex-col items-center p-5 text-center">
                    <div className={isSecret ? "animate-pulse-glow" : ""}>
                      {a.badge_url ? (
                        <img src={a.badge_url} alt={a.name} className="h-12 w-12 rounded-2xl object-contain" />
                      ) : (
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${isSecret ? "from-yellow-400/30 to-amber-500/30" : "from-primary/20 to-accent/20"} text-primary`}>
                          <Trophy className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-sm font-semibold">{a.name}</p>
                    {isSecret && <span className="text-[10px] font-medium text-yellow-500">✦ Secret Badge</span>}
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                    {a.earnedAt && (
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        {new Date(a.earnedAt).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked badges */}
      {locked.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Locked</h2>
          <div className="grid grid-cols-2 gap-3">
            {locked.map((a: any, index: number) => (
              <Card
                key={a.id}
                className="border-0 shadow-md opacity-[0.35] backdrop-blur-sm animate-fade-in"
                style={{ animationDelay: `${(earned.length + index) * 80}ms`, animationFillMode: "backwards" }}
              >
                <CardContent className="flex flex-col items-center p-5 text-center">
                  <div className="relative">
                    {a.badge_url ? (
                      <img src={a.badge_url} alt={a.name} className="h-12 w-12 rounded-2xl object-contain grayscale blur-[1px]" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                        <Trophy className="h-6 w-6" />
                      </div>
                    )}
                    <Lock className="absolute -bottom-1 -right-1 h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-sm font-semibold">{a.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                  {a.requirement_value && (
                    <p className="mt-2 text-[10px] text-primary font-medium">
                      Requires {a.requirement_value} {a.requirement_type === "total_points" ? "points" : a.requirement_type === "habit_count" ? "habits" : a.requirement_type}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {visible.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">No achievements available yet</p>
        </div>
      )}
    </div>
  );
}
