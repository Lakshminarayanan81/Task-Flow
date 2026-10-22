# TaskFlow

A full-stack project and task manager in the spirit of a mini Trello: sign up, create projects, and move tasks across a **To Do → In Progress → Done** board, with search and due-date filters.

Built with the MERN stack (MongoDB, Express, React, Node.js) as a backend learning project. The same app will later be rebuilt with Python + FastAPI + SQL to compare the two approaches.

**Live app:** https://task-flow-five-wine.vercel.app
**API:** https://task-flow-zzl2.onrender.com

> The API runs on Render's free tier, which sleeps after ~15 minutes without traffic. The first request after that can take 30–60 seconds while it wakes up.

---

## Features

- **Accounts** — sign up and log in with email and password. Passwords are hashed with bcrypt; sessions use JWTs. "Keep me logged in" chooses between staying signed in and signing out when the tab closes.
- **Projects** — create, edit, and delete your own projects. Each card shows progress (e.g. *9 / 14 done*), a count per status, and when it was last active. Deleting a project also deletes its tasks.
- **Task board** — three columns (To Do, In Progress, Done). Add, edit, and delete tasks; change status from the card; overdue tasks are highlighted.
- **Filtering and search** — filter by status and due date (today, this week, this month, or a custom range) and search titles and descriptions. Filtering runs on the server.
- **Privacy** — you only ever see your own projects and tasks. Requests for anyone else's data return `404`.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19 (Vite), React Router, Axios, React Hook Form, Tailwind CSS v4, react-hot-toast |
| Backend | Node.js, Express 5, Mongoose 9, express-validator, jsonwebtoken, bcrypt |
| Database | MongoDB Atlas |
| Hosting | Vercel (frontend), Render (backend) |

## Project structure

```
Task Flow/
├── server/                      Express API
│   ├── config/db.js             MongoDB connection
│   ├── models/                  User, Project, Task (Mongoose schemas + indexes)
│   ├── controllers/             auth, project, task, health — request handlers
│   ├── routes/                  URL → validation → controller wiring
│   ├── middleware/
│   │   ├── auth.middleware.js       protect: verifies the JWT, sets req.user
│   │   ├── validate.middleware.js   turns express-validator failures into 400s
│   │   └── error.middleware.js      single place that formats every error response
│   ├── utils/generateToken.js   signs JWTs
│   ├── server.js                app entry point
│   └── .env.example
└── client/                      React app
    ├── src/
    │   ├── api/axios.js         API client: attaches the token, handles expired sessions
    │   ├── authStorage.js       where the session lives (localStorage / sessionStorage)
    │   ├── context/             AuthProvider + useAuth hook
    │   ├── pages/               Login, Signup, Dashboard, ProjectDetails
    │   ├── components/          cards, forms, Navbar, Modal, Popover, route guards…
    │   ├── utils/date.js        date formatting, overdue, due-date presets
    │   └── index.css            Tailwind theme (design tokens)
    ├── vercel.json              SPA rewrite for deep links
    └── .env.example
```

---

## Running it locally

**You'll need:** Node.js 20 or newer, and a MongoDB database (a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster works).

### 1. Backend

```bash
cd server
cp .env.example .env      # then fill in the values — see "Environment variables" below
npm install
npm run dev               # http://localhost:5000
```

You should see `Server is running on port 5000` and `MongoDB connected`. If you use Atlas, add your IP address under **Network Access** first.

### 2. Frontend

In a second terminal:

```bash
cd client
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

Open http://localhost:5173 and sign up.

### Scripts

| Where | Command | What it does |
|---|---|---|
| `server/` | `npm run dev` | Starts the API with nodemon (restarts on file changes) |
| `server/` | `npm start` | Starts the API with plain Node — used in production |
| `client/` | `npm run dev` | Vite dev server with hot reload |
| `client/` | `npm run build` | Production build into `client/dist/` |
| `client/` | `npm run preview` | Serves the production build locally (http://localhost:4173) |
| `client/` | `npm run lint` | ESLint |

## Environment variables

### Backend (`server/.env`)

| Variable | Example | Purpose |
|---|---|---|
| `PORT` | `5000` | Port to listen on. Hosts like Render set this themselves. |
| `MONGO_URI` | `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/taskflow?retryWrites=true&w=majority` | Database connection string. The part after `.net/` is the database name. |
| `JWT_SECRET` | a long random string | Signs and verifies login tokens. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `7d` | How long a login lasts. |
| `CLIENT_URL` | `http://localhost:5173` | Frontend origin(s) allowed by CORS. Comma-separate several. Must match exactly — scheme, host, port, **no trailing slash**. Defaults to `http://localhost:5173`. |

### Frontend (`client/.env`)

| Variable | Example | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | Base URL for every API call. **Vite builds this into the JavaScript at build time**, so it's visible to anyone and changing it requires a rebuild. Never put secrets in `VITE_` variables. |

---

## API reference

Base URL: `/api` (e.g. `https://task-flow-zzl2.onrender.com/api`).

### Authentication

Protected endpoints need the token from signup/login in a header:

```
Authorization: Bearer <token>
```

A missing, invalid, or expired token returns `401`.

### Endpoints

