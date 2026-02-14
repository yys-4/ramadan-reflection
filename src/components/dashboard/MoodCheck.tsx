import { useDailyMood, type MoodType } from "@/hooks/useDailyMood";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smile, Battery, Sparkles } from "lucide-react";

const moods: { value: MoodType; icon: React.ReactNode; label: string }[] = [
  { value: "Happy", icon: <Smile className="h-5 w-5" />, label: "Happy" },
  { value: "Tired", icon: <Battery className="h-5 w-5" />, label: "Tired" },
  { value: "Blessed", icon: <Sparkles className="h-5 w-5" />, label: "Blessed" },
];
/**
 * Daily mood check-in — renders as a radio group of 3 mood options.
 * Only 3 moods are offered intentionally to reduce decision fatigue during
 * fasting (when cognitive load is higher). Happy/Tired/Blessed cover the
 * core emotional spectrum without being overwhelming.
 */
export function MoodCheck() {
  const { mood, setMood, isSetting } = useDailyMood();
  const currentMood = mood?.mood as MoodType | undefined;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          How are you feeling today?
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="flex gap-2" role="radiogroup" aria-label="How are you feeling today?">
          {moods.map((m) => {
            const isActive = currentMood === m.value;
            return (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                disabled={isSetting}
                role="radio"
                aria-checked={isActive}
                aria-label={`Set mood to ${m.label}`}
                className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl p-3 transition-all duration-300 ${isActive
                    ? "bg-primary/15 text-primary scale-105 shadow-md"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
              >
                {m.icon}
                <span className="text-[10px] font-medium">{m.label}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
