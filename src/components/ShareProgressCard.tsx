import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Share2, Download, Flame, Star } from "lucide-react";

interface ShareProgressProps {
  name: string;
  todayPoints: number;
  totalPoints: number;
  streak: number;
  completed: number;
  total: number;
  topHabits: string[];
}

export function ShareProgressButton(props: ShareProgressProps) {
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const generateImage = async () => {
    setOpen(true);
    // Wait for render
    await new Promise((r) => setTimeout(r, 300));
    if (!cardRef.current) return;
    try {
      const url = await toPng(cardRef.current, { pixelRatio: 3, quality: 0.95 });
      setImageUrl(url);
    } catch {
      // silently fail
    }
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `mutabaah-progress-${new Date().toISOString().split("T")[0]}.png`;
    a.click();
  };

  const pct = props.total > 0 ? Math.round((props.completed / props.total) * 100) : 0;

  return (
    <>
      <Button variant="outline" size="sm" onClick={generateImage} className="gap-1.5">
        <Share2 className="h-4 w-4" />
        Share
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Share Your Progress</DialogTitle>
          </DialogHeader>

          {/* Hidden render target for image generation */}
          <div className="overflow-hidden rounded-xl">
            <div
              ref={cardRef}
              className="flex flex-col items-center p-8 text-center"
              style={{
                background: "linear-gradient(160deg, #0d1117 0%, #0a2a2f 40%, #1a0a2e 100%)",
                color: "white",
                width: 360,
                minHeight: 640,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {/* Logo */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #2db5a3, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                م
              </div>
              <p style={{ marginTop: 8, fontSize: 11, opacity: 0.6 }}>Mutaba'ah Pro</p>
              <p style={{ marginTop: 4, fontSize: 10, opacity: 0.4 }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>

              {/* Big percentage */}
              <div style={{ marginTop: 40 }}>
                <p style={{ fontSize: 72, fontWeight: 800, lineHeight: 1 }}>{pct}%</p>
                <p style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
                  {props.completed}/{props.total} habits completed
                </p>
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: "flex",
                  gap: 24,
                  marginTop: 36,
                  padding: "16px 24px",
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 24, fontWeight: 700 }}>{props.todayPoints}</p>
                  <p style={{ fontSize: 10, opacity: 0.5 }}>Today</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 24, fontWeight: 700 }}>{props.totalPoints}</p>
                  <p style={{ fontSize: 10, opacity: 0.5 }}>Total pts</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 24, fontWeight: 700 }}>{props.streak}🔥</p>
                  <p style={{ fontSize: 10, opacity: 0.5 }}>Streak</p>
                </div>
              </div>

              {/* Top habits */}
              {props.topHabits.length > 0 && (
                <div style={{ marginTop: 32, width: "100%" }}>
                  <p style={{ fontSize: 11, opacity: 0.4, textTransform: "uppercase", letterSpacing: 2 }}>
                    Completed Today
                  </p>
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                    {props.topHabits.slice(0, 5).map((h, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 10,
                          background: "rgba(255,255,255,0.05)",
                          fontSize: 13,
                          textAlign: "left",
                        }}
                      >
                        ✓ {h}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <p style={{ marginTop: "auto", paddingTop: 32, fontSize: 10, opacity: 0.3 }}>
                Track your Ramadan journey • mutabaahpro.app
              </p>
            </div>
          </div>

          <Button onClick={downloadImage} disabled={!imageUrl} className="gap-2">
            <Download className="h-4 w-4" />
            Download Image
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
