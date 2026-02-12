import { useLocation } from "react-router-dom";

export default function PlaceholderPage() {
  const { pathname } = useLocation();
  const name = pathname.slice(1).charAt(0).toUpperCase() + pathname.slice(2);
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{name}</h1>
        <p className="mt-2 text-muted-foreground">Coming soon in Phase 3+ ✨</p>
      </div>
    </div>
  );
}
