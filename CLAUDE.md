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
- Backend hosting: Render or Railway
- DB hosting: MongoDB Atlas
- Frontend hosting: Vercel or Netlify

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
├── controllers/     auth.controller.js, project.controller.js, task.controller.js
├── routes/          auth.routes.js, project.routes.js, task.routes.js
├── middleware/       auth.middleware.js, error.middleware.js
├── utils/           generateToken.js
├── .env
├── server.js
└── package.json
```

### Data models

**User**
| Field | Type | Notes |
|---|---|---|
| name | String | required |
| email | String | required, unique |
| password | String | required, hashed with bcrypt before save |
| createdAt | Date | default now |

**Project**
| Field | Type | Notes |
|---|---|---|
| title | String | required |
| description | String | optional |
| owner | ObjectId | ref → `User` |
| createdAt | Date | default now |

**Task**
| Field | Type | Notes |
|---|---|---|
| title | String | required |
| description | String | optional |
| status | String | enum: `todo`, `in-progress`, `done`; default `todo` |
| dueDate | Date | optional |
| project | ObjectId | ref → `Project` |
| createdAt | Date | default now |

### API endpoints
| Method | Endpoint | Description | Auth |
|---|---|---|---|
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

Query params to support on the "list tasks" endpoint once basic CRUD works:
`?status=`, `?dueBefore=` / `?dueAfter=`, `?search=`.

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
└── src/
    ├── api/            axios.js  (base API instance)
    ├── context/        AuthContext.jsx
    ├── components/     Navbar, ProjectCard, TaskCard, TaskForm, ProtectedRoute
    ├── pages/          Login.jsx, Signup.jsx, Dashboard.jsx, ProjectDetails.jsx
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
- **ProtectedRoute** — redirects to `/login` if no valid token in `AuthContext`.

### Integration flow
1. Login form submits → Axios `POST /api/auth/login`.
2. Backend returns JWT → stored via `AuthContext` (and persisted, e.g. `localStorage`).
3. Every subsequent Axios request attaches the token in the `Authorization` header.
4. Protected pages check `AuthContext` before rendering; otherwise redirect to `/login`.
5. Dashboard fetches projects on mount; Project Details fetches that project's tasks.
6. Task status changes trigger `PUT /api/tasks/:id` and update local state.

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
`▶ On Day: not tracked strictly | Phase: 5 in progress | Last completed task: Backend feature-complete (auth, Project/Task CRUD, filtering, validation) and pushed to GitHub (Lakshminarayanan81/Task-Flow, branch main). Frontend started: Vite + React scaffold, Tailwind v4, client/src/api/axios.js, client/src/context/AuthContext.jsx, BrowserRouter/AuthProvider/Toaster in main.jsx, placeholder Login/Signup pages. Next: real Login page (react-hook-form + useAuth + toast).`

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
```

(Frontend `.env` — Vite):
```
VITE_API_BASE_URL=http://localhost:5000/api
```
