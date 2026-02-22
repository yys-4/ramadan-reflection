import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Moon,
  Loader2,
  Info,
  CheckCircle2,
  BarChart3,
  Trophy,
  Share2,
  Smartphone,
  MonitorSmartphone,
  Download,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Password tidak cocok. Silakan periksa kembali.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, fullName);
      } else {
        await signIn(email, password);
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="border-0 shadow-xl shadow-primary/5">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
              <Moon className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Ramadan Reflection</CardTitle>
              <CardDescription className="mt-1">
                {isSignUp ? "Buat akun untuk mulai melacak ibadahmu" : "Selamat datang kembali, lanjutkan perjalananmu"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nama Lengkap</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama lengkap kamu"
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              {isSignUp && (
                <div className="space-y-2 animate-fade-in">
                  <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={6}
                      required
                    />
                  </div>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? "Buat Akun" : "Masuk"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {isSignUp ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setConfirmPassword(""); // Reset confirm password when switching modes
                }}
                className="font-medium text-primary hover:underline"
              >
                {isSignUp ? "Masuk" : "Daftar"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Readme / About Button */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-card/60 backdrop-blur-sm px-4 py-3 text-sm text-muted-foreground transition-all hover:bg-card hover:text-foreground hover:shadow-md">
              <Info className="h-4 w-4" />
              <span>Tentang Aplikasi &amp; Cara Pasang</span>
              <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl px-0">
            <SheetHeader className="px-6 pb-4">
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-muted-foreground/20" />
              <SheetTitle className="flex items-center justify-center gap-2 text-lg">
                <Moon className="h-5 w-5 text-primary" />
                Ramadan Reflection
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(85vh-5rem)] px-6">
              <div className="space-y-6 pb-10">
                {/* Intro */}
                <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 p-5">
                  <p className="text-sm leading-relaxed text-foreground">
                    <strong>Ramadan Reflection</strong> adalah aplikasi web progresif (PWA) yang
                    dirancang untuk membantu kamu menjalani ibadah Ramadan secara lebih
                    terstruktur, terukur, dan bermakna. Catat kebiasaan harian, pantau
                    progres, dan raih pencapaian sepanjang bulan suci.
                  </p>
                </div>

                {/* Fitur Utama */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Fitur Utama
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <FeatureCard
                      icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
                      title="Checklist Harian"
                      desc="Tandai salat, tilawah, zikir, dan amal lainnya"
                    />
                    <FeatureCard
                      icon={<BarChart3 className="h-5 w-5 text-accent" />}
                      title="Statistik & Insight"
                      desc="Lihat tren ibadahmu dalam grafik mingguan"
                    />
                    <FeatureCard
                      icon={<Trophy className="h-5 w-5 text-yellow-500" />}
                      title="Pencapaian"
                      desc="Raih badge untuk setiap milestone ibadah"
                    />
                    <FeatureCard
                      icon={<Share2 className="h-5 w-5 text-emerald-500" />}
                      title="Bagikan Progress"
                      desc="Share progres harianmu ke media sosial"
                    />
                  </div>
                </div>

                {/* Cara Pasang PWA */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Pasang di Perangkatmu
                  </h3>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Aplikasi ini bisa dipasang langsung dari browser — tanpa perlu unduh
                    dari Play Store atau App Store.
                  </p>

                  {/* Android */}
                  <InstallGuide
                    icon={<Smartphone className="h-5 w-5" />}
                    platform="Android (Chrome)"
                    steps={[
                      "Buka aplikasi ini di Google Chrome",
                      "Ketuk ikon titik tiga (⋮) di pojok kanan atas",
                      "Pilih \"Tambahkan ke Layar Utama\" atau \"Install App\"",
                      "Ketuk \"Instal\" pada pop-up konfirmasi",
                      "Aplikasi akan muncul di layar utama seperti aplikasi biasa!",
                    ]}
                  />

                  {/* iOS */}
                  <InstallGuide
                    icon={<MonitorSmartphone className="h-5 w-5" />}
                    platform="iPhone / iPad (Safari)"
                    steps={[
                      "Buka aplikasi ini di Safari (bukan Chrome)",
                      "Ketuk ikon Share (kotak dengan panah ke atas) di bagian bawah layar",
                      "Gulir ke bawah dan pilih \"Tambahkan ke Layar Utama\"",
                      "Beri nama lalu ketuk \"Tambah\"",
                      "Aplikasi sudah terpasang — buka dari layar utama!",
                    ]}
                  />

                  {/* Desktop */}
                  <InstallGuide
                    icon={<Download className="h-5 w-5" />}
                    platform="Laptop / PC (Chrome / Edge)"
                    steps={[
                      "Buka aplikasi ini di Chrome atau Edge",
                      "Klik ikon install (⊕) di address bar, atau buka menu (⋮) → \"Install Ramadan Reflection\"",
                      "Klik \"Install\" pada dialog konfirmasi",
                      "Aplikasi akan terbuka dalam jendela tersendiri!",
                    ]}
                  />
                </div>

                {/* Footer note */}
                <p className="text-center text-[11px] text-muted-foreground/50 pt-2">
                  Dibuat dengan ❤️ untuk menemani Ramadanmu 1447 H
                </p>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

/** Small feature highlight card */
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl bg-card/80 p-3.5 shadow-sm">
      <div className="mb-2">{icon}</div>
      <p className="text-xs font-semibold">{title}</p>
      <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{desc}</p>
    </div>
  );
}

/** Collapsible install guide per platform */
function InstallGuide({
  icon,
  platform,
  steps,
}: {
  icon: React.ReactNode;
  platform: string;
  steps: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-border/50 bg-card/50 transition-all">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-card"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <span className="flex-1 text-sm font-medium">{platform}</span>
        <ChevronRight
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open && (
        <div className="space-y-2 px-4 pb-4 pt-1 animate-fade-in">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                {i + 1}
              </span>
              <p className="text-xs leading-relaxed text-muted-foreground pt-0.5">{step}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