| Method | Endpoint | Auth | Body / query | Success |
|---|---|---|---|---|
| `GET` | `/` *(no `/api`)* | — | — | `200` `{ "status": "ok" }` — health check |
| `POST` | `/api/auth/signup` | — | `name`, `email`, `password` | `201` user + token |
| `POST` | `/api/auth/login` | — | `email`, `password` | `200` user + token |
| `GET` | `/api/projects` | ✓ | — | `200` your projects, with stats |
| `POST` | `/api/projects` | ✓ | `title`, `description?` | `201` new project |
| `GET` | `/api/projects/:id` | ✓ | — | `200` one project, with stats |
| `PUT` | `/api/projects/:id` | ✓ | `title?`, `description?` | `200` updated project |
| `DELETE` | `/api/projects/:id` | ✓ | — | `200` — also deletes the project's tasks |
| `GET` | `/api/projects/:id/tasks` | ✓ | query: `status?`, `dueAfter?`, `dueBefore?`, `search?` | `200` matching tasks |
| `POST` | `/api/projects/:id/tasks` | ✓ | `title`, `description?`, `status?`, `dueDate?` | `201` new task |
| `PUT` | `/api/tasks/:id` | ✓ | `title?`, `description?`, `status?`, `dueDate?` | `200` updated task |
| `DELETE` | `/api/tasks/:id` | ✓ | — | `200` |

`?` = optional.

### Validation rules

| Field | Rule |
|---|---|
| `name` | required |
| `email` | valid email address |
| `password` (signup) | at least 8 characters, including a number |
| `title` | required on create; if sent on update, can't be empty |
| `status` | one of `todo`, `in-progress`, `done` — defaults to `todo` |
| `dueDate` | ISO 8601 date, e.g. `2026-10-15`. On `PUT`, send `null` to clear it. |
| `status` / `dueAfter` / `dueBefore` (query) | same formats as above; each may appear once |
| `search` (query) | up to 100 characters; matches title or description, case-insensitive |

Date filters are inclusive. `dueAfter=2026-10-01&dueBefore=2026-10-31` returns tasks due during October. Tasks without a due date never match a date filter.

### Responses

Every response uses the same envelope.

**Success:**
```json
{ "success": true, "data": { ... } }
```
Signup and login also include `"token": "<jwt>"`.

**Project objects** from `GET /api/projects` and `GET /api/projects/:id` include computed stats:
```json
{
  "_id": "6aaf8e1c2af9829559bb51df",
  "title": "Mobile App Redesign",
  "description": "Refresh onboarding and settings",
  "owner": "6a4a8aec16e6fe6352b05465",
  "createdAt": "2026-09-20T07:41:16.742Z",
  "updatedAt": "2026-09-20T07:41:16.742Z",
  "taskCounts": { "todo": 3, "in-progress": 2, "done": 9 },
  "dueSoon": 2,
  "lastActivity": "2026-10-20T09:12:03.120Z"
}
```
`dueSoon` counts unfinished tasks due in the next 7 days.

**Error:**
```json
{ "success": false, "message": "Title is required" }
```
Validation errors also include an `errors` array with one entry per failed field.

| Status | Meaning |
|---|---|
| `400` | Invalid input — failed validation, a malformed id, or an email that's already registered |
| `401` | Not logged in, invalid/expired token, or wrong email/password |
| `404` | Doesn't exist **or** belongs to another user (deliberately indistinguishable) |
| `500` | Unexpected server error |

### Example

```bash
# Log in
curl -X POST https://task-flow-zzl2.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword1"}'

# Use the returned token
curl "https://task-flow-zzl2.onrender.com/api/projects" \
  -H "Authorization: Bearer <token>"
```

---

## Deployment

| Part | Host | Key settings |
|---|---|---|
| Database | MongoDB Atlas | Separate user and database for production. Network Access `0.0.0.0/0`, since Render's free tier has no fixed IP. |
| Backend | Render (Web Service) | Root directory `server` · Build `npm ci` · Start `npm start` · Health check `/` · Env: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL` |
| Frontend | Vercel | Root directory `client` · Framework Vite · Env: `VITE_API_BASE_URL` |

Both hosts redeploy automatically on every push to `main`.

Things that commonly go wrong:
- **CORS error in the browser** — `CLIENT_URL` on the backend doesn't exactly match the frontend's address (check `https://` and trailing slashes).
- **`bad auth : authentication failed`** — wrong username or password in `MONGO_URI`; note the database user is separate from your Atlas website login.
- **404 when refreshing a page** — the SPA rewrite in `client/vercel.json` is missing.
- **Frontend still calling the old API** — `VITE_API_BASE_URL` changed without a redeploy.

## Known limitations

- **No automated tests yet** — Jest + Supertest backend tests are planned.
- **Logout is client-side** — JWTs are stateless, so a token stays valid until it expires (7 days) even after logout.
- **Search is a regular-expression scan** — fine at this scale; a MongoDB text index would be needed for large data.
- **Cold starts** on Render's free tier (see the note at the top).

## Roadmap

- [x] Auth, projects, and tasks (CRUD) with per-user ownership
- [x] Filtering, search, validation, centralized error handling
- [x] React frontend with the TaskFlow UI design
- [x] Deployment (Render + Vercel + Atlas)
- [ ] Automated backend tests
- [ ] v2 ideas: real-time updates, shared projects, password reset, file attachments
- [ ] Rebuild with Python + FastAPI + SQL for comparison
