import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon } from "lucide-react";
// Ramadan 2026 approximate dates (1 Ramadan ≈ Feb 17, Eid al-Fitr ≈ Mar 19).
// These are hardcoded because the Islamic (Hijri) calendar doesn't have reliable
// JS date library support and the exact dates depend on moon sighting which
// varies by region. In production, these should be configurable per locale.
const RAMADAN_START = new Date("2026-02-17");
const EID_DATE = new Date("2026-03-19");
const TOTAL_DAYS = 30;

export function RamadanCountdown() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const msPerDay = 86400000;
  const daysPassed = Math.max(0, Math.floor((today.getTime() - RAMADAN_START.getTime()) / msPerDay));
  const daysLeft = Math.max(0, Math.ceil((EID_DATE.getTime() - today.getTime()) / msPerDay));
  // Use daysPassed out of TOTAL_DAYS for accurate percentage (day 1 = 1/30 completed at end of day)
  const completedDays = Math.min(daysPassed, TOTAL_DAYS);
  const progress = Math.min(100, Math.max(0, (completedDays / TOTAL_DAYS) * 100));
  // `daysPassed + 1` converts zero-indexed elapsed days into human-friendly
  // "day of Ramadan" numbering — day 0 elapsed means it's Day 1 of Ramadan.
  const dayOfRamadan = Math.min(daysPassed + 1, 30);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Moon className="h-4 w-4" />
          Ramadan Journey
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-6 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-bold">{daysLeft}</span>
          <span className="text-xs text-muted-foreground">days to Eid</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Day {dayOfRamadan} of 30 • {Math.round(progress)}% complete
        </p>
      </CardContent>
    </Card>
  );
}
