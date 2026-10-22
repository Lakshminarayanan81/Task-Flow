# TaskFlow — Project Context for Claude

> **Purpose of this file:** This is a context document for Claude (in VS Code / Claude Code) to
> understand this project fully. Keep this file open or referenced in every session so Claude
> gives consistent, project-aware answers instead of generic advice. If you rename/move folders,
> update this file to match.

---

## 1. What This Project Is

**TaskFlow** is a full-stack task & project management app (similar in spirit to a mini Trello/Jira).

This is a **learning project**. The developer is an experienced **frontend developer** who is
learning **backend development** for the first time, starting with **Node.js + Express.js + MongoDB**.
A second version of this exact same app will later be rebuilt using **Python + FastAPI + SQL** to
compare NoSQL vs. relational approaches.

**Primary goal:** learn backend fundamentals deeply — not just "get it working." When Claude helps,
it should explain the *why* behind backend decisions (schema design, middleware, auth flow, status
codes, etc.), not just hand over finished code. Assume strong frontend/JS knowledge already, but
treat backend concepts (servers, databases, auth, REST design) as genuinely new.

---

## 2. Tech Stack

### Backend
| Purpose | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB (MongoDB Atlas in production) |
| ODM | Mongoose |
| Auth | JWT (`jsonwebtoken`) |
| Password hashing | `bcrypt` |
| Env config | `dotenv` |
| Dev server | `nodemon` |
| Validation | `express-validator` (or `zod`) |

### Frontend
| Purpose | Technology |
|---|---|
| Library | React.js (Vite) |
| Routing | React Router |
| HTTP client | Axios |
| Global state | React Context API |
| Styling | Tailwind CSS |
| Forms | React Hook Form |
| Notifications | `react-hot-toast` |

### Tooling / Deployment
- Git & GitHub for version control
- Postman / Thunder Client for manual API testing
- Backend hosting: **Render** (Web Service, free tier) — https://task-flow-zzl2.onrender.com
- DB hosting: **MongoDB Atlas** — local dev uses database `taskflow`, production uses `taskflow-prod`
  with its own database user
- Frontend hosting: **Vercel** — https://task-flow-five-wine.vercel.app
- Both hosts auto-deploy on every push to `main`. Full setup and troubleshooting: README.md → Deployment.

---

## 3. Feature Scope

### In scope (v1 — this build)
- **Auth:** signup, login, JWT-based session, protected routes, logout (client-side).
- **Projects (Boards):** create, list (only mine), view one, update, delete (owner only).
- **Tasks:** create inside a project, list per project, update (fields + status), delete.
- **Task status:** `todo` → `in-progress` → `done`.
- **Filtering/search:** filter tasks by status and due date, keyword search on title/description.
- **Authorization:** users only see their own projects/tasks; only the project owner can edit/delete a project.

### Out of scope (deferred to v2, do not build unless explicitly asked)
- Real-time updates (WebSockets/Socket.io)
- File/image uploads
- Multi-user collaboration on a shared project
- Email notifications / password reset
- Payments

**Important for Claude:** if asked to implement something in this "out of scope" list, flag that
it's a v2 feature rather than silently building it into v1.

---

## 4. Backend Architecture

### Folder structure
```
server/
├── config/          db.js               (MongoDB connection)
├── models/          User.js, Project.js, Task.js
├── controllers/     auth.controller.js, project.controller.js, task.controller.js, health.controller.js
├── routes/          auth.routes.js, project.routes.js, task.routes.js, health.routes.js
├── middleware/      auth.middleware.js (protect), validate.middleware.js (express-validator → 400),
│                    error.middleware.js (central error JSON; Mongoose ValidationError/CastError → 400)
├── utils/           generateToken.js
├── .env             (gitignored)
├── .env.example     (committed — variable names only, no secrets)
├── server.js
└── package.json     ("engines": node >=20)
```

Validation rules live in the route files as express-validator chains: `body()` for request
bodies, `query()` for the task filters. Route order is always:
`protect → rules → handleValidation → controller`.

### Data models

**User**
| Field | Type | Notes |
|---|---|---|
| name | String | required |
| email | String | required, unique |
| password | String | required, hashed with bcrypt before save (signup rule: 8+ chars incl. a number) |
| createdAt / updatedAt | Date | automatic (`timestamps: true`) |

**Project**
| Field | Type | Notes |
|---|---|---|
| title | String | required |
| description | String | optional |
| owner | ObjectId | ref → `User` |
| createdAt / updatedAt | Date | automatic (`timestamps: true`) |

