# LeadFlow — Lead Management System (Mini CRM)

React SPA → FastAPI REST API → SQLAlchemy → SQLite (dev) / PostgreSQL (prod).
Demo login: `demo@leadflow.com` / `Demo@1234` · Live link: _add after deployment_

## Features
Register/login (JWT), per-user lead isolation, lead CRUD, inline status change (optimistic), debounced search, status/source filters, sorting, pagination, dashboard stats (single `GROUP BY` query), responsive UI.

## Tech stack and justification
- **FastAPI instead of Express:** Pydantic type-driven validation, automatic Swagger docs at `/docs` (reviewers can test instantly), async support, little boilerplate.
- **SQLAlchemy 2.0 + PostgreSQL instead of MongoDB:** leads are structured relational data with fixed fields and enums; SQL gives constraints, unique indexes and efficient `GROUP BY` aggregation. SQLite is the zero-setup default; set `DATABASE_URL` for PostgreSQL (`postgres://` is rewritten to `postgresql://`).
- **React + Vite + Tailwind** frontend.

## Architecture
Routers (`routers/`) → schemas (validation) → models (ORM). JWT (HS256, Bearer) issued at login; every lead query filters by `owner_id = current_user.id`, so data is isolated per user. Index on `(owner_id, status, created_at)`; unique `(owner_id, email)` returns 409 on duplicates. Responses use `{success, message, data, meta}` / `{success:false, message, errors[]}`.

## Folder structure
`server/app/{main,config,database,models,schemas,security,seed}.py`, `server/app/routers/{auth,leads}.py`, `client/src/{api.js,AuthContext.jsx,constants.js,pages/,components/}`.

## Local setup (Python 3.10+, Node 18+)
```bash
cd server && python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python -m app.seed
uvicorn app.main:app --reload --port 8000
# new terminal
cd client && cp .env.example .env && npm install && npm run dev
```
Swagger docs: http://localhost:8000/docs

## Environment variables
| Server | Default | Purpose |
|---|---|---|
| DATABASE_URL | sqlite:///./leadflow.db | DB connection |
| SECRET_KEY | — | JWT secret (required if `ENV=production`) |
| ACCESS_TOKEN_EXPIRE_MINUTES | 10080 | Token lifetime |
| CLIENT_URL | http://localhost:5173 | Allowed CORS origin |

Client: `VITE_API_URL=http://localhost:8000/api`

## API (base `/api`; all lead routes need `Authorization: Bearer <token>`)
| Method | Path | Notes |
|---|---|---|
| GET | /health | liveness |
| POST | /auth/register, /auth/login | returns `{token, user}` |
| GET | /auth/me | current user |
| GET | /leads | `search,status,source,page,limit,sort_by,order` |
| GET | /leads/stats | counts per status |
| POST | /leads | 201 |
| GET/PUT/DELETE | /leads/{id} | 404 if not owned |
| PATCH | /leads/{id}/status | `{"status":"Contacted"}` |

Error example (422): `{"success":false,"message":"Validation failed","errors":[{"field":"phone","message":"Phone must be 10 digits, optionally with a country code (e.g. +91 9876543210)"}]}`

## Deployment
DB on Neon/Supabase/Render Postgres → backend on Render (build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, set `DATABASE_URL`, `SECRET_KEY`, `CLIENT_URL`, `ENV=production`) → frontend on Vercel/Netlify (SPA rewrite to `index.html`, set `VITE_API_URL`).

## Screenshots to capture in `/screenshots`
login, dashboard desktop, dashboard mobile, add-lead modal, filters in action, Swagger `/docs`.

## Future improvements
Alembic migrations, tests, CSV import/export, activity timeline, refresh tokens.
