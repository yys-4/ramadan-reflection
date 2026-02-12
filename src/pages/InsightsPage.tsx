import { useWeeklyData } from "@/hooks/useInsightsData";
import { useProfile } from "@/hooks/useDashboardData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, Zap, Calendar } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export default function InsightsPage() {
  const { data, isLoading } = useWeeklyData();
  const { data: profile } = useProfile();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 pt-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const { dailyData, categoryData, weeklyPoints, bestDay, totalLogs } = data;
  const maxCompleted = Math.max(...dailyData.map((d) => d.total), 1);

  // Radar chart data — fullMark is 100 for percentage
  const radarData = categoryData.map((cat) => ({
    category: cat.name,
    score: cat.pct,
    fullMark: 100,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 pt-6">
      <h1 className="text-2xl font-bold">Weekly Insights</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-lg animate-fade-in">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{weeklyPoints}</p>
              <p className="text-xs text-muted-foreground">Points this week</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg animate-fade-in" style={{ animationDelay: "50ms", animationFillMode: "backwards" }}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{profile?.current_streak || 0}</p>
              <p className="text-xs text-muted-foreground">Day streak</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "backwards" }}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalLogs}</p>
              <p className="text-xs text-muted-foreground">Habits completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg animate-fade-in" style={{ animationDelay: "150ms", animationFillMode: "backwards" }}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Calendar className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{bestDay?.dayName}</p>
              <p className="text-xs text-muted-foreground">Best day</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart — Overall Score */}
      <Card className="border-0 shadow-lg animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "backwards" }}>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">Overall Score</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="category"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickCount={5}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly bar chart */}
      <Card className="border-0 shadow-lg animate-fade-in" style={{ animationDelay: "250ms", animationFillMode: "backwards" }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Daily Completion</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="flex items-end justify-between gap-2" style={{ height: 140 }}>
            {dailyData.map((d) => {
              const height = maxCompleted > 0 ? (d.completed / maxCompleted) * 100 : 0;
              const isToday = d.date === new Date().toISOString().split("T")[0];
              return (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-medium">{d.pct}%</span>
                  <div className="w-full rounded-t-md bg-muted" style={{ height: 100 }}>
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        isToday ? "bg-gradient-to-t from-primary to-accent" : "bg-primary/60"
                      }`}
                      style={{ height: `${height}%`, marginTop: `${100 - height}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                    {d.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
