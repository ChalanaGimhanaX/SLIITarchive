# SLIIT Uni Archive Platform

A community-driven archive for SLIIT past papers, lecture notes, tutorials, and other study material. The platform is designed around a Django backend, a modern SPA frontend, PostgreSQL full-text search, and an approval workflow so public search stays clean and trustworthy.

## Product Goals

- Make it easy for students to discover academic resources by module, document type, and keyword.
- Keep moderation lightweight by leaning on Django Admin instead of building a custom back office too early.
- Support deep search inside uploaded PDFs through asynchronous text extraction.
- Stay cost-conscious by using PostgreSQL native search and Cloudflare R2 instead of a heavier search/storage stack.

## Recommended Stack

- Backend: Django, Django REST Framework, SimpleJWT
- Database: PostgreSQL
- Search: PostgreSQL `SearchVectorField` + `GIN` indexes
- Background jobs: Celery + Redis
- File storage: Cloudflare R2 through `django-storages` and `boto3`
- Frontend: React + Vite + TypeScript
- Observability: Sentry, structured logging
- API docs: OpenAPI / Swagger

## Target Repository Structure

```text
Sliit_database/
|-- backend/
|   |-- config/
|   |-- apps/
|   |   |-- accounts/
|   |   |-- taxonomy/
|   |   |-- documents/
|   |   `-- moderation/
|   |-- requirements/
|   |-- manage.py
|   `-- .env.example
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- features/
|   |   |-- pages/
|   |   |-- routes/
|   |   `-- lib/
|   |-- public/
|   `-- .env.example
|-- docs/
|   `-- IMPLEMENTATION_BLUEPRINT.md
|-- docker-compose.yml
`-- README.md
```

## Delivery Strategy

### MVP

- Custom user model with role support
- Taxonomy management for faculties, degrees, and modules
- PDF upload flow to Cloudflare R2
- Celery-based PDF text extraction
- Moderation queue in Django Admin
- Public search across approved documents only
- User dashboard for upload history and status

### V2

- Duplicate detection UI
- Report/flag content flow
- Preview thumbnails or first-page previews
- Search suggestions and popularity ranking
- Auto-suggest module tags from extracted text
- Notifications for approval or rejection

## Core Decisions

- Use Django Admin as the first moderation interface to reduce custom dashboard work.
- Use PostgreSQL full-text search before considering Elasticsearch or Meilisearch.
- Keep module tagging manual for MVP, but support automatic module suggestions later.
- Restrict public discovery to approved documents only.

## What This Repo Needs Next

1. Scaffold the backend Django project and apps.
2. Scaffold the React frontend with routing and a shared API client.
3. Set up PostgreSQL, Redis, and local development via Docker Compose.
4. Implement the models and migrations described in [`docs/IMPLEMENTATION_BLUEPRINT.md`](/c:/Users/Chalana/Documents/Sliit_database/docs/IMPLEMENTATION_BLUEPRINT.md).
5. Build the upload, processing, moderation, and search flows in that order.

## Blueprint

The detailed execution plan lives in [`docs/IMPLEMENTATION_BLUEPRINT.md`](/c:/Users/Chalana/Documents/Sliit_database/docs/IMPLEMENTATION_BLUEPRINT.md).
