# Development Guide

Full architecture reference for the Bubu Study Planner codebase.

---

## Table of Contents

1. [Repository Layout](#repository-layout)
2. [Type System](#type-system)
3. [State Management](#state-management)
4. [Components](#components)
5. [Hooks](#hooks)
6. [Context](#context)
7. [Utilities & Libraries](#utilities--libraries)
8. [Constants & Static Data](#constants--static-data)
9. [Styling](#styling)
10. [Build & Deployment](#build--deployment)
11. [Data Flow Diagram](#data-flow-diagram)

---

## Repository Layout

```
bubu_study_planner/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Pages CI/CD
├── public/
│   ├── favicon.svg
│   └── .nojekyll                   # Prevents GitHub Pages from ignoring _ files
├── scripts/
│   └── postbuild-pages.mjs         # Copies index.html → 404.html after build
├── src/
│   ├── components/                 # React UI components
│   │   ├── App.tsx                 # Root layout: sidebar + active view
│   │   ├── AppErrorBoundary.tsx    # Top-level error boundary
│   │   ├── ConfirmDialog.tsx       # Reusable modal confirmation dialog
│   │   ├── CourseManager.tsx       # Reorderable course list with CRUD
│   │   ├── CourseModal.tsx         # Add/edit course form (color + emoji)
│   │   ├── HomeView.tsx            # Today's agenda, mood, and verse
│   │   ├── MoodModal.tsx           # 13-option mood picker modal
│   │   ├── MonthlyView.tsx         # 6-week calendar grid
│   │   ├── Sidebar.tsx             # Navigation rail with tooltips
│   │   ├── TaskModal.tsx           # Add/edit task form
│   │   └── WeeklyView.tsx          # Course × day grid with drag-and-drop
│   ├── context/
│   │   └── ConfirmContext.tsx      # Promise-based global confirm dialog
│   ├── constants/
│   │   └── moods.ts                # Mood definitions: emoji, label, color
│   ├── data/
│   │   └── comfortVerses.ts        # 22 Bible verses for daily rotation
│   ├── hooks/
│   │   ├── usePlannerData.ts       # Central state + localStorage persistence
│   │   ├── usePrintSheetScale.ts   # Auto-scales print sheets to one page
│   │   └── useWeekHeaderOverrides.ts # Custom week title storage
│   ├── lib/
│   │   ├── safeStorage.ts          # Safe localStorage get/set wrappers
│   │   └── utils.ts                # cn() class merger, createId() UUID helper
│   ├── types/
│   │   ├── types.ts                # Core domain types
│   │   └── view.ts                 # AppView union type
│   ├── index.css                   # Global styles, Tailwind imports, print rules
│   └── main.tsx                    # React DOM entry point
├── .env.example                    # Environment variable template
├── .gitignore
├── index.html                      # Vite HTML entry
├── metadata.json                   # App metadata (name, description)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Type System

All domain types live in `src/types/types.ts`.

### `Course`
```ts
interface Course {
  id: string;
  name: string;
  color: string;   // Tailwind bg-* class (e.g. "bg-pink-200")
  icon?: string;   // Emoji character
}
```

### `Task`
```ts
interface Task {
  id: string;
  title: string;
  dueDate: string;      // ISO date string "YYYY-MM-DD"
  time?: string;        // "HH:MM" 24-hour format
  courseId: string;     // References Course.id; empty string = unassigned
  category: string;     // CategoryDef.id or legacy string label
  completed: boolean;
}
```

### `CategoryDef`
```ts
interface CategoryDef {
  id: string;
  name: string;
  color: string;   // Hex or Tailwind color
  icon?: string;   // Emoji character
}
```

### `Mood`
```ts
type Mood =
  | 'happy' | 'neutral' | 'sad' | 'stressed' | 'excited'
  | 'joyful' | 'creative' | 'tired' | 'focused'
  | 'anxious' | 'sick' | 'loved' | 'angry';
```

### `DailyMood`
```ts
interface DailyMood {
  date: string;   // "YYYY-MM-DD"
  mood: Mood;
}
```

### `Sticker`
```ts
interface Sticker {
  id: string;
  emoji: string;
  date: string;   // "YYYY-MM-DD"
}
```

### `AppView` (`src/types/view.ts`)
```ts
type AppView = 'home' | 'month' | 'week' | 'courses' | 'settings';
```

---

## State Management

All mutable app state lives in the `usePlannerData` hook (`src/hooks/usePlannerData.ts`). There is no external state library — React's `useState` drives everything and the hook writes to `localStorage` on every mutation.

### localStorage Keys

| Key | Type | Default |
|---|---|---|
| `planner_courses` | `Course[]` | 3 sample courses |
| `planner_tasks` | `Task[]` | `[]` |
| `planner_moods` | `DailyMood[]` | `[]` |
| `planner_categories` | `CategoryDef[]` | 5 defaults |
| `planner_stickers` | `Sticker[]` | `[]` |
| `planner_week_headers` | `Record<string, string>` | `{}` |

Reads are guarded by `safeLocalStorageGet()` (returns `null` on error) and every value is validated before use. Unknown or corrupt data falls back to defaults silently.

### Hook API

```ts
const {
  // data
  courses, tasks, moods, categories, stickers,

  // course actions
  addCourse, updateCourse, deleteCourse, reorderCourses,

  // task actions
  addTask, updateTask, deleteTask, toggleTask,

  // category actions
  addCategory, deleteCategory,

  // mood actions
  setMood,

  // sticker actions
  addSticker, removeSticker,

  // utilities
  exportCSV, exportJSON, hardReset,
} = usePlannerData();
```

This hook is called once in `App.tsx` and props are passed down to each view.

---

## Components

### `App.tsx`

Root component. Holds the active view in local state, renders `Sidebar` and whichever view is active. Calls `usePlannerData` once and passes results down. Also wraps everything in `AppErrorBoundary` and `ConfirmProvider`.

**Props:** none (root)

**State:**
- `view: AppView` — currently displayed view
- `darkMode: boolean` — applied to root `<div>` as a class

---

### `Sidebar.tsx`

Vertical navigation rail on the left edge. Buttons use `title` attributes and custom tooltip spans for hover labels. No routing — just calls `onViewChange(view)`.

**Props:**
```ts
{
  view: AppView;
  onViewChange: (v: AppView) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}
```

---

### `HomeView.tsx`

Shows three cards:
1. **Today** — date header with mood emoji and a button to open `MoodModal`
2. **Agenda** — tasks due today, sorted by time, grouped by course
3. **Verse** — daily comfort verse from `comfortVerses.ts`, selected by `dayOfYear % verses.length`

**Props:**
```ts
{
  tasks: Task[];
  courses: Course[];
  moods: DailyMood[];
  onSetMood: (mood: Mood) => void;
  darkMode: boolean;
}
```

---

### `WeeklyView.tsx`

The most complex component. Renders a grid of `courses × 7 days`.

**Layout:**
- Header row: day labels (Mon–Sun) with animated date numbers
- Per-course rows: each cell holds tasks for that course on that day
- "Other Tasks" row: tasks with no assigned course
- Left column: course name badges (draggable to reorder)

**Drag & drop:**
- Tasks: `dragstart` on a task chip sets a JSON payload; `dragover`/`drop` on a cell calls `onUpdateTask` with the new date and course
- Courses: row drag using a drag handle icon; `mousedown` → `mousemove` → `mouseup` sequence with visual ghost

**Print scaling:** delegates to `usePrintSheetScale`.

**Week navigation:** prev/next arrows update an internal `weekStart` date; custom title stored via `useWeekHeaderOverrides`.

**Props:**
```ts
{
  tasks: Task[];
  courses: Course[];
  categories: CategoryDef[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onToggleTask: (id: string) => void;
  onReorderCourses: (courses: Course[]) => void;
  darkMode: boolean;
}
```

---

### `MonthlyView.tsx`

6-week calendar. Each cell contains color-coded task chips. Clicking a chip opens `TaskModal` in edit mode. Animated transitions between months use Motion's `AnimatePresence`.

**Props:** same shape as WeeklyView (tasks, courses, categories, CRUD callbacks, darkMode).

---

### `TaskModal.tsx`

Form modal for creating and editing tasks. Contains three sub-components rendered inline:

- **DatePicker** — custom calendar grid (no third-party date picker)
- **TimeSelect** — three dropdowns: hour, minute, AM/PM
- **CourseSelect** — styled dropdown with color swatches

On submit, calls `onAdd` or `onUpdate` depending on whether an existing task was passed. Validates that title and date are non-empty.

**Props:**
```ts
{
  task?: Task;           // undefined = create mode
  courses: Course[];
  categories: CategoryDef[];
  onAdd: (task: Omit<Task, 'id'>) => void;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  defaultDate?: string;
  defaultCourseId?: string;
}
```

---

### `CourseManager.tsx`

Full-page course list with add/edit/delete and drag-to-reorder. Each row shows the course color swatch, emoji, and name. Delete triggers a `useConfirm` dialog before calling `onDelete`.

**Props:**
```ts
{
  courses: Course[];
  onAdd: (c: Omit<Course, 'id'>) => void;
  onUpdate: (c: Course) => void;
  onDelete: (id: string) => void;
  onReorder: (courses: Course[]) => void;
  darkMode: boolean;
}
```

---

### `CourseModal.tsx`

Small modal with a text input, a 10-color palette, and a 10-emoji picker. Used by `CourseManager` for both create and edit.

**Props:**
```ts
{
  course?: Course;
  onSave: (data: Omit<Course, 'id'>) => void;
  onClose: () => void;
}
```

---

### `MoodModal.tsx`

4-column grid of 13 mood buttons. Each button shows an emoji and a label. Selecting one calls `onSave(mood)` and closes the modal.

**Props:**
```ts
{
  currentMood?: Mood;
  onSave: (mood: Mood) => void;
  onClose: () => void;
}
```

---

### `ConfirmDialog.tsx`

Generic modal with title, message, and two buttons. Rendered by `ConfirmContext` — not used directly by other components.

**Props:**
```ts
{
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
```

---

### `AppErrorBoundary.tsx`

Class component wrapping the app. Catches render errors and shows a fallback UI with the error message and a "Reload" button.

---

## Hooks

### `usePlannerData` (`src/hooks/usePlannerData.ts`)

Central data hook. See [State Management](#state-management) for the full API.

**Initialization flow:**
1. Read each key from localStorage via `safeLocalStorageGet`
2. Parse JSON; if invalid or missing, use default values
3. Assign each to a `useState` call
4. Every setter also calls `safeLocalStorageSet` to persist

**Export helpers:**
- `exportCSV()` — builds a CSV blob (ID, Title, Date, Time, Course, Category, Completed) and triggers a download
- `exportJSON()` — serializes all state to JSON and triggers a download
- `hardReset()` — clears all localStorage keys and reloads

---

### `usePrintSheetScale` (`src/hooks/usePrintSheetScale.ts`)

Attaches to `window.beforeprint` and `window.afterprint`. Before printing, measures the sheet element's natural height against the available print height and sets a CSS transform scale (clamped 55%–112%). After printing, removes the scale.

**Usage:**
```ts
const sheetRef = usePrintSheetScale();
// attach sheetRef to the element you want scaled
```

---

### `useWeekHeaderOverrides` (`src/hooks/useWeekHeaderOverrides.ts`)

Stores a `Record<string, string>` mapping ISO week-start dates to custom titles, persisted in localStorage under `planner_week_headers`.

**Returns:**
```ts
{
  overrides: Record<string, string>;
  setOverride: (weekStart: string, title: string) => void;
  clearOverride: (weekStart: string) => void;
}
```

---

## Context

### `ConfirmContext` (`src/context/ConfirmContext.tsx`)

Provides a Promise-based `useConfirm()` hook so any component can request a confirmation without prop-drilling.

**Usage:**
```ts
const confirm = useConfirm();
const ok = await confirm({
  title: 'Delete course?',
  message: 'This cannot be undone.',
  danger: true,
});
if (ok) deleteCourse(id);
```

Internally renders a single `ConfirmDialog` instance controlled by the context. Multiple simultaneous confirms are not supported (last one wins).

---

## Utilities & Libraries

### `src/lib/utils.ts`

```ts
// Merge Tailwind classes safely (clsx + tailwind-merge)
function cn(...inputs: ClassValue[]): string

// Crypto-based UUID, with Math.random fallback
function createId(): string
```

### `src/lib/safeStorage.ts`

```ts
// Returns parsed value or null on any error (quota exceeded, JSON invalid, etc.)
function safeLocalStorageGet<T>(key: string): T | null

// Silently fails on quota errors instead of throwing
function safeLocalStorageSet(key: string, value: unknown): void
```

---

## Constants & Static Data

### `src/constants/moods.ts`

Exports a `MOODS` array of 13 objects:
```ts
interface MoodDef {
  id: Mood;
  emoji: string;
  label: string;
  color: string;   // Tailwind bg-* class
}
```

Also exports:
- `getMoodEmoji(mood: Mood): string`
- `getMoodLabel(mood: Mood): string`

### `src/data/comfortVerses.ts`

Array of 22 objects `{ text: string; reference: string }`. `HomeView` selects one via `dayOfYear % 22`.

---

## Styling

### Tailwind Setup

Tailwind CSS 4 is loaded via the Vite plugin (`@tailwindcss/vite`). Custom theme tokens are declared in `src/index.css` using `@theme`:

```css
@theme {
  --color-pastel-pink: #FFD6E0;
  --color-pastel-mint: #C1F0DC;
  --color-pastel-blue: #BDE0FE;
  --color-pastel-purple: #D4BBFC;
  --color-pastel-yellow: #FFF3B0;
  --color-off-white: #FFF9FB;
}
```

### Global Utility Classes (`src/index.css`)

| Class | Effect |
|---|---|
| `.glass` | `backdrop-blur-md` frosted glass |
| `.squircle` | `border-radius: 32px` |
| `.no-scrollbar` | Hides scrollbar while preserving scroll |
| `.btn` | Base button with hover lift and active press |

### Print Media Query

`@media print` rules in `index.css`:
- Hide `.no-print` elements (sidebar, header buttons)
- Show `.print-only` elements (standalone title)
- Remove shadows and backgrounds for ink saving
- The `usePrintSheetScale` hook applies an inline CSS transform to fit content

### Fonts

Loaded from Google Fonts in `index.html`:
- **Quicksand** — body text
- **Nunito** — headings and labels

### Dark Mode

Applied by toggling a `dark` class on the root `<div>` in `App.tsx`. Tailwind's `dark:` variant handles color overrides throughout. Primary dark palette uses Zinc.

---

## Build & Deployment

### Vite Config (`vite.config.ts`)

- Plugin: `@vitejs/plugin-react`, `@tailwindcss/vite`
- Custom plugin strips `crossorigin` attributes from the built HTML (compatibility with some static hosts)
- `base` is set to `process.env.VITE_BASE ?? './'` — `./` works for any static host; GitHub Actions overrides it to the repo sub-path

### Path Alias

`@/` resolves to the project root in both `vite.config.ts` and `tsconfig.json`.

### Postbuild Script (`scripts/postbuild-pages.mjs`)

```js
// After vite build, copy dist/index.html → dist/404.html
// GitHub Pages serves 404.html for unknown paths → enables SPA client-side routing
```

### CI/CD (`.github/workflows/deploy.yml`)

Trigger: push to `main`

Steps:
1. `actions/checkout`
2. `actions/setup-node@v4` with Node 22
3. `npm ci`
4. `VITE_BASE=/<repo-name>/ npm run build`
5. `actions/deploy-pages` → deploys `dist/`

### npm Scripts

| Script | Command |
|---|---|
| `dev` | `vite --port=3000 --host=0.0.0.0` |
| `build` | `vite build && node scripts/postbuild-pages.mjs` |
| `lint` | `tsc --noEmit` |

---

## Data Flow Diagram

```
main.tsx
  └── AppErrorBoundary
        └── ConfirmProvider (ConfirmContext)
              └── App
                    ├── usePlannerData()          ← all state lives here
                    │     └── localStorage        ← persisted on every mutation
                    ├── Sidebar
                    │     └── onViewChange → App state (view)
                    └── [active view]
                          ├── HomeView
                          │     └── MoodModal → onSetMood → usePlannerData
                          ├── WeeklyView
                          │     ├── TaskModal → onAdd/onUpdate/onDelete → usePlannerData
                          │     └── CourseManager → onAdd/onUpdate/onDelete → usePlannerData
                          └── MonthlyView
                                └── TaskModal → onAdd/onUpdate/onDelete → usePlannerData
```

State only flows downward via props. Mutations flow back up via callback props. No global store, no event bus.
