import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { Home, ListChecks, BarChart3, Trophy, LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/checklist", icon: ListChecks, label: "Checklist" },
  { to: "/insights", icon: BarChart3, label: "Insights" },
  { to: "/achievements", icon: Trophy, label: "Achievements" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
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
        <button onClick={() => setDark(!dark)} className="flex flex-col items-center gap-1 px-3 py-1.5 text-muted-foreground transition-colors">
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="text-[10px] font-medium">Theme</span>
        </button>
      </nav>
    </div>
  );
}