Index: `{ owner: 1 }`. Deleting a project also deletes its tasks (`Task.deleteMany`) — MongoDB has
no foreign keys / `ON DELETE CASCADE`, so the controller does it.

**Task**
| Field | Type | Notes |
|---|---|---|
| title | String | required |
| description | String | optional |
| status | String | enum: `todo`, `in-progress`, `done`; default `todo` |
| dueDate | Date | optional |
| project | ObjectId | ref → `Project` |
| createdAt / updatedAt | Date | automatic (`timestamps: true`) |

Index: `{ project: 1, status: 1 }` (compound — serves "tasks of a project" and the status filter).
Ownership of a task is checked through its parent project (task → project → owner).

### API endpoints
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/` | Health check → `{ "status": "ok" }` (Render's health check uses it) | No |
| POST | `/api/auth/signup` | Register a new user | No |
| POST | `/api/auth/login` | Log in, returns JWT | No |
| GET | `/api/projects` | List projects for logged-in user | Yes |
| POST | `/api/projects` | Create a project | Yes |
| GET | `/api/projects/:id` | Get one project (ownership checked) | Yes |
| PUT | `/api/projects/:id` | Update a project (owner only) | Yes |
| DELETE | `/api/projects/:id` | Delete a project (owner only) | Yes |
| GET | `/api/projects/:id/tasks` | List tasks in a project | Yes |
| POST | `/api/projects/:id/tasks` | Create a task in a project | Yes |
| PUT | `/api/tasks/:id` | Update a task (fields or status) | Yes |
| DELETE | `/api/tasks/:id` | Delete a task | Yes |

Query params on the "list tasks" endpoint (implemented and validated with `query()` rules):
`?status=`, `?dueBefore=` / `?dueAfter=` (inclusive, `$lte` / `$gte`), `?search=` (escaped,
case-insensitive regex over title + description, max 100 chars). Each may appear only once.

`GET /api/projects` and `GET /api/projects/:id` also return computed stats per project, from a
single `Task.aggregate()` (`$match` → `$group`): `taskCounts { todo, in-progress, done }`,
`dueSoon` (unfinished tasks due in the next 7 days), and `lastActivity`. The list is sorted by
`lastActivity`, newest first.

Not-found and not-yours both return the same `404`, deliberately, so ids can't be probed.

**Auth flow:** signup hashes password with bcrypt → login verifies password, signs a JWT →
frontend sends JWT in `Authorization: Bearer <token>` header → `auth.middleware.js` verifies
token on protected routes and attaches `req.user`.

**Error handling convention:** use a centralized error-handling middleware; all error responses
should return consistent JSON shape, e.g. `{ "success": false, "message": "..." }`.

---

## 5. Frontend Architecture

### Folder structure
```
client/
├── vercel.json         (SPA rewrite: every path → index.html, so deep links don't 404)
├── .env.example
└── src/
    ├── api/            axios.js  (base instance; request interceptor adds the token,
    │                              response interceptor handles 401 → session expired)
    ├── authStorage.js  (token/user in localStorage or sessionStorage — "Keep me logged in";
    │                    readValidToken() drops an expired token at startup)
    ├── context/        AuthContext.jsx (AuthProvider), authContext.js (context object),
    │                   useAuth.js (hook) — split so Fast Refresh works
    ├── components/     Navbar, ProjectCard, TaskCard, TaskForm, ProjectForm, Modal, Popover,
    │                   PasswordInput, ProtectedRoute, GuestRoute, Logo, Icons
    ├── pages/          Login.jsx, Signup.jsx, Dashboard.jsx, ProjectDetails.jsx
    ├── utils/          date.js (formatting, overdue, due-date presets)
    ├── statusStyles.js (status → Tailwind classes)
    ├── index.css       (Tailwind v4 @theme design tokens from the TaskFlow UI System design)
    ├── App.jsx
    └── main.jsx
```

### Pages
- **Login** — email/password form → `POST /api/auth/login` → stores token.
- **Signup** — name/email/password form → `POST /api/auth/signup`.
- **Dashboard** — lists the user's projects, "New Project" action.
- **Project Details** — shows one project's tasks in three status columns (To Do / In Progress / Done).

### Key components
- **Navbar** — app name, logged-in user, logout.
- **ProjectCard** — project summary on Dashboard.
- **TaskCard** — task summary + quick status change.
- **TaskForm** — create/edit a task.
- **ProjectForm** — create/edit a project, shown in a **Modal**.
- **Popover** — dropdown used for the account menu, ⋮ menus, and the due-date filter.
- **ProtectedRoute** — redirects to `/login` if no valid token in `AuthContext`.
- **GuestRoute** — the reverse: redirects logged-in users away from `/login` and `/signup`.

### Integration flow
1. Login form submits → Axios `POST /api/auth/login`.
2. Backend returns JWT → stored via `AuthContext` (and persisted, e.g. `localStorage`).
3. Every subsequent Axios request attaches the token in the `Authorization` header.
4. Protected pages check `AuthContext` before rendering; otherwise redirect to `/login`.
5. Dashboard fetches projects on mount; Project Details fetches that project's tasks.
6. Task status changes trigger `PUT /api/tasks/:id` and update local state.
7. Filters: search is debounced 300ms; status/date filters fetch immediately; stale requests are
   cancelled with `AbortController`; after a task change while filtered, the list refetches.
8. Any `401` (outside `/auth/*`) → the axios response interceptor calls AuthProvider's handler →
   session cleared → redirect to `/login`.

---

## 6. Roadmap (1 hour/day, 63 days total)

| Phase | Days | Focus |
|---|---|---|
| 1 | 1–9 | Environment setup, Node & Express fundamentals |
| 2 | 10–18 | MongoDB, Mongoose, User model & Authentication |
| 3 | 19–30 | Project & Task APIs (core CRUD) |
| 4 | 31–36 | Filtering, search, validation, error handling |
| 5 | 37–45 | React frontend setup, Auth pages |
| 6 | 46–54 | Dashboard, Project Details, Task UI, integration |
| 7 | 55–63 | Testing, polishing, deployment, documentation |

**Current status:** _(update this line as you progress)_
`▶ On Day: not tracked strictly | Phase: 7 in progress | Done in Phase 7: polish (401 interceptor, expired-token check at startup, GuestRoute, useAuth split), deployment (Render + Vercel + Atlas, live — see §2), documentation (README.md + this file). Also done ahead of plan: TaskFlow UI design, project progress stats (aggregation), query-param validation, indexes. Remaining: (1) user is reviewing ~27 uncommitted files marked with "CHANGE [tag]" comments → trim comments, commit, push (the live site still runs the older commit 41d9df4 until then); (2) fix 4 npm audit vulnerabilities in server/ (plain npm audit fix, not --force); (3) pin engines.node to "24.x"; (4) Jest + Supertest backend tests (postponed by user).`

> Full day-by-day breakdown (all 63 days) lives in the companion Word doc
> `TaskFlow-Project-Plan.docx`. If Claude needs the exact task for a specific day and it isn't
> obvious from the phase above, ask the user which day they're on rather than guessing.

---

## 7. How Claude Should Help in This Project

- **Follow the current phase.** Don't introduce concepts or packages from later phases (e.g. don't
  suggest Socket.io during Phase 3) unless the user explicitly asks to go off-roadmap.
- **Explain backend concepts as you go** — this is a learning project, not a "just ship it" project.
  When introducing something new (middleware, JWT, Mongoose refs, etc.), briefly explain what it
  does and why it's used here, then show the code.
- **Match the architecture above.** Use the folder structure, model fields, and endpoint names
  exactly as defined here so the project stays consistent across sessions.
- **Keep v1 scope disciplined.** Politely flag if a request drifts into "out of scope" (§3) territory.
- **Prefer small, testable steps.** Given the 1-hour/day pace, favor incremental changes over large
  rewrites — one feature or one concept per session, testable in Postman/browser before moving on.
- **When reviewing code**, check against this doc's conventions (error response shape, auth
  middleware pattern, ownership checks) rather than generic "best practices" that might not fit
  a learning-focused MERN project.
- **Remember the end goal**: this same feature set gets rebuilt in FastAPI + SQL later, so where
  relevant (especially data modeling and auth), a short "this is how it differs in SQL" aside is
  welcome — but only as a brief note, not a distraction from the current task.

---

## 8. Quick Reference — Environment Variables

```
PORT=5000
MONGO_URI=<mongodb atlas connection string>
JWT_SECRET=<random secret string>
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173        # CORS allow-list, comma-separated, exact match, no trailing slash
```

(Frontend `.env` — Vite):
```
VITE_API_BASE_URL=http://localhost:5000/api
```

Production values live in the host dashboards, never in git:
- **Render:** `MONGO_URI` (prod user + `taskflow-prod` database), `JWT_SECRET` (different from
  dev), `JWT_EXPIRES_IN`, `CLIENT_URL=https://task-flow-five-wine.vercel.app`. Render sets `PORT`.
- **Vercel:** `VITE_API_BASE_URL=https://task-flow-zzl2.onrender.com/api`. It's baked in at build
  time, so changing it needs a redeploy. Never put secrets in `VITE_` variables.
