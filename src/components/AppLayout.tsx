import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useDashboardData";
import { Home, ListChecks, BarChart3, Trophy, LogOut, Moon, Sun, User, Settings, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/checklist", icon: ListChecks, label: "Checklist" },
  { to: "/insights", icon: BarChart3, label: "Insights" },
  { to: "/achievements", icon: Trophy, label: "Achievements" },
];

/**
 * Root layout providing:
 * - Desktop: 80px fixed sidebar with icon-only navigation
 * - Mobile: Bottom tab bar with Profile/Settings sheet (containing Logout)
 */
export function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut, user } = useAuth();
  const { data: profile } = useProfile();
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDark(true);
    }
  }, []);

  // Initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "RR";
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-20 lg:flex-col lg:items-center lg:justify-between lg:border-r lg:border-border lg:bg-card lg:py-6">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground">
            م
          </div>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className="flex h-12 w-12 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                activeClassName="bg-primary/10 text-primary"
              >
                <item.icon className="h-5 w-5" />
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} className="text-muted-foreground hover:text-foreground">
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground hover:text-destructive">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-card/95 backdrop-blur-lg py-2 lg:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className="flex flex-col items-center gap-1 px-3 py-1.5 text-muted-foreground transition-colors"
            activeClassName="text-primary"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}

        {/* Profile / Menu Sheet (Replaces simple Theme toggle) */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center gap-1 px-3 py-1.5 text-muted-foreground transition-colors">
              <User className="h-5 w-5" />
              <span className="text-[10px] font-medium">Profile</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl px-0">
            <SheetHeader className="px-6 pb-2">
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-muted-foreground/20" />
              <SheetTitle>Profile & Settings</SheetTitle>
            </SheetHeader>

            <div className="space-y-6 px-6 py-4">
              {/* User Profile Card */}
              <div className="flex items-center gap-4 rounded-xl bg-muted/50 p-4">
                <Avatar className="h-12 w-12 border-2 border-background">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {profile?.full_name ? getInitials(profile.full_name) : <User className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold">{profile?.full_name || "User"}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Preferences
                </h3>

                {/* Theme Toggle */}
                <button
                  onClick={() => setDark(!dark)}
                  className="flex w-full items-center justify-between rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    </div>
                    <span className="font-medium">Theme</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {dark ? "Dark Mode" : "Light Mode"}
                  </span>
                </button>
              </div>

              <Separator />

              {/* Logout Button */}
              <Button
                variant="destructive"
                className="w-full gap-2 rounded-xl h-12 text-base"
                onClick={signOut}
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>

              <p className="text-center text-[10px] text-muted-foreground pt-2">
                Ramadan Reflection v1.2.0
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
