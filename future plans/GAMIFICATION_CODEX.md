# Taskflow Gamification Codex: How to Unlock Everything

This document serves as the official rulebook for Taskflow's Phase 5 Gamification system. It explains exactly what every hidden item, buff, and badge is, and the exact database triggers required to unlock them.

---

## 🎒 Permanent Inventory Items (Loot)
These items go into your Inventory Dock as permanent integers. You "spend" them to level up your Digital Bonsai Tree.

### 🛡️ Streak Shields
*   **What it does:** Once implemented, spending this will protect a habit streak from resetting to zero if you miss a day.
*   **How to unlock:** Maintain any habit streak for **10 consecutive days**. A shield drops automatically on day 10, 20, 30, etc.

### 💎 Prediction Crystals
*   **What it does:** Feeds 20 XP to the Bonsai Tree.
*   **How to unlock:** Capture a "Worry Jot." Later, when the system follows up, honestly report that the reality turned out better than your fear (accuracy = "low").

### ✨ Fresh Start Tokens
*   **What it does:** Feeds 25 XP to the Bonsai Tree (and forgives overdue tasks).
*   **How to unlock:** Open the Mistake Log and document a mistake with a solution/lesson learned. Rewards the psychological act of facing failure head-on.

### 🟡 Composure Coins
*   **What it does:** Feeds 15 XP to the Bonsai Tree.
*   **How to unlock:** Start a focus session under pressure. (If you execute a focus session >30 minutes without dawdling, the engine grants a coin probabilistically as a reward for starting fast).

### ⚓ Anchor Weights
*   **What it does:** Feeds 15 XP to the Bonsai Tree.
*   **How to unlock:** "The Anchor." Navigate to your backlog and complete one of your **3 oldest pending tasks**.

### ⚡ Stretch Tokens
*   **What it does:** Feeds 20 XP to the Bonsai Tree.
*   **How to unlock:** Complete a task sized as `L` (Large) or `XL` (Extra Large) perfectly, meaning you never clicked the "Push to tomorrow" button even once.

### ⏳ Time Bender Hourglasses
*   **What it does:** Feeds 15 XP to the Bonsai Tree.
*   **How to unlock:** Start a Pomodoro/timer with an expected duration. If you complete the task within **5 minutes** (over or under) of your predicted time, you earn this for perfect estimation.

### 📖 Golden Bookmarks
*   **What it does:** Feeds 10 XP to the Bonsai Tree.
*   **How to unlock:** While running an active focus session, successfully add a new "Jot" (Idea/Todo) without terminating the session early. Rewards capturing thoughts without breaking flow.

### 🔥 Embers of Continuity
*   **What it does:** The highest value item. Feeds 50 XP to the Bonsai Tree.
*   **How to unlock:** Achieve 7 consecutive perfect "Daily Wins."

---

## 🌩️ Active Buffs (Temporary Multipliers)
Buffs are not items you keep. They are temporary states that stick to your dock for a few hours, altering your XP output to simulate "flow state."

### 🐦 Zen Mode (Morning Lark)
*   **How to unlock:** Complete your very first task of the day **before 9:30 AM**.
*   **The Effect:** Immediately grants +50 bonus XP and activates Zen Mode for **3 hours**.

### 🌊 Momentum Surge (The Closer)
*   **How to unlock:** Complete the final subtask of a parent task, marking the entire parent task as 100% complete.
*   **The Effect:** Immediately grants +50 bonus XP (simulating a 5x boost) and activates Momentum Surge for **4 hours**.

### 🚀 Laser Overdrive
*   **How to unlock:** Complete a single focus session lasting **50 minutes or more** with **zero distractions** logged.
*   **The Effect:** Grants +100 bonus XP immediately and turns on a 2x XP multiplier for all game actions over the next **2 hours**.

### 🔋 Brain Fuel (Metabolic Fueling)
*   **How to unlock:** Sustain a deep focus session for **60 continuous minutes**.
*   **The Effect:** Acts as a self-care nudge. Grants +25 bonus XP and applies the Brain Fuel buff for **1 hour**, indicating you need to eat, stand up, or take a walk.

---

## 🏆 Achievement Badges
Badges are permanent milestones logged to your profile. Each has a Bronze (Tier 1), Silver (Tier 2), and Gold (Tier 3) phase.

*   **First Focus:** Complete 1 / 10 / 50 total focus sessions.
*   **Task Crusher:** Complete 10 / 50 / 200 total tasks.
*   **Habit Collector:** Simultaneously maintain 3 / 7 / 15 active (non-abandoned) habits.
*   **Deep Worker:** Accumulate 10 / 50 / 200 total hours of deep focus time across all sessions.
*   **Laser Focus:** Execute 1 / 10 / 50 perfect distraction-free sessions (must be >25 mins long).

### Psychological Milestone Badges
These are designed specifically for ADHD / highly-resistant brains:
*   **Consistency Machine:** Push any single habit streak to 7 / 21 / 60 consecutive days.
*   **Frog Eater:** Complete 1 / 5 / 25 tasks flagged as "Frogs" (Urgent + High Energy required, or pushed 3+ times).
*   **Fear Crusher:** Finally complete 1 / 5 / 20 tasks that you historically pushed to tomorrow with the reason: "Too Scary."
