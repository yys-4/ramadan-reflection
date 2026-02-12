import { useDailyQuote } from "@/hooks/useDailyQuote";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export function DailyQuoteCard() {
  const { data: quote, isLoading } = useDailyQuote();

  if (isLoading || !quote) return null;

  return (
    <Card className="col-span-full border-0 shadow-lg overflow-hidden relative">
      {/* Islamic geometric pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <CardContent className="relative p-6">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
            <BookOpen className="h-4 w-4 text-accent" />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-accent">
              Daily Inspiration
            </p>
            <blockquote className="text-sm font-medium italic leading-relaxed text-foreground">
              "{quote.quote_text}"
            </blockquote>
            {quote.author && (
              <p className="text-xs text-muted-foreground">— {quote.author}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
