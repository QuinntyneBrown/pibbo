# Pibbo content service

A small .NET 10 service that serves Pibbo's content: activities, lessons, and the pictures and
recordings they need. It is read-only and holds nothing about a child
([ADR 0034](../docs/adr/0034-content-backend.md)). Staff with the `content-editor` role upload
pictures and recordings and publish content versions. The frontend does not call it yet; its
types for it are generated from the contract.

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
| `GET /metrics` | OpenTelemetry metrics in the Prometheus format. |
| `GET /openapi/v1.json` | The public OpenAPI 3.1 contract. |
| `GET /openapi/admin.json` | The administration contract. |
| `PUT /api/v1/admin/assets/{folder}/{path}` | Staff: stores a picture or a recording. |
| `POST /api/v1/admin/content/versions` | Staff: publishes a reviewed content version. |

- **The contracts** are committed as [`openapi/v1.json`](openapi/v1.json) and
  [`openapi/admin.json`](openapi/admin.json), with descriptions from the code's doc comments.
  The frontend's types are generated from `v1.json` by
  [`tools/content-api/generate-client.mjs`](../tools/content-api/generate-client.mjs), and every
  frontend build fails if they drift. Generate any other client from those files; each operation has an id (`getManifest`, `getActivity`, `getLesson`). A test fails
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
| `Transport:RequireHttps` | `true` | Redirect HTTP to HTTPS (308). Health probes and `/metrics` are not redirected. |
| `Transport:HttpsPort` | `443` | The port the redirect names. |
| `Cors:FrontendOrigin` | empty | The one other origin allowed to read. Empty allows none: serve the frontend from the same origin. |
| `RateLimit:RequestsPerMinute` | `300` | Requests one client may make in a minute before 429. Health probes and `/metrics` are not counted. |
| `Authentication:Schemes:Bearer:ValidIssuer`, `ValidAudiences`, `SigningKeys` | none | The staff tokens trusted. `dotnet user-jwts` writes them in Development. None trusts no token. |
| `Authentication:Schemes:Bearer:Authority` | none | An OIDC provider whose tokens are trusted instead of local keys. |
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

## Administration

Only `/api/v1/admin` accepts writes, and only with a bearer token carrying the
`content-editor` role: 401 without a trusted token, 403 without the role. There is no OIDC
provider for the MVP: tokens are signed with keys configured under
`Authentication:Schemes:Bearer`. With nothing configured, no token is trusted. To trust an
OIDC provider later, set `Authentication:Schemes:Bearer:Authority` (and the audience) instead.

Locally:

```bash
cd backend/src/Pibbo.Api
dotnet user-jwts create --role content-editor --name editor --output token
```

```bash
curl -X PUT --data-binary @cat.ogg -H "Authorization: Bearer $TOKEN" http://localhost:5183/api/v1/admin/assets/recordings/words/cat.ogg
```

```bash
curl -X POST --json @content.json -H "Authorization: Bearer $TOKEN" http://localhost:5183/api/v1/admin/content/versions
```

- **Uploads** are checked by their bytes, never their declared type: MP3 or Ogg recordings of
  at most 1 MB under `/recordings`, WebP or SVG pictures of at most 2 MB under `/pictures`,
  named for what they are. Anything else is 415, anything larger 413, and nothing past 2 MB is
  read. An SVG is stored sanitised: no script, style, `foreignObject`, animation, event handler
  or reference outside the drawing. A path is lowercase letters, digits, hyphens and
  underscores, and never leaves its folder.
- **Publishing** runs the same check as the content file, then adds the version; a version
  already published is 409. Text is 1 to 80 characters of letters, digits, spaces and
  `' ’ - ? ! . , + _ ♪`.
- **In Development** uploads land in `frontend/projects/pibbo/public`, where the bundled
  recordings and pictures are served from. Delete what you try out, or point
  `Content:AssetsRoot` at a copy.

## What it never does

- It accepts GET and HEAD only, except under `/api/v1/admin` with a staff token.
- It sets no cookie and reads none.
- Its log (Serilog, one line of JSON per event) holds a timestamp, method, route template,
  status, duration and trace id. It never holds a path, a query string, a header, a cookie, a
  token or an address: what ASP.NET Core's request scope would add is taken off, and a
  caller's trace id is not adopted.
- Its metrics are labelled by method, route template and status only.
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

## Deploy

[`deploy/compose.yaml`](deploy/compose.yaml) runs the service as a Docker Swarm stack, and
[`deploy/deploy.sh`](deploy/deploy.sh) deploys one image:

```bash
PIBBO_CONTENT_DIR=/srv/pibbo/content backend/deploy/deploy.sh registry.example/pibbo-api@sha256:<digest>
```

A release starts beside the one running and gets traffic only once its health check, the app's
own readiness probe (`dotnet Pibbo.Api.dll probe`), passes. If it never does, the update rolls
back on its own and the script exits 1; the release before it served throughout. Build the
image once and deploy the same digest to every environment.

| Variable | Meaning |
|----------|---------|
| `PIBBO_CONTENT_DIR` | The folder with `content.json` and `assets/`, mounted at `/app/content`. |
| `PIBBO_FRONTEND_ORIGIN` | `Cors:FrontendOrigin`, if the frontend is on another origin. |
| `PIBBO_PORT` | The published port (8080). TLS ends at the proxy in front. |
| `PIBBO_REPLICAS` | How many instances (1). They share the SQLite volume, so keep them on one node. |
| `PIBBO_STACK` | The stack name (`pibbo`). |

## Checks

CI builds the backend, checks its format, fails on a high or critical vulnerable package (NuGet
audit and [`tools/audit-packages.sh`](tools/audit-packages.sh)), runs one critical acceptance
path per feature (`--filter Category=Critical`), builds the image and checks it runs read-only,
non-root and ready. `node tools/verify/verify.mjs` at the repository root runs every test.

## Open

- Which content moves from the frontend to this service, and when.
- An OIDC provider for staff, and the production platform.
- Uploading WAV and JPEG, which the bundled content uses but `L2-031` does not allow.
- A load test of the API (`L2-032` #4).
