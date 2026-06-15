# Development Guide

## Prerequisites

| Tool | Minimum version | Install |
|------|-----------------|---------|
| Python | 3.11 | [python.org](https://python.org) or `pyenv` |
| Node.js | 20 LTS | [nodejs.org](https://nodejs.org) or `nvm` |
| npm | 9+ | Bundled with Node.js |
| Git | 2.40+ | `brew install git` (macOS) |
| PostgreSQL | 14+ | Optional — SQLite is the default for local dev |

---

## First-Time Setup

```bash
git clone https://github.com/KOBOKO23/portfolio.git
cd portfolio
./scripts/setup.sh
```

`setup.sh` does the following in one command:

1. Creates `backend/venv` and installs Python dependencies
2. Copies `backend/.env.example` → `backend/.env`
3. Runs `python manage.py migrate`
4. Runs `python manage.py seed_data` (populates sample content)
5. Creates an `admin / admin123` superuser
6. Runs `npm install` in `src/`
7. Creates `src/.env` with `VITE_API_BASE_URL=http://localhost:8000/api`

---

## Running the Development Stack

```bash
./scripts/dev.sh
```

This starts both servers in parallel and streams their logs with a `[backend]` / `[frontend]` prefix. Press `Ctrl+C` to stop both.

| Service | URL |
|---------|-----|
| Django API | http://localhost:8000/api |
| Django Admin | http://localhost:8000/admin |
| React dev server | http://localhost:5173 |

To start them separately:

```bash
# Terminal 1 — backend
cd backend
source venv/bin/activate
python manage.py runserver

# Terminal 2 — frontend
cd src
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

Copy `backend/.env.example` and fill in the values you need for the features you're working on. Most features work with just `SECRET_KEY` and `DEBUG=True`.

| Variable | Default | Required for |
|----------|---------|--------------|
| `SECRET_KEY` | dev default | Always (auto-generated on setup) |
| `DEBUG` | `True` | — |
| `OPENWEATHER_API_KEY` | — | Weather forecast page (falls back to mock) |
| `STRIPE_SECRET_KEY` | — | Stripe payment flow |
| `DARAJA_CONSUMER_KEY` | — | M-Pesa payment flow |
| `DARAJA_CONSUMER_SECRET` | — | M-Pesa payment flow |
| `EMAIL_HOST_USER` | — | Admin notification emails |
| `EMAIL_HOST_PASSWORD` | — | Admin notification emails |

### Frontend (`src/.env`)

Created automatically by `setup.sh`. Only one variable is needed for local development:

```
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## Common Development Tasks

### Running tests

```bash
./scripts/test.sh               # both backend + frontend
./scripts/test.sh --backend-only
./scripts/test.sh --frontend-only
./scripts/test.sh --e2e         # also runs Playwright E2E
```

### Linting and formatting

```bash
./scripts/lint.sh               # check only
./scripts/lint.sh --fix         # auto-fix ruff violations
```

Individual linters:

```bash
# Backend
cd backend
ruff check . --fix
ruff format .

# Frontend
cd src
npm run lint
npm run format:check
npx prettier --write .
```

### Type-checking

```bash
cd src && npm run typecheck   # tsc --noEmit
```

### Running migrations

```bash
./scripts/migrate.sh

# Or manually
cd backend
python manage.py makemigrations <app_name> --name describe_the_change
python manage.py migrate
```

### Accessing the Django admin

Visit http://localhost:8000/admin and log in with `admin / admin123` (created by `setup.sh`).

### Seeding the database

```bash
cd backend && python manage.py seed_data
```

Seed data is defined in `backend/apps/core/management/commands/seed_data.py`.

### Creating a superuser (manual)

```bash
DJANGO_SU_USERNAME=phil \
DJANGO_SU_EMAIL=kobokophilip@gmail.com \
DJANGO_SU_PASSWORD=changeme \
./scripts/createsuperuser.sh
```

### Backing up local data

```bash
./scripts/backup.sh           # database only
./scripts/backup.sh --full    # database + media files
```

---

## IDE Setup

### VS Code

Recommended extensions:

- **Python** (`ms-python.python`) — Django, venv integration, debugger
- **Pylance** (`ms-python.vscode-pylance`) — type checking
- **Ruff** (`charliermarsh.ruff`) — linting + formatting
- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)

Recommended `settings.json` (workspace):

```json
{
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.formatOnSave": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  },
  "python.defaultInterpreterPath": "./backend/venv/bin/python"
}
```

---

## Switching to PostgreSQL Locally

By default, local development uses SQLite. To use PostgreSQL:

```bash
# Ensure PostgreSQL is running locally
./scripts/pg_switch.sh portfolio postgres
```

This exports your SQLite data, creates the PostgreSQL database, updates `backend/.env`, runs migrations, and loads the exported data.

---

## Debugging

### Backend

Set a breakpoint using Python's built-in debugger:

```python
import pdb; pdb.set_trace()
```

Or use VS Code's Django debug configuration. Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Django",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/backend/manage.py",
      "args": ["runserver"],
      "django": true,
      "env": { "PYTHONPATH": "${workspaceFolder}/backend" }
    }
  ]
}
```

### Frontend

The Vite dev server includes full source maps. Use Chrome DevTools or VS Code's browser debugger.

For React component state, install [React Developer Tools](https://react.dev/learn/react-developer-tools).

---

## Pre-Deploy Verification

Before pushing to `production`, run:

```bash
./scripts/deploy-check.sh
```

This validates:
- Django `check --deploy` (no warnings)
- No pending migrations
- `pip check` (no broken requirements)
- TypeScript compiles cleanly
- Vite builds successfully
