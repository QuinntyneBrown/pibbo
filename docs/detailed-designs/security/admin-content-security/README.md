# Content administration security

## Overview

Staff edit content through endpoints under `/api/v1/admin`. Each call needs a valid OIDC token with the `content-editor` role. Uploaded files are checked by content sniffing and size; text is checked against a character allow-list and an 80-character maximum. CI fails on high or critical vulnerable packages.

## Description

The feature is a vertical slice through the backend: `Pibbo.Api` (controllers and middleware), `Pibbo.Application` (MediatR handlers), `Pibbo.Domain` and `Pibbo.Infrastructure`, with the Angular client generated from its OpenAPI document. The backend exists only once the ADR required by `L2-028` is accepted.

- **`AdminContentController`** — controller under `/api/v1/admin` with `[Authorize(Policy = "ContentEditor")]`.
- **`UploadAssetCommand + validator`** — FluentValidation checks sniffed type (audio/mpeg, audio/ogg, image/webp, sanitised image/svg+xml) and size (audio 1 MB, image 2 MB).
- **`SaveTextContentCommand + validator`** — allow-list and 80-character maximum.
- **`SvgSanitiser`** — removes scripts and external references from SVG.
- **`CI audit steps`** — `dotnet list package --vulnerable` and `npm audit` fail the build on high or critical findings.

## Requirements

The feature realises the following level-2 (L2) requirements. Each L2 requirement refines a level-1 (L1) requirement, cited by identifier.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-031` | `L1-026` | Content administration security. Staff edit content through authenticated endpoints under `/api/v1/admin`. |

Acceptance criteria of `L2-031` (Content administration security):

1. Given no token, when an admin endpoint is called, then 401 is returned.
2. Given a valid OIDC token without the `content-editor` role, when called, then 403 is returned.
3. Given an uploaded file, when received, then its type is checked by content sniffing (audio/mpeg, audio/ogg, image/webp, sanitised image/svg+xml), its size is capped (audio 1 MB, image 2 MB), and anything else is rejected with 415 or 413.
4. Given text content (words, sentences), when saved, then it is validated against a character allow-list and a maximum of 80 characters, and Angular renders it without bypassing sanitisation.
5. Given the CI pipeline, when it runs, then `dotnet list package --vulnerable` and `npm audit` fail the build on high or critical findings.

## Diagrams

### System context

The child uses Pibbo directly; a grown-up is beside or nearby and is not needed to make the feature work. No third-party system takes part.

![C4 system context for content administration security](diagrams/c4-context.png)

### Containers

`Pibbo.Api` serves read-only content to the `pibbo` application on the same origin; it receives nothing about a child.

![C4 container view for content administration security](diagrams/c4-container.png)

### Components

The policy runs before model binding of the file body.

![C4 component view for content administration security](diagrams/c4-component.png)

### Class structure

Commands carry the raw input; validators enforce the rules before the handler runs.

![Class diagram for content administration security](diagrams/class.png)

### Upload an asset as a content editor

Authentication and role come first; then the file is sniffed and size-checked.

![Sequence for upload an asset as a content editor](diagrams/sequence-upload-asset.png)
