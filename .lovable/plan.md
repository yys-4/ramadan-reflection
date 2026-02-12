

# Phase 1 & 2: Auth Flow + Bento Grid Dashboard

## Phase 1: Foundation & Auth

### 1.1 Design System (Teal/Purple/White Palette)
- Update `index.css` CSS variables with a Ramadan-inspired theme:
  - **Primary**: Teal (~`174 60% 40%`) for buttons, active states, progress rings
  - **Accent**: Light purple (~`263 70% 70%`) for highlights, badges, gradients
  - **Background**: Warm off-white, cards in pure white with soft shadows
  - **Dark mode**: Deep navy/charcoal with teal and purple glows
- Add keyframe animations: fade-in for cards, pulse for streak fire, shimmer for points

### 1.2 Supabase Auth Setup
- Create `src/integrations/supabase/client.ts` — Supabase client initialization
- Create `src/contexts/AuthContext.tsx` — Auth provider using `onAuthStateChange` + `getSession`
  - Exposes `user`, `session`, `signIn`, `signUp`, `signOut`
  - On signup, auto-inserts a row into `profiles` table with the user's UUID
- Create `src/components/ProtectedRoute.tsx` — redirects to `/login` if no session

### 1.3 Login Page (`/login`)
- Clean, centered card layout with the teal/purple gradient background
- Toggle between **Sign In** and **Sign Up** modes
- Email + password fields with form validation
- App logo/name "Mutaba'ah Pro" with a crescent moon icon at the top
- Success toast on login, error handling for invalid credentials

### 1.4 App Layout & Navigation
- Create `src/components/AppLayout.tsx` — wraps authenticated pages
- **Mobile**: Sticky bottom navigation bar with 4 tabs (Home, Checklist, Insights, Achievements) using Lucide icons
- **Desktop**: Same nav converts to a slim left sidebar
- Active tab highlighted with teal accent color
- User avatar + logout button in the nav

---

## Phase 2: Bento Grid Dashboard

### 2.1 Dashboard Page (`/` route)
Responsive Bento Grid layout using CSS Grid:
- **Mobile**: Single column, stacked cards
- **Tablet**: 2-column grid
- **Desktop**: 3-column grid with cards spanning different sizes for visual hierarchy

### 2.2 Dashboard Cards

**Card 1 — Greeting & Date** (spans full width on mobile, 2 cols on desktop)
- "Assalamu Alaikum, [full_name]" from `profiles` table
- Today's date display
- Short motivational Ramadan message (rotating from a static list)

**Card 2 — Today's Progress** (featured card, larger)
- Circular progress ring built with SVG
- Shows percentage: (completed habits today / total habits) × 100
- Data: count `habit_logs` where `user_id = current user`, `completed_at = today`, `status = true` vs total `habits` count
- Animated fill on load

**Card 3 — Points**
- Large number display of `profiles.total_points`
- Star/gem icon with subtle glow animation
- "+X today" subtitle calculated from today's completed habit point values

**Card 4 — Streak**
- Fire/flame icon with `profiles.current_streak` days
- Pulsing glow animation when streak > 0
- "Keep it going!" or "Start today!" message based on streak status

**Card 5 — Category Breakdown**
- Mini horizontal bar chart showing completion % per `habits.category`
- Categories: Prayers, Quran, Zikr, Sunnah (based on habit categories in DB)
- Color-coded bars using teal/purple shades

**Card 6 — Recent Achievements**
- Shows last 2-3 badges from `user_achievements` joined with `achievements`
- Each shows badge icon, achievement name, and date earned
- If none earned yet: encouraging placeholder message

### 2.3 Data Layer
- Create React Query hooks in `src/hooks/`:
  - `useProfile()` — fetch current user's profile from `profiles`
  - `useTodayHabits()` — fetch all habits + today's `habit_logs` for the user
  - `useRecentAchievements()` — fetch latest 3 from `user_achievements` joined with `achievements`
- Skeleton loading states for each card matching the Bento Grid dimensions
- Error boundaries with friendly retry UI

### 2.4 Routes Setup
- `/login` → Login/Signup page (public)
- `/` → Dashboard with Bento Grid (protected)
- `/*` → 404 Not Found page
- Remaining routes (checklist, insights, achievements) as placeholder pages for now, accessible via nav

