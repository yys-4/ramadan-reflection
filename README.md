# Ramadan Reflection

A high-performance, PWA-ready Ramadan Spiritual Habit Tracker designed to help users maintain consistency in their worship through a gamified experience.

---

## I. Project Overview & Vision

**Project Name**: Ramadan Reflection

**Description**:
A high-performance, PWA-ready Ramadan Spiritual Habit Tracker designed to help users maintain consistency in their worship through a gamified experience.

**Design Aesthetic**:
Modern Bento Grid layout with a soothing Teal and Purple color palette.

---

## II. Core Features

- 🍱 **Bento Grid Dashboard**: A responsive central hub displaying real-time progress, lifetime points, and daily streaks.
- 📋 **Categorized Daily Checklist**: Habits grouped logically into 'Morning', 'Evening', and 'All Day' sections.
- 🎮 **Advanced Gamification**: An automated system for calculating streaks and awarding badges based on specific point milestones and habit counts.
- 📊 **Spiritual Analytics**: Data visualization using Recharts (Radar Charts) to monitor balance across different categories of worship.
- 📱 **PWA Support**: Installable on iOS/Android with offline data resilience and 'Add to Home Screen' capabilities.

---

## III. Technical Architecture

### Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React.js, Vite, Tailwind CSS, Shadcn UI, Framer Motion |
| **Backend & Database** | Supabase (PostgreSQL) |
| **Visualization** | Recharts |

### Backend & Security

- **Supabase (PostgreSQL)**: Relational database consisting of 5 core tables:
    - `profiles`
    - `habits`
    - `habit_logs`
    - `achievements`
    - `user_achievements`
- **Data Security**: Strict Row Level Security (RLS) policies ensuring user data isolation.
- **Integrity**: Use of SECURITY DEFINER functions and triggers for automated profile creation upon signup.

---

## IV. Installation & Deployment

### Prerequisites

Ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn

### Steps

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/ramadan-reflection.git
    cd ramadan-reflection
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**:
    Create a `.env` file in the root directory and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```
