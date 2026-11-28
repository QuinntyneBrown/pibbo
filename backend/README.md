# Pibbo content service

A small .NET 10 service that serves Pibbo's content: activities, lessons, and the pictures and
recordings they need. It is read-only and holds nothing about a child
([ADR 0022](../docs/adr/0022-content-backend.md)). The frontend does not call it yet.

## Run it

```bash
cd backend/src/Pibbo.Api
dotnet run
```

It listens on `http://localhost:5183`, creates its SQLite database in `src/Pibbo.Api/data/`,
publishes `backend/content/content.json` into it and serves the pictures and recordings already
in `frontend/projects/pibbo/public`.

```bash
cd backend
dotnet test
```

runs the acceptance tests. They host the API in memory and call it over HTTP, each test on
its own database: EF Core InMemory, and a real SQLite file for the database tests.

## The API

| Request | Answers |
|---------|---------|
| `GET /api/v1/content/manifest` | The content version, every activity and lesson, and every asset path. |
| `GET /api/v1/activities/{id}` | One activity. |
| `GET /api/v1/lessons/{id}` | One lesson. |
| `GET /pictures/…`, `GET /recordings/…` | A picture or a recording. |
| `GET /health/live` | 200 while the process runs. |
| `GET /health/ready` | 200 while checked content can be served, otherwise 503. |
| `GET /openapi/v1.json` | The OpenAPI 3.1 contract. |

- **The contract** is committed as [`openapi/v1.json`](openapi/v1.json). Generate a client from
  that file; each operation has an id (`getManifest`, `getActivity`, `getLesson`). A test fails
  when the API drifts from it. To publish a deliberate change, run
  `PIBBO_UPDATE_OPENAPI=1 dotnet test` and commit the file.
- **Caching.** Each content response carries an `ETag`. Send it back as `If-None-Match` and the
  answer is 304 until the content changes.
- **Errors** are RFC 9457 problem details (`application/problem+json`) with a `traceId` that
  matches the log: 400 with an `errors` object naming each field for an id that does not match
  `^[a-z0-9-]{1,64}$`, 404, 405 for any write, 429 with `Retry-After`, 500 and 503.
- **Versioning.** A breaking change is a new `/api/v2`; `/api/v1` only gains optional fields.

## Content

`content.json` is one reviewed file:

```json
{
  "version": "2026.11.0",
  "activities": [
    {
      "id": "count-the-toys",
      "group": "count",
      "name": "Count the toys",
      "glyph": "1 2 3",
      "recording": "/recordings/home/count-the-toys.wav",
      "pictures": [],
      "recordings": []
    }
  ],
  "lessons": []
}
```

Content is served from the database. The file is how a reviewed version gets there: when the
file changes, it is checked and, if it passes, published as a new version; the newest version
is served. No restart is needed.

- **The check:** ids are well formed and unique, text is 1 to 80 plain characters, every path
  is under `/pictures/` or `/recordings/` and its file exists, and a lesson names only
  activities that exist.
- **A file that fails is not published.** The last good version stays served and the reason is
  in the log. With no published version at all, `/health/ready` answers 503.
- **A published version is never rewritten.** Changed content needs a new `version`.

The file in `content/` lists the activities Home offers today; which numbers, sounds and words
they cover is not decided here.

## Database

SQLite through EF Core, with three tables: `content_versions`, `activities` and `lessons`. It
has no table for anything else. Migrations are applied when the service first reads the
database. To add one after changing the model:

```bash
dotnet ef migrations add <Name> --project src/Pibbo.Infrastructure --startup-project src/Pibbo.Infrastructure --output-dir Persistence/Migrations
```

To use another database, change the provider in `InfrastructureServices.AddInfrastructure` and
regenerate the migrations; nothing outside `Pibbo.Infrastructure` knows which one it is.

## Settings

Each can be set in `appsettings.json` or as an environment variable (`Content__Root`).

| Setting | Default | Meaning |
|---------|---------|---------|
| `ConnectionStrings:Content` | `Data Source={app}/data/pibbo-content.db` | The SQLite connection string. `/data/pibbo-content.db` in the image. |
| `Content:Root` | `content` | The folder that holds `content.json`. Relative to the application. |
| `Content:AssetsRoot` | `{Content:Root}/assets` | The folder that holds `pictures/` and `recordings/`. |
| `Transport:RequireHttps` | `true` | Redirect HTTP to HTTPS (308). Health probes are not redirected. |
| `Transport:HttpsPort` | `443` | The port the redirect names. |
| `Cors:FrontendOrigin` | empty | The one other origin allowed to read. Empty allows none: serve the frontend from the same origin. |
| `RateLimit:RequestsPerMinute` | `300` | Requests one client may make in a minute before 429. Health probes are not counted. |
| `Serilog:MinimumLevel` | `Information`; `Warning` for ASP.NET Core and EF Core | What is logged. Standard Serilog configuration. |
| `ASPNETCORE_FORWARDEDHEADERS_ENABLED` | unset | Set to `true` behind a proxy that ends TLS, so the redirect and the rate limit see the real scheme and client. |
| `ASPNETCORE_HTTP_PORTS` | `8080` in the image | The port it listens on. |

In `Development` the content is read from this repository, HTTPS is not required and
`http://localhost:4200` may read.

## Container

```bash
docker build -t pibbo-api backend
```

```bash
docker run --read-only -p 8080:8080 -v /path/to/content:/app/content:ro -v pibbo-data:/data pibbo-api
```

Both base images are pinned by digest and the service runs as a non-root user with no shell.
The content folder holds `content.json` and `assets/`; the database is kept in `/data`. Move traffic only after `/health/ready`
answers 200, and promote the same image between environments.

## What it never does

- It accepts GET and HEAD only. There is no write endpoint, no sign-in and no admin area.
- It sets no cookie and reads none.
- Its log (Serilog, one line of JSON per event) holds a timestamp, method, route template,
  status, duration and trace id. It never holds a path, a query string, a header, a cookie or
  an address: what ASP.NET Core's request scope would add is taken off, and a caller's trace
  id is not adopted.
- The rate limit counts by address in memory only.

## Layout

| Project | Holds | Depends on |
|---------|-------|------------|
| `Pibbo.Domain` | Activities, lessons, the id rule and the content check. | nothing |
| `Pibbo.Application` | MediatR queries and handlers, FluentValidation validators, the validation pipeline behaviour and the `IContentStore` contract. | `Pibbo.Domain` |
| `Pibbo.Infrastructure` | The EF Core context and migrations, the store that reads them and the publisher that fills them from the file. | `Pibbo.Application` |
| `Pibbo.Api` | Endpoints, contracts, middleware, health and Serilog. | `Pibbo.Application`, `Pibbo.Infrastructure` |

An endpoint sends one MediatR request. Its validator runs first, so a malformed id never reaches
a handler or the database. MediatR is pinned to 12.x, the last Apache-licensed line; 13 and
later need a commercial licence key.

## Not built yet

- Content administration (`L2-031`): no OIDC and no upload. Content changes by replacing the file.
- A metrics exporter. ASP.NET Core records `http.server.request.duration` by route and status;
  add an OpenTelemetry exporter where it is deployed.
- The generated Angular client, the CI job and the deployment with automatic rollback.
