# Bubu Study Planner

A cute, printable study planner web app built with React, TypeScript, and Tailwind CSS. Plan your week and month, track your mood, and stay encouraged with a daily Bible verse.

## Features

- **Three views** — Home (today's summary), Weekly grid, and Monthly calendar
- **Course management** — Add, color-code, and reorder your courses
- **Task tracking** — Assign tasks to courses and categories, set due dates and times, mark complete
- **Drag & drop** — Move tasks between day/course cells; reorder course rows
- **Mood tracking** — Log a daily mood from 13 emoji options
- **Daily verse** — A rotating Bible verse shown on the Home view every day
- **Print support** — Auto-scales to one page; hides UI controls
- **Data export** — CSV or full JSON backup; hard reset available
- **Dark mode** — Toggle via sidebar
- **Offline-first** — All data lives in browser localStorage, no account needed

## Tech Stack

| Layer | Library |
|---|---|
| UI framework | React 19 |
| Language | TypeScript 5.8 |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| Date utilities | date-fns 4 |
| Animations | Motion (Framer Motion) 12 |
| Icons | Lucide React |
| Class utilities | clsx + tailwind-merge |

## Getting Started

### Prerequisites

- Node.js 22+
- npm or any compatible package manager

### Install & run

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:3000`.

### Build

```bash
npm run build
```

Output goes to `dist/`. The postbuild script copies `index.html` → `404.html` for GitHub Pages SPA routing.

### Type check

```bash
npm run lint
```

## Project Structure

```
src/
├── components/       # All React UI components
├── context/          # React context providers
├── constants/        # Static data (mood definitions)
├── data/             # Static content (comfort verses)
├── hooks/            # Custom React hooks
├── lib/              # Utility functions and safe wrappers
└── types/            # TypeScript type definitions
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for a full breakdown of the architecture and every file.

## Data & Storage

All planner data is stored in `localStorage` under these keys:

| Key | Contents |
|---|---|
| `planner_courses` | Course list with colors and icons |
| `planner_tasks` | Task list with dates, times, categories |
| `planner_moods` | Daily mood log |
| `planner_categories` | Custom task categories |
| `planner_stickers` | Stickers (reserved, not yet used) |
| `planner_week_headers` | Custom week title overrides |

No data is ever sent to a server.

## Environment Variables

Copy `.env.example` and fill in as needed:

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Google GenAI API key (reserved for future AI features) |
| `APP_URL` | Self-referential app URL |
| `VITE_BASE` | Asset base path (auto-set by GitHub Actions) |

## Deployment

The app deploys automatically to GitHub Pages on every push to `main` via `.github/workflows/deploy.yml`. The workflow:

1. Checks out the repo
2. Installs Node 22
3. Runs `npm run build` (with `VITE_BASE` set to the repo path)
4. Deploys `dist/` to the `gh-pages` branch

For any other static host, just serve the `dist/` folder.

## Printing

Open any view and use your browser's print dialog (`Ctrl+P` / `Cmd+P`). The app auto-scales the sheet to fit on one page and hides all navigation and UI controls.

## Contributing

1. Fork the repo and create a feature branch
2. Run `npm run lint` before committing
3. Open a pull request against `main`

## License

MIT
