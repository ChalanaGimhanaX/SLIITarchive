# SLIIT Archive

Community archive platform for SLIIT study material, past papers, lecture notes, tutorials, and related academic resources.

The project combines a Django REST backend with a React and TypeScript frontend. It is designed around searchable approved documents, authenticated uploads, moderation workflows, analytics, and storage that can run locally or with Cloudflare R2.

## Features

- Public document discovery with module, document-type, and keyword search
- Student upload flow with authentication
- Moderation queue for approving, rejecting, and reprocessing documents
- Django Admin support for operational review
- PDF text extraction through Celery tasks
- PostgreSQL full-text search support
- Analytics for visitors, page views, downloads, users, and popular documents
- React frontend with dashboard, search, admin, support, privacy, and upload pages
- Vercel-ready root deployment shape for frontend and API routes

## Technology

| Area | Stack |
| --- | --- |
| Backend | Django, Django REST Framework, SimpleJWT |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Search | PostgreSQL full-text search |
| Jobs | Celery, Redis |
| Storage | Local media or Cloudflare R2 through `django-storages` |
| API docs | drf-spectacular / OpenAPI |

## Repository Structure

```text
backend/           # Django project, apps, API routes, Celery setup
sliitui/           # React and TypeScript frontend
api/               # Vercel API entrypoints
docs/              # Implementation notes and blueprint
docker-compose.yml # Local service dependencies
vercel.json        # Root deployment config
```

Core Django apps:

- `accounts` - users, roles, JWT auth, profile endpoints
- `taxonomy` - faculties, degrees, modules, and document classification
- `documents` - uploads, approved document search, user document views
- `moderation` - review queue, actions, reports, logs
- `analytics` - event tracking and dashboard summaries

## Local Development

Install backend dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run Django:

```bash
cd backend
python manage.py migrate
python manage.py runserver
```

Run the frontend:

```bash
cd sliitui
npm install
npm run dev
```

## Environment

Start from the sample files:

- `.env.example`
- `backend/.env.example`
- `sliitui/.env.example`

Minimum local values usually include a Django secret key, database configuration, allowed hosts, CORS origins, and frontend API base URL.

## Deployment Notes

Deploy the repository root on Vercel, not only the `sliitui` folder. The root `vercel.json` builds the Vite frontend from `sliitui`, exposes Django through root API functions, and falls back non-API routes to the SPA entrypoint.

Minimum production environment variables:

- `DJANGO_SECRET_KEY`
- `DATABASE_URL`

Recommended production variables:

- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_CORS_ALLOWED_ORIGINS`
- `CLOUDFLARE_R2_*` values for persistent file uploads

## Documentation

The detailed implementation plan is in [docs/IMPLEMENTATION_BLUEPRINT.md](docs/IMPLEMENTATION_BLUEPRINT.md).
